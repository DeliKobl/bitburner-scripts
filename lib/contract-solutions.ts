/** @public */
export function integerPartitions(n: number): number {
    if (n < 0 || !Number.isInteger(n)) return 0;
    if (n === 0) return 1;

    const dp = new Array<number>(n + 1);
    dp[0] = 1;

    for (let i = 1; i <= n; i++) {
        let sum = 0;
        let step = 1;

        while (true) {
            // maps 1,2,3,4... to 1,-1,2,-2...
            const k = step % 2 !== 0 ? Math.ceil(step / 2) : -Math.floor(step / 2);

            // generalized pentagonal number formula gk = (3k^2-k)/2
            const gk = (3 * k * k - k) / 2

            // we can stop once gk exceeds our target i
            if (gk > i) break;

            // +1 for odd k, -1 for even k
            const sign = k % 2 !== 0 ? 1 : -1;

            sum += sign * dp[i - gk]
            step++
        }

        dp[i] = sum;
    }

    return dp[n] - 1;
}

export function kadane(numbers: number[]): number {

    let bestSum = -Infinity;
    let currentSum = 0;
    for (const x of numbers) {
        currentSum = Math.max(x, currentSum + x);
        bestSum = Math.max(bestSum, currentSum);
    }

    return bestSum;
}

export function caesar(inputString: string, leftShift: number): string {
    return inputString.split('').map((char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
            return String.fromCharCode(((code - 65 - leftShift + 26) % 26) + 65);
        }
        return char;
    }).join('');
}

export function largestPrimeFactor(n: number): number {
    let factor = 2;
    while (factor * factor <= n) {
        if (n % factor === 0) {
            n /= factor;
        } else {
            factor += (factor === 2 ? 1 : 2);
        }
    }
    return n;
}

export function bestTrade(prices: number[]): number {
    let profit: number;
    let bestProfit: number = -Infinity;
    for (let i = 1; i < prices.length; i++) {
        for (let j = i - 1; j >= 0; j--) {
            profit = prices[i] - prices[j]
            if (profit > bestProfit) bestProfit = profit;
        }
    }
    return bestProfit;
}