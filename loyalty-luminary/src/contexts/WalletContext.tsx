// src/contexts/WalletContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { 
  connectWallet, 
  isWalletConnected, 
  getCurrentAddress,
  getContract
} from '@/lib/ethereum';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  connecting: boolean;
  connectWithWallet: () => Promise<void>;
  contract: any;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  connecting: false,
  connectWithWallet: async () => {},
  contract: null,
  disconnectWallet: () => {},
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [contract, setContract] = useState<any>(null);

  // Check if wallet is already connected on initial load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await isWalletConnected();
        if (connected) {
          const addr = await getCurrentAddress();
          setIsConnected(true);
          setAddress(addr);
          try {
            const contractInstance = await getContract();
            setContract(contractInstance);
          } catch (error) {
            console.error('Failed to get contract instance:', error);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();

    // Setup MetaMask event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
      window.ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User has disconnected all accounts
      setIsConnected(false);
      setAddress(null);
      setContract(null);
    } else {
      // User has switched accounts
      setAddress(accounts[0]);
      try {
        const contractInstance = await getContract();
        setContract(contractInstance);
      } catch (error) {
        console.error('Failed to get contract instance:', error);
      }
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setContract(null);
  };

  const connectWithWallet = async () => {
    setConnecting(true);
    
    try {
      const { address: walletAddress, signer } = await connectWallet();
      setIsConnected(true);
      setAddress(walletAddress);
      
      try {
        const contractInstance = await getContract();
        setContract(contractInstance);
      } catch (contractError) {
        toast.error('Failed to connect to smart contract');
        console.error('Contract connection error:', contractError);
      }
      
      toast.success('Wallet connected successfully');
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setContract(null);
    localStorage.removeItem('walletConnected');
    toast.info('Wallet disconnected');
  };

  return (
    <WalletContext.Provider 
      value={{ 
        isConnected, 
        address, 
        connecting, 
        connectWithWallet,
        contract,
        disconnectWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};