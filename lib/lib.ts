import { NS, Player, Server } from "@ns";

const HACK = "/lib/worker-hack.ts";
const WEAKEN = "/lib/worker-weaken.ts";
const GROW = "/lib/worker-grow.ts";
const HACK_RAM = 1.7;
const WEAKEN_RAM = 1.75;
const GROW_RAM = 1.75;

/** @public */
export function getHostnames(ns: NS): string[] {
    let scan = ns.scan("home");
    let changed = 1;

    while (changed == 1) {
        changed = 0;
        for (const server of scan) {
            let temp = ns.scan(server);
            for (const server of temp) {
                if (scan.includes(server)) continue;

                scan.push(server);
                changed = 1;
            }
        }
    }
    return scan;
}

/** @public */
export function getServerList(ns: NS): Server[] {
    const scan = getHostnames(ns);
    let servers = new Array<Server>(scan.length);

    for (let i = 0; i < scan.length; i++) {
        servers[i] = ns.getServer(scan[i]);
    }
    return servers;
}

/** @public */
export function findBestServer(ns: NS, servers: Server[]): string {
    let bestServer = "n00dles";
    let bestRatio = ns.getServerMaxMoney("n00dles") / ns.getServerMinSecurityLevel("n00dles");
    let hackingLevel = ns.getHackingLevel()
    let serverLevel = 0;
    for (const server of servers) {
        if (ns.getServerMoneyAvailable(server.hostname) < 1) continue;
        serverLevel = ns.getServerRequiredHackingLevel(server.hostname);
        if (serverLevel > hackingLevel) continue;
        let serverRatio = ns.getServerMaxMoney(server.hostname) / ns.getServerMinSecurityLevel(server.hostname);
        if (serverRatio > 0) {
            ns.tprintf("%s - %s", server.hostname, ns.format.number(serverRatio));
        } else continue;
        if ((serverRatio > bestRatio) && (serverLevel <= hackingLevel * 0.4)) {
            bestServer = server.hostname;
        }
    }
    ns.tprintf("best server: %s", bestServer);
    return bestServer;
}

/** @public */
export function getRoot(ns: NS, servers: Server[]): void {
    let numPrograms = 0;
    if (ns.fileExists("BruteSSH.exe", "home")) numPrograms++;
    if (ns.fileExists("FTPCrack.exe", "home")) numPrograms++;
    if (ns.fileExists("relaySMTP.exe", "home")) numPrograms++;
    if (ns.fileExists("HTTPWorm.exe", "home")) numPrograms++;
    if (ns.fileExists("SQLInject.exe", "home")) numPrograms++;

    for (const server of servers) {
        if (ns.hasRootAccess(server.hostname)) continue;
        if (ns.getServerNumPortsRequired(server.hostname) > numPrograms) continue;
        for (let i = 0; i < numPrograms; i++) {
            switch (i) {
                case 0:
                    ns.brutessh(server.hostname);
                    break;
                case 1:
                    ns.ftpcrack(server.hostname);
                    break;
                case 2:
                    ns.relaysmtp(server.hostname);
                    break;
                case 3:
                    ns.httpworm(server.hostname);
                    break;
                case 4:
                    ns.sqlinject(server.hostname);
                    break;
            }
        }
        if (ns.nuke(server.hostname)) ns.tprintf("~~obtained root on %s~~", server.hostname);
    }
}

