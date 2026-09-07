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
function getHackSetup(ns: NS, servers: Server[], player: Player, runner: Server): HackSetup {

    const weakenSecurityAmount = ns.formulas.hacking.weakenEffect(1, 1);
    let mock = ns.formulas.mockServer()
    let setup: HackSetup = {
        target: ns.getServer("n00dles"),
        runner: ns.getServer("home"),
        threads: {
            hackThreads: 1,
            firstWeakenThreads: 1,
            growThreads: 1,
            secondWeakenThreads: 1
        }
    };
    let profits = new Map<Server, number>();
    let setups = new Map<Server, HWGW>();

    for (const server of servers) {
        if (server.requiredHackingSkill === undefined || server.requiredHackingSkill > player.skills.hacking || server.moneyMax === undefined) continue;
        let idealThreads: HWGW = {
            hackThreads: 1,
            firstWeakenThreads: 1,
            growThreads: 1,
            secondWeakenThreads: 1
        };
        // time in seconds it takes for a batch to complete
        const time = ns.formulas.hacking.weakenTime(server, player) / 1000;

        mock.hackDifficulty = server.minDifficulty;
        mock.requiredHackingSkill = server.requiredHackingSkill;
        mock.moneyMax = server.moneyMax;
        mock.serverGrowth = server.serverGrowth;
        const hackChance = ns.formulas.hacking.hackChance(mock, player);

        let bestProfit = 0

        for (let threads = 1; threads < Infinity; threads++) {
            const hackSecurityAmount = ns.hackAnalyzeSecurity(threads);
            const amount = Math.min(ns.formulas.hacking.hackPercent(server, player) * threads * server.moneyMax, server.moneyMax);
            mock.moneyAvailable = server.moneyMax - amount;
            const growThreads = ns.formulas.hacking.growThreads(mock, player, mock.moneyMax)
            const firstWeakenThreads = Math.ceil(hackSecurityAmount / weakenSecurityAmount);
            const growSecurityAmount = ns.growthAnalyzeSecurity(growThreads);
            const secondWeakenThreads = Math.ceil(growSecurityAmount / weakenSecurityAmount);
            const hwgwram = (threads * HACK_RAM) + ((firstWeakenThreads + secondWeakenThreads) * WEAKEN_RAM) + (growThreads * GROW_RAM);
            if (hwgwram > (runner.maxRam - runner.ramUsed)) break;

            const profit = amount / time * hackChance * 60;
            if (profit < bestProfit) continue;

            bestProfit = profit;
            idealThreads = {
                hackThreads: threads,
                firstWeakenThreads: firstWeakenThreads,
                growThreads: growThreads,
                secondWeakenThreads: secondWeakenThreads
            };
        }
        profits.set(server, bestProfit);
        setups.set(server, idealThreads)
    }

    const profitsSorted = new Map([...profits.entries()].sort((a, b) => a[1] - b[1]));
    for (const x of profitsSorted.entries()) {
        ns.tprintf("%s\n= $%s/min\n\n", x[0].hostname, ns.format.number(x[1]))
        ns.tprintf("%s", String(setups.get(x[0])))
    }


    return setup;

}


/** @public */
export interface HackSetup {
    target: Server,
    runner: Server,
    threads: HWGW
}

/** @public */
export interface HWGW {
    hackThreads: number,
    firstWeakenThreads: number,
    growThreads: number,
    secondWeakenThreads: number
}