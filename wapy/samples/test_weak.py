import sys
import os
import gc

import embed

a = 1;b = 2;c = 3

def allocate_some():
  d = [a] * 1024;  e = [3] * 1024;  f = [4] * 1024


class uweak:

    def __init__(self):
        def __del__():
            print("uweak.__del__")
        self.__del__ = embed.on_del( __del__ )


def func():
    x = uweak()

    def foo():
        print('i am a foo finalizer')
    z = embed.on_del(foo)


func()
allocate_some()

#try:
#    del x
#except:
#    pass


#collect happens -> dtor called

print("="*30)
gc.collect()
print("="*30)
