     1	import { ComponentType } from "react";
     2	import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
     3	import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
     4	import { Toaster } from "@/components/ui/toaster";
     5	import { TooltipProvider } from "@/components/ui/tooltip";
     6	import { AuthProvider, useAuth } from "@/lib/auth";
     7	import NotFound from "@/pages/not-found";
     8	import LoginPage from "@/pages/login";
     9	import RegisterPage from "@/pages/register";
    10	import DashboardPage from "@/pages/dashboard";
    11	import MapPage from "@/pages/map";
    12	import AlertsPage from "@/pages/alerts";
    13	import AlertDetailPage from "@/pages/alert-detail";
    14	import IncidentsPage from "@/pages/incidents";
    15	import BroadcastsPage from "@/pages/broadcasts";
    16	import UsersPage from "@/pages/users";
    17	import ShiftsPage from "@/pages/shifts";
    18	import ActivityPage from "@/pages/activity";
    19	import SettingsPage from "@/pages/settings";
    20	
    21	const queryClient = new QueryClient({
    22	  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
    23	});
    24	
    25	function ProtectedRoute({ component: Component }: { component: ComponentType }) {
    26	  const { user, isHydrated } = useAuth();
    27	  if (!isHydrated) return (
    28	    <div className="min-h-screen bg-background flex items-center justify-center">
    29	      <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
    30	    </div>
    31	  );
    32	  if (!user) return <Redirect to="/" />;
    33	  return <Component />;
    34	}
    35	
    36	function PublicRoute({ component: Component }: { component: ComponentType }) {
    37	  const { user, isHydrated } = useAuth();
    38	  if (!isHydrated) return null;
    39	  if (user) return <Redirect to="/dashboard" />;
    40	  return <Component />;
    41	}
    42	
    43	function AppRouter() {
    44	  return (
    45	    <Switch>
    46	      <Route path="/" component={() => <PublicRoute component={LoginPage} />} />
    47	      <Route path="/register" component={() => <PublicRoute component={RegisterPage} />} />
    48	      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
    49	      <Route path="/map" component={() => <ProtectedRoute component={MapPage} />} />
    50	      <Route path="/alerts" component={() => <ProtectedRoute component={AlertsPage} />} />
    51	      <Route path="/alerts/:id" component={() => <ProtectedRoute component={AlertDetailPage} />} />
    52	      <Route path="/incidents" component={() => <ProtectedRoute component={IncidentsPage} />} />
    53	      <Route path="/broadcasts" component={() => <ProtectedRoute component={BroadcastsPage} />} />
     54	      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} />} />
    55	      <Route path="/shifts" component={() => <ProtectedRoute component={ShiftsPage} />} />
    56	      <Route path="/activity" component={() => <ProtectedRoute component={ActivityPage} />} />
    57	      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
    58	      <Route component={NotFound} />
    59	    </Switch>
    60	  );
    61	}
    62	
    63	function App() {
    64	  return (
    65	    <QueryClientProvider client={queryClient}>
    66	      <TooltipProvider>
    67	        <AuthProvider>
    68	          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
    69	            <AppRouter />
    70	          </WouterRouter>
    71	          <Toaster />
    72	        </AuthProvider>
    73	      </TooltipProvider>
    74	    </QueryClientProvider>
    75	  );
    76	}
    77	
    78	export default App;
