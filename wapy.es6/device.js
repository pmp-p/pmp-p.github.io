"use strict";

class loopback {

    constructor(family, type, proto) {
        this.sid ="" +  ++vm.aio.plink.id
        this.name = "loopback("+this.sid+")"
        this.binaryType = undefined
        this.loopback = true
    }

    // loopback is an inverted socket

    // send is receive
    //send(data) {
    recv(data) {
        if (data.substr(0,1) == '<') {
            console.log(this.name + ": received [html] on " + this.vaddr )
            var b = new Blob([data],  {type: "text/html; charset=utf-8"} )
            if (window.last_b_url) {
                console.log('url blob cleaned up')
                window.URL.revokeObjectURL(window.last_b_url)
            }

            window.last_b_url = window.URL.createObjectURL(b)
            setTimeout( function () { window.open( window.last_b_url, "web") } , 10 )
            return
        }

        if (data.substr(0,1) == '{') {
            console.log(this.name + ": received [json] on " + this.vaddr )
            this.onmessage( {'data':data})  // source origin
            return
        }
    }

    // receive is sending directly to sockets incoming queue
    //recv(data) {
    send(data) {
        const fd = vm.posix.fildes[this.sid];
        console.log(this.name + ": sending " + data + " on " + fd );
        try {
            data = JSON.parse(data)
        } catch(x) {}
        fd.i.stream.push( [""+Date.now(), this.vaddr, data ] );
    }

    onopen() {
        console.log(this.name + ":  connected to " + this.vaddr)
        this.send("GET /\r\n")
    }

    connect(url) {
        console.log(this.name +": connecting " + url)
        if (vm.posix.services[url]) {
            console.log(this.name +": found server for : "+ url )
            this.vaddr = "localhost:" + this.sid + "/"
            vm.posix.clients[this.vaddr] = this

            // this is targeting control channel hub
            this.fd = vm.posix.services[url]
            this.fd.impl.onmessage( { 'data' : new Blob([this.vaddr]) } )

        } else {
            console.log(this.name +": ERROR server not found : "+ url )
        }
    }

}

//window.loopback = loopback



// good old http1 each page reload must exec js.
function browse() {
    var html = `<HTML>
<HEAD>
</HEAD>

<style>
html, body {
  width: 100%;
  height:100%;
  margin: 0;
  padding: 0;
}

body {
    background-color: #DDDDDD;
}
</style>

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
    window.open( window.last_b_url, "web")


}

function browse2() {
    console.log("  ******************* CONNECTING **********************")
    var cs = new loopback('AF_LOCAL','SOCK_STREAM', 'http');
        cs.connect('localhost:80');
}
setTimeout(browse2,8000);
