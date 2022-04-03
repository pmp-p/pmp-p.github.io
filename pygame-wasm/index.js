"use strict";

window.__defineGetter__('__FILE__', function() {
  return (new Error).stack.split('/').slice(-1).join().split(':')[0] +": "
})

const DBG=0

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

function register(fn,fn_dn){
    if (!defined(fn_dn) )
        fn_dn = fn.name;
    console.log('  |-- added ' + fn_dn );
    window[fn_dn]=fn;
}

register(register)
register(defined);

function repr(obj) {
    if(obj == null || typeof obj === 'string' || typeof obj === 'number') return String(obj);
    if(obj.length) return '[' + Array.prototype.map.call(obj, repr).join(', ') + ']';
    if(obj instanceof HTMLElement) return '<' + obj.nodeName.toLowerCase() + '>';
    if(obj instanceof Text) return '"' + obj.nodeValue + '"';
    if(obj.toString) return obj.toString();

    return JSON.stringify(obj);
}
register(repr)


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



function dirname(path){
    return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
}
register(dirname);

function basename(path){
    return path.split('/').pop();
}
register(basename);

function _until(fn_solver){
    var argv = Array.from(arguments)
    argv.shift()

    return new Promise(resolve => {
        var start_time = Date.now();
        function solve() {
          if ( fn_solver.apply(null, argv ) ) {
            console.log("_until has reached", argv)
            resolve();
          } else if (Date.now() > start_time + 10000) {
            console.error('ERROR time out waiting for condition _until',argv);
            resolve();
          } else {
            window.setTimeout(solve, 100);
          }
        }

        solve();
    });
}
register(_until);




export class WasmTerminal {

  constructor() {
    this.input = ''
    this.resolveInput = null
    this.activeInput = true
    this.inputStartCursor = null

    this.xterm = new Terminal(
      { scrollback: 10000, fontSize: 14, theme: { background: '#1a1c1f' }, cols: 100}
    );

    const imageAddon = new ImageAddon.ImageAddon("./xtermjsixel/xterm-addon-image-worker.js", {sixelSupport: true});

    this.xterm.loadAddon(imageAddon);
    this.xterm.open(document.getElementById('terminal'))

    // hack to hide scrollbar inside box
    document.getElementsByClassName('xterm-viewport')[0].style.left="-15px"

    this.xterm.onKey((keyEvent) => {
        // Fix for iOS Keyboard Jumping on space
        if (keyEvent.key === " ") {
            keyEvent.domEvent.preventDefault();
        }

    });

    this.xterm.onData(this.handleTermData)
    }

    open(container) {
        this.xterm.open(container);
    }

    ESC() {
        for (var i=0; i < arguments.length; i++)
            this.xterm.write("\x1b"+arguments[i])
    }

