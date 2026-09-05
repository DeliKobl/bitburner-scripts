import { NS } from "@ns";
import * as lib from "./lib/lib";

const HACK_SCRIPT = "generic-hack.ts"
let HACKING_LEVEL: number;
let IDEAL_SERVER: string;
let SCRIPT_RAM: number;

export async function main(ns: NS): Promise<void> {
    let servers = lib.getServerList(ns);
    if (ns.args[0] != null) {
        IDEAL_SERVER = ns.args[0].toString();
    } else {
        IDEAL_SERVER = lib.findBestServer(ns, servers);
    }
    HACKING_LEVEL = ns.getHackingLevel();
    SCRIPT_RAM = ns.getScriptRam(HACK_SCRIPT);
    for (const server of servers) {
        if (server.hostname == "home") continue;
        if (!ns.hasRootAccess(server.hostname)) continue;
        if (ns.fileExists(HACK_SCRIPT, server.hostname)) ns.rm(HACK_SCRIPT, server.hostname);
        ns.scp(HACK_SCRIPT, server.hostname, "home");
        ns.scriptKill(HACK_SCRIPT, server.hostname);
        let numThreads = Math.floor(ns.getServerMaxRam(server.hostname) / SCRIPT_RAM);
        if (numThreads > 0) {
            ns.exec(HACK_SCRIPT, server.hostname, numThreads, IDEAL_SERVER);
            ns.tprintf("Started hack script on %s targeting %s with %i threads", server.hostname, IDEAL_SERVER, numThreads);
        }
    }
    ns.scriptKill(HACK_SCRIPT, "home");
    let numThreads = Math.min((Math.floor(ns.getServerMaxRam("home") / SCRIPT_RAM) - 4), 100)
    if (numThreads > 0) {
        ns.exec(HACK_SCRIPT, "home", numThreads, IDEAL_SERVER);
        ns.tprintf("Started hack script on home targeting %s with %i threads", IDEAL_SERVER, numThreads);
    }
}