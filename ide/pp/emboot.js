var module = module_load("emboot");
var Module = window.Module;

include("./inc/lzma_worker.js");

include("./inc/browserfs.min.js");

include("fd.js");

include("kbd.js");

/* deprecated with emsdk 2019
function loadDynamicLibraryZ(src) {
  var libModule;
  libModule = eval(src)(
    alignFunctionTables(),
    Module
  );

  // add symbols into global namespace TODO: weak linking etc.
  for (var sym in libModule) {
    if (!Module.hasOwnProperty(sym)) {
        //console.log(sym);
        Module[sym] = libModule[sym];
    }
  }
  //>2019
  loadedDynamicLibraries.push(libModule);
}

register(loadDynamicLibraryZ);

async function dyld_lzma(lzma_file, trigger, size_hint){
    var blob = await get_lzma( window.lib, trigger, lzma_file, size_hint, false, false)
    write_file("lib","lib"+trigger+".so",blob)
}
register(dyld_lzma);


*/


// return null string ptr to NEVER BLOCK ! \n will be added by emscripten loop
// emscripten does not flush stdin buffer on "" only on null.
function window_prompt(){
    if (!window.kbL.length)
        return null;
    return window.kbL.shift();
}

register(window_prompt);


async function dlopen_lzma(lib,size_hint) {
    if ( file_exists("lib/lib"+lib +".js") ){
        console.log(" =========== CAN RAW EVAL ========== ")
    }
    var lzma_file = "lib"+lib+".js.lzma"
    var blob = await get_lzma( window.lib, lib, lzma_file, size_hint, false, false)
    write_file("lib","lib"+trigger+".so",blob)
}
register(dlopen_lzma);


function push_arguments() {
    var argv = "";
    console.log( "window.location.href=" + window.location.href);
    window.APPNAME =  window.location.href.rsplit('?');
    if (window.APPNAME.length==1)
            window.APPNAME.push(argv);

    if (!Module.arguments)
        Module.arguments = [];

    if (!window.APPNAME[0]) {
        window.APPNAME = window.APPNAME[1];
        argv = "";
    } else {
        argv = ""+window.APPNAME[1];
        window.APPNAME = window.APPNAME[0];
    }

    APPNAME = APPNAME.rsplit('_',1)[0];
    APPNAME = APPNAME.rsplit('/',1)[1];

// FIXME: arg list
    if (argv.endswith('zip')){
        argv = argv.rsplit('&');
        window.embed_state["argv"] = argv ;
        console.log(" ========= MULTIPLE ARGUMENTS ("+argv.length+") : ["+argv+"]" );
        Module["arguments"][0] = ""+argv[0] ;
        Module["arguments"][1] = ""+argv[1] ;
        argv = ""+Module["arguments"][0] ;
    }

    if (argv.startswith('http')) {
                console.log(" ========= USING CORS BROKER ======= ");
                Module["arguments"][0] =  "https://cors-anywhere.herokuapp.com/" + argv ;
    } else
        Module["arguments"][0] = argv ;

    return APPNAME;
}
register(push_arguments);


async function fs_get_mount(zipurl, mpoint, trigger){

    function zipready(e, zipfs){
        window.mfs.mount( mpoint, zipfs);
        console.log("BFS : "+ zipurl+" mounted on "+mpoint+' with trigger ['+trigger+']');
        window.fstab[trigger] = true;
    }

    var Buffer = BrowserFS.BFSRequire('buffer').Buffer ;
    var zipdata = await _get(zipurl, "aio_get_" + trigger);
    new BrowserFS.FileSystem.ZipFS.Create( {"zipData": Buffer.from(zipdata), name : "zipfs"}, zipready );
}


