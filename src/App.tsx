import { useState, useEffect, useCallback } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import {
  PublicClient,
  encodeFunctionData,
  formatUnits,
  type Address,
  type Hex,
  parseUnits,
} from 'viem'
import { useSponsoredTransaction } from './use-sponsored-transaction'

const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS as Address

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const

function App({ client }: { client: PublicClient }) {
  const { login, logout, authenticated, user } = usePrivy()
  const { wallets, ready } = useWallets()
  const { sendTransaction, wallet } = useSponsoredTransaction()

  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [tokenBalance, setTokenBalance] = useState<string | null>(null)
  const [tokenDecimals, setTokenDecimals] = useState<number>(6)

  const fetchBalance = useCallback(async () => {
    if (!wallet) return
    try {
      const [balance, decimals] = await Promise.all([
        client.readContract({
          address: TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [wallet.address as Address],
        }),
        client.readContract({
          address: TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }),
      ])
      setTokenDecimals(decimals)
      setTokenBalance(formatUnits(balance, decimals))
    } catch (err) {
      console.error('[fetchBalance] Error:', err)
      setTokenBalance('Error')
    }
  }, [wallet])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // ERC20 Transfer
  const handleTransfer = async () => {
    setStatus('Sending...')
    setError('')
    try {
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [toAddress as Address, parseUnits(amount, tokenDecimals)],
      })

      const txHash = await sendTransaction({
        to: TOKEN_ADDRESS,
        data: data as Hex,
      })

      setStatus(`Transaction sent! Hash: ${txHash}`)
    } catch (err: unknown) {
      console.error('[handleTransfer] Error:', err)
      setError(err instanceof Error ? err.message : String(err))
      setStatus('')
    }
  }

  // ERC20 Approve
  const handleApprove = async () => {
    setStatus('Approving...')
    setError('')
    try {
      const spender = toAddress as Address
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, parseUnits(amount || '1000000', tokenDecimals)],
      })

      const txHash = await sendTransaction({
        to: TOKEN_ADDRESS,
        data: data as Hex,
      })

      setStatus(`Approve sent! Hash: ${txHash}`)
    } catch (err: unknown) {
      console.error('[handleApprove] Error:', err)
      setError(err instanceof Error ? err.message : String(err))
      setStatus('')
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>Privy Wallet Error Reproduction</h1>

      {/* Auth */}
      <section style={{ marginBottom: 20 }}>
        <h2>1. Authentication</h2>
        {authenticated ? (
          <div>
            <p>Logged in: {user?.wallet?.address || user?.email?.address || 'Unknown'}</p>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <button onClick={login}>Login with Privy</button>
        )}
      </section>

      {/* Wallet Info */}
      <section style={{ marginBottom: 20 }}>
        <h2>2. Wallet Status</h2>
        <p>Ready: {String(ready)}</p>
        <p>Wallets count: {wallets.length}</p>
        {wallets.map((w, i) => (
          <div key={i} style={{ marginLeft: 10, marginBottom: 5 }}>
            <p>
              [{i}] {w.walletClientType} - {w.address} (chain: {w.chainId})
            </p>
          </div>
        ))}
        <p>
          Selected wallet (useWallet): {wallet?.address ?? 'None'} ({wallet?.walletClientType})
        </p>
        <p>
          Token balance: {tokenBalance ?? '-'}{' '}
          <button onClick={fetchBalance}>Refresh</button>
        </p>
      </section>

      {/* Transaction */}
      {authenticated && (
        <section style={{ marginBottom: 20 }}>
          <h2>3. Send Transaction (useSponsoredTransaction)</h2>
          <div style={{ marginBottom: 10 }}>
            <label>
              To Address:
              <br />
              <input
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="0x..."
                style={{ width: 420 }}
              />
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>
              Amount:
              <br />
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
                style={{ width: 200 }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleTransfer}>Transfer Token</button>
            <button onClick={handleApprove}>Approve Token</button>
          </div>

          {status && <p style={{ color: 'green' }}>{status}</p>}
          {error && (
            <pre style={{ color: 'red', whiteSpace: 'pre-wrap', maxWidth: 600 }}>{error}</pre>
          )}
        </section>
      )}
    </div>
  )
}

export default App
