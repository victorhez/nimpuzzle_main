import { NIMIQ_RPC_URL, TREASURY } from './config'

export async function rpc(method: string, params: unknown[] = []) {
  const response = await fetch(NIMIQ_RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`)
  const json = await response.json()
  if (json.error) throw new Error(json.error.message || 'RPC error')
  return json.result
}

/** Verify an entry transaction on-chain. No private key is ever held by NimPuzzle. */
export async function verifyPayment(txHash: string, wallet: string, expectedLuna: number) {
  if (!TREASURY) throw new Error('NIMIQ_TREASURY_ADDRESS is not configured')
  const tx = await rpc('getTransactionByHash', [txHash])
  if (!tx) return { valid: false, reason: 'Transaction not found yet' }
  const from = String(tx.from || tx.sender || '').replace(/\s/g, '')
  const to = String(tx.to || tx.recipient || '').replace(/\s/g, '')
  const expectedTo = TREASURY.replace(/\s/g, '')
  const value = Number(tx.value ?? 0)
  const executionResult = tx.executionResult === undefined ? true : Boolean(tx.executionResult)
  const valid = from.toLowerCase() === wallet.replace(/\s/g, '').toLowerCase()
    && to.toLowerCase() === expectedTo.toLowerCase()
    && value >= expectedLuna
    && executionResult
  return { valid, reason: valid ? 'confirmed' : 'Transaction does not match entry requirements', tx }
}
