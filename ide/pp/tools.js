"use strict";

var DBG=0

if (!window["js"]){
    window["js"]=0;
    window["js_req"] = 4 ;
} else
    window["js_req"] = 5 ;


function module_load(m){
    console.log("Begin : "+ m +".js  " + window["js"]+"/"+ window["js_req"]);
    return m;
}

var module = module_load("tools");


String.prototype.rsplit = function(sep, maxsplit) {
    var split = this.split(sep);
    return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
}

String.prototype.endswith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
}

String.prototype.startswith = function(prefix) {
    return this.indexOf(prefix, 0) !== -1;
}


function undef(e,o){
    if (typeof o === 'undefined' || o === null)
        o = window;
    //else console.log('domain '+o)

    try {
        e = o[e];
    } catch (x) { return true }

    if (typeof e === 'undefined' || e === null)
        return true;
    return false;
}


function register(fn,fn_dn){
    if ( undef(fn_dn) )
        fn_dn = fn.name;
    //console.log('  |-- added ' + fn_dn );
    window[fn_dn]=fn;
}

//cyclic dep
register(register)
register(undef)
register(module_load)

function repr(obj) {
    if(obj == null || typeof obj === 'string' || typeof obj === 'number') return String(obj);
    if(obj.length) return '[' + Array.prototype.map.call(obj, repr).join(', ') + ']';
    if(obj instanceof HTMLElement) return '<' + obj.nodeName.toLowerCase() + '>';
    if(obj instanceof Text) return '"' + obj.nodeValue + '"';
    if(obj.toString) return obj.toString();

    return JSON.stringify(obj);
}
register(repr)

//============================================================================================
// https://github.com/ljharb/is-callable/blob/master/index.js

var fnToStr = Function.prototype.toString;

var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
    try {
        var fnStr = fnToStr.call(value);
        return constructorRegex.test(fnStr);
    } catch (e) {
        return false; // not a function
    }
};

var tryFunctionObject = function tryFunctionToStr(value) {
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
};
register(isCallable)

//==========================================================================================================================


function module_loaded(m,mod){
    window["js"]+=1
    sys.modules[m] = mod || true;
    console.log("End : "+m+".js " + window["js"]+"/"+ window["js_req"]);
    return window["js_req"] - window["js"] ;
}
register(module_loaded);


function defined(e,o){
    if (typeof o === 'undefined' || o === null)
        o = window;
    //else console.log('domain '+o)
    try {
        e = o[e];
    } catch (x) { return false }

    if (typeof e === 'undefined' || e === null)
        return false;
    return true;
}
register(defined);

//bad behaviour when  o.attr == None
function hasattr(o,e){
    try {
        e = o[e];
    } catch (x) { return false }

    if (typeof e === 'undefined' || e === null)
        return false;
    return true;
}

register(hasattr);

// for awaiting key on Map
function has_key(o,e){
    return o.has(e)
}
register(has_key);




async function load_python(){
    console.log(" ============= wasm load start ====================");
    Module.loadWebAssemblyModule( FS.readFile("/lib/libpython.wasm"), 1 );
    /*
    WebAssembly.compile( FS.readFile("/libpython.wasm") ).then(
        mod=>
            WebAssembly.Module.exports( new WebAssembly.Module( mod ))
    );
    */
    /*
    function do_exports(mod){
        console.log("      ======== wasm : "+mod+"===================");
        var exports = WebAssembly.Module.exports(mod);
        for (var i=0;i<exports.length;i++)
            console.log( exports[i].name +' : '+ exports[i].kind );
    }
    WebAssembly.compile(
        FS.readFile("/libpython.wasm")
    ).then(
            mod=>  do_exports(mod)
    );
    */

}
register(load_python);

function setdefault(n,v,o){
    if (o == null)
        o = window;

    if (undef(n,o)){
        o[n]=v;
        console.log('  |-- ['+n+'] set to ['+ o[n]+']' );
        return true;
    }
    return false;
}

register(setdefault);



function toArray(data) {
    if (typeof data === 'string') {
      var arr = new Array(data.length);
      for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
      data = arr;
    }
    return data;
}
register(toArray);