/** @public */
export function getHackSetup(ns: NS, servers: Server[], player: Player, runner: Server): HackSetup {

    // amount of security decrease for 1 thread
    const weakenSecurityAmount = ns.formulas.hacking.weakenEffect(1, runner.cpuCores);

    // mock server that will simulate different server states
    let mock = ns.formulas.mockServer()

    // map of profits for printing to the terminal
    let profits = new Map<Server, number>();

    // map of ideal batch thread counts for each server.
    // this is probably not needed
    let setups = new Map<Server, HWGW>();

    for (const server of servers) {
        // don't do anything on inelligible servers
        if (
            server.requiredHackingSkill === undefined ||
            server.requiredHackingSkill > player.skills.hacking ||
            server.moneyMax === undefined ||
            server.moneyMax < 1 ||
            !server.hasAdminRights
        ) continue;

        // this will go on the setups map
        let idealThreads: HWGW | null = null

        // time in seconds it takes for a batch to complete
        const time = ns.formulas.hacking.weakenTime(server, player) / 1000;

        // set some values on the mock server for the thread finding loop
        mock.hackDifficulty = server.minDifficulty;
        mock.requiredHackingSkill = server.requiredHackingSkill;
        mock.moneyMax = server.moneyMax;
        mock.serverGrowth = server.serverGrowth;
        mock.hasAdminRights = server.hasAdminRights;
        const hackChance = ns.formulas.hacking.hackChance(mock, player);
        const hackPercent = ns.formulas.hacking.hackPercent(mock, player);

        let bestProfit = 0

        // this loop is very inefficient! basically we need to find a set of four integers (a, b, c, d) that solves the equation
        // (a * HACK_RAM) + ((b + c) * WEAKEN_RAM) + (d * GROW_RAM) <= (runner.maxRam - runner.ramUsed)
        // while maximizing the value a.
        // the values b, c, and d all depend on a.
        // this loop starts at a = 1 and increments until the equation is no longer true.
        // there is absolutely better ways to do this but I can't think of any right now.

        // TODO: there is possibly a way to do this by finding out *how* b, c, and d relate to a
        // TODO: and find a function that can solve this in one go but that is a project for another time.
        for (let threads = 1; hackPercent * threads < 1; threads++) {

            // amount stolen from the server
            const amount = hackPercent * threads * server.moneyMax;

            // calculate the amount of threads needed to grow the theoretical result of a hack back to full cash
            mock.moneyAvailable = server.moneyMax - amount;
            const growThreads = ns.formulas.hacking.growThreads(mock, player, mock.moneyMax, runner.cpuCores)

            // weaken threads, pretty simple
            const hackSecurityAmount = ns.hackAnalyzeSecurity(threads);
            const firstWeakenThreads = Math.ceil(hackSecurityAmount / weakenSecurityAmount);
            const growSecurityAmount = ns.growthAnalyzeSecurity(growThreads, undefined, runner.cpuCores);
            const secondWeakenThreads = Math.ceil(growSecurityAmount / weakenSecurityAmount);

            // check if we're over budget on ram cost and stop if we are
            const hwgwram = (threads * HACK_RAM) + ((firstWeakenThreads + secondWeakenThreads) * WEAKEN_RAM) + (growThreads * GROW_RAM);
            if (hwgwram > (runner.maxRam - runner.ramUsed)) break;

            const batches = Math.floor((runner.maxRam - runner.ramUsed) / hwgwram);

            // this profit number is the $/min, formatted this way for human readability
            const profit = amount * batches / time * hackChance * 60;
            if (profit < bestProfit) continue;

            bestProfit = profit;
            idealThreads = {
                hackThreads: threads,
                firstWeakenThreads: firstWeakenThreads,
                growThreads: growThreads,
                secondWeakenThreads: secondWeakenThreads,
            };
        }
        if (!idealThreads) {
            // this should never happen but is in place to make the compiler happy
            ns.tprintf("Error discerning ideal thread count!");
            ns.exit();
        }

        // set the best profit and ideal threads on the maps
        // TODO: find a method to have both these values on one map, or some other data structure
        profits.set(server, bestProfit);
        setups.set(server, idealThreads);
    }

    const profitsSorted = new Map([...profits.entries()].sort((a, b) => a[1] - b[1]));
    const profitsSortedIter = profitsSorted.entries()
    for (const x of profitsSortedIter) {
        ns.tprintf("%s\n= $%s/min  (Level %f required)  {%i, %i, %i, %i}",
            x[0].hostname,
            ns.format.number(x[1]),
            x[0].requiredHackingSkill,
            setups.get(x[0])?.hackThreads,
            setups.get(x[0])?.firstWeakenThreads,
            setups.get(x[0])?.growThreads,
            setups.get(x[0])?.secondWeakenThreads,
        )
        ns.tprintf("\n");
    }

    // pop off the last element from the sorted map to get best profit server
    const bestServer = Array.from(profitsSorted.keys()).pop();
    if (!bestServer) ns.exit();

    // associated thread setup
    const bestThreads = setups.get(bestServer)
    if (!bestThreads) ns.exit();

    return {
        target: bestServer,
        runner: runner,
        threads: bestThreads,
    };

}


/** @public */
export interface HackSetup {
    target: Server,
    runner: Server,
    threads: HWGW,
}

/** @public */
export interface HWGW {
    hackThreads: number,
    firstWeakenThreads: number,
    growThreads: number,
    secondWeakenThreads: number,
}