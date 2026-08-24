#!/usr/bin/env node

const {
  PrivateKey,
  KeyPair,
} = require('@nimiq/core');

async function main() {
  const privateKey = PrivateKey.generate();
  const keyPair = KeyPair.derive(privateKey);
  const address = keyPair.toAddress();

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          NimPuzzle — Payout Hot Wallet Generator            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  Address (user-friendly)  :', address.toUserFriendlyAddress());
  console.log('  Address (hex / contract) :', address.toHex());
  console.log('');
  console.log('  Private key (hex)        :', privateKey.toHex());
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  COPY THE VALUE BELOW INTO YOUR VERCEL ENV VAR:             ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                                                              ║');
  console.log('   NIMIQ_PAYOUT_PRIVATE_KEY=' + privateKey.toHex());
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  ⚠️  SECURITY INSTRUCTIONS:');
  console.log('   1. SAVE the address above — you need to SEND NIM to it');
  console.log('      as a working float (e.g. 50-100 NIM for daily payouts).');
  console.log('   2. NEVER put the TREASURY wallet private key here.');
  console.log('   3. Keep this key ONLY in Vercel env vars (encrypted at rest).');
  console.log('   4. If this key leaks, SWEEP the funds IMMEDIATELY, generate');
  console.log('      a new one, and update the Vercel env var.');
  console.log('   5. Do NOT commit this output anywhere.');
  console.log('');
}

main().catch((err) => {
  console.error('Error generating wallet:', err);
  process.exit(1);
});
