import { NS } from "@ns";
import * as lib from "./lib/lib";

export async function main(ns: NS): Promise<void> {
    ns.tprintf(lib.getHostnames(ns).toString());
}