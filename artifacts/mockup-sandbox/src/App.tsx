import { ComponentType } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import MapPage from "@/pages/map";
import AlertsPage from "@/pages/alerts";
import AlertDetailPage from "@/pages/alert-detail";
import IncidentsPage from "@/pages/incidents";
import BroadcastsPage from "@/pages/broadcasts";
import UsersPage from "@/pages/users";
import ShiftsPage from "@/pages/shifts";
import ActivityPage from "@/pages/activity";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function ProtectedRoute({ component: Component }: { component: ComponentType }) {
  const { user, isHydrated } = useAuth();
  if (!isHydrated) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
    </div>
  );
  if (!user) return <Redirect to="/" />;
  return <Component />;
}

function PublicRoute({ component: Component }: { component: ComponentType }) {
  const { user, isHydrated } = useAuth();
  if (!isHydrated) return null;
  if (user) return <Redirect to="/dashboard" />;
  return <Component />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={() => <PublicRoute component={LoginPage} />} />
      <Route path="/register" component={() => <PublicRoute component={RegisterPage} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/map" component={() => <ProtectedRoute component={MapPage} />} />
      <Route path="/alerts" component={() => <ProtectedRoute component={AlertsPage} />} />
      <Route path="/alerts/:id" component={() => <ProtectedRoute component={AlertDetailPage} />} />
      <Route path="/incidents" component={() => <ProtectedRoute component={IncidentsPage} />} />
      <Route path="/broadcasts" component={() => <ProtectedRoute component={BroadcastsPage} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/shifts" component={() => <ProtectedRoute component={ShiftsPage} />} />
      <Route path="/activity" component={() => <ProtectedRoute component={ActivityPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
