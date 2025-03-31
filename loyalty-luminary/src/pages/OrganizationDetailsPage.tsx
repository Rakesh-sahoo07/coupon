import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CouponCard } from "@/components/coupons/CouponCard";
import { ChevronLeft, Plus, Users, Settings, Ticket, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const OrganizationDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactEmail: "",
    website: ""
  });
  
  const { isConnected, contract, address, connectWithWallet, connecting } = useWallet();

  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!isConnected || !contract || !id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch organization details
        const orgData = await contract.getOrganization(id);
        
        // Based on the contract, organization structure is:
        // [id, name, description, admin, isActive, timestamp]
        const timestamp = Number(orgData[5].toString());
        const createdDate = new Date(timestamp * 1000);
        
        const adminAddress = orgData[3];
        const isUserAdmin = adminAddress.toLowerCase() === address?.toLowerCase();
        setIsAdmin(isUserAdmin);
        
        const orgInfo = {
          id: id,
          name: orgData[1], // Name is at index 1
          description: orgData[2], // Description is at index 2
          admin: adminAddress, // Admin address is at index 3
          isActive: orgData[4], // isActive is at index 4
          timestamp: timestamp,
          createdAt: createdDate.toLocaleDateString(),
          createdAgo: formatDistanceToNow(createdDate, { addSuffix: true }),
          // These fields are not in the blockchain and would need to be stored elsewhere
          contactEmail: '',
          website: ''
        };
        
        setOrganization(orgInfo);
        setFormData({
          name: orgInfo.name,
          description: orgInfo.description,
          contactEmail: orgInfo.contactEmail || '',
          website: orgInfo.website || ''
        });
        
        // Fetch coupons for this organization
        const couponIdsResponse = await contract.getOrganizationCoupons(id);
        const couponIds = Array.isArray(couponIdsResponse) 
          ? couponIdsResponse.map(id => id.toString()) 
          : Object.values(couponIdsResponse).map(id => id.toString());
        
        // Fetch details for each coupon
        const couponPromises = couponIds.map(async (couponId) => {
          try {
            const coupon = await contract.getCoupon(couponId);
            
            // Based on the contract, coupon structure is:
            // [id, code, organizationId, discountAmount, isUsed, isActive, userWallet, userEmail, timestamp]
            
            // Format the discount amount based on the value
            const discountAmount = coupon[3].toString();
            let discount;
            if (parseInt(discountAmount) > 10000) {
              // Fixed amount (assumed in cents)
              discount = `$${(parseInt(discountAmount) / 100).toFixed(2)} OFF`;
            } else {
              // Percentage (assumed in basis points)
              discount = `${(parseInt(discountAmount) / 100).toFixed(0)}% OFF`;
            }
            
            // Determine status based on isActive and isUsed flags
            let status;
            if (!coupon[5]) { // isActive is at index 5
              status = "expired";
            } else if (coupon[4]) { // isUsed is at index 4
              status = "used";
            } else {
              status = "active";
            }
            
            // Calculate expiry date (30 days from creation)
            const timestamp = Number(coupon[8].toString());
            const expiryDate = new Date(timestamp * 1000 + 30 * 24 * 60 * 60 * 1000);
            
            return {
              id: coupon[0].toString(),
              code: coupon[2],
              organizationId: coupon[1].toString(),
              organization: orgInfo.name,
              discount,
              expiresAt: expiryDate.toLocaleDateString(),
              status,
              userWallet: coupon[6],
              userEmail: coupon[7],
              timestamp
            };
          } catch (error) {
            console.error(`Error fetching coupon ${couponId}:`, error);
            return null;
          }
        });
        
        const couponData = (await Promise.all(couponPromises)).filter(Boolean);
        // Sort coupons by creation time (newest first)
        const sortedCoupons = couponData.sort((a, b) => b.timestamp - a.timestamp);
        
        setCoupons(sortedCoupons);
      } catch (error) {
        console.error("Error fetching organization data:", error);
        toast.error("Failed to load organization details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, [isConnected, contract, id, address]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Since name and description are stored on blockchain, we would need a transaction to update
    // But this functionality is not available in the current contract
    // For now we'll just show a toast message
    toast.success("Settings saved");
    // In a real app, you would store contactEmail and website elsewhere
  };

  const handleUseCoupon = async (couponId) => {
    if (!isConnected || !contract) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      const tx = await contract.useCoupon(couponId);
      toast.info("Transaction submitted, waiting for confirmation...");
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success("Coupon used successfully");
        
        // Update the coupon in the local state
        setCoupons(coupons.map(c => {
          if (c.id === couponId) {
            return { ...c, status: "used" };
          }
          return c;
        }));
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error using coupon:", error);
      toast.error(error.message || "Failed to use coupon");
    }
  };

  const handleShareCoupon = async (couponId, toEmail) => {
    if (!isConnected || !contract) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      const tx = await contract.shareCoupon(couponId, toEmail);
      toast.info("Transaction submitted, waiting for confirmation...");
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success("Coupon shared successfully");
        
        // Remove the shared coupon from the local state
        setCoupons(coupons.filter(c => c.id !== couponId));
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error sharing coupon:", error);
      toast.error(error.message || "Failed to share coupon");
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto animate-fade-in">
      {!isConnected && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Wallet not connected</AlertTitle>
          <AlertDescription className="flex items-center mt-2">
            <span className="mr-2">Please connect your wallet to view organization details.</span>
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
          <p>Loading organization data...</p>
        </div>
      ) : !organization ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">Organization Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The organization you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link to="/organizations">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <PageHeader 
            title={organization.name} 
            description={organization.description} 
            action={
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/organizations">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Organizations
                  </Link>
                </Button>
                {isAdmin && (
                  <Button asChild>
                    <Link to={`/coupons/create?organization=${id}`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Coupon
                    </Link>
                  </Button>
                )}
              </div>
            }
          />

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="coupons">
                Coupons ({coupons.length})
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="settings">Settings</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Created On</CardTitle>
                    <CardDescription>{organization.createdAgo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {organization.createdAt}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
                    <CardDescription>For this organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{coupons.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
                    <CardDescription>Ready to be used</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {coupons.filter(c => c.status === "active").length}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Coupons</CardTitle>
                    <CardDescription>Latest coupons for this organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {coupons.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No coupons yet</p>
                    ) : (
                      <>
                        {coupons.slice(0, 3).map((coupon) => (
                          <div 
                            key={coupon.id} 
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <div>
                              <p className="font-medium">{coupon.discount}</p>
                              <p className="text-sm text-muted-foreground">Code: {coupon.code}</p>
                            </div>
                            <Badge 
                              className={
                                coupon.status === "active" ? "bg-green-500" : 
                                coupon.status === "used" ? "bg-gray-500" : "bg-red-500"
                              }
                            >
                              {coupon.status}
                            </Badge>
                          </div>
                        ))}
                        {coupons.length > 3 && (
                          <div className="mt-4 text-center">
                            <Button asChild variant="outline" size="sm">
                              <Link to="#coupons" onClick={() => {
                                const element = document.querySelector('[data-state="active"][value="coupons"]');
                                if (element instanceof HTMLElement) {
                                  element.click();
                                }
                              }}>
                                View All Coupons
                              </Link>
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Blockchain information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Admin Address</p>
                      <p className="font-mono text-sm break-all">{organization.admin}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Organization ID</p>
                      <p className="font-mono">{organization.id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={organization.isActive ? "bg-green-500" : "bg-red-500"}>
                        {organization.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {isAdmin && (
                      <div className="mt-6 pt-4 border-t">
                        <p className="text-sm text-primary">You are the admin of this organization</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="coupons">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">All Coupons</h3>
                {isAdmin && (
                  <Button asChild>
                    <Link to={`/coupons/create?organization=${id}`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Coupon
                    </Link>
                  </Button>
                )}
              </div>
              
              {coupons.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Coupons Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    This organization doesn't have any coupons yet.
                  </p>
                  {isAdmin && (
                    <Button asChild>
                      <Link to={`/coupons/create?organization=${id}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Coupon
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coupons.map((coupon, index) => (
                    <CouponCard
                      key={coupon.id}
                      id={coupon.id}
                      code={coupon.code}
                      discount={coupon.discount}
                      organization={coupon.organization}
                      expiresAt={coupon.expiresAt}
                      status={coupon.status}
                      className="animate-scale-in h-[200px]"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onUse={() => handleUseCoupon(coupon.id)}
                      onShare={(email) => handleShareCoupon(coupon.id, email)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            {isAdmin && (
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Settings</CardTitle>
                    <CardDescription>Manage your organization settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className= 'text-left' htmlFor="name">Organization Name</Label>
                          <Input 
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled
                          />
                          <p className="text-xs text-muted-foreground">
                            Organization name cannot be changed after creation (blockchain limitation)
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label  className= 'text-left' htmlFor="description">Description</Label>
                          <Textarea 
                            id="description"
                            name="description" 
                            value={formData.description}
                            onChange={handleChange}
                            className="min-h-[100px]"
                            disabled
                          />
                          <p className="text-xs text-muted-foreground">
                            Description cannot be changed after creation (blockchain limitation)
                          </p>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default OrganizationDetailsPage;