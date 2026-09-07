import { NS, Server } from "@ns";
import * as lib from "./lib/lib";

const HACK = "/lib/worker-hack.ts";
const WEAKEN = "/lib/worker-weaken.ts";
const GROW = "/lib/worker-grow.ts";

export async function main(ns: NS): Promise<void> {
    let player = ns.getPlayer();
    const servers = lib.getServerList(ns);
    const config = ns.flags([
        ['hackThreads', 0],
        ['target', ''],
    ]);


}