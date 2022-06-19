import asyncio
import pygame
import os
import sys
import random
from button import Button
from player import Player
from level import Level
import colors
import config
from config import DISP_WID, DISP_HEI, BASE_FPS
try:
    from pydub import AudioSegment
except:
    AudioSegment = None



# INITIALIZE PYGAME
pygame.init()
pygame.mixer.init()

# WINDOW CONSTANTS
PATH = os.path.abspath(os.path.dirname(sys.argv[0]))
clock = pygame.time.Clock()

# CREATE WINDOW
pygame.display.set_caption(config.DISP_TIT)
pygame.display.set_icon(pygame.image.load(config.DISP_ICO))
display = pygame.display.set_mode((DISP_WID, DISP_HEI), pygame.RESIZABLE)
display_rect = display.get_rect()
game = pygame.Surface((DISP_WID, DISP_HEI))
game_rect = game.get_rect()
resize = None


def render():
    if display_rect.h != DISP_HEI or display_rect.w != DISP_WID:
        pygame.transform.scale(game, (display_rect.w, display_rect.h), display)
    else:
        display.blit(game, (0, 0))


# CONSTANTS
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
FONT = pygame.font.Font(config.FONT_TYPE, config.FONT_SIZE_NORMAL)
FONT_BIG = pygame.font.Font(config.FONT_TYPE, config.FONT_SIZE_BIG)
FONT_SMALL = pygame.font.Font(config.FONT_TYPE, config.FONT_SIZE_SMALL)
LIFE = pygame.image.load(config.HEART_ICON)
LIFE.set_colorkey(WHITE)
LIFE = LIFE.convert()


def add_songs_in_folder(folder, songs, recursive=True):
    for item in os.listdir(folder):
        path = os.path.join(PATH, folder, item)
        if os.path.isfile(path):
            song_title = item.split('.')[0].replace('_', ' ')
            songs.append([song_title, path])
        if recursive and os.path.isdir(path):
            print(item)
            add_songs_in_folder(path, songs, recursive)


def pager(length, cut):
    return [slice(i, min(i + cut, length)) for i in range(0, length, cut)]


def transform(path, new_format, replace=False, return_path=False):
    audio = AudioSegment.from_file(path)
    name = os.path.basename(path).split('.')[0] + '.' + new_format
    new_path = os.path.join(os.path.dirname(path), name)
    audio.export(new_path, new_format)
    if replace:
        os.remove(path)
    if return_path:
        return new_path


SONGS = []  # [song title, path]
add_songs_in_folder(os.path.join(PATH, 'assets', 'songs'), SONGS)

##for song in SONGS:
##    if song[0].split('.')[-1].lower() != 'ogg':
##        song[1] = transform(song[1], 'ogg', True, True)


# GAME LOOP
state = 'start'

end = \
player = \
lifes = \
shield = \
lifes_rect = \
seen = \
help_page =\
title = \
author = \
author2 = \
play_button = \
help_button = \
exit_button = \
background = None



async def menu_start_loop():
    global loop
    title = FONT_BIG.render(config.GAME_TITLE, False, colors.neon['blue'])
    author = FONT_SMALL.render(config.GAME_AUTHOR, False, colors.neon['red'])
    author2 = FONT_SMALL.render(config.GAME_AUTHOR2, False, colors.neon['red'])
    play_button = Button(colors.neon['fucsia'], 300, 200, 200, 70, image=FONT.render('PLAY', False, (0, 0, 0)))
    help_button = Button(colors.neon['fucsia'], 300, 280, 200, 70, image=FONT.render('HELP', False, (0, 0, 0)))
    exit_button = Button(colors.neon['fucsia'], 300, 360, 200, 70, image=FONT.render('EXIT', False, (0, 0, 0)))
    background = pygame.image.load(config.MENU_BACKGROUND).convert()

    # LOOP
    while state == 'start':
        # EVENTS
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                state = 'close'
            if event.type == pygame.VIDEORESIZE:
                display_rect = display.get_rect()
                resize = (float(display_rect.w) / float(DISP_WID), float(display_rect.h) / float(DISP_HEI))
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                state = 'close'

        # TIME
        clock.tick(BASE_FPS)

        # LOGIC
        if play_button.mouseclic(resize=resize):
            state = 'choose'
        if help_button.mouseclic(resize=resize):
            state = 'help'
        if exit_button.mouseclic(resize=resize):
            state = 'close'

        # RENDER
        game.fill((0, 0, 0))
        game.blit(background, (0, 0))
        game.blit(title, (90, 10))
        game.blit(author, (100, 90))
        game.blit(author2, (100, 130))
        play_button.draw(game)
        help_button.draw(game)
        exit_button.draw(game)

        # FLIP
        render()
        pygame.display.update()
        await asyncio.sleep(0)


