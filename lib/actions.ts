'use server';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  conversionRate: number;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  // HADX LABS Production Mock Metrics
  return {
    totalRevenue: 128500,
    totalOrders: 342,
    activeUsers: 1205,
    conversionRate: 3.8,
  };
}
