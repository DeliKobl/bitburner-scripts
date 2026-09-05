import { NS, Server } from "@ns";
import * as lib from "./lib/lib";

const HACK = "/lib/worker-hack.ts";
const WEAKEN = "/lib/worker-weaken.ts";
const GROW = "/lib/worker-grow.ts";

export async function main(ns: NS): Promise<void> {
    const servers = lib.getServerList(ns);
    lib.getRoot(ns, servers);

    const target = ns.args[1] !== undefined ? String(ns.args[1]) : lib.findBestServer(ns, servers);
    if (!ns.hasRootAccess(target)) {
        ns.alert("I'm so big and round uhghhhh (get root access pls)");
        return;
    }

    copyScripts(ns, servers);

    while (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) {
        if (ns.exec(WEAKEN, "home", 1, target, 0) === 0) await ns.sleep(5000);
        await ns.sleep(10);
    }
    ns.scriptKill(WEAKEN, "home");
    while (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)) {
        if (sendPrep(ns, target).length < 1) await ns.sleep(5000);
        await ns.sleep(10);
    }
    ns.scriptKill(WEAKEN, "home");
    ns.scriptKill(GROW, "home");
    while (true) {
        if (sendBatch(ns, target).length < 2) await ns.sleep(5000);
        await ns.sleep(10);
    }
}

function copyScripts(ns: NS, servers: Server[]): void {
    ns.tprintf("copying scripts...");
    for (const server of servers) {
        if (server.hostname === "home") continue;
        ns.rm(HACK, server.hostname);
        ns.rm(WEAKEN, server.hostname);
        ns.rm(GROW, server.hostname);
        ns.scp([HACK, WEAKEN, GROW], server.hostname, "home")
    }
}

function sendBatch(ns: NS, target: string): number[] {

    const spacer = 2;
    const weakenMillis = ns.getWeakenTime(target);
    const hackOffset = weakenMillis - ns.getHackTime(target) - spacer;
    const growOffset = weakenMillis - ns.getGrowTime(target);
    const weakenOffset = spacer

    const hackThreads = 1;
    const realHackAmount = ns.hackAnalyze(target) * hackThreads;
    const multiplier = 1 / (1 - realHackAmount)
    const cores = ns.getServer("home").cpuCores;
    const weakenAmount = ns.weakenAnalyze(1, cores);
    const growThreads = Math.max(Math.ceil(ns.growthAnalyze(target, multiplier, cores)), 1);
    const weakenThreads = Math.max(Math.ceil(ns.growthAnalyzeSecurity(growThreads, undefined, cores) / weakenAmount), 1);

    const totalRam = ns.getScriptRam(HACK) + (ns.getScriptRam(GROW) * growThreads) + (ns.getScriptRam(WEAKEN) * weakenThreads)
    if (ns.getServerMaxRam("home") - ns.getServerUsedRam("home") < totalRam) {
        return [];
    }

    const a = ns.exec(HACK, "home", hackThreads, target, hackOffset);
    const b = ns.exec(GROW, "home", growThreads, target, growOffset);
    const c = ns.exec(WEAKEN, "home", weakenThreads, target, weakenOffset);
    return [a, b, c];
}

function sendPrep(ns: NS, target: string): number[] {
    const growOffset = ns.getWeakenTime(target) - ns.getGrowTime(target) - 5;
    const totalRam = ns.getScriptRam(GROW) + ns.getScriptRam(WEAKEN)
    if (ns.getServerMaxRam("home") - ns.getServerUsedRam("home") < totalRam) {
        return [];
    }
    const a = ns.exec(GROW, "home", 1, target, growOffset);
    const b = ns.exec(WEAKEN, "home", 1, target, 0);
    return [a, b]
}