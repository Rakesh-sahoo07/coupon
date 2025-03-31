import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Ticket, Building2, Users, ArrowRight, Clock, Bell, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, formatDistanceToNow } from "date-fns";

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCoupons: 0,
    organizations: 0,
    totalMembers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingExpiry, setUpcomingExpiry] = useState([]);
  
  const { isConnected, contract, connectWithWallet, connecting } = useWallet();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch organizations
        const orgIdsResponse = await contract.getMyOrganizations();
        const orgIds = Array.isArray(orgIdsResponse) 
          ? orgIdsResponse.map(id => id.toString()) 
          : Object.values(orgIdsResponse).map(id => id.toString());
        
        const orgsMap = {};
        const orgPromises = orgIds.map(async (id) => {
          try {
            const org = await contract.getOrganization(id);
            // Based on the contract, organization structure is:
            // [id, name, description, admin, isActive, timestamp]
            const timestamp = Number(org[5].toString());
            
            orgsMap[id] = {
              id: id,
              name: org[1], // Name is at index 1
              description: org[2], // Description is at index 2
              admin: org[3], // Admin is at index 3
              timestamp: timestamp
            };
            
            return {
              id: id,
              name: org[1],
              timestamp
            };
          } catch (error) {
            console.error(`Error fetching organization ${id}:`, error);
            return null;
          }
        });
        
        const orgs = (await Promise.all(orgPromises)).filter(Boolean);
        
        // Fetch all coupons from user's organizations
        const allCouponIds = [];
        const couponsByOrg = {};
        
        for (const orgId in orgsMap) {
          try {
            const orgCouponsResponse = await contract.getOrganizationCoupons(orgId);
            const orgCouponIds = Array.isArray(orgCouponsResponse) 
              ? orgCouponsResponse.map(id => id.toString()) 
              : Object.values(orgCouponsResponse).map(id => id.toString());
            
            couponsByOrg[orgId] = [];
            
            for (const couponId of orgCouponIds) {
              if (!allCouponIds.includes(couponId)) {
                allCouponIds.push(couponId);
              }
            }
          } catch (error) {
            console.error(`Error fetching organization coupons for ${orgId}:`, error);
          }
        }
        
        // Get user coupons as well
        const userCouponsResponse = await contract.getMyCoupons();
        const userCouponIds = Array.isArray(userCouponsResponse) 
          ? userCouponsResponse.map(id => id.toString()) 
          : Object.values(userCouponsResponse).map(id => id.toString());
        
        // Add unique user coupons to allCouponIds
        for (const couponId of userCouponIds) {
          if (!allCouponIds.includes(couponId)) {
            allCouponIds.push(couponId);
          }
        }
        
        // Fetch details for all coupons
        const couponPromises = allCouponIds.map(async (id) => {
          try {
            const coupon = await contract.getCoupon(id);
            
            // Based on the contract, coupon structure is:
            // [id, code, organizationId, discountAmount, isUsed, isActive, userWallet, userEmail, timestamp]
            
            const orgId = coupon[1].toString();
            const timestamp = Number(coupon[8].toString());
            const isUsed = coupon[4];
            const isActive = coupon[5];
            
            // Calculate expiry date (30 days from creation)
            const expiryTimestamp = timestamp + (30 * 24 * 60 * 60);
            const now = Math.floor(Date.now() / 1000);
            const secondsUntilExpiry = expiryTimestamp - now;
            const daysUntilExpiry = Math.ceil(secondsUntilExpiry / (24 * 60 * 60));
            
            // Format discount amount
            const discountAmount = coupon[3].toString();
            let discountDisplay;
            if (parseInt(discountAmount) > 10000) {
              discountDisplay = `$${(parseInt(discountAmount) / 100).toFixed(2)} OFF`;
            } else {
              discountDisplay = `${(parseInt(discountAmount) / 100).toFixed(0)}% OFF`;
            }
            
            // Add to couponsByOrg
            if (couponsByOrg[orgId]) {
              couponsByOrg[orgId].push({
                id: coupon[0].toString(),
                code: coupon[2],
                discountAmount: discountDisplay,
                isUsed,
                isActive,
                timestamp
              });
            }
            
            return {
              id: coupon[0].toString(),
              code: coupon[2],
              organizationId: orgId,
              organization: orgsMap[orgId]?.name || "Unknown Organization",
              discountAmount: discountDisplay,
              isUsed,
              isActive,
              expiryTimestamp,
              daysUntilExpiry,
              timestamp
            };
          } catch (error) {
            console.error(`Error fetching coupon ${id}:`, error);
            return null;
          }
        });
        
        const coupons = (await Promise.all(couponPromises)).filter(Boolean);
        
        // Set statistics
        setStats({
          totalCoupons: coupons.length,
          organizations: orgs.length,
          totalMembers: 0, // Not tracked in current contract
        });
        
        // Set recent activity (combined and sorted by timestamp)
        const activities = [
          // Organization creation events
          ...orgs.map(org => ({
            id: `org-${org.id}`,
            title: "Organization created",
            description: `${org.name} was created`,
            timestamp: org.timestamp,
            icon: <Building2 className="h-4 w-4" />
          })),
          
          // Coupon creation and usage events
          ...coupons.map(coupon => {
            if (coupon.isUsed) {
              return {
                id: `coupon-used-${coupon.id}`,
                title: "Coupon redeemed",
                description: `${coupon.discountAmount} at ${coupon.organization}`,
                timestamp: coupon.timestamp + 1000, // Add a small offset to ensure correct ordering
                icon: <Ticket className="h-4 w-4" />
              };
            } else {
              return {
                id: `coupon-created-${coupon.id}`,
                title: "New coupon created",
                description: `${coupon.discountAmount} at ${coupon.organization}`,
                timestamp: coupon.timestamp,
                icon: <Ticket className="h-4 w-4" />
              };
            }
          })
        ];
        
        // Sort by timestamp (newest first) and take top 5
        const sortedActivities = activities
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5)
          .map(activity => ({
            ...activity,
            formattedTime: formatDistanceToNow(new Date(activity.timestamp * 1000), { addSuffix: true })
          }));
        
        setRecentActivity(sortedActivities);
        
        // Set upcoming expiry coupons
        const activeCoupons = coupons.filter(coupon => coupon.isActive && !coupon.isUsed);
        const sortedBySoonestExpiry = activeCoupons
          .sort((a, b) => a.expiryTimestamp - b.expiryTimestamp)
          .slice(0, 3)
          .map(coupon => ({
            id: coupon.id,
            code: coupon.code,
            description: `${coupon.discountAmount} at ${coupon.organization}`,
            expiresIn: `${coupon.daysUntilExpiry} days`
          }));
        console.log("Upcoming Expiry Coupons:", sortedBySoonestExpiry);
        setUpcomingExpiry(sortedBySoonestExpiry);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isConnected, contract]);

  return (
    <div className="container px-4 py-8 mx-auto animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        description="Overview of your loyalty program" 
        action={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild disabled={!isConnected}>
              <Link to="/coupons/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Coupon
              </Link>
            </Button>
            <Button variant="outline" asChild disabled={!isConnected}>
              <Link to="/organizations/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Link>
            </Button>
          </div>
        }
      />

      {!isConnected && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Wallet not connected</AlertTitle>
          <AlertDescription className="flex items-center mt-2">
            <span className="mr-2">Please connect your wallet to view your dashboard.</span>
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
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <StatCard 
              title="Total Coupons" 
              value={stats.totalCoupons.toString()} 
              icon={<Ticket className="h-4 w-4 text-primary" />}
              className="animate-scale-in" 
              style={{ animationDelay: "0ms" }}
            />
            <StatCard 
              title="Organizations" 
              value={stats.organizations.toString()} 
              icon={<Building2 className="h-4 w-4 text-secondary" />}
              className="animate-scale-in" 
              style={{ animationDelay: "100ms" }}
            />
            <StatCard 
              title="Active Coupons" 
              value={(upcomingExpiry.length).toString()} 
              icon={<Users className="h-4 w-4 text-accent" />}
              className="animate-scale-in" 
              style={{ animationDelay: "200ms" }}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-left">Recent Activity</CardTitle>
                  <CardDescription>Latest actions across your organizations</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-2">
                  {recentActivity?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No recent activity</p>
                  ) : (
                    recentActivity?.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="flex items-start pb-4 last:pb-0 last:border-0 border-b"
                      >
                        <div className="mr-4 mt-0.5 rounded-full p-2 bg-muted">
                          {activity.icon}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">{activity.title}</p>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground ">{activity.formattedTime}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground text-left">{activity.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Expiring Soon</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription className="text-left">
                  Coupons that will expire soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingExpiry.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No upcoming expirations</p>
                  ) : (
                    upcomingExpiry.map((coupon) => (
                      <div 
                        key={coupon.id}
                        className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition space-y-1"
                      >
                        <div className="flex justify-between">
                          <p className="font-medium">{coupon.code}</p>
                          <p className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                            {coupon.expiresIn}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground text-left">{coupon.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;