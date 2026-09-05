import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    while (true) {
        for (let i = 0; i < ns.hacknet.numNodes(); i++) {
            if (ns.hacknet.getLevelUpgradeCost(i) < ns.getPlayer().money) ns.hacknet.upgradeLevel(i);
            if (ns.hacknet.getCoreUpgradeCost(i) < ns.getPlayer().money) ns.hacknet.upgradeCore(i);
            if (ns.hacknet.getRamUpgradeCost(i) < ns.getPlayer().money) ns.hacknet.upgradeRam(i);
            if (ns.hacknet.getPurchaseNodeCost() < ns.getPlayer().money) ns.hacknet.purchaseNode();
        }
        await ns.sleep(1000);
    }
}