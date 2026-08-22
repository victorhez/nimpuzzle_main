import { NIMIQ_NETWORK } from './config'

let clientPromise: Promise<any> | null = null

async function getClient(): Promise<any> {
  if (!process.env.NIMIQ_PAYOUT_PRIVATE_KEY) {
    throw new Error('NIMIQ_PAYOUT_PRIVATE_KEY is not configured')
  }

  const Nimiq = require('@nimiq/core') as any

  if (!clientPromise) {
    clientPromise = (async () => {
      const config = new Nimiq.ClientConfiguration()

      config.network(NIMIQ_NETWORK)

      const client = await Nimiq.Client.create(config.build())

      await client.waitForConsensusEstablished()

      return client
    })()
  }

  return clientPromise
}

export async function sendPayout(
  recipient: string,
  amountLuna: bigint,
): Promise<string> {
  const Nimiq = require('@nimiq/core') as any

  const privateKey = Nimiq.PrivateKey.fromHex(
    process.env.NIMIQ_PAYOUT_PRIVATE_KEY!,
  )

  const keyPair = Nimiq.KeyPair.derive(privateKey)

  const client = await getClient()

  const sender = keyPair.toAddress()

  const recipientAddress =
    Nimiq.Address.fromUserFriendlyAddress(recipient)

  const height = await client.getHeadHeight()

  const networkId = await client.getNetworkId()

  const tx = Nimiq.TransactionBuilder.newBasic(
    sender,
    recipientAddress,
    amountLuna,
    0n,
    height,
    networkId,
  )

  tx.sign(keyPair, undefined)

  const result = await client.sendTransaction(tx)

  return result.hash
}
