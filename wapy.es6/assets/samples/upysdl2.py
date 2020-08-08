
#BUG pystack/locals def draw_triangle(r=255,g=255,b=255) : workaround no INT path.
#BUG SDL_UpdateWindowSurface()


import pythons

renderer = None
window = None


def draw_triangle(r=128,g=128,b=128):
    global renderer
    SDL_SetRenderDrawColor(renderer, r, g, b, SDL_ALPHA_OPAQUE)
    SDL_RenderDrawLine(renderer, 220, 100, 200, 140)
    SDL_RenderDrawLine(renderer, 200, 140, 240, 140)
    SDL_RenderDrawLine(renderer, 240, 140, 220, 100)

def init_sdl():
    global renderer, window
    import ctypes
    import usdl2 as sdl2
    e = SDL_Init(SDL_INIT_VIDEO)
    if not e:
        if 1:
            renderer = static(SDL_Renderer);window = static(SDL_Window)
            print( renderer.byref() , window.byref())
            e = sdl2.SDL_CreateWindowAndRenderer(320,240,0, window.byref(), renderer.byref())
        else:
            window = sdl2.SDL_CreateWindow("Hello World", sdl2.SDL_WINDOWPOS_UNDEFINED, sdl2.SDL_WINDOWPOS_UNDEFINED, 640, 480, sdl2.SDL_WINDOW_SHOWN)

        # TODO: unpack the new ptr automatically
        print( renderer.byref() , window.byref())
        print( int(renderer) , int(window))
    else:
        print('SDL_Init error', e)

    return window, renderer,


def sdl2_test():
    global window, renderer, running, ev, evref, bitmapSurface

    init_sdl()

    if 1:
        bitmapSurface = SDL_LoadBMP(b"hello.bmp")
        print("bitmap",bitmapSurface)
        if (int(bitmapSurface)):
            if 0:
                windowsurface = SDL_GetWindowSurface(window)
                print("windowsurface=",windowsurface)
                SDL_BlitSurface(bitmapSurface, None, windowsurface, None)
                #BUG
                SDL_UpdateWindowSurface(window)
            else:
                bitmapTex = SDL_CreateTextureFromSurface(renderer, bitmapSurface);
                SDL_FreeSurface(bitmapSurface);
                SDL_RenderClear(renderer);
                SDL_RenderCopy(renderer, bitmapTex, None, None);
        else:
            print("NPE!")
            return

    # a blue triangle


    if 1:
        draw_triangle(0,0,255)

        last = 0

        running = True

        ev = static( SDL_Event )
        evref = ev.byref()

        countdown = 15
        tictac = pythons.Lapse(1)

        embed.os_hideloop()

        while running:
            aio.suspend()

            if tictac:
                countdown -=1
                if not countdown:
                    print("tmout!")
                    running = False

            elif SDL_PollEvent(evref) != 0:
                if ev.type == SDL_QUIT:
                    running = False
                    break
                if ev.type != last:
                    print(countdown, "ev.type =", ev.type)
                    last = ev.type
            SDL_RenderPresent(renderer)


        embed.os_showloop()
        if 0:
            SDL_DestroyWindow(window)
            SDL_Quit()


def sdl2_ok():
    global window, renderer
    init_sdl()

    bitmapSurface = SDL_LoadBMP(b"hello.bmp")
    print("bitmap=",bitmapSurface)

    bitmapTex = SDL_CreateTextureFromSurface(renderer, bitmapSurface);
    SDL_FreeSurface(bitmapSurface);
    SDL_RenderClear(renderer);
    SDL_RenderCopy(renderer, bitmapTex, None, None);

    draw_triangle(0,0,255)
    SDL_RenderPresent(renderer)

CLI()
F=dir()
from usdl2 import *
builtins.SDL_Renderer = SDL_Renderer
print( "SDL_Renderer", SDL_Renderer , "=", renderer)
STI()


print("\n"*4)
print("SDL2 is now loaded, you can run some tests functions like :")
for f in F:
    if str(f).count('sdl2'):
        print(' -',f)

aio_suspend()

sdl2_test()

aio_suspend()
