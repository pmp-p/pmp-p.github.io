"use strict";

// rtc
// https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/
// https://btorrent.xyz/
// https://github.com/webtorrent/webtorrent
// https://github.com/pubnub/webrtc
// https://github.com/mdn/samples-server/blob/master/s/webrtc-simple-datachannel/main.js

// kbd
// http://ascii-table.com/ansi-escape-sequences-vt-100.php

import * as simplepeer from "../simplepeer.min.js";


try {
    clog("logger test : ")
    clog("ok")
} catch (x) {
    window.clog = console.log
    window.log = console.log
    clog("ERROR: " + x)
}


if (typeof SharedArrayBuffer !== 'function' || typeof Atomics !== 'object') {
    if (clog)
        clog('This browser does not support SharedArrayBuffers!')
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

function ID(){
     return 'js|' + Math.random().toString(36).substr(2, 9);
}

var fnToStr = Function.prototype.toString;

var tryFunctionObject = function tryFunctionObject(value) {
    try {
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



// ================= aio (down/up) link =================================================

// 0 console stdin
// 1 host stdout
// 2 host stderr

function new_fd(sid, impl, url) {
    var fd = { 'impl' : impl }
       fd.i = {}
       fd.i.stream = []
       fd.i.mode = 0
       fd.o = []
       fd.sid = sid
       fd.name = url
    posix.fildes[sid]  = fd
    return fd
}

var name = "aio"
var err = {}

var plink = {
    "ref" : [],
    "MAXSIZE" : 0,
    "dbg" : 1,
    "id" : 2,
}


// TODO refactor pts handling for asyncio tui apps contexts
var posix = {
    "pts" : 0,
    "cors" : null,
    'fildes' : {},
    'services' : {},
    'clients' : {},
    'hub' : undefined,
}


posix.opentty = function ( term , termp, winp ){
    posix.pts+=1
    term.id = posix.pts
    term.callback = function callback(data){
        stdin += data
        return false //no echo
    }
}


plink.state_reset = function(){
    plink.state = {"ioctl":[]}
}

plink.state_reset()

// TODO timestamps, return values
function IOCTL(fd, cmd, rv) {
    plink.state.ioctl.push("" + fd + ":" + cmd)
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
        for (var i=0;i < plink.ref.length;i++) {
            if ( Object.is(rv, plink.ref[i][1]) ){
                rvid = plink.ref[i][0]
                //console.log('re-using id = ', rvid)
                seen = true
                break
            }
        }

        if (!seen) {
            rvid = ID();
            window[rvid] = rv;
            plink.ref.push( [rvid, rv ] )
            //transmit bloat only on first access to object
            plink.state[""+callid ] =  rvid +"/"+ rv
        } else
            plink.state[""+callid ] =  rvid
    } else
        plink.state[""+callid ] =""+rv
    //console.log("embed_call_impl:"+ callid+ " => " + plink.state[callid] )
}


function io_sync(payload) {
    if (plink.dbg)
        console.log( "io_sync : " + payload )

    try {

        eval(payload)
    } catch (x) {
        clog("IOSYNC EVAL ERROR: " +payload+' =>'+x)
    }
}


function io_dispatch(payload) {

    if (payload.startsWith("//S:"))
        return io_sync( unhex_utf8( payload.substr(4) ) )

    if (payload.startsWith("//A:"))
        console.log("io_async N/I" + unhex_utf8( payload.substr(4) ) )
        //return io_async( unhex_utf8( payload.substr(4) ) )
}


function solve_path(name) {
    var path = name.rsplit('.')
    var solved = [window]
        while (path){
            var elem = path.shift()
//DBG
//if (plink.dbg)
//            console.log('239:'+name+'['+elem + '] ?')
            if (elem){
                var leaf = solved[ solved.length -1 ][ elem ]
//if (plink.dbg) {
//                if (leaf)
//                    console.log('  solved ==> Yes' )
//}
                solved.push( leaf )

            } else break
        }
    return solved
}


function embed_call(jsdata) {
    //always
    var callid = jsdata['id'];

    var name = jsdata['m']

    // shortcut for sockets
    if  (callid.substr(0,1)=="#" ) {
        return aio_write(callid, unhex_utf8( name.substr(4) ) )
    }

    if (name.startsWith("//")) {
        return io_dispatch( name )
    }

    try {
        const solved = solve_path(name)
        const target = solved[ solved.length -1 ]
        const owner = solved[ solved.length -2 ]

        if (!isCallable(target)) {

//DBG
if (plink.dbg)
            console.log("embed_not_a_call(id=" + callid + ", query="+name+") value == " + target)

            plink.state[""+callid ] = ""+target;
            return;
        }

        //only if method call
        var params = jsdata['a'];
        var env = jsdata['k'] || {};

//DBG
if (plink.dbg)
        console.log('embed_call:'+ ( target.name || ""+target) +' callid '+callid+' launched with',params,' on object ' + (owner.name || ""+owner) )

        //setTimeout( embed_call_impl ,1, callid, target, owner, params );
        embed_call_impl( callid, target, owner, params )

    } catch (x) {
        console.log('malformed RPC '+jsdata+" : "+x +" for path : "+ name)
    }
}


function log(msg) {
    const out = document.getElementById('log')
    if (out){
        var lines = out.textContent.split("\n")
        while (lines.length > 4 )
            lines.shift()
        out.textContent = lines.join("\n") + msg + '\n';
    }
}

function clog(msg) {
    console.log(msg)
    log(msg)
}


function recvmmsg() {
    for (const [sid, fd] of Object.entries(posix.fildes)) {
        if (fd.i.stream.length>0)
            plink.state["#" + sid] = fd.i.stream.shift()
    }
}

plink.io = function() {
    if ( getValue( plink.shm, 'i8') ) {
        //console.log("shm locked, retrying in 16 ms")
        return //
    }

    // get all file/socket/else pending
    recvmmsg()

    const rpcdata = "aio.step('''"+ JSON.stringify(plink.state) +"''')#aio.step\n"
    stringToUTF8( rpcdata, plink.shm, plink.MAXSIZE)
    plink.state_reset()
}

function blob_as_str(b) {
    var u, x
    u = URL.createObjectURL(b)
    x = new XMLHttpRequest()
    x.open('GET', u, false) // although sync, you're not fetching over internet
    x.send()
    URL.revokeObjectURL(u)
    return x.responseText
}

// websockets fd

// setup websocket with callbacks
// defaults to wss://
function socket(ip,port, unsecure) {
    const sid = "" + ++plink.id
    var url = "://" + ip + ":" + port

    if (unsecure)
        url = 'ws' + url
    else
        url = 'wss'+ url

    if (clog)
        clog("vm.aio.socket.open : " + url + " as "+ sid)

    var ws = new WebSocket(url, 'binary') // or ['binary',]

    ws.binaryType = "blob"

    const fd  = new_fd(sid, ws, url)

    ws.onopen = function() {
        clog('onopen:' + url)
        IOCTL(sid,'open',0)
    }

    ws.onclose = function() {
        clog('onclose:' +url)
        IOCTL(sid, 'close', 0)
    }

    ws.onmessage = function(e) {
        //clog('MESSAGE: ' + e.substring(0,20) )
        // date.now() is for SO_TIMESTAMPNS, url for datagram peer etc ...
        if (fd.i.mode==0)
            fd.i.stream.push( [""+Date.now(), url, blob_as_str(e.data) ] )
        else // N/I   ( raw / readlines / rpc encapsulation etc ... )
            fd.i.stream.push( [""+Date.now(), url, blob_as_str(e.data) ] )
    }

    return sid
}

function aio_connect(sid) {
    setTimeout( function() { posix.fildes[sid].impl.onopen() } , 10 )
}

function aio_open_ws(ip,port){
    return vm.aio.socket(ip, port, 1)
}

function aio_open_wss(ip,port){
    return vm.aio.socket(ip, port, 0)
}

function aio_write(fd, data){
    const impl = posix.fildes[fd].impl
    if (impl.binaryType) {
        if (impl.binaryType == "blob")
            return impl.send(new Blob([data]))
    }
    if (impl.loopback)
        impl.recv(data)
    else
        impl.send(data)
}


function aio_bind(mask, port){

    if (!posix.hub) {
        var peer = new simplepeer.SimplePeer({ "initiator" : true })
        peer.on('connect', () => { console.log('HUB.CONNECTED') } )
        peer.on('signal', function (data) {
            for (var key in posix.fildes) {
                console.log('huh->client.signal :'+ key );
                posix.fildes[key].impl.signal(data)
            }
        })
        peer.on('error', function (err) { console.log('error', err) })
        posix.hub = peer
    }

    const sid = "" + ++plink.id

    var url = mask + ":" + port

    clog("aio_bind : " + url )

    var peer = new simplepeer.SimplePeer({ "initiator" : false }) //, "stream": localStream
        peer.on('signal', function (data) {
            console.log('client.signal :'+data);
            posix.hub.signal(data)
        })
        peer.on('connect', () => { console.log('client.CONNECTED') } )
        peer.on('error', function (err) { console.log('error', err) })

    const fd  = new_fd(sid, peer, url)

    peer.onmessage = function(e) {
        clog("bind-loop-msg : "+ e.data)
        fd.i.stream.push( [""+Date.now(), url, blob_as_str(e.data) ] )
    }


    posix.services[url] = fd

    return sid
}


function aio_accept(url){
    console.log("aio_accept : " + url )
    const lb = posix.clients[url]
    const fd  = new_fd(lb.sid, lb, url)
    IOCTL(lb.sid,'open',0)
    return fd.sid
}

function demux_fd(text) {
    try {
        var jsdata = JSON.parse(text);
        for (key in jsdata) {
            // TODO: multiple vt fds for pty.js
            if (key=="1") {
                vm.stdio_process(1, unhex_utf8( jsdata[key]))
                continue
            }
            try {
                embed_call(jsdata[key])
            } catch (e) {
                clog("IOEror : "+e)
            }
        }
    } catch (x) {
        // found a raw C string via libc
        if (text.length) {
            clog("C-OUT ["+text+"]")
            /*
            flush_stdio()
            try {
                posix.syslog(text)
            } catch (y) {
                term_impl(text+"\r\n")
            }*/
        }
    }
}

// this is a the demultiplexer for stdout and os (DOM/js/aio ...) control
function pts_decode(textblob){

    try {
        demux_fd(textblob)
    } catch (x) {
        // naive recover
        for (var text of textblob.split('{')) {
            demux_fd("{"+text)
        }
    }
}

var ctl = {
    'accept' : aio_accept,
    'connect': aio_connect,
    'open_ws' : aio_open_ws,
    'open_wss' :aio_open_wss,
    'bind' : aio_bind,
    'write' : aio_write,
}


function solve_dom(name) {
    var path = name.rsplit('.')
    var solved = [window]
    var last
    while (path){
        var elem = path.shift()
        if (elem){
            const leaf = solved[ solved.length -1 ][ elem ]
            // not a dom
            if (isCallable(leaf))
                return
            solved.push( leaf )
            last = elem
            } else {
                solved[ solved.length -1 ] = last
                break
            }
        }
    return solved
}

var dom = {
    'lshift' : function lshift(path, data) {
        //clog('lshift : '+path+' += ' + data)
        const solved = solve_dom(path)
        if (solved) {
            var owner  = solved[ solved.length - 2 ]
            const tname = solved[ solved.length - 1 ]
            //clog("where: "+ owner + '->' + tname )
            //clog("old : "+ owner[tname] )
            owner[tname] += data
            //clog("new : "+ owner[tname] )
        }
    },
}


//
export { dom, solve_path, name, plink, posix, ctl, socket, pts_decode, err, isCallable }
