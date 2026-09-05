import { NS, BasicHGWOptions } from "@ns";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0].toString();
    const opts: BasicHGWOptions = {
        additionalMsec: Number(ns.args[1])
    };
    await ns.weaken(target, opts);
}