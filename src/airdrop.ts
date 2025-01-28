import axios from "axios";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { swap } from "./swap";
import { Telegraf } from "telegraf";
import fs from "fs";
import path from "path";
require("dotenv").config();
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection(process.env.RPC_URL!);
const owner = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!));
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const AIRDROP_LOG_FILE = path.join(__dirname, "airdrop-log.json");

interface Airdrop {
    id: string;
    name: string;
    tokenAddress: string;
    requirements: string[];
    deadline: string;
    minTokenValue: number;
}

interface UserPreferences {
    blockchain: string;
    minTokenValue: number;
}

export async function fetchAirdrops(): Promise<Airdrop[]> {
    const response = await axios.get("https://api.airdrops.io/v1/airdrops");
    return response.data.map((airdrop: any) => ({
        id: airdrop.id,
        name: airdrop.name,
        tokenAddress: airdrop.tokenAddress,
        requirements: airdrop.requirements,
        deadline: airdrop.deadline,
    }));
}

export function filterAirdrops(airdrops: Airdrop[], preferences: UserPreferences): Airdrop[] {
    return airdrops.filter((airdrop) => {
        const isBlockchainMatch = airdrop.tokenAddress.startsWith(preferences.blockchain);
        const isValueMatch = airdrop.minTokenValue >= preferences.minTokenValue;
        return isBlockchainMatch && isValueMatch;
    });
}

export async function participateInAirdrop(airdrop: Airdrop): Promise<void> {
    const tokenAddress = new PublicKey(airdrop.tokenAddress);
    const swapAmount = 0.01 * LAMPORTS_PER_SOL; // Small amount to hold for airdrop

    // Swap logic (similar to the existing `swap` function)
    await swap(tokenAddress.toString(), swapAmount);

    console.log(`Participated in airdrop: ${airdrop.name}`);
    logAirdropParticipation(airdrop);
}

export function logAirdropParticipation(airdrop: Airdrop): void {
    const logEntry = {
        id: airdrop.id,
        name: airdrop.name,
        tokenAddress: airdrop.tokenAddress,
        participatedAt: new Date().toISOString(),
    };

    let log = [];
    if (fs.existsSync(AIRDROP_LOG_FILE)) {
        log = JSON.parse(fs.readFileSync(AIRDROP_LOG_FILE, "utf-8"));
    }
    log.push(logEntry);
    fs.writeFileSync(AIRDROP_LOG_FILE, JSON.stringify(log, null, 2));
}

export async function notifyUser(airdrop: Airdrop): Promise<void> {
    const message = `New Airdrop Detected!\nName: ${airdrop.name}\nToken Address: ${airdrop.tokenAddress}\nDeadline: ${airdrop.deadline}`;
    await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID!, message);
}