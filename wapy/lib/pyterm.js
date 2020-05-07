include("lib/pyterm.css")
include("https://cdnjs.cloudflare.com/ajax/libs/xterm/3.14.4/xterm.min.css","css")
include("https://cdnjs.cloudflare.com/ajax/libs/xterm/3.14.4/xterm.min.js")
include("https://cdnjs.cloudflare.com/ajax/libs/xterm/3.14.4/addons/fit/fit.min.js")




Module.canvas = canvas;

function PYTHONSTARTUP() {
    window.urls.cors = function (url){
        if (url.includes('/wyz.fr/'))
            return CORS_BROKER + url
        return url
    }

}

/*Initialization function*/
window.onload = function() {

    Terminal.applyAddon(fit);
    window.term = new Terminal({
            cols : 132,
            rows : 40,
            tabStopWidth : 8,
            cursorBlink : true,
            cursorStyle : 'block',
            applicationCursor : true,
        });

    //term.customKeydownHandler = kbd_handler

    aio_fd_0 = document.getElementById('aio_fd_0');
    aio_fd_0.value = "";
    term.open(aio_fd_0);
    term.fit();

    /*Setup key input handler */
    // window_prompt is the pythons.js function that will flush
    // pseudo-readline buffer toward upy core
    window.prompt = window_prompt


    /*Write text to the terminal */
    window.term_impl = function (text) { term.write(text) }

    /*Setup key input handler */

    term.on('data', function(key, e) {
        if ( xterm_helper(term, key) ) {
            if (key.charCodeAt(0) <=27)
                console.log("KBD : "+key.charCodeAt(0)+ " len= "+key.length)
            window.stdin += key
        }
        //term.write(key)
    });
    /*Initialize MicroPython itself*/
    /*Initialize the REPL.*/
    pythons()
}
