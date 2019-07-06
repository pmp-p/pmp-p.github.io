def zfill(s, width, char="0"):
    s = str(s)
    if len(s) < width:
        s = "".join((char * (width - len(s)), s))
    return s

def mkdir(p):
    p = p.rstrip("/\n\r\t")
    try:
        if __UPY__:
            __import__("uos").mkdir(p)
        else:
            __import__("os").mkdir(p)
        return p
    except OSError as e:
        if e.args[0] == 17:
            return
    #print('"%s"' % p, e)


def SI(dl, bw=0):
    dl = float(dl)
    if bw:
        trail = "iB/s"
        dl = dl / float(bw)
    else:
        trail = "iB"

    for u in "KMG":
        dl = dl / 1024
        if dl < 1024:
            fmt = "%0.2f %s%s"
            break
    else:
        fmt = "%s %s%s"
        u = ""
    return fmt % (dl, u, trail)


def var(*a):
    for k in a:
        if k in uses.protected:
            raise Exception("re-def %s" % k)
        else:
            uses.protected.append(k)


def export(k, v=unset, repl=False):
    if v is unset:
        if isinstance(k,str):
            #very bad, only usefull for repl
            v = getattr( __import__('__main__') , k, unset)
            if v is unset:
                v = eval(k, globals())
        else:
            v=k
            k = v.__name__
    var(k)
    if repl:
        globals()[k]=v
    else:
        setattr(builtins, k, v)
    return v


def exports(*a):
    for k in a:
        export(k,repl=True)



