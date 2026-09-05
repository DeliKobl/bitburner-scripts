import { NS } from "@ns";
import * as lib from "./lib/lib";
import * as cct from "./lib/contract-solutions"

export async function main(ns: NS): Promise<void> {
    let servers = lib.getServerList(ns);
    let contracts: string[] = new Array<string>;
    let contractsServer: string[] = new Array<string>;
    let answerNum: number;
    let answerStr: string;
    let status: string;

    for (const server of servers) {
        let files = ns.ls(server.hostname, ".cct");
        contracts = contracts.concat(files);
        for (let i = 0; i < files.length; i++) {
            contractsServer.push(server.hostname);
        }
    }
    for (let i = 0; i < contracts.length; i++) {
        ns.tprintf("attempting %s on %s", contracts[i], contractsServer[i]);
        switch (ns.codingcontract.getContractType(contracts[i], contractsServer[i])) {
            case "Total Ways to Sum":
                answerNum = cct.integerPartitions(ns.codingcontract.getData(contracts[i], contractsServer[i]));
                status = ns.codingcontract.attempt(answerNum, contracts[i], contractsServer[i]);
                ns.tprintf("%s", status);
                break;
            case "Subarray with Maximum Sum":
                answerNum = cct.kadane(ns.codingcontract.getData(contracts[i], contractsServer[i]));
                status = ns.codingcontract.attempt(answerNum, contracts[i], contractsServer[i]);
                ns.tprintf("%s", status);
                break;
            case "Encryption I: Caesar Cipher":
                let caesarData = ns.codingcontract.getData(contracts[i], contractsServer[i])
                answerStr = cct.caesar(caesarData[0], caesarData[1])
                status = ns.codingcontract.attempt(answerStr, contracts[i], contractsServer[i]);
                ns.tprintf("%s", status);
                break;
            case "Find Largest Prime Factor":
                answerNum = cct.largestPrimeFactor(ns.codingcontract.getData(contracts[i], contractsServer[i]));
                status = ns.codingcontract.attempt(answerNum, contracts[i], contractsServer[i]);
                ns.tprintf("%s", status);
                break;
            case "Algorithmic Stock Trader I":
                answerNum = cct.bestTrade(ns.codingcontract.getData(contracts[i], contractsServer[i]));
                status = ns.codingcontract.attempt(answerNum, contracts[i], contractsServer[i]);
                ns.tprintf("%s", status);
                break;
            default:
                status = "nosolution";
                ns.tprintf("uhhhh we don't know this one chief (%s)", ns.codingcontract.getContractType(contracts[i], contractsServer[i]));
                break;
        }
        if (status === "") {
            ns.tprintf("we got a problem!!!! we failed one!!!!!");
        }
    }
}