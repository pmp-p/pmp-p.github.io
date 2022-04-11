import sys
import asyncio
import pygame
from menu import *
from game import Game
from config import *
from utils import *

pygame.init()

screen = pygame.display.set_mode((screen_width, screen_height), pygame.RESIZABLE | pygame.SCALED)
pygame.display.set_caption('BreakPong')

clock = pygame.time.Clock()

mode = 'home'
first_time_playing = True


async def main():
    global mode, first_time_playing
    g = Game()
    game_won = GameWonMenu()
    game_lost = GameLostMenu()
    home = Home()
    guide = Guide()

    if sys.platform == 'emscripten':
        import embed
        #https://v6p9d9t4.ssl.hwcdn.net/html/5546785/index.html
        embed.run_script("""info_inline(`<a href="https://tank-king.itch.io/breakpong" target=iframe>Open Javascript/HTML5 Version (new window)</a>`)""")


    while True:
        events = pygame.event.get()
        for e in events:
            if e.type == pygame.QUIT:
                sys.exit(0)
        screen.fill((0, 0, 10))
        if mode == 'game':
            result = g.update(events)
            g.draw(screen)
            if result is not None:
                if result:
                    mode = 'gamewon'
                    SoundManager.play('win')
                else:
                    mode = 'gamelost'
                    SoundManager.play('game_over')
        elif mode == 'gamewon':
            result = game_won.update(events)
            game_won.draw(screen)
            if result is not None:
                if result == 'Home':
                    mode = 'home'
                else:
                    sys.exit(0)
        elif mode == 'gamelost':
            result = game_lost.update(events)
            game_lost.draw(screen)
            if result is not None:
                if result == 'Retry':
                    g = Game()
                    mode = 'game'
                elif result == 'Home':
                    mode = 'home'
                else:
                    sys.exit(0)
        elif mode == 'home':
            result = home.update(events)
            home.draw(screen)
            if result is not None:
                if result == 'Play':
                    if first_time_playing:
                        mode = 'guide'
                    else:
                        g = Game()
                        mode = 'game'
                elif result == 'Help':
                    guide = Guide()
                    mode = 'guide'
                    first_time_playing = False
                else:
                    sys.exit(0)
        elif mode == 'guide':
            result = guide.update(events)
            guide.draw(screen)
            if result is not None:
                if result:
                    if first_time_playing:
                        mode = 'game'
                        first_time_playing = False
                    else:
                        mode = 'home'

        #screen.blit(text(str(clock.get_fps().__int__()), 50, 'white'), (0, 0))
        pygame.display.update()
        clock.tick(FPS)
        await asyncio.sleep(0)


asyncio.run( main() )
