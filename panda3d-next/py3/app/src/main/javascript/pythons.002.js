"use strict";

// window.plink  will hold embed I/O , stdin and stdout buffers via plink.002.js




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
//register(module_load)

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

setdefault('JSDIR','')


function include(filename, filetype){
    if (filetype===null ||typeof filetype === 'undefined')
        filetype = 'js';
        if (filename.endsWith('css'))
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

// ================== uplink ===============================================

// separated file pink.py : entry point is embed_call(struct_from_json)

// =================  EMSCRIPTEN wrap stuff ================================

function preRun(){
    console.log("preRun: Begin")
    //FS.init()

    window._dlopen = Module._dlopen = function(filename, flag) {
        console.log("cannot dlopen ["+filename+"]")
    }
    window._dlclose = Module._dlclose = function(handle){}
    window._dlerror = Module._dlerror = function(){return "dlerror certainly"}
    window._dladdr = Module._dladdr = function(address, info) { }
    // do we need to call it instead of Module
    if (window.stock)
        setTimeout(postRun,1)
    else {
        // we still can modify argc/argv.
        var argv = window.location.href.split('?',2)
        var e;
        while (e=argv.shift())
            arguments_.push(e)
        argv = arguments_.pop().split('&')
        while (e=argv.shift())
            arguments_.push(e)

        if ( defined('PYTHONSTARTUP') )
            PYTHONSTARTUP()
        else
            console.log("preRun: function PYTHONSTARTUP() ? " )
    }
    console.log("preRun: End")

}


function write_file(dirname, filename, arraybuffer) {
    FS.createPath('/',dirname,true,true);
    FS.createDataFile(dirname,filename, arraybuffer, true, true);
}

function postRun() {
    console.log("postRun: Begin")
    console.log("postRun: End")
}

function init_repl_begin(){

    console.log("init_repl: Begin (" + arguments_.length+")")
    var scripts = document.getElementsByTagName('script')

    window.pyscripts = new Array()

    if ( window.plink.shm ) {
        console.log("shared memory ptr was set by wasm module to : " + window.plink.shm )
        console.log("kbd shared memory port was set by wasm module to : " + window.plink.io_port_kbd )
    } else {
        window.plink.shm =  Module._shm_ptr()
        // IO_KBD dev0
        window.plink.io_port_kbd = Module._shm_get_ptr(0, 0)
        // get repl max buffer size but dont start it yet
        window.PyRun_SimpleString_MAXSIZE = Module._repl_run(1)
    }


    console.log("init_repl: shm "+window.plink.shm+"["+PyRun_SimpleString_MAXSIZE +"]")

    if (arguments_.length>1) {

        var argv0 = "" + arguments_[1]
        if (argv0.startsWith('http'))
            if (window.posix.cors)
                argv0 = window.posix.cors(argv0)
        else console.log("CORS PATCH OFF")

        console.log('running with sys.argv', argv0)

        window.currentTransferSize = 0
        window.currentTransfer = argv0

        var ab = awfull_get(argv0,'utf-8')
        if (window.currentTransferSize>=0) {
            console.log(ab.length)
            FS.createDataFile("/",'main.py', ab, true, true);
            PyRun_VerySimpleFile('main.py')
        } else {
            console.log("error getting main.py from '"+argv0+"'")
            term_impl("Javascript : error getting main.py from '"+argv0+"'\r\n")
            //TODO: global control var to skip page scripts
        }

    }

    for(var i = 0; i < scripts.length; i++){
        var script = scripts[i]

        if(script.type == window.script_type){
            if (script.text)
                pyscripts.push(script.text)

        }
    }

    if (false)
        console.log("246:no start")
    else {
    // run scripts or start repl asap
    if (pyscripts.length)
        PyRun_SimpleString()
    else
        console.log("no '"+window.script_type+"' script tag found")
}
}


function interact() {
    if (window.cpython) {
        window.prompt = window_prompt
    } else {
        try {
            Module._repl_run(0)
        } catch (x) { console.log("repl init function not present, starting anyway") }
    }
    console.log(" ----------- repl interact  ---------")
    //setInterval( stdin_poll , 16)
}


function init_repl_end() {

    console.log("shared memory ptr : " + window.plink.shm )

    if (window.repl)
        interact()
    else
        console.log("REPL will not start until you call interact() from code")

    window.init_repl_begin = null
    window.init_repl_end = null
    console.log("init_repl: End")
}

// =========================== REPL shm interface ===============================

window.BAD_CORE = 1


function prepro(text) {
    return text
}

function PyRun_VerySimpleFile(filename, ascode) {
    var code =`
try:
    exec( open('` + filename + `', 'r').read(), globals() , globals())
except Exception as e:
    sys.print_exception(e)
`
    if (ascode)
        return code
    pyscripts.push(code)
}


// FIXME: ordering of scripts blocks => use a queue and do it async
function PyRun_SimpleString(text){
    if ( getValue( plink.shm, 'i8') ) {
        console.log("shm locked, retrying in 16 ms")
        setTimeout(PyRun_SimpleString, 16, text )
        return //
    }

    if (!text)
        text = pyscripts.shift()

    var header = text.substring(0,64).trim()


    // no : for script tags
    var async_script = header.startsWith('#!async')

    //if (async_script)
    //    console.log("==== ASYNC TL =======> "+header)

    // for script file there's :
    header = header.replace('async:','').replace(' ','').trim()

    if ( header.startsWith("#!") ) {
        header = header.split("\n")[0].substr(2).trim()
        // if not .py found then it's a script tag.
        text = PyRun_VerySimpleFile(":"+header, true)
        console.log("====================================")
        console.log(text)
        console.log("====================================")
        /*
        if ( header.endsWith('.py') ) {
            console.log("Getting shebang py=["+header+"] async="+ async_script)
            var tmp = awfull_get(text, "utf-8")
            if (tmp)
                text=tmp
        }
        */
    }

    if ( text ) {

        //try to fix the damn thing temporarily
        text= prepro(text)

        if (text.length >= PyRun_SimpleString_MAXSIZE)
            console.log("ERROR: python code ring buffer overrun")

        // TODO: ordering of mixed sync/async toplevels
        if (async_script)
            stringToUTF8( text +"\n#async-tl", plink.shm, PyRun_SimpleString_MAXSIZE )
        else
            stringToUTF8( text, plink.shm, PyRun_SimpleString_MAXSIZE )

        console.log("wrote "+text.length+"B to shm")
    } else
        console.log("invalid text block")

    if (pyscripts.length)
        return setTimeout(PyRun_SimpleString, 16 )

    if (init_repl_end)
        init_repl_end()

}



// ===================================== STDIN ================================

// window.plink.pts hold tty devices descriptors

window.stdin_array = []

window.stdin_raw = true
window.stdin_echo = false

// the readline emulation buffer ( via prompt() )
window.stdin = ""

// for non event driven repl ( cpython default )

// keyboard driver buffer
window.stdin_buf = ""

// internal keyboard buffer
window.stdin_tmp = ""





// this is the closest to a readline interface we can get.
function window_prompt(){
    if (window.stdin.length>0) {
        var str = window.stdin
        window.stdin = ""
        console.log("PROMPT["+str+"]")
        return str
    }
    return null
}


function stdin_poll(){
    //pending draw ?
    if (stdout_blit)
        flush_stdout();

    //pending io/rpc ?
    if (plink.io)
        plink.io()


    if (window.cpython) {
        // is last batch out ?
//        if (window.stdin.length)
  //          return

        // did we get a newline ?
        if (!window.stdin_flush)
            return

        if (!window.stdin_buf.length)
            return

        if ( getValue( plink.io_port_kbd, 'i8') ) {
            console.log("kbd port locked, retrying later")
            return
        }
        var utf8 = unescape(encodeURIComponent(window.stdin_buf));
        // keep the stdin buffer for prompt().
        window.stdin = utf8
        window.stdin_buf = ""
        window.stdin_flush = false;

        console.log("ready to send kbdport@"+plink.io_port_kbd+"["+utf8+"]")

    } else {
        if (!window.stdin_raw)
            return

        if (!window.stdin.length)
            return

        if ( getValue( plink.io_port_kbd, 'i8') ) {
            console.log("kbd port locked, retrying later")
            return
        }

        var utf8 = unescape(encodeURIComponent(window.stdin));

        // event driven repl can consume via kbd port.
        window.stdin = ""
    }

    /// flush whole buffer to shared memory as a null terminated str
    stringToUTF8( utf8, plink.io_port_kbd, 1024) // MP_IO_SIZE


}


// Ctrl+L is mandatory ! need xterm.js 3.14+
function xterm_helper(term, key) {
    function ESC(data) {
        return String.fromCharCode(27)+data
    }
    if ( key.charCodeAt(0)==12 ) {
        var cy = 0+term.buffer.cursorY
        if ( cy > 0) {
            if (cy <= term.rows) {
                term.write( ESC("[B") )
                term.write( ESC("[J") )
                term.write( ESC("[A") )
            }

            term.write( ESC("[A") )
            term.write( ESC("[K") )
            term.write( ESC("[1J"))

            for (var i=1;i<cy;i++) {
                term.write( ESC("[A") )
                term.write( ESC("[M") )
            }
            term.write( ESC("[M") )
        }
        return false
    }
    return true
}


// =================================== STDOUT ==================================

// TODO: add a dupterm for stderr, and display error in color in xterm if not in stdin_raw mode


window.stdout_blit = false
window.stdout_array = []


function flush_stdout_utf8(){}

function stdout_process_utf8(cc) {
    term_impl(cc)
    stdout_blit = false
}


window.stdout_process = stdout_process_utf8
window.flush_stdout = flush_stdout_utf8


// this is a demultiplexer for stdout and os (DOM/js ...) control
function pts_decode(text){

    try {
        var jsdata = JSON.parse(text);
        for (key in jsdata) {
            // TODO: multiple fds for pty.js
            if (key=="1") {
                stdout_process(unhex_utf8( jsdata[key]))
                //stdout_process( jsdata[key] )
                continue
            }
            try {
                embed_call(jsdata[key])
            } catch (e) {
                console.log("IOEror : "+e)
            }
        }


    } catch (x) {
        // found a raw C string via libc
        console.log("C-OUT ["+text+"]")
        flush_stdout()
        try {
            posix.syslog(text)
        } catch (y) {
            term_impl(text+"\r\n")
        }

    }
}

// ========================== startup hooks ======================================

window.script_types = ["text/python","text/µpython"]

if ( window.cpython ) {
    window.script_type = "text/python"
    window.script_interpreter = "python"
    window.stdin_echo = true
    window.stdin_raw = false;
    window.stdin_flush = false;
} else {
    window.script_type = "text/µpython"
    window.script_interpreter = "micropython"
}

function setStatus(args) {
    console.log("setStatus : " + args)
}


function preMainLoop(args) {
    //console.log("preMainLoop : " + args)
    stdin_poll()
    return true
}

if (undef("Module")){
    console.log("-- RUNNING FROM USER DEFINED --")
    window.Module = {
        preRun : [preRun],
        postRun: [postRun],
        setStatus : setStatus,
        preMainLoop : preMainLoop,
        print : pts_decode,
        printErr : console.log,
    }
    window.script_type = "text/python"
} else {
    console.log("-- RUNNING FROM EMSCRIPTEN DEFAULTS --")
}



async function pythons(argc, argv){
    var scripts = document.getElementsByTagName('script')

    for(var i = 0; i < scripts.length; i++){
        var script = scripts[i]

        if(script.type == script_type){

            var emterpretURL = window.script_interpreter + ".binary"
            var emterpretXHR = new XMLHttpRequest;
                emterpretXHR.open("GET", emterpretURL, !0),
                emterpretXHR.responseType = "arraybuffer",
                emterpretXHR.onload = function() {
                    if ( (200 === emterpretXHR.status) || (0 === emterpretXHR.status) ) {
                        Module.emterpreterFile = emterpretXHR.response
                        console.log("Using "+window.script_interpreter+" VM via asyncify")
                    } else {
                        console.log("Using "+window.script_interpreter+" VM synchronously because no micropython.binary => " + emterpretXHR.status )
                    }
                    include(window.script_interpreter + ".js")
                }
                emterpretXHR.send(null)
            break
        }
    }
}


//console.log('pythons included')