function dirname(path){
    return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
}
register(dirname);

function basename(path){
    return path.split('/').pop();
}
register(basename);


function aimport(filename){
    if ( (filename.indexOf('.') === 0) || (filename.indexOf('/') === 0 ) ){
        //absolute !
    } else {
        //corrected
        filename = window.JSDIR + filename;
    }

    var fileref=document.createElement('script')
    fileref.setAttribute("type","text/javascript")
    fileref.setAttribute("src", filename)
    fileref.setAttribute('async',true);
    document.getElementsByTagName("head")[0].appendChild(fileref)
    fileref.async = true;
    fileref.defer = true;
    //fileref.src = window.URL.createObjectURL( window.EMScript );
    //document.body.appendChild(fileref);
}

function include(filename, filetype){
    if (filetype===null ||typeof filetype === 'undefined')
        filetype = 'js';
        if (filename.endswith('css'))
            filetype = 'css';

    if ( (filename.indexOf('.') === 0) || (filename.indexOf('/') === 0 ) ){
        //absolute !
    } else {
        //corrected
        filename = window.JSDIR + filename;
    }

    if (filetype=="js"){ //if filename is a external JavaScript file
        var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", filename)
        fileref.setAttribute('async',false);
    }
    else if (filetype=="css"){ //if filename is an external CSS file
        var fileref=document.createElement("link")
        fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css")
        fileref.setAttribute("href", filename)
    }   else {
        console.log("#error can't include "+filename+' as ' +filetype);
        return false;
    }
    if (typeof fileref!="undefined")
        console.log("#included "+filename+' as ' +filetype);

        document.getElementsByTagName("head")[0].appendChild(fileref)
        fileref.async = false;
        fileref.defer = false;
        //fileref.src = window.URL.createObjectURL( window.EMScript );
        //document.body.appendChild(fileref);
}
window.include = include;




var Queue = function() {
    var functionSet=(function() {
        var _elements=[]; // creating a private array
        return [
            // push function
            function() { return _elements.push.apply(_elements,arguments); },
            // shift function
            function() { return _elements.shift.apply(_elements,arguments); },
            function() { return _elements.length; },
            function(n) { return _elements.length=n; }
        ];
    })();
    this.push=functionSet[0];
    this.shift=functionSet[1];
    Object.defineProperty(this,'length',{
        'get':functionSet[2],
        'set':functionSet[3],
        'writeable':true,
        'enumerable':false,
        'configurable':false
    });
    // initializing the queue with given arguments
    this.push.apply(this,arguments);
}

window.Queue = Queue;


const coroutine = nextValue => iterator => {
  const { done, value } = iterator.next(nextValue);

  if (done) {
    return;
  }

  if (value.constructor === Promise) {
    value.then(promiseValue => {
      coroutine(promiseValue)(iterator);
    });
  } else {
    coroutine(value)(iterator);
  }
};

const delay = (ms, fn_solver) => new Promise(resolve => setTimeout(() => resolve(fn_solver()), ms*1000));
//const delay_argv = (ms, fn_solver, argv) => new Promise(resolve => setTimeout(() => resolve(fn_solver.apply(null, argv)), ms*1000));



window.delay = delay;
window.coroutine = coroutine ;

function _while(fn_solver){
    var tick = 0;
    return async function fwrapper(){
        var argv = Array.from(arguments)
        console.log("awaiting "+ fn_solver.name + "("+argv+") to be false");
        function log_me(){
            var now = Math.round(Date.now()/1000);
            var result = fn_solver.apply(window, argv);
            if (tick<now){
                tick = now+5;
                console.log('  |-- ' + fn_solver.name +'('+argv+') is '+ result);
            }
            return result;
        }
        while (await delay(0, log_me) )
            {};
    }
}
register(_while);
if (DBG) {
    function _until(fn_solver){
        var tick = 0;
        return async function fwrapper(){
            var argv = Array.from(arguments)
            console.log("awaiting "+ fn_solver.name + "("+argv+") to be true");
            function log_me(){
                var now = Math.round(Date.now()/1000);
                var result = fn_solver.apply(window, argv);
                if ( (tick<now) || result){
                    tick = now+5;
                    console.log('  |-- ' + fn_solver.name +'('+argv+') is '+ result);
                }
                return result;
            }
            while (!await delay(0, log_me) )
                {};
        }
    }
    register(_until);
} else {
    function _until(fn_solver){
        return async function fwrapper(){
            var argv = Array.from(arguments)
            function solve_me(){return  fn_solver.apply(window, argv ) }
            while (!await delay(0, solve_me ) )
                {};
        }
    }
    register(_until);
}