    handleTermData = (data) => {

        const ord = data.charCodeAt(0);
        let ofs;

        const cx = this.xterm.buffer.active.cursorX

        // TODO: Handle ANSI escape sequences
        if (ord === 0x1b) {

            // Handle special characters
            switch ( data.charCodeAt(1) ) {
                case 0x5b:

                    const cursor = readline.history.length  + readline.index
                    var histo = ">>> "

                    switch ( data.charCodeAt(2) ) {

                        case 65:
                            // memo cursor pos before entering histo
                            if (!readline.index) {
                                if (readline.last_cx < 0 ) {
                                    readline.last_cx = cx
                                    readline.buffer = this.input
                                }
                                // TODO: get current line content from XTERM
                            }

                            if ( cursor >0 ) {
                                readline.index--
                                histo = ">>> " +readline.history[cursor-1]
                                //console.log(__FILE__," histo-up  :", readline.index, cursor, histo)

                                this.ESC("[132D","[2K")
                                this.xterm.write(histo)
                                this.input = histo.substr(4)
                            }

                            //console.log("VT UP")
                            break;


                        case 66:
                            if ( readline.index < 0  ) {
                                readline.index++
                                histo = histo + readline.history[cursor]
                                this.ESC("[132D","[2K")
                                this.xterm.write(histo)
                                this.input = histo.substr(4)
                            } else {
                                // we are back
                                if (readline.last_cx >= 0) {
                                    histo = histo + readline.buffer
                                    readline.buffer = ""
                                    this.ESC("[2K")
                                    this.ESC("[132D")
                                    this.xterm.write(histo)
                                    this.input = histo.substr(4)
                                    this.ESC("[132D")
                                    this.ESC("["+readline.last_cx+"C")
                                    //console.log(__FILE__," histo-back", readline.index, cursor, histo)
                                    readline.last_cx = -1
                                }
                            }
                            //console.log("VT DOWN")
                            break;

                        case 67:
                            //console.log("VT RIGHT")
                            break;

                        case 68:
                            //console.log("VT LEFT")
                            break;

                        default:
                            console.log(__FILE__,"VT arrow ? "+data.charCodeAt(2))
                    }
                    break
                default:

                    console.log(__FILE__,"VT ESC "+data.charCodeAt(1))
            }

        } else if (ord < 32 || ord === 0x7f) {
            switch (data) {
                case "\r": // ENTER
                case "\x0a": // CTRL+J
                case "\x0d": // CTRL+M
                    this.xterm.write('\r\n');
                    readline.complete(this.input)
                    this.input = '';
                    break;
                case "\x7F": // BACKSPACE
                case "\x08": // CTRL+H
                case "\x04": // CTRL+D
                    this.handleCursorErase(true);
                    break;

                // ^L for clearing VT but keep X pos.
                case "\x0c":
                    const cy = this.xterm.buffer.active.cursorY

                    if (cy < this.xterm.rows )
                        this.ESC("[B","[J","[A")

                    this.ESC("[A","[K","[1J")

                    for (var i=1;i<cy;i++) {
                        this.ESC("[A","[M")
                    }

                    this.ESC("[M")

                    if ( cx>0 )
                        this.ESC("["+cx+"C")
                    break;

            default:
                console.log("vt:" + ord )

          }
        } else {
            this.input += data;
            this.xterm.write(data)
        }
    }

    handleCursorErase() {
        // Don't delete past the start of input
        if (this.xterm.buffer.active.cursorX <= this.inputStartCursor) {
            return
        }
        this.input = this.input.slice(0, -1)
        this.xterm.write('\x1B[D')
        this.xterm.write('\x1B[P')
    }


    clear() {
        this.xterm.clear();
    }

    print(message) {
    const normInput = message.replace(/[\r\n]+/g, "\n").replace(/\n/g, "\r\n");
    this.xterm.write(normInput);
  }

}


{

    const __FILE__ = "index.js:"

    async function fshandler() {
        console.log(__FILE__,"Begin")

        await _until(defined,"FS")

        FS.mkdir("/data");
        FS.mkdir("/data/data");

        await _until(defined, "APK", Module)

        FS.mkdir("/data/data/" + Module.APK);

        var memfs
        BrowserFS.FileSystem.InMemory.Create( function(e,fs){memfs = fs} )

        var mfs =  new BrowserFS.FileSystem.MountableFileSystem();
            BrowserFS.initialize(mfs);

        var BFS = new BrowserFS.EmscriptenFS();

        FS.mount(BFS, {root: "/"}, "/data/data/" + Module.APK );

        function ovfs_cb(e, ovfs ) {
           mfs.mount("/", ovfs)
           window.apk_ready = true
        }

        function apk_cb(e, apkfs){
            console.log(__FILE__,"APK", Module.APK,"received")
            window.document.title = Module.APK
            BrowserFS.FileSystem.OverlayFS.Create(  {"writable" :  memfs, "readable" : apkfs }, ovfs_cb )
        }

        fetch(Module.APK + ".apk").then(function(response) {
            return response.arrayBuffer();
        }).then(function(zipData) {
            const Buffer = BrowserFS.BFSRequire('buffer').Buffer;
            const zipfs = BrowserFS.FileSystem.ZipFS.Create({"zipData" : Buffer.from(zipData),"name":"apk"}, apk_cb)
        })
        await _until(defined,"apk_ready")
        await _until(defined, "postMessage", Module)
        //await custom_site(FS)
        setTimeout(custom_site, 500, FS)
    }
    register(fshandler)

    console.log(__FILE__,"waiting rootfs")

    window.onload = async () => { await custom_onload(WasmTerminal) }

    await fshandler()

    console.log(__FILE__,"custom_site End")

}

