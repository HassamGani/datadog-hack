import dynamic from "next/dynamic";
import { Suspense } from "react";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

const TradingDashboard = dynamic(
  () => import("@/components/dashboard/TradingDashboard"),
  {
    loading: () => <DashboardSkeleton />,
  }
);

export const revalidate = 0;

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <TradingDashboard />
    </Suspense>
  );
}
