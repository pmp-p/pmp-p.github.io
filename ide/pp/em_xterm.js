
var vt100 = null;

console.log("emboot : non-standard emscripten loader found, assuming xterm.js");
window.kbQ = new Queue() ;
window.kbL = new Queue();

function terminal_in(ek){
    for (var i=0; i<ek.length; i++) {
        console.log('vt100:' + ek.charAt(i) );
        window.kbQ.push( ek.charAt(i) );
    }
}

function term_impl(text){
    //vt100.do_recv(text,DBG);
    if (window.vt100_echo)
        vt100.write(text);
    //else
       // console.log('echo off "'+text+'"');
}

function terminal_out(text){
    var add_trail = true;
    try {
        if (arguments.length > 1)
            text = Array.prototype.slice.call(arguments).join(' ')
        tl = text.length;

        //maybe got DLE+ETX
        if (tl>=2){

            if (  (text.charCodeAt(tl-1)==3) && (text.charCodeAt(tl-2)==16) ){
                // only DLE_ETX go out
                if (tl==2)
                    return;
                //chop
                text = text.substring(0,tl-2);
                //no \n for data transmission.
                add_trail = false;
            }
        }

        // anything not raw data has the trailing \n chopped , add it back.
        // and since it is vt100 add \r
        if (add_trail)
            text = text + "\r\n";
        term_impl(text)

    } catch (x){
        console.log("E.out : "+ x);
    }
}
register( terminal_out );

//======================================================
// select support for console

function kbd_has_io(channel){
    return window.kbQ.length;
}

function kbd_getch_i(channel){
    if (!window.kbQ.length)
        return -1;
    var c = window.kbQ.shift();
    return c.charCodeAt(0);
}
function kbd_echo(status){
    if (status==1)
        window.vt100_echo = 1;

    if (status==0)
        window.vt100_echo = 0;

    return window.echo_is_on;
}

//======================================================

async function emboot(){
    include("./inc/browserfs.min.js");
    include("./inc/xterm.css");
    include("./inc/fullscreen.css");
    include("./inc/xterm.js");
    include("./inc/fit.js");

    await _until(defined)("Terminal");

    window.vt100_echo = 1

    vt100 = new Terminal({
        cols : 132,
        rows : 51,
        tabStopWidth : 8,
        cursorBlink : true,
        cursorStyle : 'block',
        applicationCursor : true,
    });

    vt100.open(document.getElementById('xterm'), focus=true);

    await _until(defined)('fit');

    Terminal.applyAddon(fit);
    vt100.on('data', terminal_in); //vt100.write.bind(xterminal));
    vt100.fit();

    register(vt100);

    Module["print"] = terminal_out;
    Module["has_io"] = kbd_has_io ;
    Module["kbd_echo"] = kbd_echo ;
    Module["kbd_getch_i"] = kbd_getch_i;
}

window.onload = function(){
    Module.arguments = [];

    APPNAME = push_arguments();
    console.log("Begin (onload) : " + APPNAME + "(" + Module.arguments + ")" );

    main(APPNAME);

    console.log("End (onload): " + APPNAME );
}

async function main(argv){
    await _until( defined )("get_lzma");
    jsrun_lzma( APPNAME + ".js.lzma", "entrypoint", 538*1024);
}


emboot();
