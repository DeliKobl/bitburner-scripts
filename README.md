# meow

aight so like, these are scripts ya. for the game [bitburner](https://github.com/bitburner-official/bitburner-src).

here's a brief description of each of them

## batcher.ts
sends batches of (hack, weaken, grow, weaken) workers to the "best" server.
only uses ram on home, takes a few command line arguments optionally
first arg is the fraction of money to steal, default is 0.05
second is the target server, default runs an algorithm in lib/lib.ts
third arg changes what server the workers run on, but this is untested. default is home

## contracts.ts
searches for any coding contracts and attempts to complete them using algorithms defined in lib/contract-solutions.ts

## dispatch-ram.ts
goes through every server I have root access on (excluding home), and runs lib/share-ram.ts with maximum threads.
this increases the multiplier of faction reputation gained

## dispatcher.ts
my first hacking script, just finds the "best" server and execs generic-hack.ts on every server I have root on.
this is inefficient because the state of the target server will have changed by the time an action finishes.
it is however functional when there isn't enough ram to run the batcher efficiently.
takes an optional argument to specify a custom target serveer

## early-batcher.ts
this is just a lot of code from batcher.ts copied but using a default of 1 hack thread to try and fit batches on limited ram when just starting a bitnode.

## find-path.ts
takes the first argument and tries to find a path to that server if it exists, then prints a list of connect commands to copy into the terminal.
much easier than using scan-analyze and looking for the server you want, and works past a depth of 10.

## formula-batcher.ts (wip)
now that I've started bitnode-5, I have access to formulas.exe from the start. this batcher will make use of new server ranking algorithm that calculates real profits per minute and also will optionally make use of existing server ram, and optionally will purchase cloud servers too.

## generic-hack.ts
pretty much just the early hack script from the tutorial.

## list-servers.ts
just a wrapper for a function in lib/lib.ts that spits out every server in the terminal.
I use this before find-path.ts so I know how to spell the name lol

## netburners.ts
my attempt at automating the hacknet nodes before formulas.exe
it just buys anything that you can afford but maxes out at 16 nodes
I plan to revisit this script with formulas.exe once I finish the new batcher

## root.ts
simple wrapper for a function in lib/lib.ts that grants me root access to every server possible, given the amount of programs I own.
the idea is to buy a tor router, buy more programs, and run this again whenever I need. although, other scripts can just call the function themselves, and should.

## lib/contract-solutions
contains functions to solve contracts.

## lib/lib.ts
most of the meat of my code lives here, not really organized.
I'll try to comment things in here the best I can

## lib/shareram.ts
simply runs ns.share() indefinitely

## lib/worker-*.ts
runs a single hack/weaken/grow operation with a few parameters
first argument is the target
second argument is the delay to add in milliseconds
both arguments are required! (I should probably fix that)

## lib/worker-prep.ts
I don't use this anymore.
this script does some funky stuff to prepare a server to minimum security and maximum money.
ultimately not as good as having the logic in the controller script and running oneshot workers from it.