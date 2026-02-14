import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Sources from "@/pages/Sources";
import Pipeline from "@/pages/Pipeline";
import SettingsPage from "@/pages/Settings";
import ScraperLogs from "@/pages/ScraperLogs";
import Redirect from "@/pages/Redirect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sources" element={<Sources />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/scraper-logs" element={<ScraperLogs />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="/r/:shortCode" element={<Redirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
