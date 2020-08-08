from threading import Thread

print("="*80)

print("Hello World")

def __main__(*argv, **env):
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


with aio.hide:
    with aio.block:
        aio.start([],{})


    global sock, fd
    tic = 5

    #sock = aio_open("192.168.1.66:26667", "a+", 5)
    sock = aio_open("82.65.46.75:26667", "a+", 5)


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

