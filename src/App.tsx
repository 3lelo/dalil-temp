import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OnboardingGuard } from "@/components/auth/OnboardingGuard";
import { AdminRoute } from "@/components/auth/AdminRoute";

import Docs from "./pages/Docs";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import IQTest from "./pages/IQTest";
import Roadmap from "./pages/Roadmap";
import FlowChart from "./pages/FlowChart";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import AlgorithmPage from "./pages/AlgorithmPage";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Docs />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/roadmap" element={<Roadmap />} />
                  <Route path="/flowchart" element={<FlowChart />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/algorithm/:id" element={<AlgorithmPage />} />
                  <Route path="/u/:username" element={<PublicProfile />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  
                  <Route path="/setup" element={
                    <OnboardingGuard stage="setup"><Setup /></OnboardingGuard>
                  } />
                  <Route path="/iq" element={
                    <OnboardingGuard stage="iq"><IQTest /></OnboardingGuard>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute requireOnboarding><Dashboard /></ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <AdminRoute><Admin /></AdminRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
