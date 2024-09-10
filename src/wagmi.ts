import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      coinbaseWallet({
        appName: 'Create Wagmi',
        preference: 'smartWalletOnly',
      }),
    ],
    transports: {
      [baseSepolia.id]: http(),
    },
  });
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
