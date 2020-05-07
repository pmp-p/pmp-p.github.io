function mdi(mdi_name, dlay){

    var SCROLL_WIDTH = 24;

    //console.log("Opening mdi :" + mdi_name)

    function q(tag) {
        var q_name = mdi_name
        var query = "div#"+q_name+" div[class='"+tag+"']"
        //console.log(query)
        return document.querySelector(query)
    }

    var popup = q("popup");
    var win_handle = q("handle");
    var win_close = q("close");
    var win_anchor = q("anchor");

    //-- let the popup make draggable & movable.
    var offset = { x: 0, y: 0 };

    var WIDTH =  640
    var HEIGHT = 480


  win_handle.addEventListener('mousedown', mouseDown, false);
  window.addEventListener('mouseup', mouseUp, false);

  function mouseUp()
  {
    window.removeEventListener('mousemove', popupMove, true);
  }

  function mouseDown(e){
    offset.x = e.clientX - popup.offsetLeft;
    offset.y = e.clientY - popup.offsetTop;
    window.addEventListener('mousemove', popupMove, true);
  }

  function popupMove(e){
    popup.style.position = 'absolute';
    var top = e.clientY - offset.y;
    var left = e.clientX - offset.x;
    popup.style.top = top + 'px';
    popup.style.left = left + 'px';
  }
  //-- / let the popup make draggable & movable.

  window.onkeydown = function(e){
    if(e.keyCode == 27){ // if ESC key pressed
      //btn_close.click(e);
    }
  }

  btn_popup_onclick = function(e){
    // win_anchor
    spreadwin_anchor(true);

    // reset div position
    popup.style.display = "block";

    popup.style.top = "400px";

    popup.style.left = "900px";
    popup.style.height = "480px";

  }

    btn_close_onclick = function(e){
    popup.style.display = "none";
        win_anchor.style.display = "none";
    }

    window.onresize = function(e){
        spreadwin_anchor();
    }

    function spreadwin_anchor(flg){
      /*
    var WIDTH =  window.outerWidth
    var HEIGHT = window.outerHeight
    win_anchor.style.width = WIDTH + 100 + "px";
    win_anchor.style.height = HEIGHT + 100 + "px";

    */
        if (flg != undefined && flg == true) win_anchor.style.display = "block";
    }

    setTimeout(btn_popup_onclick,dlay)

}

mdi("mdi_browser",1500)





class loopback {

    constructor(family, type, proto) {

    }

    connect(url) {
        console.log(this + " connecting " + url)
    }

    send(data) {
       console.log(this + " sending " + data)
    }
}

window.loopback = loopback


// good old http1 each page reload must exec js.
function browse() {
    var html = `<HTML>
<HEAD>
</HEAD>

<BODY>
Hi at `+performance.now()+` on http:`+window.name+`<br>
<a href='/click_and_Js' onclick=\"alert('aye');\">click me</a>
<br/>
<a href='/autoclick'>click me</a>
<br/>

</BODY>
</HTML>

    <script type='text/javascript'>

    if (!parent["http:"+window.name]){
        function use(n) {
            window[n] = parent[n];
        }

        use("ioctl");
        use("socket") ;
        use("loopback");
        console.log("IFRAME");
        var cs = new loopback('AF_LOCAL','SOCK_STREAM', 'http');
            cs.connect('localhost:80');
            cs.send('GET /');
        parent["http:"+window.name]=cs
    }

    async function navigate(e) {
        e.preventDefault();
console.log("http:"+window.name+ " : "+e.srcElement.attributes.href.textContent );
        parent["http:"+window.name].send('GET '+e.srcElement.attributes.href.textContent);

    }


    window.onload = function() {
        //for(var i in document.getElementsByClassName('link')) {
        for(var i in document.getElementsByTagName('a')) {
            var link = document.getElementsByTagName('a')[i];
            try {
                link.addEventListener('click', navigate, false);
            } catch (x){ } //console.log("125:"+link) };
        }

    }
    </script>
    `

    var b = new Blob([html],  {type: "text/html; charset=utf-8"} )
    if (window.last_b_url) {
        console.log('url blob cleaned up')
        window.URL.revokeObjectURL(window.last_b_url)
    }
    window.last_b_url = window.URL.createObjectURL(b)
    window.open( window.last_b_url, "browser")

    //setTimeout(browse,5000);
}


































