import { queryOptions, useQuery } from '@tanstack/react-query';
import { QueryConfig } from '@/lib/react-query';

export type DashboardMetric = {
  label: string;
  value: number | string;
  trend: string;
  isPositive: boolean;
  color: string;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type RecentTask = {
  id: string;
  title: string;
  assignee: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
};

export type DashboardStats = {
  metrics: DashboardMetric[];
  chartData: ChartPoint[];
  recentTasks: RecentTask[];
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        metrics: [
          {
            label: 'Total Tasks',
            value: 84,
            trend: '+18% this week',
            isPositive: true,
            color: 'from-blue-500 to-indigo-600',
          },
          {
            label: 'Pending Tasks',
            value: 23,
            trend: 'Needs attention',
            isPositive: false,
            color: 'from-amber-500 to-orange-600',
          },
          {
            label: 'Completed Tasks',
            value: 58,
            trend: '82% completion rate',
            isPositive: true,
            color: 'from-emerald-500 to-teal-600',
          },
          {
            label: 'Total Users',
            value: 12,
            trend: 'Fully active team',
            isPositive: true,
            color: 'from-purple-500 to-pink-600',
          },
        ],
        chartData: [
          { label: 'Jan', value: 12 },
          { label: 'Feb', value: 24 },
          { label: 'Mar', value: 45 },
          { label: 'Apr', value: 38 },
          { label: 'May', value: 64 },
          { label: 'Jun', value: 84 },
        ],
        recentTasks: [
          {
            id: 'task-1',
            title: 'Design Dashboard UI Mockups',
            assignee: 'Rahul Sharma',
            status: 'In Progress',
            priority: 'High',
            dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
          },
          {
            id: 'task-2',
            title: 'Integrate NestJS API Endpoints',
            assignee: 'Priya Patel',
            status: 'Pending',
            priority: 'High',
            dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
          },
          {
            id: 'task-3',
            title: 'Write Comprehensive Unit Tests',
            assignee: 'Amit Verma',
            status: 'Completed',
            priority: 'Medium',
            dueDate: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'task-4',
            title: 'Draft Project Documentation',
            assignee: 'Unassigned',
            status: 'Pending',
            priority: 'Low',
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
          },
        ],
      });
    }, 500);
  });
};

export const getDashboardStatsQueryOptions = () => {
  return queryOptions({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });
};

type UseDashboardStatsOptions = {
  queryConfig?: QueryConfig<typeof getDashboardStatsQueryOptions>;
};

export const useDashboardStats = ({ queryConfig }: UseDashboardStatsOptions = {}) => {
  return useQuery({
    ...getDashboardStatsQueryOptions(),
    ...queryConfig,
  });
};
