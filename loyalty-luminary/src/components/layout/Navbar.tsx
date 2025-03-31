import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  LayoutDashboard,
  Building2,
  Ticket,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWallet } from "@/contexts/WalletContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isConnected, address, disconnectWallet, connecting } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
    { name: "Organizations", path: "/organizations", icon: <Building2 className="w-4 h-4 mr-2" /> },
    { name: "My Coupons", path: "/coupons", icon: <Ticket className="w-4 h-4 mr-2" /> },
  ];

  // Truncate wallet address for display
  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md border-b" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-2">
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl font-bold"
          >
            <div className="rounded-full bg-gradient-to-r from-primary to-secondary p-1.5">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <span className="hidden md:inline-block">Loyalty Luminary</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === item.path ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeSwitcher />
          
          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="hidden md:flex">
                  <Wallet className="mr-2 h-4 w-4" />
                  {truncateAddress(address)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={disconnectWallet}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="hidden md:flex" disabled={connecting}>
              <Link to="/connect">
                <Wallet className="mr-2 h-4 w-4" />
                {connecting ? "Connecting..." : "Connect"}
              </Link>
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && isOpen && (
        <div className="fixed inset-0 top-16 bg-background/95 backdrop-blur-sm z-50 p-6 space-y-6 animate-fade-in md:hidden">
          <nav className="flex flex-col space-y-6">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center text-lg font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
          
          {isConnected ? (
            <div className="space-y-2">
              <div className="flex items-center p-2 rounded-md bg-muted">
                <Wallet className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">{truncateAddress(address)}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={disconnectWallet}>
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <Button asChild className="w-full">
              <Link to="/connect">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Link>
            </Button>
          )}
        </div>
      )}
    </header>
  );
}