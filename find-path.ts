import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0] as string;

    if (!target) {
        ns.tprint("ERROR: Please specify a target server. Usage: run find-path.ts [target]");
        return;
    }

    if (!ns.serverExists(target)) {
        ns.tprint(`ERROR: Server '${target}' does not exist.`);
        return;
    }

    const visited = new Set<string>();
    const path = findPath(ns, "home", target, visited);

    if (path) {
        // Output path and copy-pasteable terminal command string
        const connectChain = path.map((server: string) => `connect ${server}`).join("; ");

        ns.tprint(`Path to ${target}:\n${path.join(" -> ")}`);
        ns.tprint(`Terminal command:\n${connectChain}`);
    } else {
        ns.tprint(`Could not find a path to ${target}.`);
    }
}

function findPath(ns: NS, current: string, target: string, visited: Set<string>): string[] | null {
    visited.add(current);

    if (current === target) {
        return [current];
    }

    const neighbors: string[] = ns.scan(current);

    for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
            const subPath = findPath(ns, neighbor, target, visited);
            if (subPath !== null) {
                return [current, ...subPath];
            }
        }
    }

    return null;
}