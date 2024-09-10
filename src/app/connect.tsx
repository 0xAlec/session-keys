import React, { useCallback } from 'react';
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

const buttonStyles = {
  background: 'transparent',
  border: '1px solid transparent',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 200,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold',
  fontSize: 18,
  backgroundColor: '#0052FF',
  paddingLeft: 15,
  paddingRight: 30,
  borderRadius: 10,
};

const sdk = new CoinbaseWalletSDK({
  appName: 'My Dapp',
  appLogoUrl: 'https://example.com/logo.png',
  appChainIds: [84532],
});

const provider = sdk.makeWeb3Provider();

export function BlueCreateWalletButton() {
  const createWallet = useCallback(async () => {
    try {
      const [address] = await provider.request({
        method: 'eth_requestAccounts',
      });
    } catch (error) {
      handleError(error);
    }
  }, [handleSuccess, handleError]);

  return (
    <button style={buttonStyles} onClick={createWallet}>
      Create Wallet
    </button>
  );
}
