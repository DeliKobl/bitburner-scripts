import { NS, Server } from "@ns";
import * as lib from "./lib/lib";

const HACK = "/lib/worker-hack.ts";
const WEAKEN = "/lib/worker-weaken.ts";
const GROW = "/lib/worker-grow.ts";
const PREP = "/lib/worker-prep.ts";

export async function main(ns: NS): Promise<void> {
    const servers = lib.getServerList(ns);
    lib.getRoot(ns, servers);

    const hackAmount = ns.args[0] !== undefined ? Number(ns.args[0]) : 0.05;
    // TODO: use ns.prompt() and print some values to terminal to decide hackAmount

    const target = ns.args[1] !== undefined ? String(ns.args[1]) : lib.findBestServer(ns, servers);
    if (!ns.hasRootAccess(target)) {
        ns.alert("I'm so big and round uhghhhh (get root access pls)");
        return;
    }
    const ramSource = ns.args[2] !== undefined ? String(ns.args[2]) : "home";
    // TODO: create config type and move argument handling to a function

    copyScripts(ns, servers);

    const prepInitialWeakenThreads = Math.ceil((ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) / ns.weakenAnalyze(1));
    if (prepInitialWeakenThreads !== 0) {
        if (ns.exec(WEAKEN, "home", prepInitialWeakenThreads, target, 0) === 0) {
            while (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) {
                if (ns.exec(WEAKEN, "home", 1, target, 0) === 0) await ns.sleep(5000);
                await ns.sleep(10);
            }
        }
    }
    while (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) || ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) {
        if (sendPrep(ns, target).length < 1) await ns.sleep(5000);
        await ns.sleep(10);
    }
    ns.scriptKill(WEAKEN, ramSource);
    ns.scriptKill(GROW, ramSource);
    // TODO: spawn other batcher scripts to send batches using other servers we have root on
    while (true) {
        if (sendBatch(ns, target, hackAmount, ramSource).length < 2) await ns.sleep(5000);
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
        ns.rm(PREP, server.hostname);
        ns.scp([HACK, WEAKEN, GROW, PREP], server.hostname, "home")
    }
}

function sendBatch(ns: NS, target: string, hackAmount: number, ramSource: string): number[] {
    const hackMoney = hackAmount * ns.getServerMaxMoney(target);
    const cores = ns.getServer(ramSource).cpuCores

    const spacer = 2;
    const weakenMillis = ns.getWeakenTime(target);
    const hackOffset = weakenMillis - ns.getHackTime(target) - spacer;
    const weakenPreOffset = 0
    const growOffset = weakenMillis - ns.getGrowTime(target) + spacer;
    const weakenPostOffset = 2 * spacer

    const weakenAmount = ns.weakenAnalyze(1, cores);
    const hackThreads = Math.max(Math.floor(ns.hackAnalyzeThreads(target, hackMoney)), 1);
    const weakenPreThreads = Math.max(Math.ceil(ns.hackAnalyzeSecurity(hackThreads) / weakenAmount), 1);
    const realHackAmount = ns.hackAnalyze(target) * hackThreads;
    const multiplier = 1 / (1 - realHackAmount)

    const growThreads = Math.max(Math.ceil(ns.growthAnalyze(target, multiplier, cores)), 1);
    //const growThreads = 2 * hackThreads;
    const weakenPostThreads = Math.max(Math.ceil(ns.growthAnalyzeSecurity(growThreads, undefined, cores) / weakenAmount), 1);

    const totalRam = (ns.getScriptRam(HACK) * hackThreads) + (ns.getScriptRam(GROW) * growThreads) + (ns.getScriptRam(WEAKEN) * (weakenPreThreads + weakenPostThreads))
    if (ns.getServerMaxRam(ramSource) - ns.getServerUsedRam(ramSource) < totalRam) {
        return [];
    }

    const a = ns.exec(HACK, ramSource, hackThreads, target, hackOffset);
    const b = ns.exec(WEAKEN, ramSource, weakenPreThreads, target, weakenPreOffset);
    const c = ns.exec(GROW, ramSource, growThreads, target, growOffset);
    const d = ns.exec(WEAKEN, ramSource, weakenPostThreads, target, weakenPostOffset);
    return [a, b, c, d];
}

function sendPrep(ns: NS, target: string): number[] {
    const growOffset = ns.getWeakenTime(target) - ns.getGrowTime(target) - 5;
    const ratio = ns.growthAnalyzeSecurity(1, target, ns.getServer("home").cpuCores) / ns.weakenAnalyze(1, ns.getServer("home").cpuCores)
    let growThreads;
    let weakenThreads;

    if (ratio < 1) {
        growThreads = Math.floor(1 / ratio);
        weakenThreads = 1
    } else if (ratio === 0) {
        growThreads = 1
        weakenThreads = 1
    } else {
        growThreads = 1
        weakenThreads = Math.ceil(ratio);
    }
    if (growThreads === Infinity || weakenThreads === Infinity) return [];
    const totalRam = (ns.getScriptRam(GROW) * growThreads) + (ns.getScriptRam(WEAKEN) * weakenThreads)
    if (ns.getServerMaxRam("home") - ns.getServerUsedRam("home") < totalRam) {
        return [];
    }
    const a = ns.exec(GROW, "home", growThreads, target, growOffset);
    const b = ns.exec(WEAKEN, "home", weakenThreads, target, 0);
    return [a, b]
}