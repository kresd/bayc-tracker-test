require("dotenv").config();
const { Alchemy, Network } = require("alchemy-sdk");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const CONTRACT = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
const epoch = parseInt(process.argv[2]);

if (!ALCHEMY_API_KEY || isNaN(epoch)) {
  console.error("Usage: node index.epoch.cached.js <epoch>");
  process.exit(1);
}

const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
});

// --- Cache Handling ---
const CACHE_PATH = path.resolve(".cache", "balances.json");
let balanceCache = fs.existsSync(CACHE_PATH)
  ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"))
  : {};

function saveCache() {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(balanceCache, null, 2));
}

// --- Find block from epoch ---
async function getBlockNumberAt(epoch) {
  const latest = await alchemy.core.getBlockNumber();
  let low = Math.max(0, latest - 5000);
  let high = latest;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const block = await alchemy.core.getBlock(mid);
    if (!block?.timestamp) break;

    if (block.timestamp < epoch) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return low;
}

// --- Get BAYC Holders ---
async function getBaycHolders() {
  const { owners } = await alchemy.nft.getOwnersForContract(CONTRACT);
  return owners || [];
}

// --- Total ETH balance with caching + parallel ---
async function getTotalBalance(addresses, blockTag) {
  const { BigNumber } = ethers;
  const batchSize = 50;
  let total = BigNumber.from(0);

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async (addr) => {
        const key = `${addr.toLowerCase()}@${blockTag}`;
        if (balanceCache[key]) {
          return ethers.utils.parseEther(balanceCache[key]);
        }

        try {
          const bal = await alchemy.core.getBalance(addr, blockTag);
          balanceCache[key] = ethers.utils.formatEther(bal);
          return bal;
        } catch {
          return BigNumber.from(0);
        }
      })
    );

    for (const result of results) {
      if (BigNumber.isBigNumber(result)) {
        total = total.add(result);
      }
    }

    process.stdout.write(`Processed ${Math.min(i + batchSize, addresses.length)} / ${addresses.length}\r`);
  }

  process.stdout.write("\n");
  saveCache();

  return ethers.utils.formatEther(total);
}

// --- Main ---
(async () => {
  try {
    console.log(`Resolving block for epoch: ${epoch}...`);
    const blockNumber = await getBlockNumberAt(epoch);
    console.log(`Using block: ${blockNumber}`);

    console.log("Fetching BAYC holders...");
    const holders = await getBaycHolders();
    if (!holders.length) {
      console.error("No holders found.");
      return;
    }

    console.log("Fetching balances...");
    const totalETH = await getTotalBalance(holders, blockNumber);

    console.log("\nResult:");
    console.log("  Epoch time : ", epoch);
    console.log("  Block      : ", blockNumber);
    console.log("  Holders    : ", holders.length);
    console.log("  Total ETH  : ", totalETH, "ETH");
  } catch (err) {
    console.error("Error:", err.message || err);
  }
})();
