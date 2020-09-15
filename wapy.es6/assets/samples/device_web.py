
#from threading import Thread

class Spam(aio.Thread):

    async def run(self, *args, **kwargs):
        count = 0
        while not (await self):
            count += 1
            document.body.innerHTML << '( and is still Here %s )<br/>' % count


def dom():

    spam = Spam()

    # scheduling time slice in seconds.
    spam.rt(3)

    document.body.innerHTML = '<pre>Python was Here !</pre>'

    # go !
    spam.start()



async def atruc():
    await aio.sleep(1)
    print('async-machin')


async def main(*argv, **env):
    print('aio main done')


if 0:
    tic = 3

    while tic:
        print('tic',tic)
        tic -= 1
        time.sleep(1)

    #unset  = object()

    class Fact(object):
        """A data descriptor that sets and returns values
           normally and prints a message logging their access.
        """

        def __init__(self, host, name, default=None):
            self.name = name
            self.host = host
            self.host.setup(self.name, default)

        def __get__(self, obj, objtype):
            print("get", self.name)
            return self.host[self.name]

        def __set__(self, obj, val):
            print("maj", self.name)
            self.host[self.name] = val

    class FactMgr(object):
        def __init__(self):
            print('FactMgr init')
            self.__d__ = dict()

        def __setitem__(self, key, v):
            setattr(self.__class__, key, Fact(host=self, name=key, default=v))

        def __getitem__(self, key, default = undef):
            if default is undef:
                return self.__d__.get( key)
            return self.__d__.get( key, default)

        def setup(self, key, v):
            self.__d__.__setitem__( key, v)

    fm = FactMgr()

    fm["x"] = 10
    print(fm.x+0)

    fm.x = 333
    print(fm.x, fm["x"])

    fm.x += 333
    print(fm.x, fm["x"])

    print('test valid pythons.pycore.pyc_test')
    embed.corepy('pyc_test')
    print('\ntest invalid pythons.pycore function')
    embed.corepy('aïe')


import pythons





def sys_excepthook(etype, exc, tb, **kw):
    fn = kw.get('file')
    ln = kw.get('line')
    es = str(exc)
    if etype is SyntaxError:
        if es == "'await' outside function":
            print(">>> AsyncTopLevel - hook : %s" % exc )
        else:
            print(">>> SyntaxError - hook : %s" % exc )
            print('user:%s:%s'%(fn,ln))
        return

    format_list = kw.get('format_list',[])
    return pythons.__excepthook__(etype, exc, tb, **kw)


pythons.excepthook = sys_excepthook

