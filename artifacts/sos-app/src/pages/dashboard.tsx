import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";
import ResidentDashboard from "@/components/dashboards/resident-dashboard";
import TanodDashboard from "@/components/dashboards/tanod-dashboard";
import AdminDashboard from "@/components/dashboards/admin-dashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Layout>
      {user?.role === "resident" && <ResidentDashboard />}
      {(user?.role === "tanod") && <TanodDashboard />}
      {(user?.role === "admin" || user?.role === "superadmin") && <AdminDashboard />}
    </Layout>
  );
}
