"use strict";

/*
https://github.com/WebKit/webkit/blob/master/Source/WebCore/Modules/websockets/WebSocket.idl
[
    ActiveDOMObject,
    Constructor(USVString url, optional sequence<DOMString> protocols = []),
    Constructor(USVString url, DOMString protocol),
    ConstructorMayThrowException,
    ConstructorCallWith=ScriptExecutionContext,
    Exposed=(Window,Worker),
    EnabledAtRuntime=WebSocket
] interface WebSocket : EventTarget {
    readonly attribute USVString URL; // Lowercased .url is the one in the spec, but leaving .URL for compatibility reasons.
    readonly attribute USVString url;

    const unsigned short CONNECTING = 0;
    const unsigned short OPEN = 1;
    const unsigned short CLOSING = 2;
    const unsigned short CLOSED = 3;
    readonly attribute unsigned short readyState;

    readonly attribute unsigned long bufferedAmount;

    attribute EventHandler onopen;
    attribute EventHandler onmessage;
    attribute EventHandler onerror;
    attribute EventHandler onclose;

    readonly attribute DOMString? protocol;
    readonly attribute DOMString? extensions;

    attribute DOMString binaryType;

    [MayThrowException] void send(ArrayBuffer data);
    [MayThrowException] void send(ArrayBufferView data);
    [MayThrowException] void send(Blob data);
    [MayThrowException] void send(USVString data);

    [MayThrowException] void close(optional [Clamp] unsigned short code, optional DOMString reason);
};
*/






var module = module_load("fd");
window.rpc_id = 0



//=========================== attic ==================

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}
function ID(){
    window.rpc_id++ ;
    return 'js|' + window.rpc_id;
}
register(ID)

//=========================== attic ==================



function tmpfile(){
     return '/tmp/' + Math.random().toString(36).substr(2, 9);
}
register(tmpfile)


var fdpool = 0;
var fdstat = {}

var fd = {"name":"fd"}
register(fd);

function ioctl(dev,opcode,params) {
    console.log('IOCTL: ' + dev +' '+ opcode +' '+ params );
    window.embed_state['ioctl-'+dev.fd] = [dev,opcode,params] ;
}
register(ioctl)

function blob_as_str(b) {
    var u, x;
    u = URL.createObjectURL(b);
    x = new XMLHttpRequest();
    x.open('GET', u, false); // although sync, not fetching over internet
    x.send();
    URL.revokeObjectURL(u);
    return x.responseText;
}
register(blob_as_str)


window.embed_replies = new Map()
window.embed_state = {}
window.embed_ref = []

function embed_call_impl(callid, fn, owner, params) {
    var rv = null;
    try {
        rv = fn.apply(owner,params)
    } catch(x){
        console.log("call failed : "+fn+"("+params+") : "+ x )
    }
    if ( (rv !== null) && (typeof rv === 'object')) {
        var seen = false
        var rvid = null;
        for (var i=0;i<window.embed_ref.length;i++) {
            if ( Object.is(rv, window.embed_ref[i][1]) ){
                rvid = window.embed_ref[i][0]
                //console.log('re-using id = ', rvid)
                seen = true
                break
            }
        }

        if (!seen) {
            rvid = ID();
            window[rvid] = rv;
            window.embed_ref.push( [rvid, rv ] )
            //transmit bloat only on first access to object
            window.embed_state[""+callid ] =  rvid +"/"+ rv
        } else
            window.embed_state[""+callid ] =  rvid
    } else
        window.embed_state[""+callid ] =""+rv
    //console.log("embed_call_impl:" + window.embed_state )
}
register(embed_call_impl)


function embed_call(jsdata) {
    var jsdata = JSON.parse(jsdata);

    //always
    var callid = jsdata['id'];
    var name = jsdata['m'];
    try {
        var path = name.rsplit('.')
        var solved = []
        solved.push( window )

        while (path){
            var elem = path.shift()
            if (elem){
                var leaf = solved[ solved.length -1 ][ elem ]
                console.log( solved[ solved.length -1 ]+" -> "+ leaf)
                solved.push( leaf )
            } else break
        }
        var target = solved[ solved.length -1 ]
        var owner = solved[ solved.length -2 ]

        if (!isCallable(target)) {
            console.log("embed_call(query="+name+") == "+target)
            window.embed_state[""+callid ] = target
            return
        }

        //only if method call
        var params = jsdata['a'];
        var env = jsdata['k'] || {};

        console.log('embed_call:'+target +' call '+callid+' launched with',params,' on object ' +owner)

        setTimeout( embed_call_impl ,1, callid, target, owner, params );
    } catch (x) {
        console.log('malformed RPC '+jsdata + ' : '+x )
    }
}
register(embed_call)


function embed_process_msg(data){
    if (data.startswith("//")) {
    // S == sync call
        if (data.startswith("//S:")) {
            data = data.substring(4, data.length)
            console.log("EVAL:", data)
            eval(data)
            return 1
        }
    // A == async call
        if (data.startswith("//A:")) {
            embed_call( data.substring(4, data.length) )
            return 0 // no pumping since we will receive an answer
        }
    // R == result
        if (data.startswith("//R:")) {
            data = JSON.parse( data.substring(4, data.length) )
            window.embed_replies.set( 0+data["id"] , data["r"] )
            return 1
        }
    //discard //

    } else {
        log('MESSAGE: ' + data )
    }
    // default to keep alive
    return 1
}
register(embed_process_msg)




class socket extends EventTarget {
    constructor(domain, type, protocol) {
        super();
        this.protocol = protocol;

        this.binaryType = type;
        this.readyState = WebSocket.CONNECTING;
    }

    connect(url) {
        this.fd =  ID();  // or uuidv4()
        this.port = parseInt( url.rsplit(':').pop() );
        ioctl(this, 'connect',  this.port );
    }

    get onopen() {
        return this.listeners.open;
    }

    get onmessage() {
        return this.listeners.message;
    }

    get onclose() {
        return this.listeners.close;
    }

    get onerror() {
        return this.listeners.error;
    }

    set onopen(listener) {
        delete this.listeners.open;
        this.addEventListener('open', listener);
    }

    set onmessage(listener) {
        try { delete this.listeners.message } catch (x){}
        this.addEventListener('message', listener)
    }

    set onclose(listener) {
        try { delete this.listeners.close } catch (x){}
        this.addEventListener('close', listener)
    }


    set onerror(listener) {
        try { delete this.listeners.error } catch (x){}
        this.addEventListener('error', listener)
    }

    send(request){
        console.log("214: socket "+request)
        //document.getElementById('url').textContent = "URL : " + request;
    }

}
register(socket)

module_loaded(module);

