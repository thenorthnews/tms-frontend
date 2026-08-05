import { User, PopulatedUserSummary } from '@/types/api';

export type TeamMember = User | PopulatedUserSummary | string;

export interface Team {
  _id?: string;
  id?: string;
  name: string;
  managerId?: User | PopulatedUserSummary | string;
  members?: TeamMember[];
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface CreateTeamInput {
  name: string;
  managerId?: string;
  members?: string[];
}

export interface UpdateTeamInput {
  name?: string;
  managerId?: string;
  members?: string[];
}

export type MemberRole = 'manager' | 'tl' | 'employee';

export type MemberSortKey =
  | 'name'
  | 'email'
  | 'role'
  | 'department'
  | 'assigned'
  | 'completed'
  | 'progress';

export interface CreateMemberFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: MemberRole;
  department: string;
  gender: number;
}
