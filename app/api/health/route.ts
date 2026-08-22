import { ok } from '@/lib/api'
export const runtime='nodejs'
export async function GET(){return ok({service:'nimpuzzle',status:'healthy',timestamp:new Date().toISOString()})}
