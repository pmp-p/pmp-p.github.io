import asyncio
import pygame
import pygame._sdl2 as sdl2

import settings
from hud import HUD
from pipe import Pipes
from scene import Scene
from player import Player
from menus import MainMenu, GameOverMenu


pygame.init()

__ANDROID__ = True
try:
    import android
except ImportError:
    __ANDROID__ = False


SCREENW = 512
SCREENH = 384


async def main():
    global __ANDROID__,SCREENW,SCREENH

    if __ANDROID__:
        window = sdl2.Window(settings.TITLE, (0, 0), fullscreen_desktop = True)
    else:
        window = sdl2.Window(settings.TITLE, (SCREENW, SCREENH))
        window.set_icon(pygame.image.load("icon.png"))


    renderer = sdl2.Renderer(window, accelerated = True)
    if __ANDROID__:
        renderer.logical_size = SCREENW, SCREENH


    def reset():
        player.reset()
        pipes.reset()
        gameover_menu.reset()

    # Main part of the game starts from here
    rng = True
    state = "not started"
    clock = pygame.time.Clock()

    player = Player(SCREENW, SCREENH, renderer)
    pipes = Pipes(SCREENW, SCREENH, renderer)
    scene = Scene(SCREENW, SCREENH, renderer, player.POSX)
    main_menu = MainMenu(SCREENW, SCREENH, renderer)
    hud = HUD(SCREENW, SCREENH, renderer)
    gameover_menu = GameOverMenu(SCREENW, SCREENH, renderer)

    while rng:
        dt = clock.tick(settings.FPS) / 1000

        # The cool pygame(SDL) event loop
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                rng = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    rng = False
            player.events(event)
            if player.state == "died" and gameover_menu.button_clicked(event):
                reset()

        # Handle the events
        player.physics(dt, scene.base_rect.h)
        pipes.physics(dt, player)
        scene.physics(dt, player.pos.x)
        if player.state != "idle":
            hud.physics(player.score)
        if player.state == "died":
            gameover_menu.physics()

        # Draw
        renderer.draw_color = (0, 0, 0, 255) # Set the draw colour
        renderer.clear() # Fill the screen with the set draw colour
        scene.draw_bg()
        pipes.draw()
        player.draw()
        scene.draw_base()
        if player.state == "idle":
            main_menu.draw()
        else:
            hud.draw()
        if player.state == "died":
            gameover_menu.draw()
        renderer.present() # Update the screen
        await asyncio.sleep(0)

asyncio.run( main() )

