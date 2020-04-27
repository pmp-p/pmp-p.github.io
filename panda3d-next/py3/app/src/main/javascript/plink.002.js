"use strict";

//document.getElementById('test').textContent = "THIS IS THE I/O TEST BLOCK\n"
document.title="THIS IS A EMPTY TEST TITLE"


if (typeof SharedArrayBuffer !== 'function'
    || typeof Atomics !== 'object') {
    document.getElementById('log').textContent = 'This browser does not support SharedArrayBuffers!'
}


// const worker = new Worker('worker.js');

// We display output for the worker
/*
worker.addEventListener('message', function (event) {
    document.getElementById('output').textContent = event.data;
});

// Set up the shared memory
const sharedBuffer = new SharedArrayBuffer(1 * Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);

// Set up the lock
Lock.initialize(sharedArray, 0);
const lock = new Lock(sharedArray, 0);
lock.lock();

try {
    // Try new API (clone)
    worker.postMessage({sharedBuffer});
} catch (e) {
    // Fall back to old API (transfer)
    worker.postMessage({sharedBuffer}, [sharedBuffer]);
}

document.getElementById('unlock').addEventListener('click', event => {
    event.preventDefault();
    lock.unlock();
});

*/


// ================= (c/up)link =================================================

window.plink = {}



var pts = {}
   pts.i = {}
   pts.i.line = ""
   pts.i.raw = true
   pts.o = {}

plink.pts = pts


window.posix = {}
posix.pts = 0
posix.opentty = function ( term , termp, winp ){
    posix.pts+=1
    term.id = posix.pts
    term.callback = function callback(data){
        stdin += data
        return false //no echo
    }
}


plink.embed = {}
plink.embed.ref = []

plink.embed.state_reset = function(){
    plink.embed.state = {"ioctl":[]}
}

plink.embed.state_reset()



function ID(){
     return 'js|' + Math.random().toString(36).substr(2, 9);
}

var fnToStr = Function.prototype.toString;

var constructorRegex = /\s*class /;
var isES6ClassFn = function isES6ClassFn(value) {
    try {
        var fnStr = fnToStr.call(value);
        var singleStripped = fnStr.replace(/\/\/.*\n/g, '');
        var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, '');
        var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' ');
        return constructorRegex.test(spaceStripped);
    } catch (e) {
        return false; // not a function
    }
};

var tryFunctionObject = function tryFunctionObject(value) {
    try {
        if (isES6ClassFn(value)) { return false; }
        fnToStr.call(value);
        return true;
    } catch (e) {
        return false;
    }
};

var toStr = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';


function isCallable(value) {
    if (!value) { return false; }
    if (typeof value !== 'function' && typeof value !== 'object') { return false; }
    if (typeof value === 'function' && !value.prototype) { return true; }
    if (hasToStringTag) { return tryFunctionObject(value); }
    if (isES6ClassFn(value)) { return false; }
    var strClass = toStr.call(value);
    return strClass === fnClass || strClass === genClass;
}



async function embed_call_impl(callid, fn, owner, params) {
    var rv = null;
    try {
        rv = await fn.apply(owner,params)
    } catch(x){
        console.log("call failed : "+fn+"("+params+") : "+ x )
    }
    if ( (rv !== null) && (typeof rv === 'object')) {
        var seen = false
        var rvid = null;
        for (var i=0;i<plink.embed.ref.length;i++) {
            if ( Object.is(rv, plink.embed.ref[i][1]) ){
                rvid = plink.embed.ref[i][0]
                //console.log('re-using id = ', rvid)
                seen = true
                break
            }
        }

        if (!seen) {
            rvid = ID();
            window[rvid] = rv;
            plink.embed.ref.push( [rvid, rv ] )
            //transmit bloat only on first access to object
            plink.embed.state[""+callid ] =  rvid +"/"+ rv
        } else
            plink.embed.state[""+callid ] =  rvid
    } else
        plink.embed.state[""+callid ] =""+rv
    //console.log("embed_call_impl:"+ callid+ " => " + plink.embed.state[callid] )
}


function io_sync(payload) {
//    console.log(payload)
    try {
        eval(payload)
    } catch (x) {
        console.log("IOSYNC EVAL ERROR: " +payload+' =>'+x)
    }
}


function io_dispatch(payload) {

    if (payload.startsWith("//S:"))
        return io_sync( unhex_utf8( payload.substr(4) ) )

    if (payload.startsWith("//A:"))
        return io_async( unhex_utf8( payload.substr(4) ) )
}

window.embed_dbg = 0

function embed_call(jsdata) {
    //always
    var callid = jsdata['id'];

    var name = jsdata['m']

    // shortcut for sockets
    if  (callid.substr(0,1)=="#" ) {
        return window.socks.write(callid, unhex_utf8( name.substr(4) ) )
    }

    if (name.startsWith("//"))
        return io_dispatch( name )

    var path = name.rsplit('.')
    var solved = []
    solved.push( window )

    try {

        while (path){
            var elem = path.shift()
            if (elem){
                var leaf = solved[ solved.length -1 ][ elem ]
//DBG
if (embed_dbg)
                    console.log( solved[ solved.length -1 ]+" -> "+ leaf)
                solved.push( leaf )
            } else break
        }
        var target = solved[ solved.length -1 ]
        var owner = solved[ solved.length -2 ]

        if (!isCallable(target)) {

//DBG
if (embed_dbg)
            console.log("embed_call(id=" + callid + ", query="+name+") == " + target)

            plink.embed.state[""+callid ] = ""+target;
            return;
        }

        //only if method call
        var params = jsdata['a'];
        var env = jsdata['k'] || {};

//DBG
if (embed_dbg)
        console.log('embed_call:'+ ( target.name || ""+target) +' callid '+callid+' launched with',params,' on object ' + (owner.name || ""+owner) )

        //setTimeout( embed_call_impl ,1, callid, target, owner, params );
        embed_call_impl( callid, target, owner, params )

    } catch (x) {
        console.log('malformed RPC '+jsdata+" : "+x )
    }
}


function log(msg) {
    document.getElementById('log').textContent += msg + '\n'
}


plink.io = function() {
    if ( getValue( plink.shm, 'i8') ) {
        //console.log("shm locked, retrying in 16 ms")
        return //
    }
    const rpcdata = "aio.step('''"+ JSON.stringify(plink.embed.state) +"''')#aio.step\n"
    stringToUTF8( rpcdata, plink.shm, 16384 )
    plink.embed.state_reset()
}


























//
