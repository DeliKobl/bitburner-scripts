import { NS } from "@ns";
import * as lib from "./lib/lib";


export async function main(ns: NS): Promise<void> {
    const servers = lib.getHostnames(ns);

    for (const server of servers) {
        if (server === "home") continue;
        if (!ns.hasRootAccess(server)) continue;
        if (ns.getServerMaxRam(server) < 4) continue;
        ns.scp("lib/shareram.ts", server, "home");
        ns.exec("lib/shareram.ts", server, ns.getServerMaxRam(server) / 4);
    }
}