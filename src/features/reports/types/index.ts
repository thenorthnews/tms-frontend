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
