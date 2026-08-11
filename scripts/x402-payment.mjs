// Generate an x402 `X-PAYMENT` header for POST /api/v1/bookings so you can pay
// the booking endpoint from Postman/curl. It calls the endpoint once (no
// payment) to read the 402 challenge, signs the USDC EIP-3009 authorization
// with your wallet, and prints the base64 header value to paste into Postman.
//
// Usage (env vars):
//   API_KEY=...           your marketplace API key (Bearer)
//   PRIVATE_KEY=0x...     a wallet funded with USDC on the target network
//   OFFERING_ID=...       a published offering id
//   DATE=2026-07-01       (optional) defaults to +7 days
//   TIME=14:00            (optional) defaults to 14:00
//   BASE_URL=...          (optional) defaults to http://localhost:3000
//
//   node --env-file=.env scripts/x402-payment.mjs          # print X-PAYMENT
//   node --env-file=.env scripts/x402-payment.mjs --send   # also book it
//
// NOTE: the signed authorization is short-lived (~10 min) — paste it into
// Postman promptly. On mainnet this moves REAL USDC; test on base-sepolia first.

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// x402 network id → EVM chain id.
const CHAIN_IDS = { base: 8453, "base-sepolia": 84532 };

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function randomNonce() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return (
    "0x" +
    [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
  );
}

function ymdPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

async function main() {
  const baseUrl = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const apiKey = required("API_KEY");
  const privateKey = required("PRIVATE_KEY");
  const offeringId = required("OFFERING_ID");
  const date = process.env.DATE || ymdPlus(7);
  const time = process.env.TIME || "14:00";

  const account = privateKeyToAccount(privateKey);
  const url = `${baseUrl}/api/v1/bookings`;
  const body = JSON.stringify({ offeringId, date, time });
  const authHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // 1) Hit the endpoint with no payment to read the 402 challenge.
  console.log(`→ Requesting ${url} (no payment) to read the 402 challenge…`);
  const challengeRes = await fetch(url, { method: "POST", headers: authHeaders, body });
  if (challengeRes.status !== 402) {
    const text = await challengeRes.text();
    console.error(
      `Expected 402, got ${challengeRes.status}. Is x402 enabled (X402_PAY_TO set)? Response:\n${text}`,
    );
    process.exit(1);
  }
  const challenge = await challengeRes.json();
  const requirements = challenge.accepts?.[0];
  if (!requirements) {
    console.error("402 had no `accepts` requirements:", JSON.stringify(challenge));
    process.exit(1);
  }

  const chainId = CHAIN_IDS[requirements.network];
  if (!chainId) {
    console.error(`Unknown network "${requirements.network}" — add it to CHAIN_IDS.`);
    process.exit(1);
  }

  console.log(
    `  pay ${requirements.maxAmountRequired} (atomic USDC) to ${requirements.payTo} on ${requirements.network}`,
  );

  // 2) Build + sign the EIP-3009 transferWithAuthorization the "exact" scheme uses.
  const validAfter = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 600); // ~10 min
  const nonce = randomNonce();

  const authorization = {
    from: account.address,
    to: requirements.payTo,
    value: requirements.maxAmountRequired,
    validAfter: validAfter.toString(),
    validBefore: validBefore.toString(),
    nonce,
  };

  const client = createWalletClient({ account, transport: http() });
  const signature = await client.signTypedData({
    domain: {
      name: requirements.extra?.name,
      version: requirements.extra?.version,
      chainId,
      verifyingContract: requirements.asset,
    },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: {
      from: account.address,
      to: requirements.payTo,
      value: BigInt(requirements.maxAmountRequired),
      validAfter,
      validBefore,
      nonce,
    },
  });

  const paymentPayload = {
    x402Version: challenge.x402Version ?? 1,
    scheme: requirements.scheme,
    network: requirements.network,
    payload: { signature, authorization },
  };
  const xPayment = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

  console.log("\n=== X-PAYMENT (paste into Postman as a header value) ===\n");
  console.log(xPayment);
  console.log(
    `\nPayer: ${account.address}\nValid until: ${new Date(Number(validBefore) * 1000).toISOString()}`,
  );

  // 3) Optionally send the paid request end-to-end.
  if (process.argv.includes("--send")) {
    console.log("\n→ Retrying with X-PAYMENT…");
    const paidRes = await fetch(url, {
      method: "POST",
      headers: { ...authHeaders, "X-PAYMENT": xPayment },
      body,
    });
    const text = await paidRes.text();
    console.log(`HTTP ${paidRes.status}`);
    const settle = paidRes.headers.get("x-payment-response");
    if (settle) {
      console.log("X-PAYMENT-RESPONSE:", Buffer.from(settle, "base64").toString("utf8"));
    }
    console.log(text);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
