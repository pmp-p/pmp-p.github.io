import builtins
import sys
import gc

impl = sys.implementation.name[:3]

# lock them they are always needed
setattr(builtins, "__UPY__", impl == "mic")
setattr(builtins, "sys", sys)
setattr(builtins, "gc", gc)

if __UPY__:
    import utime as Time
else:
    sys.path.insert(0, sys.modules["xpy"].__file__.replace("__init__.py", impl))
    import time as Time
    setattr(builtins, "const", lambda x: x)

setattr(builtins, "__ANDROID__", sys.platform == "android")
setattr(builtins, "__EMSCRIPTEN__", sys.platform in ("wasm", "emscripten","asm.js",))


setattr(builtins, "Time", Time)

del impl

if __UPY__:

    def flush_io():
        # FIXME: OSError: [Errno 22] EINVAL
        try:
            sys.stdout.flush()
        except:
            pass


elif __EMSCRIPTEN__:
    #special xoff DLE+ETX for emscripten console line.
    def flush_io():
        print('\x10\x03')
        sys.stdout.flush()
        sys.stderr.flush()
else:

    def flush_io():
        sys.stdout.flush()
        sys.stderr.flush()


setattr(builtins, "flush_io", flush_io)
del flush_io


def pdb(*argv, **kw):
    try:
        kw.setdefault('file',sys.stderr)
    except:
        pass
    print(*argv, **kw)


setattr(builtins, "pdb", pdb)
del pdb


class unset(object):

    def __nonzero__(self):
        return 0

    def __repr__(self):
        return "<?>"

    __str__ = __repr__


setattr(builtins, "unset", unset())

del unset

# decorator for making dynamic class/modules function or juste alias one on many in a given module
# the uses() block will load/unload required modules or packages taking care of other references found in __enter__ stage


class ld:

    @classmethod
    def hardref(cls, self,call=None,argv=None,kw=None):
        with uses(self.__module__) as _:
            try:
                ref = getattr(_, self.__name__)
                if call:
                    return ref(*argv, **kw)
                return ref
            except AttributeError as e:
                pdb(self.__module__,self.__name__,e)
                if __UPY__:
                    sys.print_exception(e, sys.stderr)
                else:
                    raise

    class weakref(object):

        def __init__(self, f):
            self.__module__, self.__name__ = f.rsplit(".", 1)

        def __call__(self, *argv, **kw):
            return ld.hardref(self, True,argv,kw)

    # dont move it up, weakref must use original object
    object = None

    weakref = weakref

    def linking(self, ctx):
        return ctx.get() is unset

    @classmethod
    def unref(cls, self, ptr, *a, **k):
        # use the ancestor class if any was set for dynamic linking
        name = getattr(self, "ldx", None)
        if name is None:
            name = self.__class__.__name__.lower()

        # solve circular ref so can write class something(ld.object) with robject as forward decl for object
        # makes __main__ implicit
        # if isinstance(self, (cls.object,None.__class__) ): #17632!
        if cls.object is None or isinstance(self, cls.object):  # 17552
            ld = "_".join((self.__module__.replace("__main__", ""), name)).strip("_")
        else:
            ld = "_".join((self.__module__, "ld"))

        #may not need static module but send it anyway
        with uses(self.__module__,ld) as _:
            #fn = "_".join((name, ptr.__name__))
            fn = ptr.__name__
            _.ld = sys.modules[self.__module__]
            try:
                return getattr(_, fn)(self, *a, **k)
            except Exception as e:
                try:pdb("66: error {}.{}({},{}) @ {}".format(self, fn, repr(a), repr(k),ld))
                except:pass
                if __UPY__:
                    sys.print_exception(e, sys.stderr)
                else:
                    raise
            finally:
                try:_.ld = None
                except:pass

    def __call__(cls, f):
        if type(f) is type:
            f.ldx = f.__name__
            return f

        if isinstance(f, str):
            return cls.weakref(f)

        def ptr(self, *a, **k):
            return ld.unref(self, f, *a, **k)

        return ptr


ld = ld()


class robject:

    # TODO: unref gc

    def ref(self, __name__):
        use.oref[id(self)] = self
        return "µO|%s|%s" % (id(self), __name__)

    # TODO: add debug flag : verbose is HEAVY ...
    def __repr__(self):
        try:
            ref = self.__str__()
        except:
            ref = self.__class__.__name__
        if use.sflag:
            ref = self.ref(ref)
        return ref


setattr(builtins, "robject", robject)
del robject

try:
    config = __import__("__main__").config
    pdb( config )
except:
    class config:
        # FIXME: should use gh by default, but warn user we are not a botnet
        srv = "http://192.168.1.66/mpy/%s/" % sys.platform
        SSID = "SSID"
        WPA = ""
        IP = "0.0.0.0"
        RAM=61984

    pdb('140:','default','config')



