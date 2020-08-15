"use strict";

var config

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
    try {
        log(msg)
    } catch(x){
        console.log(msg)
    }
}


// aio.plink  will hold embed I/O , stdin and stdout buffers
import * as aio from  "./aio.plink.es6.js"





// while this file is emscripten glue

function preRun(){
    console.log("preRun: Begin")

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


function init_repl(){

    console.log("repl: Begin (" + arguments_.length+")")

    if ( aio.plink.shm ) {
        console.log("shared memory ptr was set by wasm module to : " + aio.plink.shm )
        console.log("kbd shared memory port was set by wasm module to : " + aio.plink.io_port_kbd )
    } else {
        console.log("ERROR : shared memory ptr setup from EM_ASM failed")
    }

    console.log("init_repl: shm " + aio.plink.shm+"[" + aio.plink.MAXSIZE + "]")
/*
    if (arguments_.length>1) {

        var argv0 = "" + arguments_.pop() //[1]

        if (argv0.startsWith('edit=')) {
            var fileref=document.createElement('script')
            fileref.setAttribute("type","text/plain")
            fileref.setAttribute("class",'file')
            fileref.setAttribute("id",'argv0.py')
            //fileref.setAttribute("src", argv0.substr(5))
            //fileref.setAttribute("src", window.urls.cors(argv0.substr(5)) )
            fileref.text =  '//' + aio.posix.cors(argv0.substr(5))
            fileref.setAttribute('async',false);
            document.getElementsByTagName("head")[0].appendChild(fileref)
        } else {
            if (argv0.startsWith('http')) {
                if (aio.posix.cors)
                    argv0 = aio.posix.cors(argv0)
            } else {
                console.log("CORS PATCH OFF")
            }

        }

    }
*/

    // set ready for embedded scripts in page
    window.pyscripts = new Array()

    if (scripting.main) {
        var argv0 = scripting.main
        clog('running with sys.argv', argv0)

        window.currentTransferSize = 0
        window.currentTransfer = argv0

        var ab = vm.scripting.fs_get(argv0,'utf-8')
        if (window.currentTransferSize>=0) {
            FS.createDataFile("/",'main.py', ab, true, true);
            console.log("got main.py [" + ab +"]")
            PyRun_VerySimpleFile('main.py')
        } else {

            term_impl("Javascript : error getting main.py from '"+argv0+"'\r\n")
            //TODO: global control var to skip page scripts
        }
    }



    if (config.sti) {
        console.log("allow int for bytecode loop preemption")
        //start repl
        PyRun_SimpleString(`
import embed
import pythons
def VMIF(sti, verbose=0):
    # (dis)allow interrupts to return to host(js) while in python virtual machine

    if sti is True:embed.STI()
    elif sti is False:embed.CLI()
    if verbose:
        if not embed.FLAGS_IF():
            print("Warning : interrupt disabled, using micropython VM")
        else:
            print("Warning : interrupt enabled, using WAPY VM")

def STI(verbose=0):
    VMIF(True,verbose)

def CLI(verbose=0):
    VMIF(False,verbose)
STI(1)`)

    }

    init_repl = undefined
    scripting.repl_init = undefined



}

function runscripts() {
    var scripts = document.getElementsByTagName('script')

    for(var i = 0; i < scripts.length; i++){
        const scr = scripts[i]

        if(scr.type == window.script_type_python){
            if (scr.text) {
                clog("added script of len " + scr.text.length )
                pyscripts.push(scr.text)
            }

        }
    }

    // run scripts or start repl asap
    if (pyscripts.length)
        PyRun_SimpleString()
    else
        console.log("no '"+window.script_type_python+"' script tag found")
}




// =========================== REPL shm interface ===============================

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

//function prepro(text) {
//    return text
//}

// FIXME: ordering of scripts blocks => use a queue and do it async
function PyRun_SimpleString(text){
    if ( getValue( aio.plink.shm, 'i8') ) {
        console.log("shm locked, retrying in 16 ms")
        setTimeout(PyRun_SimpleString, 16, text )
        return //
    }

    if (!text)
        text = pyscripts.shift()
    if (text) {
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
                var tmp = scripting.fs_get(text, "utf-8")
                if (tmp)
                    text=tmp
            }
            */
        }
    }

    if ( text ) {

        //for temporarily fixes
        // text= prepro(text)

        if (text.length >= aio.plink.MAXSIZE)
            console.log("ERROR: python code ring buffer overrun")

        // TODO: ordering of mixed sync/async toplevels
        if (async_script)
            stringToUTF8( text +"\n#async-tl", aio.plink.shm, aio.plink.MAXSIZE )
        else
            stringToUTF8( text, aio.plink.shm, aio.plink.MAXSIZE )

        console.log("wrote "+text.length+"B to shm")
    } else
        console.log("invalid text block [" + text + "]")

    if (pyscripts.length)
        return setTimeout(PyRun_SimpleString, 16 )
}




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

    if (window.cpython) {
        // is last batch out ?
//        if (window.stdin.length)
  //          return

        // did we get a newline ?
        if (!window.stdin_flush)
            return

        if (!window.stdin_buf.length)
            return

        if ( getValue( aio.plink.io_port_kbd, 'i8') ) {
            console.log("kbd port locked, retrying later")
            return
        }
        var utf8 = unescape(encodeURIComponent(window.stdin_buf));
        // keep the stdin buffer for prompt().
        window.stdin = utf8
        window.stdin_buf = ""
        window.stdin_flush = false;

        console.log("ready to send kbdport@" + aio.plink.io_port_kbd + "["+utf8+"]")

    } else {
        if (!window.stdin_raw)
            return

        if (!window.stdin.length)
            return

        if (getValue(aio.plink.io_port_kbd, 'i8')) {
            console.log("kbd port @" +  aio.plink.io_port_kbd + " locked, retrying later")
            return
        }

        var utf8 = unescape(encodeURIComponent(window.stdin));

        // event driven repl can consume via kbd port.
        window.stdin = ""
    }

    /// flush whole buffer to shared memory as a null terminated str
    stringToUTF8( utf8, aio.plink.io_port_kbd, aio.plink.MP_IO_SIZE)

    console.log('FLUSHED')
}

