
def __main__(*argv, **env):
    tac = 25 * 60
    while tac:

        if not tac % 250 :
            print('    async tac',tac)
        await aio.sleep(.016)
        tac -= 1
    print('aio __main__ done')


def main():
    global sock, fd
    tic = 5

    #sock = aio_open("192.168.1.66:26667", "a+", 5)
    sock = aio_open("82.65.46.75:26667", "a+", 5)

    nick = 'wapy_'+str(time.time())[-5:].replace('.','')
    if sock:
        print("sending on",sock,sock.fileno())
        d = { 'nick': nick , 'channel' : '#sav' }
        aio_write(sock.fileno(), """CAP LS\r\nNICK {nick}\r\nUSER {nick} {nick} localhost :wsocket\r\nJOIN {channel}\r\n""".format(**d))

        tic = 60

        aio_write(sock.fileno(), "PRIVMSG #sav :Salut à vous !\r\n")

        while tic>0:
            print("    sync tic",tic, Time.time() )
            if aio_return(sock):
                line = sock.read(0).strip()
                if line.count(':')>1:
                    _, source,data = line.split(':',2)
                    if source.count(' ')>1:
                        source, cmd, target = source.split(' ',2)
                    print('%s|%s>' %(target,source), data )


            #aio_write(sock.fileno(), "PRIVMSG %s :%s :%s\n" % (channel, tic , int(Time.time())) )
            time.sleep(2)
            tic -= 2
    else:
        pdb("Failed to connect in allowed time")
    print('sync main done')


with aio.hide:
    with aio.block:
        aio.start([],{})
    main()
print('bye')
