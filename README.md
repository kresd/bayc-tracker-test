
# BAYC Holder ETH Tracker

This script calculates the total ETH held by all owners of the **Bored Ape Yacht Club (BAYC)** NFT at a specific point in time (`epoch timestamp`). It uses [Alchemy SDK](https://github.com/alchemyplatform/alchemy-sdk-js) and [ethers.js](https://docs.ethers.io/), with built-in **caching and parallel processing** for high efficiency.

---

## Features

- ✅ Fetch all BAYC NFT holders (5,000+ addresses)
- ✅ Compute ETH balance per wallet based on block from input `epoch`
- ✅ Cache results to `.cache/balances.json` to avoid re-fetching
- ✅ Parallel balance fetch using `Promise.all` in batches
- ✅ One-line live progress (`Processed X / Y`)
- ✅ Clean, efficient, and re-runnable

---

## Setup & Installation

### 1. Install dependencies

```bash
npm install alchemy-sdk ethers dotenv
```

### 2. Create a `.env` file

```env
ALCHEMY_API_KEY=your-alchemy-api-key-here
```

> Get your free API key at: https://dashboard.alchemy.com

---

## Running the Script

```bash
node index.js <epoch_timestamp>
```

### Example:

```bash
node index.js 1651276800
```

> This will fetch all BAYC holders and calculate their ETH balance at the block closest to the provided epoch time.

---

## Example Output

```
Resolving block for epoch: 1651276800...
Using block: 14682281
Fetching BAYC holders...
Fetching balances...
Processed 5512 / 5512
Result:
  Epoch time :  1651276800
  Block      :  14682281
  Holders    :  5512
  Total ETH  :  12739.41 ETH
```

---

## Local Caching

All balances per address are saved to:

```
.cache/balances.json
```

Format:

```json
{
  "0xabc...@14682281": "1.234",
  "0xdef...@14682281": "0.000"
}
```

> Re-running for the same block will read from cache — much faster and saves API quota.

---

## Performance & Optimization

- Processing all addresses may take 5–15 minutes depending on network speed and rate limits
- Default parallel batch size: 50 addresses
- Uses historical block state (`blockTag`) — heavier than `latest`

---

## Dependencies

- [alchemy-sdk](https://github.com/alchemyplatform/alchemy-sdk-js)
- [ethers](https://docs.ethers.io/)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [Node.js](https://nodejs.org/) (v16+ recommended)
---

## Author

Made with care by **Kresnamal Yuda**  