import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Loader2, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CouponCreatePage = () => {
  const [searchParams] = useSearchParams();
  const initialOrg = searchParams.get("organization") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    organization: initialOrg,
    discountType: "percentage",
    discountValue: "",
    description: "",
    recipientEmail: "",
    expiryDate: "",
    maxUses: "1"
  });
  const [couponCode, setCouponCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  
  const navigate = useNavigate();
  const { isConnected, contract, connectWithWallet, connecting } = useWallet();

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }

      try {
        // Get organization IDs
        const orgIds = await contract.getMyOrganizations();
        
        // Fetch details for each organization
        const orgPromises = orgIds.map(async (id) => {
          const org = await contract.getOrganization(id);
          return {
            id: org.id.toString(),
            name: org.name,
            description: org.description
          };
        });
        
        const orgData = await Promise.all(orgPromises);
        setOrganizations(orgData);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        toast.error("Failed to fetch organizations");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [isConnected, contract]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateCouponCode = () => {
    // Simple coupon code generation logic
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    
    // Use organization prefix if available
    const org = organizations.find(o => o.id === formData.organization);
    if (org) {
      code = org.name.substring(0, 3).toUpperCase();
    }
    
    // Add random characters
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setCouponCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Coupon code copied to clipboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !contract) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!couponCode) {
      toast.error("Please generate a coupon code first");
      return;
    }
    
    if (!formData.recipientEmail) {
      toast.error("Please provide a recipient email");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate discount value in appropriate format for the contract
      // For blockchain we'll store the value as a whole number (in smallest unit)
      let discountAmount = 0;
      if (formData.discountType === "percentage") {
        discountAmount = Math.floor(parseFloat(formData.discountValue) * 100); // Store as basis points (100 = 1%)
      } else if (formData.discountType === "fixed") {
        discountAmount = Math.floor(parseFloat(formData.discountValue) * 100); // Store in cents
      } else {
        // For free item, we'll just use 0 as a placeholder - in real implementation, 
        // you'd store this differently or handle in a more sophisticated way
        discountAmount = 0;
      }
      
      // Call the smart contract to create a coupon
      const tx = await contract.createCoupon(
        formData.organization,
        couponCode,
        discountAmount,
        formData.recipientEmail
      );
      
      toast.info("Transaction submitted, waiting for confirmation...");
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success("Coupon created successfully");
        navigate("/coupons");
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast.error(error.message || "Failed to create coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto animate-fade-in">
      <PageHeader 
        title="Create Coupon" 
        description="Create a new loyalty coupon for your customers" 
        action={
          <Button variant="outline" asChild>
            <Link to="/coupons">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Coupons
            </Link>
          </Button>
        }
      />

      {!isConnected && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Wallet not connected</AlertTitle>
          <AlertDescription className="flex items-center mt-2">
            <span className="mr-2">Please connect your wallet to create a coupon.</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={connectWithWallet}
              disabled={connecting}
            >
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p>Loading organizations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Select 
                      value={formData.organization} 
                      onValueChange={handleSelectChange("organization")}
                      disabled={!isConnected || organizations.length === 0}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map(org => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {organizations.length === 0 && isConnected && (
                      <p className="text-xs text-muted-foreground">
                        You don't have any organizations. <Link to="/organizations/create" className="text-primary hover:underline">Create one</Link>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-start gap-2">
                      <Label htmlFor="discountType">Discount Type</Label>
                      <Select 
                        value={formData.discountType} 
                        onValueChange={handleSelectChange("discountType")}
                        disabled={!isConnected}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="freeitem">Free Item</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex flex-col items-start gap-2">
                      <Label htmlFor="discountValue">
                        {formData.discountType === "percentage" ? "Percentage" : 
                        formData.discountType === "fixed" ? "Amount" : "Item"}
                      </Label>
                      <Input
                        id="discountValue"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleChange}
                        placeholder={
                          formData.discountType === "percentage" ? "10%" : 
                          formData.discountType === "fixed" ? "$5.00" : "Coffee"
                        }
                        disabled={!isConnected}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="recipientEmail">Recipient Email</Label>
                    <Input
                      id="recipientEmail"
                      name="recipientEmail"
                      type="email"
                      value={formData.recipientEmail}
                      onChange={handleChange}
                      placeholder="customer@example.com"
                      disabled={!isConnected}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Email of the person who will receive this coupon
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className='text-left'>
                    <Label htmlFor="couponCode">Coupon Code</Label></div>
                    <div className="flex space-x-2">
                      <Input
                        id="couponCode"
                        value={couponCode}
                        readOnly
                        placeholder="Click generate to create code"
                        className="font-mono"
                        disabled={!isConnected}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateCouponCode}
                        disabled={!isConnected || !formData.organization}
                      >
                        Generate
                      </Button>
                      {couponCode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={copyToClipboard}
                          disabled={!isConnected}
                        >
                          {copied ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/coupons")}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !isConnected || !couponCode || !formData.organization}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Coupon"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card className="hidden md:block">
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Coupon Preview</h3>
              <div className="p-4 border rounded-lg">
                {formData.organization && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {organizations.find(org => org.id === formData.organization)?.name || "Organization"}
                  </p>
                )}
                <div className="text-2xl font-bold mb-2">
                  {formData.discountValue 
                    ? formData.discountType === "percentage" 
                      ? `${formData.discountValue}% OFF` 
                      : formData.discountType === "fixed" 
                        ? `$${formData.discountValue} OFF`
                        : `Free ${formData.discountValue}`
                    : "Discount"}
                </div>
                {formData.expiryDate && (
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(formData.expiryDate).toLocaleDateString()}
                  </p>
                )}
                {couponCode && (
                  <div className="mt-4 p-2 bg-muted font-mono text-center rounded border-dashed border-2 border-muted-foreground">
                    {couponCode}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CouponCreatePage;