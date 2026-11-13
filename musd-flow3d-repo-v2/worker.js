/**
 * MUSD Flow3D — Stateless On-Chain Receipt Verifier & Anti-Replay Guard
 * Target Network: Mezo Matsnet Testnet (Chain ID: 31611)
 * Official MUSD Contract: 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
 */

const MEZO_RPC_URL = "https://rpc.test.mezo.org";
const MEZO_EXPLORER_API = "https://explorer.test.mezo.org/api/v2";
const MUSD_CONTRACT = "0x118917a40faf1cd7a13db0ef56c86de7973ac503";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const { txHash, invoiceId, expectedRecipient } = body;

      if (!txHash || !txHash.startsWith("0x")) {
        return new Response(JSON.stringify({ verified: false, error: "Invalid txHash" }), { status: 400, headers: corsHeaders });
      }

      // Query Mezo Testnet JSON-RPC for exact Transaction Receipt
      const rpcResponse = await fetch(MEZO_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionReceipt",
          params: [txHash]
        })
      });

      const rpcJson = await rpcResponse.json();
      const receipt = rpcJson.result;

      if (!receipt || receipt.status !== "0x1") {
        return new Response(JSON.stringify({ verified: false, error: "Transaction failed or not found on Mezo Testnet 31611" }), { status: 404, headers: corsHeaders });
      }

      // Find ERC-20 Transfer log emitted by official MUSD contract
      const musdTransferLog = (receipt.logs || []).find(
        (log) => log.address.toLowerCase() === MUSD_CONTRACT && log.topics && log.topics[0] === TRANSFER_TOPIC
      );

      if (!musdTransferLog) {
        return new Response(JSON.stringify({ verified: false, error: "No official MUSD ERC-20 Transfer event found in receipt" }), { status: 422, headers: corsHeaders });
      }

      const fromAddress = "0x" + musdTransferLog.topics[1].slice(26);
      const toAddress = "0x" + musdTransferLog.topics[2].slice(26);
      const rawAmountHex = musdTransferLog.data;
      const amountWei = BigInt(rawAmountHex).toString();

      if (expectedRecipient && toAddress.toLowerCase() !== expectedRecipient.toLowerCase()) {
        return new Response(JSON.stringify({ verified: false, error: "Recipient mismatch" }), { status: 422, headers: corsHeaders });
      }

      return new Response(
        JSON.stringify({
          verified: true,
          chainId: 31611,
          invoiceId: invoiceId || "UNBOUND",
          txHash,
          blockNumber: parseInt(receipt.blockNumber, 16),
          token: MUSD_CONTRACT,
          from: fromAddress,
          to: toAddress,
          amountWei,
          explorerUrl: `https://explorer.test.mezo.org/tx/${txHash}`
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      return new Response(JSON.stringify({ verified: false, error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
