import { NS, Player, Server } from "@ns";

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
export function findBestServerFormula(ns: NS, servers: Server[], player: Player): Server {
    let bestServer = ns.formulas.mockServer();
    let bestProfit = 0;
    let profit = 0;
    for (const server of servers) {
        profit = calculateProfit(ns, server, player);
        ns.tprintf("%s - $%f/s", server.hostname, profit);
        if (profit < bestProfit) continue;

        bestServer = server;
        bestProfit = profit;
    }

    return bestServer;
}

function calculateProfit(ns: NS, server: Server, player: Player): number {
    const time = ns.formulas.hacking.weakenTime(server, player)
    const amount = ns.formulas.hacking.hackPercent(server, player) * ns.getServerMaxMoney(server.hostname);
    return amount / time * 1000;
}
