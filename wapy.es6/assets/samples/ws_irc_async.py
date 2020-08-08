
async def __main__(*argv, **env):
    tic = 10
    print(" ------------- Hello WasmPython + sockets ----------")

    nick = 'wapy_'+str(time.time())[-5:].replace('.','')
    d = { 'nick': nick , 'channel' : '#sav' }

    async with aio.ctx(0).call(aio_open("82.65.46.75:26667", "a+",5)) as sock:
        if sock:
            fd = sock.fileno()
            print("sock fd=",fd)
            aio_write(fd, """CAP LS\r\nNICK {nick}\r\nUSER {nick} {nick} localhost :wsocket\r\nJOIN {channel}\r\n""".format(**d))
            aio_write(fd, "PRIVMSG #sav :Salut à vous !\r\n")
            while tic:
                print(tic, Time.time() )
                await aio.sleep(1)
                tic -= 1
                if aio_return(sock):
                    line = sock.read(0).strip()
                    if line.count(':')>1:
                        _, source,data = line.split(':',2)
                        if source.count(' ')>1:
                            source, cmd, target = source.split(' ',2)
                        print('%s|%s>' %(target,source), data )

        else:
            pdb("Failed to connect in allowed time")


    print("__main__ done")

aio.start([],{})
