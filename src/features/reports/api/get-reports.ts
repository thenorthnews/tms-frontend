import { useQuery, queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type GetReportsParams = {
  dateRange?: 'week' | 'month' | 'all';
  priority?: string;
};

export type ReportSummary = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
};

export type ReportPriorities = {
  low: number;
  medium: number;
  high: number;
};

export type EmployeePerformance = {
  id: string;
  name: string;
  role: string;
  assigned: number;
  completed: number;
  rate: number;
  avgTime: string;
  loggedTime?: string;
};

export type ReportsData = {
  summary: ReportSummary;
  priorities: ReportPriorities;
  employeePerformance: EmployeePerformance[];
};

export const getReports = async (params?: GetReportsParams): Promise<ReportsData> => {
  return api.get('/admin/reports', { params });
};

export const getReportsQueryOptions = (params?: GetReportsParams) => {
  return queryOptions({
    queryKey: ['reports', params],
    queryFn: () => getReports(params),
  });
};

type UseReportsOptions = {
  params?: GetReportsParams;
  queryConfig?: QueryConfig<typeof getReportsQueryOptions>;
};

export const useReports = ({ params, queryConfig }: UseReportsOptions = {}) => {
  return useQuery({
    ...getReportsQueryOptions(params),
    ...queryConfig,
  });
};
