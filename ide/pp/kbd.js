var module = module_load("kbd");

var lines= 0;
var maxlines= 24;

setdefault('kbd_classic',true);
setdefault('kbd_mod',true);
setdefault('kbd_dom3',true);
setdefault('kbd_odom3', false);

setdefault('keydown_suppr',true);
setdefault('keypress_suppr',true);
setdefault('keyup_suppr',true);

setdefault('kbd_silent', false);

setdefault('kbd_handler',null);


function kbd_has_io(channel){
    return window.kbQ.length;
}


function kbd_getch_i(channel){
    if (!window.kbQ.length)
        return -1;
    var c = window.kbQ.shift();
    return c.charCodeAt(0);
}


function kbd_set_line(text){
    window.kbL.push(text);
}


function kbd_has_line(){
    return window.kbL.length;
}


function kbd_get_line(){
    data = window.kbL.shift();
    for (var i = 0, len = data.length; i < len; ++i) window.kbQ.push( data.charCodeAt(i) );
}





function showmesg(t)
{
   var old= document.doc_form.text_area.value;
   if (lines >= maxlines)
   {
    var i= old.indexOf('\n');
    if (i >= 0)
        old= old.substr(i+1);
   }
   else
    lines++;

   document.doc_form.text_area.value= old + t + '\n';
}

function keyval(n)
{
    if (n == null) return 'undefined';
    var s= pad(3,n);
    if (n >= 32 && n < 127) s+= ' (' + String.fromCharCode(n) + ')';
    while (s.length < 9) s+= ' ';
    return s;
}

function keymesg(w,e)
{
    if (kbd_handler) {
        if (kbd_handler(w,e)) //handled ? => no spam
            return ;
    }

    var row= 0;
    var head= [w, '        '];

    if (kbd_classic) {
    showmesg(head[row] +
            ' keyCode=' + keyval(e.keyCode) +
        ' which=' + keyval(e.which) +
            ' charCode=' + keyval(e.charCode));
    row= 1;
    }
    if (kbd_mod) {
    showmesg(head[row] +
            ' shiftKey='+pad(5,e.shiftKey) +
        ' ctrlKey='+pad(5,e.ctrlKey) +
        ' altKey='+pad(5,e.altKey) +
        ' metaKey='+pad(5,e.metaKey));
    row= 1;
    }
    if (kbd_dom3) {
    showmesg(head[row] +
        ' key='+e.key +
        ' char='+e.char +
        ' location='+e.location +
        ' repeat='+e.repeat);
    row= 1;
    }
    if (kbd_odom3) {
    showmesg(head[row] +
        ' keyIdentifier='+ pad(8,e.keyIdentifier)+
        ' keyLocation='+e.keyLocation);
    row= 1;
    }

    if (row == 0)
        showmesg(head[row]);
}

function pad(n,s)
{
   s+= '';
   while (s.length < n) s+= ' ';
   return s;
}

function suppressdefault(e,flag)
{
   if (flag)
   {
       if (e.preventDefault) e.preventDefault();
       if (e.stopPropagation) e.stopPropagation();
   }
   return !flag;
}

function keydown(e)
{
   if (!e) e= event;
   keymesg('keydown',e);
   return suppressdefault(e, keydown_suppr);
}

function keyup(e)
{
   if (!e) e= event;
   keymesg('keyup',e);
   return suppressdefault(e, keyup_suppr);
}

function keypress(e)
{
   if (!e) e= event;
   keymesg('keypress',e);
   return suppressdefault(e, keypress_suppr);
}

function textinput(e)
{
    if (!e) e= event;

    if (!kbd_silent)
        showmesg('textInput data='+e.data);
    return suppressdefault(e, document.doc_form.textinput.checked);
}


// thanks to http://blog.rodneyrehm.de/archives/33-libsass.js-An-Emscripten-Experiment.html for better understanding
var C_char = function (str) {
    return allocate(intArrayFromString(str), 'i8', ALLOC_STACK); //NORMAL);
}


function em_kbd_handler(w,e){
    if (w=='keydown' && (e.keyCode==13) ){
        var content = document.doc_form.text_area.value;
        var last_line = content.substr(content.lastIndexOf("\n")+1);
        e.preventDefault();
        e.stopPropagation();

        var element = document.doc_form.text_area;
        element.value += "\n";
        element.scrollTop = element.scrollHeight;

        if (last_line.indexOf(">>> ", 0) !== -1)
            last_line = last_line.substr(4);

        var ptr = C_char(last_line) ;
        //send line to repl
        C_kbd_set_line( ptr );
        //FIXME:
        if (ptr) {
            try {
                Module._free(ptr);
            } catch (x) { console.log('segfault'); }

        }
    }
    return true;
}


async function kbd_init(h)
{
    if (h){
        window.kbd_handler = h;
        console.log("keyboard handler is now " + h.name );

    }

    //install poor man's select
    Module.kbd_has_io = kbd_has_io ;

    // log errors on terminal when interactive
    await _until(defined)("text_area_out");

    Module.printErr = text_area_out;

    document.doc_form.text_area.value+= '';
    lines= 0;

    if (document.addEventListener)
    {
       document.addEventListener("keydown",keydown,false);
       document.addEventListener("keypress",keypress,false);
       document.addEventListener("keyup",keyup,false);
       document.addEventListener("textInput",textinput,false);
    }
    else if (document.attachEvent)
    {
       document.attachEvent("onkeydown", keydown);
       document.attachEvent("onkeypress", keypress);
       document.attachEvent("onkeyup", keyup);
       document.attachEvent("ontextInput", textinput);
    }
    else
    {
       document.onkeydown= keydown;
       document.onkeypress= keypress;
       document.onkeyup= keyup;
       document.ontextinput= textinput;   // probably doesn't work
    }
}

window.kbQ = new Queue() ;
window.kbL = new Queue();

module_loaded(module, this);
//
