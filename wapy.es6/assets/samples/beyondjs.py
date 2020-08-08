from threading import Thread

print("="*80)

print("Hello World")

async def __main__(*argv, **env):
    tac = 25 * 60
    while tac:

        if not tac % 250 :
            print('    async tac',tac)
        await aio.sleep(.016)
        tac -= 1
    print('aio __main__ done')


class Bot(Thread):

    async def run(self, *args, **kwargs):
        global sock

        nick = 'wapy_'+str(time.time())[-5:].replace('.','')
        channel = '#sav'

        print("sending on",sock,sock.fileno())
        d = { 'nick': nick , 'channel' : channel }
        aio_write(sock.fileno(), """CAP LS\r\nNICK {nick}\r\nUSER {nick} {nick} localhost :wsocket\r\nJOIN {channel}\r\n""".format(**d))

        aio_write(sock.fileno(), "PRIVMSG #sav :Salut à vous !\r\n")

        tic = 60

        ini = int( Time.time() )

        # do some irc for 60 seconds
        # with 1 second deadline self.rt(1) => self.slice=1

        while not (await self):
            if aio_return(sock):
                line = sock.read(0).strip()
                if line.count(':')>1:
                    _, source,data = line.split(':',2)
                    if source.count(' ')>1:
                        source, cmd, target = source.split(' ',2)
                    if not cmd.isdigit():
                        print('%s|%s>' %(target,source), data )

            aio_write(sock.fileno(), "PRIVMSG %s :%s :%s\n" % (channel, tic , int(Time.time()-ini)) )


            tic -= 1

            if tic<0:
                break

        print('aio thread done')





def wshandler(data):
    print("wshandler",data)



with aio.hide:
    with aio.block:
        aio.start([],{})


    tic = 10

    sock = socket()

    print("sock = ",sock)

    sock.bind( ("localhost",80,) )


    print("sock bound", sock )


    #aio_write( sock.fileno(), "pouet")

    sock.listen()

    client, addr = sock.accept()
    client.ws = wshandler
    print( "ACCEPTED:", client, addr  )

    while tic:
        print('tic',tic)
        if aio_return(client):
            print( "client :", client.read(0) )
            html = '''<html>
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
<body>
<pre>pouet from wapy</pre>
<img src="logos/beer.png">
</body>
</html>'''


            aio_write( client.fileno(), '''<!DOCTYPE html>
<html lang="en">
<base href="http://localhost:8000/beyondjs/src/">
    <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>beyondjs</title>
    <link href="static/normalize.css" rel="stylesheet">
    <link href="static/fonts/leaguegothic.css" rel="stylesheet">
    <link href="static/main.css" rel="stylesheet">
    </head>

<script>
window.vaddr = "{}"
</script>

    <body>
    <div id="background">
        <video autoplay="" loop="" poster="static/video/poster.jpeg">
        <source src="static/video/space.ogv" />
        <source src="static/video/space.mp4" />
        <source src="static/video/space.webm" />
        </video>
    </div>
    <div id="overlay">
    </div>
    <div id="container"></div>
    <script src="static/main.js" type="module"></script>
    </body>
</html>'''.format( client.vaddr ) )

        time.sleep(1)

        tic -= 1



    if 0:

        if sock:

            bot = Bot()

            # scheduling time slice in seconds.
            bot.rt(1)

            # go !
            bot.start()

            #  wait till it terminates
            #bot.join()

        else:
            pdb("Failed to connect in allowed time")
    print('sync main done')

