function preRun(){
/*
BrowserFS.FileSystem.ZipFS.computeIndex(myLargeZipFile, function(zipTOC) {
  var myZipFs = new BrowserFS.FileSystem.ZipFS(zipTOC);
});
*/
    console.log("Begin: preRun ("+ Module.arguments+")");

    //var xhrfs = new BrowserFS.FileSystem.XmlHttpRequest('directio');

    window.mfs = new BrowserFS.FileSystem.MountableFileSystem();
    BrowserFS.initialize(mfs);

    //mfs.mount("/http",xhrfs);

    fs_get_mount("ulib.zip", "/lib", "lib_min");

    fs_get_mount("pplib.zip", "/lib/dist-packages", "lib_dist_packages");

    var BFS = new BrowserFS.EmscriptenFS();

    FS.createFolder(FS.root, '/usr', true, true);
    FS.mount(BFS, {root: '/'}, 'usr');

    push_arguments();

    /*
    var xhrfs = new BrowserFS.FileSystem.XmlHttpRequest('directio');
    BrowserFS.initialize(xhrfs);
    var BFS = new BrowserFS.EmscriptenFS();

    FS.createFolder(FS.root, '/http', true, true);
    FS.mount(BFS, {root: '/'}, 'http');

    */
    console.log("End: preRun");
}





function postRun(){
    console.log("Begin: postRun");
    window.embed_bridge_push = Module.cwrap('embed_bridge_push', 'number', ['number']);
    console.log("End: postRun");
}


