window.socks = { "cors": null, "name":"websocket","id":-1, "err": {} }

log = console.log

function blob_as_str(b) {
    var u, x
    u = URL.createObjectURL(b)
    x = new XMLHttpRequest()
    x.open('GET', u, false) // although sync, you're not fetching over internet
    x.send()
    URL.revokeObjectURL(u)
    return x.responseText
}

/*

// setup websocket with callbacks
var ws = new WebSocket('ws://192.168.1.66:26667/', 'binary')  // or ['binary',]

ws.binaryType = "blob"   // or 'arrayBuffer'

ws.onopen = function() {
    log('CONNECT')
    ws.send( new Blob([`CAP LS\r
NICK wapy\r
USER wapy micropy locahost :wsocket\r
JOIN #sav\r
`]) )
}

ws.onclose = function() { log('DISCONNECT') }

ws.onmessage = function(e) {
    e = blob_as_str(e.data)

    //setTimeout( pump, 5)
    if (e.startsWith("//")) {
    // S == sync call
        if (e.startsWith("//S:")) {
            e = e.substring(4,e.length)
            console.log("EVAL:",e)
            eval(e)
            return
        }
    // A == async call
        if (e.startsWith("//A:")) {
            embed_call( e.substring(4,e.length) )
            return
        }

       //discard //

    } else {
        log('MESSAGE: ' + e.substring(0,20) )
    }
}


*/
