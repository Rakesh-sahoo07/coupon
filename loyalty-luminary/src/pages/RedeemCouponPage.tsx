import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, QrCode, Store, Check, Clock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWallet } from "@/contexts/WalletContext";
import { getContract, getProvider } from "@/lib/ethereum";
import { ethers } from "ethers";

const RedeemCouponPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionComplete, setRedemptionComplete] = useState(false);
  const [coupon, setCoupon] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { isConnected, connectWithWallet, connecting, contract } = useWallet();

  // Function to fetch coupon data without wallet connection
  const fetchCouponData = async (couponCode: string) => {
    try {
      setLoading(true);
      // We need a contract instance without a signer for read-only operations
      const readonlyContract = await getContract(false);
      
      // First, get the coupon ID from the code
      const couponId = await readonlyContract.getCouponIdByCode(couponCode);
      
      if (couponId.toString() === "0") {
        setError("Coupon not found");
        return;
      }
      
      // Fetch the coupon details
      const couponData = await readonlyContract.getCoupon(couponId);
      
      // Check if coupon is already used or not active
      if (couponData.isUsed) {
        setError("This coupon has already been used");
        return;
      }
      
      if (!couponData.isActive) {
        setError("This coupon is no longer active");
        return;
      }
      
      // Fetch the organization details
      const orgData = await readonlyContract.getOrganization(couponData.organizationId);
      
      // Convert discount amount based on type (simple logic)
      let discountDisplay;
      if (parseInt(couponData.discountAmount.toString()) > 10000) {
        // Likely a fixed amount
        discountDisplay = `$${(parseInt(couponData.discountAmount.toString()) / 100).toFixed(2)} OFF`;
      } else {
        // Likely a percentage
        discountDisplay = `${(parseInt(couponData.discountAmount.toString()) / 100).toFixed(0)}% OFF`;
      }
      
      // Calculate expiry date (if we had it stored)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Assume 30 days validity
      
      setCoupon({
        id: couponData.id.toString(),
        code: couponData.code,
        discount: discountDisplay,
        organizationId: couponData.organizationId.toString(),
        userWallet: couponData.userWallet,
        userEmail: couponData.userEmail,
        timestamp: couponData.timestamp.toString(),
        expiresAt: expiresAt.toLocaleDateString()
      });
      
      setOrganization({
        id: orgData.id.toString(),
        name: orgData.name,
        description: orgData.description,
        admin: orgData.admin
      });
      
    } catch (err) {
      console.error("Error fetching coupon:", err);
      setError("Failed to load coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      fetchCouponData(code);
    }
  }, [code]);

  const handleConnect = async () => {
    try {
      await connectWithWallet();
    } catch (err) {
      console.error("Error connecting wallet:", err);
      toast.error("Failed to connect wallet");
    }
  };

  const handleRedeemCoupon = async () => {
    if (!isConnected || !contract) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!coupon || !code) {
      toast.error("Coupon information is missing");
      return;
    }
    
    setIsRedeeming(true);
    
    try {
      // First, link the coupon to the wallet if it's not already linked
      if (coupon.userWallet === ethers.ZeroAddress) {
        const linkTx = await contract.linkCouponToWallet(code);
        toast.info("Linking coupon to your wallet...");
        
        const linkReceipt = await linkTx.wait();
        
        if (linkReceipt.status !== 1) {
          throw new Error("Failed to link coupon to wallet");
        }
        
        toast.success("Coupon linked to your wallet");
      }
      
      // Now redeem the coupon
      const redeemTx = await contract.useCoupon(coupon.id);
      toast.info("Redeeming coupon...");
      
      const redeemReceipt = await redeemTx.wait();
      
      if (redeemReceipt.status === 1) {
        toast.success("Coupon redeemed successfully!");
        setRedemptionComplete(true);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      console.error("Error redeeming coupon:", err);
      toast.error(err.message || "Failed to redeem coupon");
    } finally {
      setIsRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-8 animate-fade-in">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading coupon details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-8 animate-fade-in">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-center">Coupon Error</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (redemptionComplete) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-8 animate-fade-in">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Redemption Successful!</CardTitle>
            <CardDescription className="text-center">
              You have successfully redeemed the coupon.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-muted p-4 rounded-md mb-4">
              <p className="text-lg font-bold">{coupon?.discount}</p>
              <p className="text-sm">{organization?.name}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Coupon code: {coupon?.code}
              </p>
            </div>
            
            <Alert className="bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Transaction Confirmed</AlertTitle>
              <AlertDescription>
                This transaction has been recorded on the blockchain.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center space-x-2">
            <Button onClick={() => navigate("/")} variant="outline">
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate("/coupons")}>
              View My Coupons
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8 animate-fade-in">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Redeem Coupon</CardTitle>
          <CardDescription className="text-center">
            Connect your wallet to redeem this coupon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {coupon && organization && (
            <div className="glass dark:glass-dark p-6 rounded-lg text-center">
              <div className="text-3xl font-bold mb-2">{coupon.discount}</div>
              <div className="text-sm mb-4">{organization.description}</div>
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center text-sm">
                  <Store className="h-4 w-4 mr-1" />
                  {organization.name}
                </div>
              </div>
              <div className="border-2 border-dashed border-muted-foreground/50 rounded-md p-3 inline-block">
                <div className="font-mono tracking-wider">{coupon.code}</div>
              </div>
              <div className="flex items-center justify-center mt-4 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Valid until {coupon.expiresAt}
              </div>
            </div>
          )}
          
          {!isConnected && (
            <Alert className="mb-4">
              <Wallet className="h-4 w-4 mr-2" />
              <AlertTitle>Wallet Connection Required</AlertTitle>
              <AlertDescription>
                You need to connect your wallet to redeem this coupon.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {!isConnected ? (
            <Button 
              className="w-full" 
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          ) : (
            <Button 
              className="w-full" 
              variant="default"
              onClick={handleRedeemCoupon}
              disabled={isRedeeming}
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redeeming...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Redeem Coupon
                </>
              )}
            </Button>
          )}
          
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => navigate("/")}
          >
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RedeemCouponPage;