import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Mail, ArrowRight, User, Lock, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ConnectPage = () => {
  const navigate = useNavigate();
  const { connectWithWallet, connecting, address } = useWallet();

  // Auth states
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    walletAddress: ""
  });

  // Handle wallet connection
  const handleWalletConnect = async () => {
    try {
      // If wallet connects successfully, update the register form with the wallet address
      if (address) {
        setRegisterForm({ ...registerForm, walletAddress: address });
      }
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      // Error will be shown via toast from the context
    }
  };

  // Handle login form changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm({ ...loginForm, [name]: value });
  };

  // Handle register form changes
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm({ ...registerForm, [name]: value });
  };

  // Handle login submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.email || !loginForm.password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store token and user data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Failed to login. Please check your credentials.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (registerForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          firstName: registerForm.firstName || undefined,
          lastName: registerForm.lastName || undefined,
          walletAddress: registerForm.walletAddress || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Store token and user data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success("Registration successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Failed to register. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block rounded-full bg-gradient-to-r from-primary to-secondary p-3 mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Welcome to Loyalty Luminary</h1>
          <p className="text-muted-foreground mt-2">
            Connect your wallet or sign in with email to manage your loyalty programs
          </p>
        </div>

        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          {/* Wallet Connection Tab */}
          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle>Connect Wallet</CardTitle>
                <CardDescription>
                  Connect your wallet to access your loyalty programs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="glass-dark dark:glass p-4 rounded-lg text-center">
                  <p className="text-sm mb-2">Securely connect using blockchain technology</p>
                  <p className="text-xs text-muted-foreground">
                    Your wallet address will be used to identify you and your loyalty rewards
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full relative" 
                  onClick={handleWalletConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Email Authentication Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as "login" | "register")}>
                    <TabsList>
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CardDescription>
                  {authTab === "login" 
                    ? "Sign in with your email and password" 
                    : "Create a new account to get started"
                  }
                </CardDescription>
              </CardHeader>

              {/* Login Form */}
              {authTab === "login" && (
                <>
                  <CardContent className="space-y-4">
                    <form id="login-form" onSubmit={handleLogin}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="name@example.com"
                              value={loginForm.email}
                              onChange={handleLoginChange}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                              Forgot password?
                            </Button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              name="password"
                              type="password"
                              placeholder="••••••••"
                              value={loginForm.password}
                              onChange={handleLoginChange}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      type="submit"
                      form="login-form"
                      disabled={isLoading || !loginForm.email || !loginForm.password}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Signing in...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </CardFooter>
                </>
              )}

              {/* Register Form */}
              {authTab === "register" && (
                <>
                  <CardContent className="space-y-4">
                    <form id="register-form" onSubmit={handleRegister}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="register-email"
                              name="email"
                              type="email"
                              placeholder="name@example.com"
                              value={registerForm.email}
                              onChange={handleRegisterChange}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              name="firstName"
                              type="text"
                              placeholder="John"
                              value={registerForm.firstName}
                              onChange={handleRegisterChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              name="lastName"
                              type="text"
                              placeholder="Doe"
                              value={registerForm.lastName}
                              onChange={handleRegisterChange}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="register-password"
                              name="password"
                              type="password"
                              placeholder="••••••••"
                              value={registerForm.password}
                              onChange={handleRegisterChange}
                              className="pl-10"
                              required
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Password must be at least 8 characters long
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={registerForm.confirmPassword}
                            onChange={handleRegisterChange}
                            required
                          />
                        </div>

                        {registerForm.walletAddress && (
                          <Alert>
                            <div className="flex flex-col space-y-1">
                              <Label className="text-xs">Connected Wallet</Label>
                              <AlertDescription className="text-xs font-mono break-all">
                                {registerForm.walletAddress}
                              </AlertDescription>
                            </div>
                          </Alert>
                        )}
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex-col space-y-2">
                    <Button 
                      className="w-full" 
                      type="submit"
                      form="register-form"
                      disabled={isLoading || !registerForm.email || !registerForm.password || !registerForm.confirmPassword}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Account...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Account
                        </div>
                      )}
                    </Button>
                    
                    {!registerForm.walletAddress && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleWalletConnect}
                        disabled={connecting}
                      >
                        {connecting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                            Connecting...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Wallet className="mr-2 h-4 w-4" />
                            Connect Wallet (Optional)
                          </div>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-8">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default ConnectPage;