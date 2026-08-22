# NimPuzzle

NimPuzzle is a mobile-first daily crypto word game designed for the Nimiq Mini Apps Competition — Cycle II.

Players enter with a small NIM stake, receive six attempts to solve the same globally selected crypto/Web3 word, and share the daily prize pool if they solve it. The app implements the developer brief: daily word selection, 4–7 letter word bank, tile feedback, on-screen keyboard, wallet payment flow, streaks, shareable results, leaderboards, history, server-side validation, and a midnight settlement job.

## Important production note

The Nimiq Mini App SDK is the wallet boundary: the app can request accounts and NIM transfers, but private keys remain inside Nimiq Pay. The browser uses `@nimiq/mini-app-sdk` and `init()`/`sendBasicTransaction()` for entry payments. The backend verifies the submitted transaction hash against Nimiq JSON-RPC before accepting the entry.

For payouts, the backend uses a **dedicated competition treasury hot wallet** only when `NIMIQ_PAYOUT_PRIVATE_KEY` is configured. Never use a personal wallet key. Vercel environment variables are used; the key is never committed. If the key is absent, settlement safely records payouts as queued instead of pretending money was sent.

Nimiq's current protocol documentation describes HTLC/vesting/staking contracts and basic transactions; the competition brief's “smart contract” wording should not be interpreted as permission to invent an unsupported arbitrary contract API. This implementation uses the currently documented transaction APIs and an operator-controlled payout worker.

## Stack

- Next.js App Router + TypeScript
- Nimiq Mini App SDK 0.1.x
- Nimiq Core for the payout worker
- PostgreSQL (Neon/Supabase/other hosted Postgres)
- Vercel serverless routes + Vercel Cron
- No external analytics, no private keys in the frontend

## Local setup

Requirements: Node 22+, Docker Desktop (recommended), Git.

```bash
docker compose up -d
cp .env.example .env.local
```

For the Docker database, set:

```env
DATABASE_URL=postgres://nimpuzzle:nimpuzzle@localhost:54329/nimpuzzle
NIMIQ_NETWORK=TestAlbatross
NIMIQ_RPC_URL=https://rpc.nimiqwatch.com
NIMIQ_LIVE_PAYMENTS=false
NEXT_PUBLIC_LIVE_PAYMENTS=false
```

Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The first API request creates the PostgreSQL tables. For a controlled migration, run `data/schema.sql` manually in your Postgres database as well.

## Test mode

Test mode is intentionally the default. It lets judges open the website and play without moving real NIM.

- `NIMIQ_LIVE_PAYMENTS=false`
- `NEXT_PUBLIC_LIVE_PAYMENTS=false`

The UI creates a clearly identifiable demo wallet identity. It does **not** claim a real blockchain payment occurred.

## Real Nimiq Pay testing

1. Create a Nimiq wallet and use the TestAlbatross network.
2. Get test NIM from the official testnet faucet.
3. Put a dedicated test treasury address into both `NIMIQ_TREASURY_ADDRESS` and `NEXT_PUBLIC_NIMIQ_TREASURY_ADDRESS`.
4. Set both live-payment flags to `true`.
5. Open the deployed/local HTTPS app inside Nimiq Pay.
6. Tap Connect Nimiq.
7. Tap Play for NIM.
8. Nimiq Pay displays its native payment confirmation.
9. The app sends the resulting transaction hash to `/api/enter`.
10. The server calls `getTransactionByHash` and checks sender, recipient, amount, and execution result.

## Testnet faucet

Nimiq's developer docs document the TestAlbatross faucet and free test NIM. Do not use real mainnet NIM while testing the flow.

## Production environment variables

```env
DATABASE_URL=postgres://...
NIMIQ_NETWORK=MainAlbatross
NIMIQ_RPC_URL=https://rpc.nimiqwatch.com
NIMIQ_TREASURY_ADDRESS=<dedicated-mainnet-treasury>
NEXT_PUBLIC_NIMIQ_TREASURY_ADDRESS=<same-address>
NIMIQ_ENTRY_NIM=2
PLATFORM_FEE_BPS=500
NIMIQ_LIVE_PAYMENTS=true
NEXT_PUBLIC_LIVE_PAYMENTS=true
CRON_SECRET=<long-random-secret>
NIMIQ_PAYOUT_PRIVATE_KEY=<dedicated-hot-wallet-private-key>
```

Use a dedicated treasury/hot wallet with only the amount needed for operating the competition. Rotate it after the competition if appropriate. Never put the private key in GitHub, `.env.example`, frontend code, screenshots, logs, or issue comments.

## Vercel deployment

```bash
npm i -g vercel
vercel login
vercel
```

Create/link the Vercel project, then add the production environment variables in Vercel Project Settings → Environment Variables.

Deploy:

```bash
vercel --prod
```

The included `vercel.json` registers:

```json
{"crons":[{"path":"/api/cron/settle","schedule":"0 0 * * *"}]}
```

The cron runs at UTC midnight and settles the previous UTC puzzle. For Vercel plans where cron execution limits apply, keep the daily solver count reasonable or move the payout worker to a dedicated worker service.

## Submission / Mini App URL

After deployment, the app can be opened as a Mini App using Nimiq Pay's HTTPS deep-link format:

`https://nimpay.app/miniapps/open/YOUR_DOMAIN`

Use the exact deployed domain in your competition submission.

## Security model

- The daily answer is selected server-side and is never returned by `/api/daily` before reveal.
- Guess validation happens server-side.
- One entry per wallet per UTC day is enforced by a database unique constraint.
- Six guesses per wallet per day are enforced server-side.
- Payment verification checks the on-chain transaction.
- Nimiq Pay handles private keys and native confirmation dialogs.
- Cron is protected by `CRON_SECRET`.
- Payouts are idempotent via a unique `(puzzle_date, wallet)` constraint.
- Payout failure is recorded rather than silently marking a winner paid.

## Competition feature checklist

- [x] Daily crypto/Web3 word
- [x] 459-word bank (4–7 letters), exceeding the 365-word requirement
- [x] Deterministic global word-of-the-day selection
- [x] Six attempts
- [x] Green/yellow/grey tile feedback
- [x] NIM entry stake
- [x] Daily prize pool
- [x] Server-side answer and guess validation
- [x] Wallet connection through Nimiq Pay SDK
- [x] On-chain entry verification
- [x] Streak tracking
- [x] Daily leaderboard
- [x] Weekly streak leaderboard
- [x] History
- [x] Shareable result pattern
- [x] Mobile-first UI
- [x] Midnight settlement cron
- [x] Payout queue + optional dedicated hot-wallet sender
- [x] Vercel deployment configuration

## Before submission

Do a real TestAlbatross run from Nimiq Pay. Confirm the transaction appears on-chain, confirm the server accepts only the correct amount/recipient/sender, play all six attempts, solve a puzzle, test the share button, test duplicate entry rejection, run the cron endpoint manually with the cron secret, and verify the payout queue. Only then switch to MainAlbatross.
