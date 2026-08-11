# Deploying: production & test

This project runs the same code in two modes, controlled by **one** environment
variable — `NEXT_PUBLIC_APP_ENV`. Everything about the payment network is
derived from it (see [`shared/utils/payments.ts`](shared/utils/payments.ts)), so
a deploy can't accidentally mix mainnet and testnet.

| | `NEXT_PUBLIC_APP_ENV=production` | `NEXT_PUBLIC_APP_ENV=test` |
|---|---|---|
| Crypto network | Base mainnet (chain `8453`) | Base Sepolia (chain `84532`) |
| USDC token | `0x8335…02913` | `0x036C…CF7e` |
| x402 facilitator | Coinbase CDP (needs `CDP_API_KEY_*`) | `https://x402.org/facilitator` (free) |
| Stripe | live keys (`sk_live_…`) | test keys (`sk_test_…`) |
| Real money? | **yes** | no |

Both the on-page **"Pay with USDC"** button and the **x402 agent API**
(`POST /api/v1/bookings`) follow this switch together.

## Set up each environment

1. Copy [`.env.example`](.env.example) to `.env` (local) or paste the vars into
   your host (e.g. two separate Vercel projects, or prod/preview env scopes).
2. Set `NEXT_PUBLIC_APP_ENV` to `production` or `test`.
3. Fill in the **mode-matching** Stripe keys + webhook secret, the receiving
   wallet(s), and — for production only — the Coinbase CDP keys.

On boot, [`instrumentation.ts`](instrumentation.ts) runs a consistency check and
**refuses to start** if the keys don't match the mode (e.g. live Stripe keys in
a test deploy, or production missing its CDP credentials).

## Stripe webhooks

Each mode has its **own** webhook signing secret — they are not interchangeable.

- **test:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- **production:** create an endpoint at `https://<your-domain>/api/webhooks/stripe`
  in the live Dashboard and copy its `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

## Testing the crypto flows (test mode)

- Fund a wallet with Base Sepolia ETH (gas) + test USDC from a faucet.
- On-page button: connect MetaMask, switch to Base Sepolia, pay.
- x402 API: use [`scripts/x402-payment.mjs`](scripts/x402-payment.mjs)
  (`node --env-file=.env scripts/x402-payment.mjs --send`) or the in-app
  "Pay & book with x402" demo. No CDP keys are needed in test mode.

## Known limitation

The on-page USDC checkout ([`app/api/crypto/checkout/route.ts`](app/api/crypto/checkout/route.ts))
trusts the client-supplied `txHash`: it recomputes the amount server-side but
does not yet verify on-chain that the transfer landed. The x402 API path *does*
verify via the facilitator. Consider an on-chain receipt check before relying on
the button for high-value mainnet payments.
