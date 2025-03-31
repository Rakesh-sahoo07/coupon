import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrganizationCard } from "@/components/organizations/OrganizationCard";
import { Plus, Search, Building2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const OrganizationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected, contract, connectWithWallet, connecting } = useWallet();
  
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }
  
      try {
        setLoading(true);
  
        // Get organization IDs
        const orgIdsResponse = await contract.getMyOrganizations();
        const orgIds = Array.isArray(orgIdsResponse) 
          ? orgIdsResponse.map((id) => id.toString()) // If it's already an array
          : Object.values(orgIdsResponse).map((id) => id.toString()); // Extract values if it's an object

  
        // Fetch details for each organization
        const orgPromises = orgIds.map(async (id) => {
          const org = await contract.getOrganization(id);
          const couponsCount = await contract.getCouponCount();
          console.log("Coupons Count:", couponsCount);

          return {
            id: org[0].toString(), // Organization ID
            name: org[1], // Organization name
            description: org[2], // Organization description
            admin: org[3], // Admin address
            isActive: org[4], // Active status
            createdAt: new Date(Number(org[5]) * 1000).toLocaleDateString(), // Convert bigint to number and then to date
            couponsCount: couponsCount.toString(), // Placeholder for coupons count
            membersCount: 0, // Placeholder for members count
          };
        });
        const orgData = await Promise.all(orgPromises);
        setOrganizations(orgData);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchOrganizations();
  }, [isConnected, contract]);

  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container px-4 py-8 mx-auto animate-fade-in">
      <PageHeader 
        title="Organizations" 
        description="Manage your loyalty program organizations" 
        action={
          <Button asChild disabled={!isConnected}>
            <Link to="/organizations/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Link>
          </Button>
        }
      />
      
      {!isConnected && (
        <Alert className="mb-6">
          <AlertTitle>Wallet not connected</AlertTitle>
          <AlertDescription className="flex items-center mt-2">
            <span className="mr-2">Please connect your wallet to view your organizations.</span>
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
      
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search organizations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loading}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p>Loading organizations...</p>
        </div>
      ) : organizations.length > 0 && filteredOrganizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org, index) => (
            <OrganizationCard
              key={org.id}
              id={org.id}
              name={org.name}
              description={org.description}
              couponsCount={org.couponsCount}
              membersCount={org.membersCount}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No organizations found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "No organizations match your search. Try a different query."
              : isConnected 
                ? "Create your first organization to get started."
                : "Connect your wallet to view your organizations."}
          </p>
          {isConnected ? (
            <Button asChild>
              <Link to="/organizations/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Link>
            </Button>
          ) : (
            <Button onClick={connectWithWallet} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationsPage;