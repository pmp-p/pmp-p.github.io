

import io
import binascii

import python3.aio.plink
from python3.aio.plink import window, CallPath


class socket:
    def __init__(self):
        self.i = io.BytesIO()
        self.o = io.BytesIO()
        self.sid = "?"

    @classmethod
    def getaddrinfo(cls, host, port):
        return [ [(host,port,)] ]

    async def connect(self, addr):
        window.embed_dbg = 1
        plink.DBG=1
        self.sid = await window.socks.open(*addr)
        try:
            await aio.io.ctl(self, 'open',tmout=3000)
        except Exception as e:
            print("SOCKET:",self,"TMOUT",e)

    def makefile(self):pass

    def write(self,b):
        CallPath.proxy.io( self.sid ,m="N", jscmd=b )


    def __repr__(self):
        return "<socket {}>".format( self.sid )


async def __main__(argc, argv):
    print(" ------------- Hello WasmPython + sockets ----------")

    (HOST,PORT) = ('pmpp.ddns.net', 26667)
    print('connecting to {}:{}'.format( HOST, PORT) )

    sock = socket()
    await sock.connect( (HOST,PORT,) )
    sock.write(b"CAP LS\nNICK wapy\nUSER wapy wapy locahost :wsocket\nJOIN #sav\n")


print( window, CallPath)