class uses(robject, config):

    try:
        stderr = sys.stderr
    except:
        pdb("missing stderr")
        stderr = None

    lives = True

    ctx = {}

    cont = 1

    cache = 0

    sflag = 0

    PMAP = {}

    ldgc = [0]

    oref = {}

    ldd = {}

    ldx = {}

    protected = []

    aio = None

    DBG=0

    def __enter__(self):
        try:
            if self.ldgc[-1]:
                return self
            return sys.modules[self.ldgc[-2]]
        finally:
            if self.DBG:self.DBG+=1


    def __exit__(self, *tb):
        try:
            if self.DBG:
                pdb('  '*self.DBG,self.ldgc)

            self.ldgc.pop()
            while len(self.ldgc):
                mn = self.ldgc.pop()
                mref =  self.mref(mn, -1)
                if not mref:
                    if mn.count('.'):
                        p,c = mn.rsplit('.',1)
                        p = sys.modules.get(p,None)
                        if p and hasattr(p,c):
                            delattr(p,c)
                        del p,c
                    try:
                        #check to not erase the weak link named same as module being loaded
                        if getattr(builtins, mn, unset) is sys.modules[mn]:
                            delattr(builtins, mn)
                    except:
                        pass
                    #if mn in sys.modules:
                    del sys.modules[mn]

                if self.DBG:
                    pdb('  '*self.DBG,"--",mn,mref)

                if not self.ldgc[-1]:
                    break
            # if len(self.ldgc)==1:
            use.gc()
        finally:
            if self.DBG:self.DBG-=1


    def mref(self, mn, inc=1):
        mref = self.ldd.get(mn, 0) + inc
        self.ldd[mn] = mref
        return mref

    def __call__(self, *ml, export=0):
        if len(self.ldgc) == 1:
            use.gc()

        if self.DBG:
            pdb('  '*self.DBG,'RQ',ml,'stack=',self.ldgc)


        self.ldgc.extend(ml)
        #nest
        self.ldgc.append(0)
        for mn in ml:
            self.mref(mn)

            if sys.modules.get(mn, None) is None:
                use.gc()
                try:
                    m = __import__(mn)
                except MemoryError as e:
                    pdb(mn,e)
                # m will be package entry point not submodule
                ep = mn.split(".", 1)[0]
                if getattr(builtins, ep, unset) is unset:
                    self.ldx[ep] = 1
                    setattr(builtins, ep, m)

                if mn in sys.modules:
                    m = sys.modules[mn]
                else:
                    sys.modules[mn] = m

            #elif not mn in self.ldgc: #.count(mn)<2:
            elif self.ldgc.count(mn)<2:
                # force add a ref to the existing module if we are toplevel
                if self.DBG:
                    pdb('  '*self.DBG,'toplevel +1',mn,self.mref(mn, 1))
                else:
                    self.mref(mn, 1)



        #self.ldgc.append(0)

        if self.DBG:
            pdb('  '*self.DBG,'++',mn,'stack=',self.ldgc)

        return self

    if __UPY__:
        pid = 0

        @classmethod
        def mem(cls):
            if __EMSCRIPTEN__:
                return 32768
            return gc.mem_alloc()

    else:
        pid = __import__("os").getpid()
        try:
            py = __import__("psutil").Process(pid)

            @classmethod
            def mem(cls):
                return int(cls.py.memory_info()[0])

        except:

            @classmethod
            def mem(cls):
                return 32768

    def gc(self, v=False):
        if __EMSCRIPTEN__:
            return 65535
        gc.collect()
        if __UPY__:
            mf = gc.mem_free()
        else:
            mf = self.mem()
        if not v:
            return self.free - mf
        return mf

    def __str__(self):
        return "@".join((sys.platform, self.IP))

    board = sys.platform.startswith("esp")


uses = uses()
setattr(builtins, "use", uses)
setattr(builtins, "uses", uses)
if not __UPY__:
    setattr(builtins, "RunTime", uses)

del uses

use.turbo = ld("k.turbo")

builtins.atom = object


class object(robject):

    class __call__:

        def __init__(self, host, name):
            self.self = host
            self.__name__ = name

        def __call__(self, *a, **k):
            with uses(self.self.__class__.__name__.lower()) as _:
                return getattr(_, self.__name__)(self.self, *a, **k)

    __rcall__ = __call__

    @ld
    def __init__(self, *a, **k):
        pass

    def __getattr__(self, name):
        return self.__class__.__call__(self, name)


ld.__class__.object = object


setattr(builtins, "ld", ld)
del ld, object


class dlopen(str):

    def __enter__(self):
        return self

    def __exit__(self, *tb):
        pass

    def __getattr__(self, sym):
        return ld(".".join((str(self), sym)))


setattr(builtins, "dlopen", dlopen)
del dlopen

#if __EMSCRIPTEN__:
#    import embed
#    setattr(builtins, "vars", embed.vars)

setattr(builtins, "zfill", ld("xpy.u.zfill"))
setattr(builtins, "var", ld("xpy.u.var"))
setattr(builtins, "SI", ld("xpy.u.SI"))
setattr(builtins, "export", ld("xpy.u.export"))
setattr(builtins, "exports", ld("xpy.u.exports"))


#!
setattr(builtins, "builtins", builtins)
