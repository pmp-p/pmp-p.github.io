# Click [save] toolbar's icon to run program
# Cliquer la disquette dans la barre d'outil pour executer
import sys
import os
import gc


try:
    FAKE
except:
    import builtins
    FAKE = 0

builtins.weakref = {}

print("weakref:", weakref)


try:
    #wapy
    import embed
except:
    #cpython
    class gc_cb:
        def __init__(self,cb):
            self.cb = cb
        def __del__(self):
            self.cb()
            del self.cb
    class embed:
        @staticmethod
        def on_del(cb):
            return gc_cb(cb)

a = 1;b = 2;c = 3
def allocate_some():
  d = [a] * 1024;  e = [3] * 1024;  f = [4] * 1024


class uweak:

    def __init__(self,cb, argv, kw):

        def __del__():
            did = id(__del__)
            if did in weakref:
                cb, argv, kw =  weakref.pop(did)
                cb(*argv, **kw)

        weakref[id(__del__)] = (cb, argv,kw)

        self.__del__ = embed.on_del( __del__ )
    if 1:
        def __call__(self):
            did = id(self.__del__)
            if did in weakref:
                cb, argv, kw =  weakref.pop(did)
                cb(*argv, **kw)

class truc():

    __del__ = uweak(print,('c-truc.__del__',FAKE,),{})

    def __init__(self):
        self.__del__ = uweak(print,('i-truc.__del__',FAKE,),{})

#TRUC = truc

def func():
    global FAKE
    print()
    print()
    print(" -------- scope start -------")

    x = uweak(print,('uweak.__del__',FAKE,),{})

    t = truc()

    def foodel():
        print('foodel', weakref.pop(id(foodel)))
    weakref[id(foodel)] = "foodel(%s)" % FAKE

    z = embed.on_del(foodel)
    print(" -------- scope end -------")
    print("*gc*"*15)

for x in range(1):
    func()
    del truc
    print("---- really out of scope ----")

    allocate_some()

    #collect happens -> dtor called

    gc.collect()
    print("*gc*"*15)
    print()

    FAKE+=1


print("weakref:", weakref)
