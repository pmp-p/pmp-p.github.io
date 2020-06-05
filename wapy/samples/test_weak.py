

a = 1
b = 2
c = 3
d = 4

def allocate_some():
  d = [a] * 1024
  e = [3] * 1024
  f = [4] * 1024


if 1:
    import sys
    import os
    import gc

    import embed


    def foo():
      print('i am a finalizer')


    def func():
        x = embed.on_del(foo)
        # x vanishes here

else:

    class uweak:
        def __init__(self, cb, key):
            self.key = key
            self.cb = cb

        def __del__(self):
            self.cb( self.key )
     #============================

    def __del__(the_key_refing_a_pointer):
          #ffi magic dealing with key to dtor the pointer
         print("cleaned up", the_key_refing_a_pointer )

    class user_def:
        def __init__(self ):
            self.weak =uweak(__del__, id(self))


    def func():
        x = user_def()
        # x vanishes here







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