window.global = window;


function file_exists(urlToFile)
{
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', urlToFile, false);
    xhr.send();
    return (xhr.status == 200 );
}
register(file_exists);



async function _get(url,trigger){
    fetch(url).then( function(r) { return r.arrayBuffer(); } ).then( function(udata) { window[trigger] = udata } );
    await _until(defined)(trigger);
    return window[trigger];
}
register(_get);


async function get_lzma(namespace, ns_key, url, size_hint, as_blob, run_script, as_local){
    function ns_defined(k){
        return defined(k, namespace);
    }

    fetch(url).then(
        function(r) {
            return r.arrayBuffer();
        }
    ).then(
        function(udata) {

            function copyLzmaDec(src)  {
                var dst = new ArrayBuffer(src.length);
                new Uint8Array(dst).set(new Uint8Array(src));
                return dst;
            }

            function on_lzma_dc(result){

                if (as_blob){
                    //console.log( 'get_lzma : Decompressed lzma as Blob for', ns_key);
                    namespace[ns_key] = new Blob( [copyLzmaDec(result)] ,{type: 'text/javascript'});
                } else {
                    //console.log( 'get_lzma : Decompressed lzma as ArrayBuffer for', ns_key);
                    if (as_local){
                        console.log(" Writing "+ url +" as local file '" + as_local + "' in window.mfs" );

                        //FS.createPath('/',tD_name,true,true);
                        FS.createDataFile("/",as_local, result, true, true);
                        namespace[ns_key] = true;
                    } else
                        namespace[ns_key] = result;
                }
            }

            function on_lzma_du(evt){
                //console.log( 'get_lzma : Decompressing lzma for', ns_key);
            }

            LZMA.decompress( new Uint8Array(udata) , on_lzma_dc, on_lzma_du );
        }
    );
    await _until(ns_defined)(ns_key);


    if (run_script){
        //console.log( 'get_lzma : running lzma js for', ns_key);
        var fileref=document.createElement('script');
        fileref.setAttribute("type","text/javascript");
        var result = URL.createObjectURL( window.ffi[ns_key] )
        fileref.src = result;
        fileref.async = true;
        fileref.defer = false;
        document.getElementsByTagName("head")[0].appendChild(fileref);
        //is URL.revokeObjectURL() usefull ?
        URL.revokeObjectURL(result);
        result = null;
        namespace[ns_key]=true;
    } else {
        console.log('get_lzma : ' + url+ " -> done");
    }
    return namespace[ns_key];
}

register(get_lzma);




async function get_url_as_local_file(fdnum, url, local_path, size_hint){
    if (!size_hint)
        size_hint=0;
    console.log("requesting " + url + " as #"+ fdnum + " toward " + local_path , " size="+size_hint);
    get_lzma(window.fd, fdnum, url, size_hint, false, false, local_path);
}


function fd_defined(fdnum){
    return defined(fdnum, window.fd );
}


var ffi = {"name":"ffi"};
register(ffi);

var sys = {"name":"sys"};
sys.modules = {};
register(sys);

var lib = {"name":"lib"};
register(lib);

var fstab = {"name":"fstab"};
register(fstab);


async function jsrun_lzma(url, slot, size_hint){
    await get_lzma(window.ffi, slot, url, size_hint, true, true);
}

register(jsrun_lzma);


setdefault('JSDIR','pp/');

if  (window.bootstrap) {
    async function bootstrap(){
        sys.modules["emboot"] = 0 ;
        include('emboot.js');
    }
    bootstrap();
}

module_loaded(module);