async def menu_help_loop():
    global loop
    help_page = pygame.image.load(config.HELP_IMAGE)
    help_page.set_colorkey((255, 255, 255))
    seen = False
    while state == 'help':
        # EVENTS
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                state = 'close'
            if event.type == pygame.VIDEORESIZE:
                display_rect = display.get_rect()
                resize = (display_rect.w / DISP_WID, display_rect.h / DISP_HEI)
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                state = 'start'
            if event.type == pygame.MOUSEBUTTONDOWN:
                seen = True
            if event.type == pygame.MOUSEBUTTONUP and seen:
                state = 'start'

        # RENDER
        game.fill((240, 250, 240))
        game.blit(help_page, (0, 0))

        # FLIP
        render()
        pygame.display.update()

        # TIME
        clock.tick(BASE_FPS)
        await asyncio.sleep(0)

async def menu_choose_loop():
    global loop
    levels = []
    page_back = Button(pygame.color.Color('gray'), 10, DISP_HEI-80, DISP_WID/2-30, 70, image=FONT.render('<', False, (0, 0, 0)))
    page_forward = Button(pygame.color.Color('gray'), 20 + DISP_WID/2, DISP_HEI-80, DISP_WID/2-30, 70, image=FONT.render('>', False, (0, 0, 0)))
    page = 0
    pages = pager(len(SONGS), 5)
    color = random.choice(list(colors.neon.values()))
    for song in SONGS:
        title = FONT.render(song[0].upper(), False, (0, 0, 0))
        levels.append([Button(color, 10, 10 + 80*(len(levels) % 5), DISP_WID-20, 70, image=title), song[1], song[0].upper()])

    mouse_rel = False
    while state == 'choose':

        # EVENTS
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                state = 'close'
            if event.type == pygame.VIDEORESIZE:
                display_rect = display.get_rect()
                resize = (display_rect.w / DISP_WID, display_rect.h / DISP_HEI)
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                state = 'start'
            if event.type == pygame.MOUSEBUTTONUP:
                mouse_rel = True

        # TIME
        clock.tick(BASE_FPS)

        # LOGIC
        for level in levels[pages[page]]:
            if level[0].mouseclic(resize=resize):
                try:
                    if mouse_rel:
                        player = Player(Level(pygame.mixer.Sound(level[1]), level[2]))
                        state = 'level'
                        print("-level-")
                        return
                except pygame.error:
                    clic = False
                    while not clic:
                        for event in pygame.event.get():
                            if event.type == pygame.QUIT:
                                clic = True
                                state = 'close'
                            if event.type == pygame.VIDEORESIZE:
                                display_rect = display.get_rect()
                                resize = (display_rect.w / DISP_WID, display_rect.h / DISP_HEI)
                            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                                clic = True
                            if event.type == pygame.MOUSEBUTTONDOWN:
                                clic = True

                        clock.tick(BASE_FPS)
                        pygame.draw.rect(game, (255, 255, 255), (20, 100, DISP_WID-40, 70))
                        game.blit(FONT_SMALL.render('ERROR LOADING SONG, CHECK FILE FORMAT', False, (255, 0, 0)), (30, 100))
                        render()
                        pygame.display.update()
                        await asyncio.sleep(0)

        if page_back.mouseclic(resize=resize) and mouse_rel:
            page -= 1
            if page < 0:
                page = 0
            mouse_rel = False
            color = random.choice(list(colors.neon.values()))
            for level in levels:
                level[0].color = color

        if page_forward.mouseclic(resize=resize) and mouse_rel:
            page += 1
            if page > len(pages) - 1:
                page -= 1
            mouse_rel = False
            color = random.choice(list(colors.neon.values()))
            for level in levels:
                level[0].color = color

        # RENDER
        game.fill((0, 0, 0))
        game.blit(background, (0, 0))
        page_back.draw(game)
        page_forward.draw(game)
        for level in levels[pages[page]]:
            level[0].draw(game)

        # FLIP
        render()
        pygame.display.update()
        await asyncio.sleep(0)