function gl_init() {
    var gl = null;

    if (window.canvas) {
    //FIXME:
        setdefault('gl_aa',false);         // <<<<<<<<<<<<<<<<<< Hey !

        try {
            gl = canvas.getContext("experimental-webgl2") || canvas.getContext("webgl2");
        } catch (x) {
            gl = null;
        }

        if (gl){
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            console.log(" ----- Using WEB GL 2.0 ------");
        } else {
            console.log(" ----- falling back to WEB GL 1.0 ------");
            var glctx = {
                antialias:gl_aa,
                depth: true ,
    //            alpha : false,
                stencil : true,
            }
            try {
                gl = canvas.getContext("experimental-webgl", glctx ) || canvas.getContext("webgl", glctx );


            } catch (x) {
                gl = null;
            }
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
        var ext = gl.getExtension('OES_standard_derivatives');
        if (!ext)
            console.log('GL: [OES_standard_derivatives] supported');
        else
            console.log('GL: Error [OES_standard_derivatives] derivatives *not* supported');

        console.log("RenderingContext :" + gl)

        var antialias = gl.getContextAttributes().antialias;
        console.log('GL: antialias = '+antialias+' wanted:'+gl_aa);

        var aasize = gl.getParameter(gl.SAMPLES);
        console.log('GL: antialias size = '+aasize );
    }
    if (!gl) {
        if (Module.setStatus)
            Module.setStatus("Uh, your browser doesn't support WebGL. This application won't work.");
    }

}

if (Module){
    async function late_init() {
        await _until(defined)('BrowserFS');
        preRun();
        postRun();
        gl_init();
    }

    console.log('*** very late init ***');
    late_init();

} else {

    var statusElement = document.getElementById('status');
    var progressElement = document.getElementById('progress');
    var spinnerElement = document.getElementById('spinner');

    var Module = {
        preRun : [],
        postRun: [],

        // print : redefined by emboot if found a textarea name "output" or default to xterm.js mode.
        // printErr : same

        canvas: (function() {
            window.canvas = document.getElementById('canvas');
            if (window.canvas) {
                // As a default initial behavior, pop up an alert when webgl context is lost. To make your
                // application robust, you may want to override this behavior before shipping!
                // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
                window.canvas.addEventListener("webglcontextlost", function(e) { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);
            } else console.log("Fatal : no canvas");

            return window.canvas;
        })(),

        setStatus: function(text) {
          if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
          if (text === Module.setStatus.text) return;
          var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
          var now = Date.now();
          if (m && now - Date.now() < 30) return; // if this is a progress update, skip it if too soon
          if (progressElement) {
              if (m) {
                text = m[1];
                progressElement.value = parseInt(m[2])*100;
                progressElement.max = parseInt(m[4])*100;
                progressElement.hidden = false;
                if (spinnerElement)
                    spinnerElement.hidden = false;
              } else {
                progressElement.value = null;
                progressElement.max = null;
                progressElement.hidden = true;
                if (spinnerElement) {
                    if (!text) spinnerElement.style.display = 'none';
                }
              }
          }
          if (statusElement)
            statusElement.innerHTML = text;
        },

        totalDependencies: 0,
        monitorRunDependencies: function(left) {
            this.totalDependencies = Math.max(this.totalDependencies, left);
            Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
        }
      };

      Module.setStatus('Downloading...');
      window.onerror = function(event) {
        // TODO: do not warn on ok events like simulating an infinite loop or exitStatus
        Module.setStatus('Exception thrown, see JavaScript console');
        if (spinnerElement)
            spinnerElement.style.display = 'none';
        Module.setStatus = function(text) {
          if (text) Module.printErr('[post-exception status] ' + text);
        };
    };

    //this would have no effect on a preloaded module from .html because main would be *already* running.
    Module.preRun.push( preRun );
    Module.postRun.push( postRun);

    gl_init() ;

}

// Now Module should exists.


if (document.getElementById('output')){
    console.log("emboot : Standard emscripten loader found as id=output, loading kbd/textarea");

    var textarea = document.getElementById('output');
    textarea.rows=25 ;
    textarea.style.height = "640px";

    async function emboot(){

        function term_impl(text){
            var element = document.doc_form.text_area;
            element.value += text;
            return element;
        }
        register(term_impl);

        function text_area_out(text){
            try {

                if (arguments.length > 1)
                    text = Array.prototype.slice.call(arguments).join(' ')

                var add_trail = true;
                var tl = text.length;

                //maybe got DLE+ETX flush mark
                if (tl>=2){

                    if (  (text.charCodeAt(tl-2)==16) &&  (text.charCodeAt(tl-1)==3) ) {

                        // only DLE_ETX get out , that's just an io flush
                        if (tl==2)
                            return;
                        //chop
                        text = text.substring(0,tl-2);
                        //no \n for data transmission.
                        add_trail = false;
                    }
                }

                text = text.replace( String.fromCharCode(16)+ String.fromCharCode(3), '!!') ;

                // anything raw data would have the trailing \n chopped.
                if (!add_trail){
                    term_impl(text)
                    return ;
                }

                if (text.indexOf(">>> ", 0) !== -1){
                    var element = term_impl(">>> ");
                    element.scrollTop = element.scrollHeight;
                    Module.printErr = window.old_stderr;
                    return;
                }

                window.old_stdout(text);

            } catch (x){
                console.log("text_area_out: "+ x +" text="+text);
            }
        }
        register( text_area_out );


        await _until(defined)("kbL");

        document.doc_form = {};
        document.doc_form.text_area = document.getElementById('output');
        document.doc_form.textinput = {}
        document.doc_form.textinput.checked = false;
        window.kbd_silent = true;
        window.keydown_suppr = false;
        window.keypress_suppr = false;
        window.keyup_suppr = false;
        kbd_init(em_kbd_handler);

        window.old_stdout = Module.print;
        window.old_stderr = Module.printErr;
        Module.print = text_area_out;

        if ( Module.cwrap ) {
            window.C_kbd_set_line = Module.cwrap('kbd_set_line', 'number', ['number']);
            window.embed_bridge_push = Module.cwrap('embed_bridge_push', 'number', ['number']);
        } else {
            console.log('=====FATAL====== emscripten module not started (do not use Node/require, use script tag)');
        }
    }
    emboot();

} else {
    console.log("emboot : non-standard emscripten loader found (no id=output), will switch to xterm.js behaviour");
    window["js_req"] = 5
}

// ====================== internal use C core =====================================
if ( typeof window.Worker === "function" ){


} else {
    console.log('FATAL : web worker unsupported');
    alert('FATAL : web worker unsupported on this browser');
}

function embed_sub(jsdata) {
    alert('Begin');

    window.worker = new Worker('pp/sub.js');

    worker.addEventListener('message', function(e) {
      console.log('SUB : ', e.data);
    }, false);

    worker.postMessage();
    jsdata = JSON.parse(jsdata);
    console.log( jsdata );

    alert('End');
    return jsdata['id'];
}

function write_file(dirname, filename, arraybuffer) {
    FS.createPath('/',dirname,true,true);
    FS.createDataFile(dirname,filename, arraybuffer, true, true);
}

// ====================== internal use panda3d =====================================
window.FMap = new Map()


function callfs(fn) {
    window.currentTransfer = fn;

    if (!fn.startsWith('/'))
        fn = '/'+fn;

    console.log('FIXME: sync callfs request [' + fn +']');

    try {
        fstat = FS.stat(  tn ) ;
        if (fstat)
            console.log("callfs: file exists "+ tnraw +' ' + fstat['size']);
        return fstat['size'];
    } catch (x){}


 var oReq = new XMLHttpRequest();

    function updateProgress (oEvent) {
      if (oEvent.lengthComputable) {
        var percentComplete = oEvent.loaded / oEvent.total;
        // ...
      } else {
        // / (window.currentTransferSize+1)
        // Unable to compute progress information since the total size is unknown
      }
    }

    window.currentTransferSize = 0 ;


    var tD_name  = dirname(fn);
    var tB_name = basename(fn);

    function transferComplete(evt) {
        if (oReq.status==404){
            console.log("callfs: File not found : "+ tB_name + ' in ' + (tD_name || '/') );
            window.currentTransferSize = -1 ;

        } else {
            //tD_name = tD_name.replace('/srv/rsr/','/rsr/');
            console.log("callfs: Transfer is complete saving : "+tB_name + " in " + ( tD_name || '/' ));
            var arraybuffer = oReq.response;
            window.currentTransferSize = arraybuffer.length;
            write_file(tD_name,tB_name,arraybuffer);
        }
        FMap.set(window.currentTransfer , window.currentTransferSize)
    }

    function transferFailed(evt) {
      console.log("callfs: An error occurred while transferring the file '"+window.currentTransfer+"'");
    }

    function transferCanceled(evt) {
      console.log("callfs: transfer '"+window.currentTransfer+"' has been canceled by the user.");
    }


    oReq.overrideMimeType("text/plain; charset=x-user-defined");
    oReq.addEventListener("progress", updateProgress);
    oReq.addEventListener("load", transferComplete);
    oReq.addEventListener("error", transferFailed);
    oReq.addEventListener("abort", transferCanceled);

    oReq.open("GET",(''+window.location).rsplit('/',1)[0] + fn ,false);
    oReq.send();

    return window.currentTransferSize;
}
register(callfs);



// ====================== internal use for python module ===========================


window.C_char = function (str) {
    return allocate(intArrayFromString(str), 'i8', ALLOC_STACK); //NORMAL);
}

//good for use with ``
function py(s) {
    var c_s = C_char(s);
    var saved = Module.print ;
    Module.print = term_impl;
    term_impl(s)
    Module._PyRun_SimpleString(c_s);
    Module._free(c_s);
    setTimeout( function(){ Module.print = saved; } , 0);
}
register(py)

//good for use with ``
function pyget(s) {
    var c_s = C_char("embed_set("+s+")");
    window._ = null
    Module._PyRun_SimpleString(c_s);
    Module._free(c_s);
    return window._
}
register(pyget)


function embed_sync() {
    // should poll webworkers there
    var jsdata = JSON.stringify( window.embed_state );
    if ( jsdata != '{}'){
        console.log("embed_sync : "+jsdata )
        jsdata = C_char( jsdata );
        window.embed_bridge_push( jsdata ) ;
        Module._free( jsdata );
        window.embed_state = {};
    }
}
register(embed_sync);

//======================================================================

//simplistic, faster than embed_run_script
function embed_void(jsdata) {
    var br_in = JSON.parse(jsdata);
    return [ br_in['id'] , window[br_in['m']].apply(null,br_in['a']) ];
}
register(embed_void)

module_loaded(module);




