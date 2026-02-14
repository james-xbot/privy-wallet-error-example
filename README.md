# Privy Wallet Error Reproduction

Minimal reproduction demo for a bug in `useSponsoredTransaction` — the hook that wraps Privy's `useSendTransaction` to send ERC20 transactions via an embedded wallet.

## Tech Stack

- Vite + React 19 + TypeScript
- `@privy-io/react-auth` ^3.13.1
- `viem` ^2.43.3

## Setup

```bash
pnpm install
```

Create a `.env` file (already included):

```
VITE_PRIVY_APP_ID=<your-privy-app-id>
VITE_TOKEN_ADDRESS=<erc20-token-address>
```

## Run

```bash
pnpm dev
```

Open http://localhost:3000

## Reproduce Steps

1. **Login** — Click "Login with Privy", authenticate via wallet or social login. Privy will create an embedded wallet automatically.
2. **Check wallet status** — After login, verify the embedded wallet (`walletClientType: privy`) is listed and the token balance is displayed.
3. **Send a transaction** — Fill in a "To Address" and "Amount", then click "Transfer Token" or "Approve Token".
4. **Observe the error** — The transaction is sent via `useSendTransaction` from `@privy-io/react-auth` with `{ sponsor: false }`. Check the browser console for `[useSponsoredTransaction]` logs and the error details.

## Key Files

| File | Description |
|------|-------------|
| `src/use-sponsored-transaction.ts` | Minimal reproduction of the original `useSponsoredTransaction` hook. Uses `useSendTransaction` from Privy and `useWallets` to get the embedded wallet. |
| `src/App.tsx` | Demo UI: login, wallet info, token balance, transfer/approve actions. |
| `src/main.tsx` | `PrivyProvider` setup with chain config and embedded wallet creation on login. |

## Switching Chains

The default chain is Ethereum Mainnet. To switch to a different chain, modify three places in `src/main.tsx`:

```diff
- import { mainnet } from 'viem/chains'
+ import { bscTestnet } from 'viem/chains'

  const client = createPublicClient({
-   chain: mainnet,
+   chain: bscTestnet,
    transport: http(),
  })

  <PrivyProvider
    appId={privyAppId}
    config={{
      ...
-     supportedChains: [mainnet],
-     defaultChain: mainnet,
+     supportedChains: [bscTestnet],
+     defaultChain: bscTestnet,
    }}
  >
```

Also update `VITE_TOKEN_ADDRESS` in `.env` to match a token contract on the target chain.

Available chain imports from `viem/chains`: `mainnet`, `bsc`, `bscTestnet`, `polygon`, `arbitrum`, etc.
