
#slots = 'x y z t width depth height event'
#slots = slots.split(' ')

X = const(0)
#Y = const(1)
Z = const(2)
#T = const(3)
#W = const(4)
#D = const(5)
#H = const(6)
#E = const(7)


class NodePath:
    root = None
    count = 0
    def __init__(self, parent, node, pos=None, **kw):
        if parent:
            assert isinstance(parent, NodePath)
#FIXME: self.parent = weakref.ref(parent) <= no weakref yet in micropython
        self.parent = parent
        self.node = node
        self.pos = pos or [0,0,0]
        self.name = kw.pop('name', 'n_{0:03d}'.format(self.__class__.count,3) )
        self.dirty = False
        self.children = []
        self.__class__.count += 1

        if parent: # and self.root!=parent:
            if not self in parent.children:
                parent.children.append( self )

def npos(n):
    if isinstance(n,NodePath):
        return n.pos
    return n

def get_x(n):return npos(n)[X]
def get_z(n):return npos(n)[Z]

def set_any(np,v,slot):
    global rd
    v=int(v)
    ov= npos(np)[slot]
    npos(np)[slot] = v
    if isinstance(np,NodePath) and v!=ov:
        render.dirty = np.dirty = True

def set_x(n,v): set_any(n,v,X)
def set_z(n,v): set_any(n,v,Z)

def set_text(np,t):
    t = str(t)
    ot = np.node.text
    if ot!=t:
        np.node.text = t
        render.dirty = np.dirty = True

class Node:
    def __init__(self,text=unset, **kw):
        self.text = text
        self.set_filter( lambda x:x )
        self.clip = False

    def set_filter(self,flt):
        self.flt = flt

    def filter(self,np):
        return self.flt(self.text)


class render(NodePath):
    DX = const(1)
    DZ = const(40)

    IX = const(1)
    IZ = const(-1)

    #wr0 = '\x1b%d\x1b[?25%s'
    #wr = sys.stdout.write
    @classmethod
    def wr(cls,data):
        print(data,end='')

    def __init__(self):
        self.__class__.root = self
        self.dirty = False
        NodePath.__init__(self,None,self)

    def __enter__(self):
        #self.wr(self.wr0 % ( 7 , 'l' ) )
        self.wr('\x1b7\x1b[?25l')
        return self

    def __exit__(self,*tb):
        #self.wr( self.wr0 % ( 8, 'h' ) )
        self.wr('\x1b8\x1b[?25h')

    @classmethod
    def draw_child(cls, parent, np, lvl):
        pos = npos(np)
        x = cls.DX + (cls.IX*pos[0])
        z = cls.DZ + (cls.IZ*pos[2])
        cls.wr('\x1b[%d;%dH[ %s : %s ]  ' % (z,x,np.name, np.node.text)  )

render = render()

async def taskMgr(t=1.0/24):
    import asyncio
    global render
    while True:
        if render.dirty:
            with render:
                for child in render.children:
                    render.draw_child( render , child, 0)
            render.dirty = False
            #flush_io() #DLE_ETX is sent for emscripten
        await asyncio.sleep_ms(16)
