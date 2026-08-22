export const ENTRY_NIM = Number(process.env.NIMIQ_ENTRY_NIM || '2')
export const ENTRY_LUNA = Math.round(ENTRY_NIM * 100_000)
export const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS || '500')
export const NIMIQ_NETWORK = process.env.NIMIQ_NETWORK || 'TestAlbatross'
export const NIMIQ_RPC_URL = process.env.NIMIQ_RPC_URL || 'https://rpc.nimiqwatch.com'
export const TREASURY = process.env.NIMIQ_TREASURY_ADDRESS || ''
export const LIVE_PAYMENTS = process.env.NIMIQ_LIVE_PAYMENTS === 'true'
