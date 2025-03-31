import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Store, QrCode, Share2, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/contexts/WalletContext";

interface CouponCardProps {
  id: string;
  code: string;
  discount: string;
  organization: string;
  expiresAt?: string;
  status: "active" | "used" | "expired";
  className?: string;
  style?: React.CSSProperties;
  onUse?: () => void;
  onShare?: (email: string) => void;
  organizationId?: string;
}

export function CouponCard({
  id,
  code,
  discount,
  organization,
  expiresAt,
  status,
  className,
  style,
  onUse,
  onShare,
  organizationId
}: CouponCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isUseDialogOpen, setIsUseDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isUsing, setIsUsing] = useState(false);
  const [organizationDetails, setOrganizationDetails] = useState(null);
  const { contract } = useWallet();

  // Fetch organization details if needed
  useEffect(() => {
    const fetchOrganizationDetails = async () => {
      if (contract && organizationId && !organizationDetails) {
        try {
          const orgData = await contract.getOrganization(organizationId);
          setOrganizationDetails({
            id: organizationId,
            name: orgData[1], // Organization name is at index 1
            description: orgData[2] // Description is at index 2
          });
        } catch (error) {
          console.error("Error fetching organization details:", error);
        }
      }
    };

    fetchOrganizationDetails();
  }, [contract, organizationId, organizationDetails]);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: `${discount} discount at ${organization}`,
        text: `Here's a coupon for ${discount} off at ${organization}`,
        url: `${window.location.origin}/redeem/${code}`,
      }).catch(() => {
        setIsShareDialogOpen(true);
      });
    } else {
      setIsShareDialogOpen(true);
    }
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shareEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    setIsSharing(true);
    
    try {
      // First, call the smart contract function to share the coupon
      if (onShare) {
        // This will update the blockchain state
        await onShare(shareEmail);
      }
      
      // Then call the email service to send notification
      const token = localStorage.getItem('token');
      if (!token) {
        toast.warning("Email notification not sent - authentication required");
      } else {
        // Construct the full redemption URL
        const redeemUrl = `${window.location.origin}/redeem/${code}`;
        
        // Get organization description if available
        const description = organizationDetails?.description || 
          `This coupon provides you with ${discount} at ${organization}.`;
        
        // Calculate expiry date if not provided
        const formattedExpiresAt = expiresAt || (() => {
          const date = new Date();
          date.setDate(date.getDate() + 30);
          return date.toLocaleDateString();
        })();
        
        // Send request to backend email service
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/email/send-coupon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            recipientEmail: shareEmail,
            couponCode: code,
            discount: discount,
            organizationName: organization,
            description: description,
            expiresAt: formattedExpiresAt,
            redeemUrl: redeemUrl
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Email API error:", errorData);
          toast.warning("Coupon shared on blockchain, but email notification failed");
        } else {
          toast.success("Coupon shared successfully with email notification!");
        }
      }
      
      setIsShareDialogOpen(false);
      setShareEmail("");
    } catch (error) {
      console.error("Error sharing coupon:", error);
      toast.error(error.message || "Failed to share coupon");
    } finally {
      setIsSharing(false);
    }
  };

  const handleUseSubmit = async () => {
    setIsUsing(true);
    
    try {
      if (onUse) {
        await onUse();
      }
      setIsUseDialogOpen(false);
    } catch (error) {
      console.error("Error using coupon:", error);
    } finally {
      setIsUsing(false);
    }
  };

  const statusColors = {
    active: "bg-green-500",
    used: "bg-gray-500",
    expired: "bg-red-500",
  };

  return (
    <>
      <div
        className={cn(
          "perspective-1000 cursor-pointer w-full h-full transition-transform duration-300 animate-fade-in",
          className
        )}
        onClick={() => setIsFlipped(!isFlipped)}
        style={style}
      >
        <div
          className={cn(
            "relative w-full h-full transform transition-transform duration-500 preserve-3d",
            isFlipped ? "rotate-y-180" : ""
          )}
        >
          {/* Front of card */}
          <Card className="absolute w-full h-full backface-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge
                  className={cn(
                    "text-white",
                    statusColors[status]
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                <div className="text-3xl font-bold">{discount}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Store className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{organization}</span>
                </div>
                {expiresAt && (
                  <div className="flex items-center text-sm">
                    <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Expires: {expiresAt}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button size="sm" variant="secondary" className="w-full" onClick={(e) => e.stopPropagation()}>
                <QrCode className="h-4 w-4 mr-2" /> Show QR Code
              </Button>
            </CardFooter>
          </Card>

          {/* Back of card */}
          <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col">
            <CardContent className="flex flex-col items-center justify-center p-6 flex-grow">
              <div className="border-4 border-dashed border-muted p-8 rounded-lg mb-4">
                <div className="text-lg font-mono font-bold tracking-wide">{code}</div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Present this code to the merchant to redeem your coupon
              </p>
            </CardContent>
            <CardFooter className="justify-between pt-0">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(code);
                  toast.success("Coupon code copied");
                }}
              >
                Copy Code
              </Button>
              
              {status === "active" && (
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUseDialogOpen(true);
                    }}
                  >
                    Use Now
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </Button>
                </div>
              )}
              
              {status !== "active" && (
                <Button size="sm" variant="secondary" disabled={status === "used"} onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Coupon</DialogTitle>
            <DialogDescription>
              Share this coupon with someone via email.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleShareSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input
                  id="recipient-email"
                  placeholder="friend@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                  type="email"
                />
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">{organization}</p>
                <p className="text-lg font-bold">{discount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coupon code: {code}
                </p>
                {expiresAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires: {expiresAt}
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSharing || !shareEmail}>
                {isSharing ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 mr-2 border-b-2 rounded-full border-white"></span>
                    Sharing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Use Coupon Dialog */}
      <Dialog open={isUseDialogOpen} onOpenChange={setIsUseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this coupon as used?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-4 rounded-md my-4">
            <p className="text-sm font-medium">{organization}</p>
            <p className="text-xl font-bold">{discount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Coupon code: {code}
            </p>
            {expiresAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Expires: {expiresAt}
              </p>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleUseSubmit} disabled={isUsing}>
              {isUsing ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-b-2 rounded-full border-white"></span>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Use
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}