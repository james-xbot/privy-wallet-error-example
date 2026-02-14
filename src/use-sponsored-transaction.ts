import { useCallback, useMemo } from 'react'
import { useSendTransaction, useWallets } from '@privy-io/react-auth'
import { type Address, type Hex } from 'viem'

// Whether to enable gas sponsorship
const ENABLE_GAS_SPONSORSHIP = false

export interface SendTransactionParams {
  to: Address
  data: Hex
  value?: bigint
}

/**
 * Reproduce useWallet (prioritize Privy embedded wallet)
 */
function useWallet() {
  const { wallets, ready } = useWallets()

  const wallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return null
    const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy')
    if (embeddedWallet) return embeddedWallet
    return wallets[0] || null
  }, [wallets])

  return {
    wallet,
    isLoading: !ready,
    isConnected: !!wallet,
  }
}

/**
 * Reproduce useSponsoredTransaction
 */
export function useSponsoredTransaction() {
  const { sendTransaction: privySendTransaction } = useSendTransaction({
    onError: (error) => {
      console.error('[useSponsoredTransaction] Error:', error)
    },
  })
  const { wallet } = useWallet()
  const sponsorEnabled = ENABLE_GAS_SPONSORSHIP

  const sendTransaction = useCallback(
    async (params: SendTransactionParams): Promise<string> => {
      try {
        const { to, data, value } = params
        const receipt = await privySendTransaction(
          {
            to,
            data,
            value: value ? `0x${value.toString(16)}` : undefined,
          },
          {
            sponsor: sponsorEnabled,
          },
        )

        console.log('[useSponsoredTransaction] Transaction receipt:', receipt)
        return receipt.hash
      } catch (error) {
        console.error('[useSponsoredTransaction] Error:', error)
        throw error
      }
    },
    [privySendTransaction, sponsorEnabled],
  )

  return { sendTransaction, wallet }
}
