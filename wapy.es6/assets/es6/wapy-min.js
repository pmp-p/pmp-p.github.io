"use strict";

if (!window.undef) {
    window.sys = { "modules" : {} }


    function undef(e,o){
    if (typeof o === 'undefined' || o === null)
        o = window;

    try {
        e = o[e];
    } catch (x) { return true }

    if (typeof e === 'undefined' || e === null)
        return true;
    return false;
    }

    function defined(e,o){return !undef(e,o)}

    const delay = (ms, fn_solver) => new Promise(resolve => setTimeout(() => resolve(fn_solver()), ms*1000));

    String.prototype.rsplit = function(sep, maxsplit) {
    var split = this.split(sep);
    return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
    }

    function trim(str) {
    var str = str.replace(/^\s\s*/, ''),
        ws = /\s/,
        i = str.length;
    while (ws.test(str.charAt(--i)));
    return str.slice(0, i + 1);
    }


    function register(fn,fn_dn){
    if ( undef(fn_dn) )
        fn_dn = fn.name;
    //console.log('  |-- added ' + fn_dn );
    window[fn_dn]=fn;
    }

    //cyclic dep
    window.register = register
    register(undef)
    register(defined)

    function module_loaded(m){
        sys.modules[m] = true
    }
    register(module_loaded)

    function setdefault(n,v,o){
    if (o == null)
        o = window;

    if (undef(n,o)){
        o[n]=v;
        console.log('  |-- ['+n+'] set to ['+ o[n]+']' );
        return true;
    }
    return false
    }
    register(setdefault)

    setdefault('JSDIR','')


    function include(filename, filetype){
    if (filetype===null ||typeof filetype === 'undefined')
        filetype = 'js';
        if (filename.endsWith('css'))
            filetype = 'css';

    if ( (filename.indexOf('.') === 0) || (filename.indexOf('/') === 0 ) ){
        //absolute local server
    } else {
        if (filename.startsWith('http://') || filename.startsWith('https://')) {
        //absolute remote
        } else {
            //corrected
            filename = window.JSDIR + filename;
        }
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
    // .py includes ??

    if (typeof fileref!="undefined")
        console.log("#included "+filename+' as ' +filetype);
        document.getElementsByTagName("head")[0].appendChild(fileref)
        fileref.async = false;
        fileref.defer = false;
    }
    register(include)



    function _until(fn_solver){
    return async function fwrapper(){
        var argv = Array.from(arguments)
        function solve_me(){return  fn_solver.apply(window, argv ) }
        while (!await delay(0, solve_me ) )
            {};
    }
    }
    register(_until)


    function unhex_utf8(s) {
    var ary = []
    for ( var i=0; i<s.length; i+=2 ) {
        ary.push( parseInt(s.substr(i,2),16) )
    }
    return new TextDecoder().decode( new Uint8Array(ary) )
    }
    register(unhex_utf8)

    module_loaded("aio")

}

// NETWORK

include("./../simplepeer.min.js")



// ============================== FILE I/O (sync => bad) =================================

// hit miss cache , cheat a bit for clear log and less hammer
var miss = [
]

window.urls = { "name":"webcache","id":-1, "index": "/index.html", "err":miss }

// unwanted prefixes that are in MEM or ZIP
urls.discard = {}
urls.discard.prefixes = ['/assets/','/pythons/','assets/','pythons/']
urls.discard.suffixes = ['.mpy']


function awfull_get(url, charset) {

    if (aio.posix.cors)
        url = aio.posix.cors(url)

    function updateProgress (oEvent) {
      if (oEvent.lengthComputable) {
        var percentComplete = oEvent.loaded / oEvent.total;
      } else {
            // Unable to compute progress information since the total size is unknown
          // on binary XHR
      }
    }

    function transferFailed(evt) {
        console.log("awfull_get: An error occurred while transferring the file '"+window.currentTransfer+"'");
        window.currentTransferSize = -1 ;
    }

    function transferCanceled(evt) {
        console.log("awfull_get: transfer '"+window.currentTransfer+"' has been canceled by the user.");
        window.currentTransferSize = -1 ;
    }

    var oReq = new XMLHttpRequest();

    function transferComplete(evt) {
        if (oReq.status==404){
            console.log("awfull_get: File not found : "+ url );
            window.currentTransferSize = -1 ;

        } else {
            window.currentTransferSize = oReq.response.length;
            //console.log("awfull_get: Transfer is complete saving : "+window.currentTransferSize);
        }
    }
    if (charset)
        oReq.overrideMimeType("text/plain; charset="+charset);
    else
        oReq.overrideMimeType("text/plain; charset=x-user-defined");
    oReq.addEventListener("progress", updateProgress);
    oReq.addEventListener("load", transferComplete);
    oReq.addEventListener("error", transferFailed);
    oReq.addEventListener("abort", transferCanceled);
    oReq.open("GET",url ,false);
    oReq.send();
    return oReq.response
}


function wasm_file_open(url , cachefile ) {
    var dirpath = ""
    if ( url == cachefile ) {
        //we need to build the target path, it could be a module import.

        //transform to relative path to /
        while (cachefile.startsWith("/"))
            cachefile = cachefile.substring(1)

        while (url.startsWith("/"))
            url = url.substring(1)

        // is it still a path with at least a one char folder ?
        if (cachefile.indexOf('/')>0) {
            var path = cachefile.split('/')

            // last elem is the filename
            while (path.length>1) {
                var current_folder = path.shift()
                try {
                    FS.createFolder(dirpath, current_folder, true, true)
                    //FS.createPath('/', dirname, true, true)
                } catch (err) {
                    if (err.code !== 'EEXIST')
                        throw err
// debug only, silent path recreation even if exists
//                  else
//                      console.log("wasm_file_open ["+current_folder +"@"+dirpath+"] : " + err)
                }
                dirpath = dirpath + "/" + current_folder
            }
            //console.log("+dir: "+dirpath+" +file: " + path.shift())
        } else {
            // this is a root folder, abort
            if (url.indexOf(".") <1 )
                return -1
        }
        cachefile = "/" + url
        //console.log("in /  +" + cachefile)
    }

    try {
        if (url[0]==":")
            url = url.substr(1)
        else {
            // [TODO:do some tests there for your CORS integration]
            if (aio.posix.cors)
                url = aio.posix.cors(url)
        }

        var ab = awfull_get(url)

        // is file found and complete ?
        if (window.currentTransferSize<0)
            return -1
        var ret = ab.length

        window.urls.id += 1
        if (!cachefile){
            cachefile = "cache_"+window.urls.id
            ret = window.urls.id
        }
        FS.createDataFile("/", cachefile, ab, true, true);
        return ret
    } catch (x) {
        console.log("wasm_file_open :"+x)
        return -1
    }
}

window.fget = function(rel) { return wasm_file_open(rel,rel) }


function wasm_file_exists(url, need_dot) {
    // need_dot reminds we can't check for directory on webserver
    // but we can check for a known file (probably with a dot) under it
    // -1 not found , 1 is a file on server , 2 is a directory

    function url_exists(url,code) {
        if (urls.err.indexOf(url)>-1)
            return -1

        var xhr = new XMLHttpRequest()
        xhr.open('HEAD', url, false)
        try {
            xhr.send()
        } catch (x) {
            console.log("NETWORK ERROR :" + x)
            return -1
        }

        if (xhr.status == 200 )
            return code
        urls.err[url]=xhr.status
        return -1
    }

    // we know those are all MEMFS local files.
    // and yes it's the same folder name as in another OS apps
    for (const prefix of urls.discard.prefixes) {
        if (url.startsWith(prefix))
            return -1
    }
    for (const suffix of urls.discard.suffixes) {
        if (url.endsWith(suffix))
            return -1
    }

    // are we possibly doing folder checking ?
    if (need_dot) {

        // .mpy .pyc are blacklisted for now
        // so if it's not .py then it's a folder check.
        if (!url.endsWith('.py')) {
            var found = -1

            // TODO: gain 1 call if .py exists we can discard both __init__ and index checks
            // -> would need a path cache that is usefull anyway

            // package search
            found = url_exists( url + '/__init__.py' , 2 )
            //console.log("wasm_([dir]/file)_exists ? :"+url+ ' --> ' + '/__init__.py => '+found)
            if (found>0) return found

            //namespace search
            found = url_exists( url + window.urls.index , 2 )
            //console.log("wasm_([dir]/file)_exists ? :"+url+ ' --> ' + window.urls.index + " => "+found)
            if (found>0) return found
        }

        // if name has no dot then it was a folder check
        //console.log("wasm_(dir/[file])_exists ? :"+url)
        need_dot = url.split('.').pop()
        if (need_dot==url) {
            console.log("wasm_file_exists not-a-file :"+url)
            return -1
        }
    }

    // default is a file search
    return url_exists(url, 1)
}
register(wasm_file_exists)


import * as vm from "./pythons.es6.js"


Module = vm.scripting.set_host(vm, window)


async function window_load(event) {

    // pseudo-readline buffer toward Python wasm vm via emscripten stdio polyfill
    window.prompt = vm.window_prompt

    /* Write text to the terminal */
    document.body.setAttribute('style', 'white-space: pre;');
    window.term_impl = function(text){ document.body.innerHTML += text }


    console.log(' ----------------- The page is fully loaded ----------------------');


    vm.scripting.embed( { 'prefix' : "../../", 'runscripts' : true, 'sti' : true } )

}




window.addEventListener('load', window_load )


















//
