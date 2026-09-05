import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    let target = String(ns.args[0]);
    ns.tprintf("prepping %s", target)
    while (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) {
        await ns.weaken(target);
    }
    while (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)) {
        await ns.grow(target);
        await ns.weaken(target);
    }
    ns.tprintf("done prepping");
}
