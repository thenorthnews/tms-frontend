export enum TaskStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  ON_HOLD = 4,
}

export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
}

export type Subtask = {
  _id?: string;
  id?: string;
  title: string;
  isCompleted: boolean;
  status?: TaskStatus;
  assignedTo?: string | null;
  assignedToInfo?: {
    _id: string;
    firstName: string;
    lastName: string;
    name?: string;
    initials?: string;
    role?: string;
    roleId?: number;
  } | null;
  dueDate?: string | null;
  lastStartedAt?: string | null;
  timeLogs?: TimeLog[];
  totalTimeSpent?: {
    hours: number;
    minutes: number;
    formatted: string;
  };
};

export type Attachment = {
  originalName: string;
  filename: string;
  mimetype?: string;
  size?: number;
  path: string;
  url: string;
};

export type Activity = {
  _id?: string;
  userId: string;
  userName: string;
  userInitials?: string;
  type: 'system' | 'comment';
  content: string;
  createdAt: string;
};

export type TimeLog = {
  _id?: string;
  userId: string;
  userName: string;
  hours: number;
  minutes: number;
  description?: string;
  createdAt: string;
};

export type LogTimeDTO = {
  taskId: string;
  data: {
    hours: number;
    minutes: number;
    description?: string;
  };
};

export type GetTasksParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
  priority?: number;
  assignedTo?: string;
  createdBy?: string;
  teamId?: string;
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
};

export type Task = {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedTo?: string | string[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  subtasks?: Subtask[];
  attachments?: Attachment[];
  activities?: Activity[];
  timeLogs?: TimeLog[];
  lastStartedAt?: string;
  assigneeInfo?:
    | {
        firstName: string;
        lastName: string;
        image?: string;
      }
    | {
        firstName: string;
        lastName: string;
        image?: string;
      }[];
  creatorInfo?: {
    firstName: string;
    lastName: string;
  };
  teamId?: string; // keep for backward compat
  teamIds?: string[];
  teamInfo?: {
    _id: string;
    name: string;
  };
  teamsInfo?: {
    _id: string;
    name: string;
  }[];
  clientId?: string;
  clientInfo?: {
    _id: string;
    name: string;
    companyName?: string;
  };
};
