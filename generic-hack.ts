import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    let hostname = ns.args[0].toString();
    let securityThreshold = 2; // multiple over min before we weaken
    let moneyThreshold = 0.98; // quotient of max money we want to have in order to hack it
    while (true) {
        if (ns.getServerSecurityLevel(hostname) > (ns.getServerMinSecurityLevel(hostname) * securityThreshold)) {
            await ns.weaken(hostname);
            continue;
        }
        if (ns.getServerMoneyAvailable(hostname) < (ns.getServerMaxMoney(hostname) * moneyThreshold)) {
            await ns.grow(hostname);
            continue;
        }
        await ns.hack(hostname);
    }
}