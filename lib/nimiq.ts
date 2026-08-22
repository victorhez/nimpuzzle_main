'use client'

import { init } from '@nimiq/mini-app-sdk'

export type NimiqSession = {
  address: string
  sendStake: (treasury: string, luna: number) => Promise<string>
}

type ErrorResponse = { error?: string; message?: string }

function isErrorResponse(v: unknown): v is ErrorResponse {
  return typeof v === 'object' && v !== null && ('error' in v || 'message' in v)
}

let providerPromise: ReturnType<typeof init> | null = null

export async function getNimiqProvider() {
  if (typeof window === 'undefined') {
    throw new Error('Nimiq Pay is only available in a browser')
  }

  providerPromise ||= init()
  return providerPromise
}

export async function connectNimiq() {
  const nimiq = await getNimiqProvider()
  const accounts = await nimiq.listAccounts()

  if (isErrorResponse(accounts) || !Array.isArray(accounts) || accounts.length === 0) {
    const msg = isErrorResponse(accounts)
      ? accounts.message || accounts.error || 'Wallet connection was rejected'
      : 'No Nimiq account was approved.'
    throw new Error(msg)
  }

  return {
    nimiq,
    address: accounts[0],
  }
}

export async function payStake(treasury: string, luna: number) {
  const { nimiq, address } = await connectNimiq()

  const txHash = await nimiq.sendBasicTransaction({
    recipient: treasury,
    value: luna,
  })

  if (isErrorResponse(txHash) || typeof txHash !== 'string') {
    const msg = isErrorResponse(txHash)
      ? txHash.message || txHash.error
      : 'Nimiq Pay did not return a transaction hash.'
    throw new Error(msg)
  }

  return {
    address,
    txHash,
  }
}
