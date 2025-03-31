import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { useState } from "react";
import { WalletProvider } from "@/contexts/WalletContext";

// Pages
import DashboardPage from "./pages/DashboardPage";
import ConnectPage from "./pages/ConnectPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import OrganizationDetailsPage from "./pages/OrganizationDetailsPage";
import OrganizationCreatePage from "./pages/OrganizationCreatePage";
import CouponsPage from "./pages/CouponsPage";
import CouponCreatePage from "./pages/CouponCreatePage";
import RedeemCouponPage from "./pages/RedeemCouponPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const App = () => {
  // Create a client inside the component to ensure React context is properly initialized
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  <MainLayout>
                    <Index />
                  </MainLayout>
                }
              />
              <Route path="/connect" element={<ConnectPage />} />
              <Route
                path="/dashboard"
                element={
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                }
              />
              <Route
                path="/organizations"
                element={
                  <MainLayout>
                    <OrganizationsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/organizations/:id"
                element={
                  <MainLayout>
                    <OrganizationDetailsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/organizations/create"
                element={
                  <MainLayout>
                    <OrganizationCreatePage />
                  </MainLayout>
                }
              />
              <Route
                path="/coupons"
                element={
                  <MainLayout>
                    <CouponsPage />
                  </MainLayout>
                }
              />
              <Route
                path="/coupons/create"
                element={
                  <MainLayout>
                    <CouponCreatePage />
                  </MainLayout>
                }
              />
              <Route path="/redeem/:code" element={<RedeemCouponPage />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
};

export default App;