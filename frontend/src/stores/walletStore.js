import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ethers } from 'ethers';
import { CURRENT_NETWORK, CONTRACT_ADDRESSES } from '../constants/config';
import { PAYMENT_ESCROW_ABI, ERC20_ABI } from '../constants/abi';

export const useWalletStore = create(
  persist(
    (set, get) => ({
      // State
      isConnected: false,
      address: null,
      balance: null,
      usdtBalance: null,
      chainId: null,
      provider: null,
      signer: null,
      isConnecting: false,
      error: null,

      // Contracts
      paymentEscrowContract: null,
      usdtContract: null,

      // Actions
      connectWallet: async () => {
        try {
          set({ isConnecting: true, error: null });

          // Check if wallet is available
          if (!window.ethereum) {
            throw new Error('No wallet detected. Please install MetaMask or use LINE Dapp Portal.');
          }

          // Request account access
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          });

          if (accounts.length === 0) {
            throw new Error('No accounts found. Please check your wallet.');
          }

          const address = accounts[0];
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const network = await provider.getNetwork();

          // Check if connected to correct network
          if (network.chainId.toString() !== parseInt(CURRENT_NETWORK.chainId, 16).toString()) {
            await get().switchToCorrectNetwork();
          }

          // Get balances
          const balance = await provider.getBalance(address);
          const usdtContract = new ethers.Contract(CONTRACT_ADDRESSES.USDT_TOKEN, ERC20_ABI, provider);
          const usdtBalance = await usdtContract.balanceOf(address);

          // Initialize contracts
          const paymentEscrowContract = new ethers.Contract(
            CONTRACT_ADDRESSES.PAYMENT_ESCROW,
            PAYMENT_ESCROW_ABI,
            signer
          );

          const usdtContractWithSigner = new ethers.Contract(
            CONTRACT_ADDRESSES.USDT_TOKEN,
            ERC20_ABI,
            signer
          );

          set({
            isConnected: true,
            address,
            balance: ethers.utils.formatEther(balance),
            usdtBalance: ethers.utils.formatUnits(usdtBalance, 6),
            chainId: network.chainId,
            provider,
            signer,
            paymentEscrowContract,
            usdtContract: usdtContractWithSigner,
            isConnecting: false,
            error: null,
          });

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
              get().disconnect();
            } else {
              get().connectWallet();
            }
          });

          // Listen for chain changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });

        } catch (error) {
          console.error('Wallet connection failed:', error);
          set({
            isConnecting: false,
            error: error.message,
          });
          throw error;
        }
      },

      disconnect: () => {
        set({
          isConnected: false,
          address: null,
          balance: null,
          usdtBalance: null,
          chainId: null,
          provider: null,
          signer: null,
          paymentEscrowContract: null,
          usdtContract: null,
          error: null,
        });
      },

      switchToCorrectNetwork: async () => {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CURRENT_NETWORK.chainId }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [CURRENT_NETWORK],
              });
            } catch (addError) {
              throw new Error('Failed to add Kaia network to wallet');
            }
          } else {
            throw new Error('Failed to switch to Kaia network');
          }
        }
      },

      refreshBalances: async () => {
        const { address, provider, usdtContract } = get();
        if (!address || !provider || !usdtContract) return;

        try {
          const balance = await provider.getBalance(address);
          const usdtBalance = await usdtContract.balanceOf(address);

          set({
            balance: ethers.utils.formatEther(balance),
            usdtBalance: ethers.utils.formatUnits(usdtBalance, 6),
          });
        } catch (error) {
          console.error('Failed to refresh balances:', error);
        }
      },

      // Payment functions
      approveUSDT: async (spenderAddress, amount) => {
        const { usdtContract, address } = get();
        if (!usdtContract || !address) {
          throw new Error('Wallet not connected');
        }

        try {
          const amountInWei = ethers.utils.parseUnits(amount.toString(), 6);
          const tx = await usdtContract.approve(spenderAddress, amountInWei);
          return tx;
        } catch (error) {
          console.error('USDT approval failed:', error);
          throw error;
        }
      },

      checkUSDTAllowance: async (spenderAddress) => {
        const { usdtContract, address } = get();
        if (!usdtContract || !address) return '0';

        try {
          const allowance = await usdtContract.allowance(address, spenderAddress);
          return ethers.utils.formatUnits(allowance, 6);
        } catch (error) {
          console.error('Failed to check USDT allowance:', error);
          return '0';
        }
      },

      createPayment: async (merchantAddress, amount, orderId, description) => {
        const { paymentEscrowContract, address } = get();
        if (!paymentEscrowContract || !address) {
          throw new Error('Wallet not connected');
        }

        try {
          const amountInWei = ethers.utils.parseUnits(amount.toString(), 6);
          const tx = await paymentEscrowContract.createPayment(
            merchantAddress,
            amountInWei,
            orderId,
            description
          );
          return tx;
        } catch (error) {
          console.error('Payment creation failed:', error);
          throw error;
        }
      },

      releasePayment: async (paymentId) => {
        const { paymentEscrowContract, address } = get();
        if (!paymentEscrowContract || !address) {
          throw new Error('Wallet not connected');
        }

        try {
          const tx = await paymentEscrowContract.releasePayment(paymentId);
          return tx;
        } catch (error) {
          console.error('Payment release failed:', error);
          throw error;
        }
      },

      refundPayment: async (paymentId) => {
        const { paymentEscrowContract, address } = get();
        if (!paymentEscrowContract || !address) {
          throw new Error('Wallet not connected');
        }

        try {
          const tx = await paymentEscrowContract.refundPayment(paymentId);
          return tx;
        } catch (error) {
          console.error('Payment refund failed:', error);
          throw error;
        }
      },

      getPayment: async (paymentId) => {
        const { paymentEscrowContract } = get();
        if (!paymentEscrowContract) {
          throw new Error('Contract not initialized');
        }

        try {
          const payment = await paymentEscrowContract.getPayment(paymentId);
          return {
            id: payment.id.toString(),
            payer: payment.payer,
            merchant: payment.merchant,
            amount: ethers.utils.formatUnits(payment.amount, 6),
            platformFeeAmount: ethers.utils.formatUnits(payment.platformFeeAmount, 6),
            merchantAmount: ethers.utils.formatUnits(payment.merchantAmount, 6),
            createdAt: new Date(payment.createdAt.toNumber() * 1000),
            releasedAt: payment.releasedAt.toNumber() > 0 ? new Date(payment.releasedAt.toNumber() * 1000) : null,
            released: payment.released,
            refunded: payment.refunded,
            orderId: payment.orderId,
            description: payment.description,
          };
        } catch (error) {
          console.error('Failed to get payment:', error);
          throw error;
        }
      },

      getUserPayments: async () => {
        const { paymentEscrowContract, address } = get();
        if (!paymentEscrowContract || !address) return [];

        try {
          const paymentIds = await paymentEscrowContract.getPayerPayments(address);
          const payments = await Promise.all(
            paymentIds.map(id => get().getPayment(id.toString()))
          );
          return payments;
        } catch (error) {
          console.error('Failed to get user payments:', error);
          return [];
        }
      },

      getMerchantPayments: async (merchantAddress) => {
        const { paymentEscrowContract } = get();
        if (!paymentEscrowContract) return [];

        try {
          const paymentIds = await paymentEscrowContract.getMerchantPayments(merchantAddress);
          const payments = await Promise.all(
            paymentIds.map(id => get().getPayment(id.toString()))
          );
          return payments;
        } catch (error) {
          console.error('Failed to get merchant payments:', error);
          return [];
        }
      },
    }),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        // Only persist these values
        isConnected: state.isConnected,
        address: state.address,
        chainId: state.chainId,
      }),
    }
  )
);