
def STI(verbose=0):
    if not verbose:
        embed.os_state_loop(0)
    embed.STI()

def CLI(verbose=0):
    embed.CLI()
    embed.os_state_loop(1)


def sleep(t):
    start = int( Time.time() * 1_000_000 )
    stop = start + int( t * 1_000_000 )
    STI()
    while int(Time.time()*1_000_000) < stop:
        aio.suspend()
    CLI()
    return None

# patch the fix
import time
time.sleep = sleep

print("Hi ! now waiting 10 seconds blocking")

initial = Time.time()

time.sleep(10)

print("Lo", Time.time()- initial,' s elapsed')
