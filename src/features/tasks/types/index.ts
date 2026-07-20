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
  assigneeInfo?: {
    firstName: string;
    lastName: string;
    image?: string;
  };
  creatorInfo?: {
    firstName: string;
    lastName: string;
  };
};
