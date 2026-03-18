import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import "@/lib/fetch-interceptor"; // Import the interceptor immediately

import { Login } from "@/pages/login";
import { Register } from "@/pages/register";
import { Dashboard } from "@/pages/dashboard";
import { Junior } from "@/pages/junior";
import { Missions } from "@/pages/junior/missions";
import { WorldMap } from "@/pages/junior/world";
import { Student } from "@/pages/student";
import { Family } from "@/pages/family";
import { Psychology } from "@/pages/psychology";
import { ParentDashboard } from "@/pages/parent";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Route guard component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/junior" component={() => <ProtectedRoute component={Junior} />} />
      <Route path="/junior/missions" component={() => <ProtectedRoute component={Missions} />} />
      <Route path="/junior/world" component={() => <ProtectedRoute component={WorldMap} />} />
      <Route path="/student" component={() => <ProtectedRoute component={Student} />} />
      <Route path="/family" component={() => <ProtectedRoute component={Family} />} />
      <Route path="/psychology" component={() => <ProtectedRoute component={Psychology} />} />
      <Route path="/parent" component={() => <ProtectedRoute component={ParentDashboard} />} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
