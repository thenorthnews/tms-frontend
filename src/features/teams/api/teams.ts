import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { User } from '@/types/api';

export type Team = {
  id: string;
  name: string;
  managerId: string;
  members: string[];
  managerInfo?: User;
  membersInfo?: User[];
  createdAt: string;
  updatedAt: string;
};

// 1. Get all teams
export const getTeams = async (): Promise<Team[]> => {
  return api.get('/admin/teams');
};

export const getTeamsQueryOptions = () => {
  return queryOptions({
    queryKey: ['teams'],
    queryFn: () => getTeams(),
  });
};

export const useTeams = () => {
  return useQuery({
    ...getTeamsQueryOptions(),
  });
};

// 2. Create team
export const createTeam = async (data: { name: string; managerId: string }): Promise<Team> => {
  return api.post('/admin/teams', data);
};

export const useCreateTeam = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onSuccess?.();
    },
  });
};

// 3. Delete team
export const deleteTeam = async (id: string): Promise<void> => {
  return api.delete(`/admin/teams/${id}`);
};

export const useDeleteTeam = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onSuccess?.();
    },
  });
};

// 4. Add member to team
export const addTeamMember = async ({ teamId, userId }: { teamId: string; userId: string }): Promise<Team> => {
  return api.post(`/admin/teams/${teamId}/members`, { userId });
};

export const useAddTeamMember = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onSuccess?.();
    },
  });
};

// 5. Remove member from team
export const removeTeamMember = async ({ teamId, userId }: { teamId: string; userId: string }): Promise<Team> => {
  return api.delete(`/admin/teams/${teamId}/members/${userId}`);
};

export const useRemoveTeamMember = ({ onSuccess }: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onSuccess?.();
    },
  });
};
