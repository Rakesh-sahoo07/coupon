import { ethers } from 'ethers';
import CouponABI from '../contract/Coupon.json';

// Contract address on the blockchain
export const CONTRACT_ADDRESS = '0x13E037CD53B9dB90Cec8Cca7f2987Cd246a4e0e6';

// Get Ethereum provider from window.ethereum (MetaMask)
export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error('MetaMask not installed');
};

// Connect wallet and return the signer
export const connectWallet = async () => {
  try {
    const provider = getProvider();
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { signer, address };
  } catch (error) {
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
};

// Get contract instance
export const getContract = async (withSigner = true) => {
  try {
    const provider = getProvider();
    
    if (withSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, CouponABI, signer);
    } else {
      return new ethers.Contract(CONTRACT_ADDRESS, CouponABI, provider);
    }
  } catch (error) {
    console.error('Failed to get contract instance:', error);
    throw error;
  }
};

// Check if wallet is connected
export const isWalletConnected = async () => {
  if (!window.ethereum) return false;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch (error) {
    console.error('Error checking if wallet is connected:', error);
    return false;
  }
};

// Get current wallet address
export const getCurrentAddress = async () => {
  if (!window.ethereum) return null;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current address:', error);
    return null;
  }
};