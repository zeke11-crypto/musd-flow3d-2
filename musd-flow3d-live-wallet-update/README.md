# MUSD Flow3D — Enterprise Payment, Receipt Verification & Webhook Engine

Built for **Mezo Buildathon Wave 2 (Track 2: Access and Distribution)**.

MUSD Flow3D bridges on-chain **Mezo MUSD** (`0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`) payments with off-chain enterprise automation (n8n, Cloudflare Workers, CRMs, and Telegram/WhatsApp fulfillment pipelines) wrapped in an interactive Three.js 3D Verification Vault.

## Repository Contents
- `index.html` — Single-file 3D WebGL + Ethers.js MUSD Invoice Checkout, Live Blockscout Feed, and Anti-Replay Receipt Guard.
- `worker.js` — Stateless Cloudflare Worker backend that queries `https://rpc.test.mezo.org` (`eth_getTransactionReceipt`) to validate ERC-20 `Transfer` logs emitted by `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`.
- `n8n-workflow.json` — Ready-to-import n8n webhook automation pipeline for downstream CRM and merchant fulfillment.
- `vercel.json` — Zero-config static deployment routing for Vercel.

## Key Features & Wave 2 Architecture

1. **Direct Mezo Testnet (Chain ID `31611`) Execution**:
   - Connects via `ethers.js` and EIP-6963 multi-wallet discovery to execute native ERC-20 `transfer(address,uint256)` calls against the official 18-decimal MUSD contract (`0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`).
   - Includes a 1-click **+ Add Mezo Testnet** helper (`wallet_addEthereumChain`) and built-in **Mezo Protocol Guard** warning users of the 1,800 MUSD minimum principal + 200 MUSD gas reserve (`2,000 MUSD` opening debt floor) on `BorrowerOperations.openTrove`.
2. **Cryptographic Receipt Guard (Anti-Replay Protection)**:
   - Queries the Mezo Testnet Blockscout v2 API (`/api/v2/transactions/{txHash}`) and JSON-RPC (`https://rpc.test.mezo.org`) to decode ERC-20 `Transfer` logs.
   - Prevents receipt reuse across invoices by locking verified transaction hashes in a persistent claim ledger.
3. **Automated Webhook Dispatcher (n8n & Cloudflare Worker)**:
   - Dispatches verified payment payloads to any webhook endpoint to trigger instant CRM updates, digital product delivery, or Telegram/WhatsApp receipts.

## Contract & Network Reference (Mezo Testnet)
- **Network Name**: Mezo Testnet
- **Chain ID**: `31611` (`0x7b7b`)
- **RPC URL**: `https://rpc.test.mezo.org`
- **Block Explorer**: `https://explorer.test.mezo.org`
- **MUSD Token Contract**: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` (18 Decimals)