async def main():
    global loop
    while state != 'close':

        # EMERGENCY EXIT
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                state = 'close'
            if event.type == pygame.VIDEORESIZE:
                display_rect = display.get_rect()
                resize = (display_rect.w / DISP_WID, display_rect.h / DISP_HEI)

        # START MENU
        if state == 'start':
            await menu_start_loop()

        if state == 'help':
            await menu_help_loop()

        # LEVEL SELECTOR
        if state == 'choose':
            await menu_choose_loop()


        # LEVEL ITSELF
        if state == 'level':
            heart = pygame.image.load(config.HEART_ICON)
            ecu = pygame.image.load(config.ECU_ICON)
            ecu.set_colorkey((255, 255, 255))
            damage = pygame.Surface((DISP_WID, DISP_HEI))
            damage.fill((20, 0, 0, 30))
            time_started = None
            lose_played = False
            lose = pygame.mixer.Sound('assets/sounds/lose.ogg')
            while state == 'level':
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        state = 'close'
                    if event.type == pygame.VIDEORESIZE:
                        display_rect = display.get_rect()
                        resize = (display_rect.w / DISP_WID, display_rect.h / DISP_HEI)
                    if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                        state = 'start'
                        player.level.song.stop()
                    if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
                        if not player.run:
                            player.start()
                            time_started = pygame.time.get_ticks()
                        player.spacebar()
                if player.ended:
                    state = 'start'

                # LOGIC
                if player.run:
                    player.update((pygame.time.get_ticks()-time_started)/1000)

                # RENDER
                player.draw(game)

                lifes = FONT_SMALL.render(str(int(player.life)), False, colors.neon['orange'])
                shield = FONT_SMALL.render(str(int(player.shield)), False, colors.neon['orange'])
                lifes_rect = lifes.get_rect()
                lifes_rect.topright = (700, 20)
                game.blit(lifes, lifes_rect.topleft)
                game.blit(heart, (lifes_rect.right, lifes_rect.center[1] - 14))
                game.blit(shield, (lifes_rect.left, lifes_rect.top + 30))
                game.blit(ecu, (lifes_rect.right, lifes_rect.center[1] + 16))
                score = FONT_SMALL.render(str(int(player.score)), False, colors.neon['orange'])
                combo = FONT_SMALL.render('  x '+str(int(player.combo)), False, colors.neon['orange'])
                score_rect = score.get_rect()
                score_rect.x = 20
                score_rect.y = 20
                game.blit(score, score_rect.topleft)
                game.blit(combo, score_rect.topright)
                if not player.level.obstacles:
                    end = FONT_BIG.render(config.WIN_MESSAGE, False, colors.metal['gold'])
                    end_rect = end.get_rect()
                    end_rect.center = game_rect.center
                    game.blit(end, end_rect.topleft)
                if not player.life:
                    end = FONT_BIG.render(config.DEATH_MESSAGE, False, colors.metal['silver'])
                    end_rect = end.get_rect()
                    end_rect.center = game_rect.center
                    game.blit(end, end_rect.topleft)
                    if not lose_played:
                        lose.play()
                        lose_played = True

                # FLIP
                render()

                # TIME
                clock.tick(BASE_FPS)

                # Show
                pygame.display.update()
                await asyncio.sleep(0)
            else:
                player.save()

        await asyncio.sleep(0)

    pygame.quit()
    sys.exit(0)

asyncio.run( main() )

