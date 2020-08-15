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

    // https://stackoverflow.com/questions/5202085/javascript-equivalent-of-pythons-rsplit
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

} else {
    console.log("aio.lib.js already included !")

}




