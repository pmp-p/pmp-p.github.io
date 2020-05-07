function mdi_vt(mdi_name, dlay) {

    var SCROLL_WIDTH = 24;

    console.log("Opening mdi :" + mdi_name)

    function q(tag) {
        var q_name = mdi_name
        var query = "div#"+q_name+" div[class='"+tag+"']"
        console.log(query)
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
    // expand anchor
    spreadwin_anchor(true);


    // reset div position
    popup.style.top = "40px";
    popup.style.left = "640px";
    popup.style.height = "480px";

    //popup.style.width = window.innerWidth - SCROLL_WIDTH + "px";
    //popup.style.height = window.innerHeight - SCROLL_WIDTH + "px";
    popup.style.display = "block";
    oldParent = document.getElementById("aio_fd_0");
    oldParent.style.display = "block";


    while (oldParent.childNodes.length) { popup.appendChild(oldParent.firstChild); }
    term.fit()
    popup.style.height = "500px"
    document.body.removeChild(aio_fd_0)
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


mdi_vt("mdi_vt",500)