function ESC(data) {
    return String.fromCharCode(27)+data
}

// Ctrl+L is mandatory ! xterm.js 4.7.0+
function xterm4_helper(term, e, kc) {
    if (e.domEvent.ctrlKey) {
        console.log('ctrl + '+ kc)
        if (kc == 76) {
            console.log('clear + '+ term.buffer.active.cursorY)
            var cy = 0+term.buffer.active.cursorY
            if ( cy > 0) {
                var cx = 0+term.buffer.active.cursorX
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
                if (cx > 0) {
                    term.write( ESC("["+cx+"C") )

                }
            }
            return false
        }
    }
    return true
}



// =================================== STDOUT ==================================

// TODO: add a dupterm for stderr, and display error in color in xterm if not in stdin_raw mode

function flush_stdio(){}

function stdio_process(fd, cc) {
    // TODO: multiple vt fds for pty.js
    if (fd==1)
        term_impl(cc)
}


// ========================== startup hooks ======================================


function setStatus(args) {
    console.log("setStatus : " + args)
}

function preMainLoop(args) {
    //console.log("preMainLoop(js)"+JSON.stringify(aio.plink.state))

    //pending io ?
    flush_stdio();

    stdin_poll()

    //pending io/rpc ?
    if (aio.plink.MAXSIZE)
        aio.plink.io()

    return true
}



function pythons(argc, argv){
    var scripts = document.getElementsByTagName('script')

    for (var i = 0; i < scripts.length; i++) {
        var scr = scripts[i]

        if (scr.type == script_type_python) {
            console.log('requesting script interpreter : ' + scripting.interpreter )
            var emterpretURL = scripting.interpreter + ".binary"
            var emterpretXHR = new XMLHttpRequest;
                emterpretXHR.open("GET", emterpretURL, !0),
                emterpretXHR.responseType = "arraybuffer",
                emterpretXHR.onload = function() {
                    if ( (200 === emterpretXHR.status) || (0 === emterpretXHR.status) ) {
                        Module.emterpreterFile = emterpretXHR.response
                        console.log("Using "+ scripting.interpreter + " VM via asyncify")
                    } else {
console.log("Using " + scripting.interpreter + " VM synchronously because no " + scripting.interpreter+".binary => " + emterpretXHR.status )
                    }
                    embed_pythons()
                }
                emterpretXHR.send(null)
            break
        }
    }
}

async function embed(cnf) {
    config = cnf
    console.log("loading ["+ scripting.interpreter + "] flavour")
    include(config['prefix'] + scripting.interpreter + ".js")
    if (config['runscripts']) {
        await _until(defined)("pyscripts")
        runscripts()
    } else {
        console.log('not running embedded scripts')
    }
}


function scripting_set_host(self, win) {
    window = win
    window.clog = clog
    window.script_type_python = "text/python"

    if ( window.cpython ) {
        scripting.interpreter = "python"
        window.stdin_echo = true
        window.stdin_raw = false;
        window.stdin_flush = false;
    } else {
        scripting.interpreter = "wapy"
        window.stdin_raw = true
        window.stdin_echo = false
    }


    scripting.host = window.parent && window.parent.ide

    function trace(ln) {
        if (vm.scripting.host) {
            setTimeout(() => window.parent.ide.setCursor(0+ln,0),1)
        }
    }

    scripting.trace  = trace


    // ===================================== STDIN ================================

    // aio.plink.pts hold tty devices descriptors
    window.stdin_array = []

    // the readline emulation buffer ( via prompt() )
    // for non event driven repl ( cpython default )
    window.stdin = ""

    if (undef("Module")){
        console.log("-- RUNNING FROM USER DEFINED --")
        window.Module = {
            preRun : [preRun],
            postRun: [postRun],
            setStatus : setStatus,
            preMainLoop : preMainLoop,
            print : aio.pts_decode,
            printErr : console.log,
    //        dynamicLibraries : ["libsdl2.so","libwapy.so"],
    //        dynamicLibraries : ["libwapy.so"],
    //        dynamicLibraries : ["libsdl2.so"],
        }
    } else {
        console.log("-- RUNNING FROM EMSCRIPTEN DEFAULTS --")
    }

    // not required anymore
    scripting.set_host = undefined
    scripting_set_host = undefined
    window.vm = self

    return window.Module

}


const scripting = {
    "echo" : undefined,
    "raw"  : undefined,
    "stdin" : "",
    "fs_get" : undefined,
    "main" : undefined,
    "interpreter" : "?",
    "type" : "text/python",
    "set_host" : scripting_set_host,
    "embed" : embed,
    "runscripts": runscripts,
    "xterm4_helper" : xterm4_helper,
    "init_repl" : init_repl,
    'run_scripts' : true,
    'sti' : true,
    'prefix': '../../',
}


var window = undefined
const posix = aio.posix
var dom = aio.dom

export { window, dom, scripting, PyRun_SimpleString, pythons, window_prompt, aio, posix, stdio_process }
