'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { useState } from 'react';
import { Hex, parseEther } from 'viem';
import { useAccount } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { useGrantPermissions, useSendCalls } from 'wagmi/experimental';
import {
  createCredential,
  P256Credential,
  signWithCredential,
} from 'webauthn-p256';
import { toFunctionSelector } from 'viem';
import { useCallsStatus } from 'wagmi/experimental';
import { encodeFunctionData } from 'viem';
import { clickAddress, clickAbi } from './click';
import { useConnect } from 'wagmi';

export default function App() {
  const account = useAccount();
  const { grantPermissionsAsync } = useGrantPermissions();
  const [permissionsContext, setPermissionsContext] = useState<
    Hex | undefined
  >();
  const [credential, setCredential] = useState<
    undefined | P256Credential<'cryptokey'>
  >();
  const [callsId, setCallsId] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const { sendCallsAsync } = useSendCalls();
  const { data: callsStatus } = useCallsStatus({
    id: callsId as string,
    query: {
      enabled: !!callsId,
      refetchInterval: (data) =>
        data.state.data?.status === 'PENDING' ? 500 : false,
    },
  });
  const { connectors, connect } = useConnect();

  const grantPermissions = async () => {
    const newCredential = await createCredential({ type: 'cryptoKey' });

    const response = await grantPermissionsAsync({
      permissions: [
        {
          address: account.address!,
          chainId: 84532,
          expiry: 17218875770,
          signer: {
            type: 'p256',
            data: {
              publicKey: newCredential.publicKey,
            },
          },
          permissions: [
            {
              type: 'native-token-recurring-allowance',
              data: {
                allowance: parseEther('0.1'),
                start: Math.floor(Date.now() / 1000),
                period: 86400,
              },
            },
            {
              type: 'allowed-contract-selector',
              data: {
                contract: clickAddress,
                selector: toFunctionSelector('permissionedCall(bytes)'),
              },
            },
          ],
        },
      ],
    });

    const context = response[0].context as Hex;
    setPermissionsContext(context);
    setCredential(newCredential);
  };

  const click = async () => {
    if (account.address && permissionsContext && credential) {
      setSubmitted(true);
      setCallsId(undefined);
      try {
        const callsId = await sendCallsAsync({
          calls: [
            {
              to: clickAddress,
              value: BigInt(0),
              data: encodeFunctionData({
                abi: clickAbi,
                functionName: 'click',
                args: [],
              }),
            },
          ],
          capabilities: {
            permissions: {
              context: permissionsContext,
            },
            paymasterService: {
              url: 'https://...', // Your paymaster service URL
            },
          },
          signatureOverride: signWithCredential(credential),
        });

        setCallsId(callsId);
      } catch (e: any) {
        console.error(e);
      }
      setSubmitted(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          connect({ connector: connectors[0] });
        }}
      >
        Connect{' '}
      </button>
      <Wallet>
        <ConnectWallet />
      </Wallet>
      {!permissionsContext ? (
        <button type="button" onClick={grantPermissions}>
          Grant Permission
        </button>
      ) : (
        <button
          type="button"
          onClick={click}
          disabled={
            submitted || (!!callsId && !(callsStatus?.status === 'CONFIRMED'))
          }
        >
          Click
        </button>
      )}

      {callsStatus && callsStatus.status === 'CONFIRMED' && (
        <a
          href={`https://base-sepolia.blockscout.com/tx/${callsStatus.receipts?.[0].transactionHash}`}
          target="_blank"
          className="absolute top-8 hover:underline"
        >
          View transaction
        </a>
      )}
    </>
  );
}
