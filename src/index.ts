
require("dotenv").config();
import { getTokenFromLLM } from "./get-token-from-llm";
import { getTweets } from "./get-tweets";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { swap } from "./swap";
import { fetchAirdrops, filterAirdrops, participateInAirdrop, notifyUser } from "./airdrop";

const SOL_AMOUNT = 0.001 * LAMPORTS_PER_SOL;

async function main(userName: string) {
    const newTweets = await getTweets(userName);
    console.log(newTweets)
    for (let tweet of newTweets) {
        const tokenAddress = await getTokenFromLLM(tweet.contents)
        if (tokenAddress !== "null") {
            console.log(`trying to execute tweet => ${tweet.contents}`)
            await swap(tokenAddress, SOL_AMOUNT);
        }
    }

    
    // Fetch and participate in airdrops
    const preferences = {
        blockchain: "Solana",
        minTokenValue: 100, // Example: Minimum token value in USD
    };

    const airdrops = await fetchAirdrops();
    const filteredAirdrops = filterAirdrops(airdrops, preferences);

    for (const airdrop of filteredAirdrops) {
        await participateInAirdrop(airdrop);
        await notifyUser(airdrop);
    }
}

main("BotChrome114342");