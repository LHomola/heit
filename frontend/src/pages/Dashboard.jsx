import { useAuth } from "../context/AuthContext";
import ResidentDashboard from "./dashboards/ResidentDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import ContractorDashboard from "./dashboards/ContractorDashboard";

export default function Dashboard() {
  const { currentUser } = useAuth();

  if (currentUser?.role === "resident") return <ResidentDashboard />;
  if (currentUser?.role === "manager") return <ManagerDashboard />;
  if (currentUser?.role === "contractor") return <ContractorDashboard />;
  return null;
}
