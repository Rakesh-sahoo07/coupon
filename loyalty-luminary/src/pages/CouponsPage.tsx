import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CouponCard } from "@/components/coupons/CouponCard";
import { Plus, Search, Ticket, Filter, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { ethers } from "ethers";

const CouponsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [organizations, setOrganizations] = useState({});

  const { isConnected, contract, connectWithWallet, connecting, address } = useWallet();

  useEffect(() => {
    const fetchCouponsAndOrgs = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }
  
      try {
        setLoading(true);
        
        // Fetch all organizations first
        const orgIdsResponse = await contract.getMyOrganizations();
        // Handle the response which could be an array or an object with numeric keys
        const orgIds = Array.isArray(orgIdsResponse) 
          ? orgIdsResponse.map(id => id.toString()) 
          : Object.values(orgIdsResponse).map(id => id.toString());
        
        const orgsMap = {};
        for (const id of orgIds) {
          try {
            const org = await contract.getOrganization(id);
            // Based on the contract, organization structure is:
            // [id, name, description, admin, isActive, timestamp]
            orgsMap[id] = {
              id: id,
              name: org[1], // Name is at index 1
              description: org[2], // Description is at index 2
              admin: org[3] // Admin address is at index 3
            };
          } catch (error) {
            console.error(`Error fetching organization ${id}:`, error);
          }
        }
        
        setOrganizations(orgsMap);
        
        // Fetch the user's coupons
        const myCouponsResponse = await contract.getMyCoupons();
        const myCouponIds = Array.isArray(myCouponsResponse) 
          ? myCouponsResponse.map(id => id.toString()) 
          : Object.values(myCouponsResponse).map(id => id.toString());
        
        // For each organization admin, also get the coupons they created
        const allCouponIds = [...myCouponIds];
        for (const orgId in orgsMap) {
          if (orgsMap[orgId].admin.toLowerCase() === address?.toLowerCase()) {
            try {
              const orgCouponsResponse = await contract.getOrganizationCoupons(orgId);
              const orgCouponIds = Array.isArray(orgCouponsResponse) 
                ? orgCouponsResponse.map(id => id.toString()) 
                : Object.values(orgCouponsResponse).map(id => id.toString());
              
              // Add only unique IDs
              for (const couponId of orgCouponIds) {
                if (!allCouponIds.includes(couponId)) {
                  allCouponIds.push(couponId);
                }
              }
            } catch (error) {
              console.error(`Error fetching organization coupons for ${orgId}:`, error);
            }
          }
        }
        
        // Fetch details for each coupon
        const couponPromises = allCouponIds.map(async (id) => {
          try {
            const coupon = await contract.getCoupon(id);
            
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
            
            // Timestamp is at index 8
            // Convert from seconds to milliseconds for JavaScript Date
            const timestamp = Number(coupon[8].toString());
            const expiresAt = new Date(timestamp * 1000 + 30 * 24 * 60 * 60 * 1000); // Add 30 days from timestamp
            
            // Get the organization name
            const orgId = coupon[1].toString(); // organizationId is at index 2
            const orgName = orgsMap[orgId]?.name || "Unknown Organization";
            
            return {
              id: coupon[0].toString(), // ID is at index 0
              code: coupon[2], // Code is at index 1
              discount,
              organization: orgName,
              organizationId: orgId,
              expiresAt: expiresAt.toLocaleDateString(),
              status,
              timestamp: timestamp.toString(),
              userWallet: coupon[6], // userWallet is at index 6
              userEmail: coupon[7] // userEmail is at index 7
            };
          } catch (error) {
            console.error(`Error fetching coupon ${id}:`, error);
            return null;
          }
        });
        
        const couponData = (await Promise.all(couponPromises)).filter(Boolean);
        console.log("Fetched coupons:", couponData);
        setCoupons(couponData);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        toast.error("Failed to fetch coupons");
      } finally {
        setLoading(false);
      }
    };
  
    fetchCouponsAndOrgs();
  }, [isConnected, contract, address]);

  const getFilteredCoupons = () => {
    let filtered = [...coupons];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(coupon => 
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.discount.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by tab
    if (currentTab !== "all") {
      filtered = filtered.filter(coupon => coupon.status === currentTab);
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortOrder === "newest") {
        return parseInt(b.timestamp) - parseInt(a.timestamp);
      } else if (sortOrder === "expiring") {
        return new Date(a.expiresAt) < new Date(b.expiresAt) ? -1 : 1;
      } else {
        return a.organization.localeCompare(b.organization);
      }
    });
    
    return filtered;
  };

  const filteredCoupons = getFilteredCoupons();

  const getCountByStatus = (status: string) => {
    if (status === "all") return coupons.length;
    return coupons.filter(coupon => coupon.status === status).length;
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
      <PageHeader 
        title="My Coupons" 
        description="Manage and use your loyalty coupons" 
        action={
          <Button asChild disabled={!isConnected}>
            <Link to="/coupons/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Coupon
            </Link>
          </Button>
        }
      />
      
      {!isConnected && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Wallet not connected</AlertTitle>
          <AlertDescription className="flex items-center mt-2">
            <span className="mr-2">Please connect your wallet to view your coupons.</span>
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
      
      <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">
              All ({getCountByStatus("all")})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({getCountByStatus("active")})
            </TabsTrigger>
            <TabsTrigger value="used">
              Used ({getCountByStatus("used")})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired ({getCountByStatus("expired")})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search coupons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={loading}>
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("expiring")}>
                  Expiring Soon
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("organization")}>
                  By Organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p>Loading coupons...</p>
          </div>
        ) : (
          <>
            <TabsContent value="all" className="m-0">
              {renderCouponsList(filteredCoupons)}
            </TabsContent>
            <TabsContent value="active" className="m-0">
              {renderCouponsList(filteredCoupons)}
            </TabsContent>
            <TabsContent value="used" className="m-0">
              {renderCouponsList(filteredCoupons)}
            </TabsContent>
            <TabsContent value="expired" className="m-0">
              {renderCouponsList(filteredCoupons)}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
  
  function renderCouponsList(coupons: typeof filteredCoupons) {
    if (coupons.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <Ticket className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No coupons found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "No coupons match your search. Try a different query."
              : isConnected 
                ? "Create your first coupon to get started."
                : "Connect your wallet to view your coupons."}
          </p>
          {isConnected ? (
            <Button asChild>
              <Link to="/coupons/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Link>
            </Button>
          ) : (
            <Button onClick={connectWithWallet} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons?.map((coupon, index) => (
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
    );
  }
};

export default CouponsPage;