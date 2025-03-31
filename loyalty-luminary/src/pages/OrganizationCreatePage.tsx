import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const OrganizationCreatePage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const navigate = useNavigate();
  const { isConnected, contract, connectWithWallet, connecting } = useWallet();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !contract) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the smart contract to create an organization
      const tx = await contract.createOrganization(
        formData.name,
        formData.description
      );
      
      toast.info("Transaction submitted, waiting for confirmation...");
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast.success("Organization created successfully");
        
        navigate("/organizations");
      } else {
        toast.error("Transaction failed");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error(error.message || "Failed to create organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto animate-fade-in">
      <PageHeader 
        title="Create Organization" 
        description="Set up a new loyalty program organization" 
        action={
          <Button variant="outline" asChild>
            <Link to="/organizations">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Link>
          </Button>
        }
      />

      {!isConnected && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Wallet not connected</AlertTitle>
          <AlertDescription className="flex items-center mt-2">
            <span className="mr-2">Please connect your wallet to create an organization.</span>
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

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-2 items-start">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Coffee Shop, Book Store, etc."
                  required
                />
              </div>

              <div className="flex flex-col gap-2 items-start">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your organization and loyalty program..."
                  className="min-h-[100px]"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate("/organizations")}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !isConnected}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Organization"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationCreatePage;