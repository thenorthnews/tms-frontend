export enum TaskStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
}

export type Subtask = {
  _id?: string;
  title: string;
  isCompleted: boolean;
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

export type Task = {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  subtasks?: Subtask[];
  tags?: string[];
  attachments?: Attachment[];
  teamId?: string;
  activities?: Activity[];
  timeLogs?: TimeLog[];
  assigneeInfo?: {
    firstName: string;
    lastName: string;
    image?: string;
  };
  creatorInfo?: {
    firstName: string;
    lastName: string;
  };
  teamInfo?: {
    _id: string;
    name: string;
  };
};
