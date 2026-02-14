import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import {
  createPublicClient,
  http,
} from 'viem'
import { mainnet } from 'viem/chains'
import App from './app'

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: '#0e0d0e',
          walletChainType: 'ethereum-only',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        loginMethods: ['wallet'],
        supportedChains: [mainnet],
        defaultChain: mainnet,
      }}
    >
      <App client={client} />
    </PrivyProvider>
  </StrictMode>,
)
