import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Team from "./pages/Team";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import Donate from "./pages/Donate";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPrograms from "./pages/AdminPrograms";
import AdminApprovals from "./pages/AdminApprovals";
import AdminUsers from "./pages/AdminUsers";
import TeamLeaderDashboard from "./pages/TeamLeaderDashboard";
import ProgramSelection from "./pages/ProgramSelection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/programs/:programName" element={<ProgramDetail />} />
            <Route path="/team" element={<Team />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/programs" element={<AdminPrograms />} />
        <Route path="/admin/approvals" element={<AdminApprovals />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/team-leader" element={<TeamLeaderDashboard />} />
        <Route path="/select-programs" element={<ProgramSelection />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
