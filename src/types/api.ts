export type BaseEntity = {
  id: string;
  createdAt?: number | string;
};

export type Entity<T> = {
  [K in keyof T]: T[K];
} & BaseEntity;

export type UserPhoneNumber = {
  countryCode?: string;
  number?: string;
  isVerified?: boolean;
};

export type UserEmailObj = {
  id?: string;
  isVerified?: boolean;
};

export type User = {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: number | string;
  teamId?: string;
  bio?: string;
  phoneNumber?: string | UserPhoneNumber;
  gender?: number;
  department?: string;
  image?: string;
  status: number;
  createdAt?: string | number;
  updatedAt?: string | number;
};

export type AuthResponse = {
  jwt: string;
  refresh_token: string;
  user: User;
};

export type TeamMember = User | any;

export type Team = {
  id?: string;
  _id?: string;
  name: string;
  managerId: User | any;
  members: TeamMember[];
  createdAt?: string | number;
  updatedAt?: string | number;
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
  loggedTime: string;
};

export type ReportsData = {
  summary: ReportSummary;
  priorities: ReportPriorities;
  employeePerformance: EmployeePerformance[];
};
