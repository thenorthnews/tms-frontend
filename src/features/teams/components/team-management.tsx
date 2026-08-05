import { keepPreviousData } from '@tanstack/react-query';
import {
  Users,
  CheckCircle,
  Activity,
  UserPlus,
  Trash2,
  Eye,
  Search,
  XCircle,
  ChevronUp,
  ChevronDown,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Shield,
  FolderPlus,
  Layers,
  Edit2,
} from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useTasks } from '@/features/tasks/api/get-tasks';
import { Task } from '@/features/tasks/types';
import { useCreateUser } from '@/features/users/api/create-user';
import { useDeleteUser } from '@/features/users/api/delete-user';
import { useUsers } from '@/features/users/api/get-users';
import { useUser } from '@/lib/auth';
import { User, Team, TeamMember } from '@/types/api';

import {
  useTeams,
  useCreateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
} from '../api/teams';
import { CreateMemberFormState, MemberRole } from '../types';

const isRecord = (val: unknown): val is Record<string, unknown> =>
  typeof val === 'object' && val !== null;

const getAssignedId = (assigned: unknown): string => {
  if (!assigned) return '';
  if (typeof assigned === 'string') return assigned;
  if (Array.isArray(assigned)) {
    const first = assigned[0];
    if (typeof first === 'string') return first;
    if (isRecord(first)) {
      return String(first._id || first.id || '');
    }
    return '';
  }
  if (isRecord(assigned)) {
    return String(assigned._id || assigned.id || '');
  }
  return '';
};

const createMemberSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .trim()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || !val.trim() || /^\d{10}$/.test(val.trim()),
      'Phone number must be empty or exactly 10 digits (e.g. 9876543210)',
    ),
  role: z.enum(['manager', 'tl', 'employee']),
  department: z.string().optional(),
  gender: z.coerce
    .number()
    .min(0, 'Please select a gender')
    .max(2, 'Please select a gender'),
});

const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Team name is required')
    .min(2, 'Team name must be at least 2 characters long'),
  managerId: z.string().min(1, 'Please select a Team Leader or Manager'),
});

const assignMemberSchema = z.object({
  teamId: z.string().min(1, 'Please select a team'),
  userId: z.string().min(1, 'Please select an employee to assign'),
});

export const TeamManagement = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const currentUser = useUser();
  const currentUserRole = currentUser.data?.role;
  const isCEO = currentUserRole === 0 || currentUserRole === 'CEO';

  // --- INTERACTIVE UI STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAssignMemberOpen, setIsAssignMemberOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');

  const handleTeamFilterChange = (val: string) => {
    setSelectedTeamFilter(val);
    setCurrentPage(1);
  };

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const handleRoleFilterChange = (val: string) => {
    setSelectedRoleFilter(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setMemberSearch(val);
    setCurrentPage(1);
  };

  // --- QUERY REAL DATA ---
  const roleVal =
    selectedRoleFilter === 'all'
      ? undefined
      : selectedRoleFilter === 'ceo'
        ? 0
        : selectedRoleFilter === 'manager'
          ? 1
          : selectedRoleFilter === 'tl'
            ? 2
            : 4; // employee

  // Query 1: For the paginated table (using backend page, limit, search, role, teamId)
  const usersQuery = useUsers({
    page: currentPage,
    limit: 10,
    search: memberSearch,
    role: roleVal,
    teamId: selectedTeamFilter === 'all' ? undefined : selectedTeamFilter,
    queryConfig: {
      placeholderData: keepPreviousData,
    },
  });

  // Query 2: For dropdowns and statistics (fetches all users up to 1000)
  const allUsersQuery = useUsers({
    page: 1,
    limit: 1000,
  });

  const tasksQuery = useTasks({ params: { limit: 1000 } });
  const teamsQuery = useTeams();

  // --- MUTATIONS ---
  const deleteUserMutation = useDeleteUser({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Member removed from team roster successfully',
        });
      },
    },
  });

  const createUserMutation = useCreateUser({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'New member registered successfully',
        });
        setIsAddModalOpen(false);
        setNewMember({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phoneNumber: '',
          role: 'employee',
          department: 'Engineering',
          gender: 0,
        });
        setMemberErrors({});
      },
      onError: (err: {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      }) => {
        const rawMsg = err.response?.data?.message || err.message || '';
        const backendMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;
        const msgLower = backendMsg.toLowerCase();

        if (msgLower.includes('phone')) {
          setMemberErrors((prev) => ({
            ...prev,
            phoneNumber: 'Phone number already exists',
          }));
        } else if (msgLower.includes('email')) {
          setMemberErrors((prev) => ({
            ...prev,
            email: 'Email already exists',
          }));
        } else {
          addNotification({
            type: 'error',
            title: backendMsg || 'Failed to create user',
          });
        }
      },
    },
  });

  const createTeamMutation = useCreateTeam({
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Team created successfully' });
      setIsCreateTeamOpen(false);
      setNewTeam({ name: '', managerId: '' });
    },
  });

  const addTeamMemberMutation = useAddTeamMember({
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Member added to team' });
      setIsAssignMemberOpen(false);
    },
  });

  const removeTeamMemberMutation = useRemoveTeamMember({
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Member removed from team' });
    },
  });

  const deleteTeamMutation = useDeleteTeam({
    onSuccess: () => {
      addNotification({ type: 'success', title: 'Team deleted successfully' });
    },
  });

  // New member form state (with role, department & gender)
  const [newMember, setNewMember] = useState<CreateMemberFormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'employee',
    department: 'Engineering',
    gender: 0,
  });

  // Create team form state
  const [newTeam, setNewTeam] = useState({ name: '', managerId: '' });

  // Sorting states
  const [sortKey, setSortKey] = useState<
    'name' | 'role' | 'department' | 'assigned' | 'completed' | 'progress'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Assign member to team handler
  const [assignUserId, setAssignUserId] = useState('');

  // Form error states
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});
  const [teamErrors, setTeamErrors] = useState<Record<string, string>>({});
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});

  // Inline confirmation state for remove member
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  if (
    usersQuery.isLoading ||
    allUsersQuery.isLoading ||
    tasksQuery.isLoading ||
    teamsQuery.isLoading
  ) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const dbUsers = usersQuery.data?.data || [];
  const allDbUsers = allUsersQuery.data?.data || [];
  const dbTasks = tasksQuery.data?.data || [];
  const dbTeams = teamsQuery.data || [];

  // Map users to local schema & calculate metrics dynamically
  const teamMembers = dbUsers.map((u: User) => {
    // Count tasks assigned to this user
    const assignedTasks = dbTasks.filter((t: Task) => {
      const assignedId = getAssignedId(t.assignedTo);
      return assignedId === u.id || assignedId === u._id;
    });
    const assigned = assignedTasks.length;
    const completed = assignedTasks.filter((t: Task) => t.status === 2).length; // status 2 is COMPLETED

    // Generate random profile background colors based on user initials
    const colors = [
      'bg-emerald-500',
      'bg-sky-500',
      'bg-[#1E3A8A]',
      'bg-[#F59E0B]',
      'bg-indigo-500',
      'bg-pink-500',
    ];
    const idx =
      Math.abs(
        (u.firstName || '').charCodeAt(0) + (u.lastName || '').charCodeAt(0) ||
          0,
      ) % colors.length;
    const color = colors[idx];

    const userTeam = dbTeams.find((t: Team) => {
      const mgr = t.managerId;
      const managerIdStr = (
        typeof mgr === 'object' ? mgr?._id || mgr?.id : mgr
      )?.toString();
      const memberIds = (t.members || []).map((mb: TeamMember) =>
        (typeof mb === 'object' ? mb._id || mb.id : mb)?.toString(),
      );
      const mIdStr = (u.id || u._id)?.toString();
      return mIdStr === managerIdStr || memberIds.includes(mIdStr);
    });
    const department = userTeam?.name || u.department || 'Engineering';

    const userEmailStr =
      typeof u.email === 'string' ? u.email : String(u.email || '');

    return {
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No Name',
      email: userEmailStr,
      role:
        u.role === 0
          ? 'CEO'
          : u.role === 1
            ? 'Manager'
            : u.role === 2
              ? 'Team Lead'
              : 'Employee',
      department,
      assigned,
      completed,
      avatarInitials:
        `${u.firstName?.[0] || 'U'}${u.lastName?.[0] || ''}`.toUpperCase(),
      color,
    };
  });

  // Filter based on search box input, role dropdown filter, and team dropdown filter
  const searchedMembers = teamMembers.filter((m) => {
    if (selectedTeamFilter === 'all') return true;

    const targetTeam = dbTeams.find(
      (t: Team) => (t._id || t.id)?.toString() === selectedTeamFilter,
    );
    if (!targetTeam) return true;

    const mgr = targetTeam.managerId;
    const mgrObj =
      mgr && typeof mgr === 'object'
        ? (mgr as { _id?: string; id?: string })
        : null;
    const managerIdStr = (
      mgrObj ? mgrObj._id || mgrObj.id : typeof mgr === 'string' ? mgr : ''
    )?.toString();

    const memberIds = (targetTeam.members || []).map((mb: TeamMember) =>
      (typeof mb === 'object' ? mb._id || mb.id : mb)?.toString(),
    );

    const mIdStr = m.id?.toString();
    return mIdStr === managerIdStr || memberIds.includes(mIdStr);
  });

  // Sorting Handler
  const handleSort = (
    key: 'name' | 'role' | 'department' | 'assigned' | 'completed' | 'progress',
  ) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getProgressVal = (m: (typeof teamMembers)[0]) => {
    if (m.assigned === 0) return 0;
    return Math.round((m.completed / m.assigned) * 100);
  };

  // Sort Members List (client side sorting on the paginated list)
  const sortedMembers = [...searchedMembers].sort((a, b) => {
    const aVal: string | number =
      sortKey === 'progress' ? getProgressVal(a) : a[sortKey] ?? 0;
    const bVal: string | number =
      sortKey === 'progress' ? getProgressVal(b) : b[sortKey] ?? 0;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    const aNum = typeof aVal === 'number' ? aVal : 0;
    const bNum = typeof bVal === 'number' ? bVal : 0;
    return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
  });

  // Backend Pagination Logic
  const totalPages = usersQuery.data?.meta?.totalPages || 1;
  const backendTotal = usersQuery.data?.meta?.total || 0;

  // Since pagination is performed by the backend, paginatedMembers is simply the sortedMembers array
  const paginatedMembers = sortedMembers;

  // Derived metrics calculated over ALL database users
  const allTeamMembersForStats = allDbUsers.map((u: User) => {
    const assignedTasks = dbTasks.filter((t: Task) => {
      const assignedId = getAssignedId(t.assignedTo);
      return assignedId === u.id || assignedId === u._id;
    });
    const assigned = assignedTasks.length;
    const completed = assignedTasks.filter((t: Task) => t.status === 2).length;
    return { assigned, completed };
  });

  const totalMembersCount = allTeamMembersForStats.length;
  const activeTasksCount = allTeamMembersForStats.reduce(
    (acc, m) => acc + (m.assigned - m.completed),
    0,
  );
  const avgCompletionRate =
    totalMembersCount > 0
      ? Math.round(
          (allTeamMembersForStats.reduce(
            (acc, m) => acc + (m.assigned > 0 ? m.completed / m.assigned : 0),
            0,
          ) /
            totalMembersCount) *
            100,
        )
      : 0;

  // Add Member form submit (with Zod validation)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createMemberSchema.safeParse(newMember);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setMemberErrors(errors);
      return;
    }
    setMemberErrors({});

    createUserMutation.mutate({
      data: {
        ...newMember,
        countryCode: '+1',
        phoneNumber:
          newMember.phoneNumber && newMember.phoneNumber.trim()
            ? newMember.phoneNumber.trim()
            : undefined,
        gender: Number(newMember.gender),
        image: '',
        role:
          newMember.role === 'manager' ? 1 : newMember.role === 'tl' ? 2 : 4,
      },
    });
  };

  // Create Team handler (with Zod validation)
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createTeamSchema.safeParse(newTeam);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setTeamErrors(errors);
      return;
    }
    setTeamErrors({});
    createTeamMutation.mutate({
      name: newTeam.name,
      managerId: newTeam.managerId,
    });
  };

  // Assign Member to Team handler (with Zod validation)
  const handleAssignMember = (e: React.FormEvent) => {
    e.preventDefault();
    const result = assignMemberSchema.safeParse({
      teamId: selectedTeamId,
      userId: assignUserId,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setAssignErrors(errors);
      return;
    }
    setAssignErrors({});
    addTeamMemberMutation.mutate({
      teamId: selectedTeamId,
      userId: assignUserId,
    });
    setAssignUserId('');
  };

  // Remove Member (inline confirmation)
  const handleRemoveMember = (id: string) => {
    setConfirmRemoveId(id);
  };

  const confirmRemoveMember = () => {
    if (confirmRemoveId) {
      deleteUserMutation.mutate({ userId: confirmRemoveId });
      setConfirmRemoveId(null);
    }
  };

  // Get managers and team leads list for team creation dropdown
  const managers = allDbUsers.filter((u: User) => u.role === 1 || u.role === 2);
  // Get employees not in any team for assignment
  const allTeamMemberIds = dbTeams.flatMap((t: Team) =>
    (t.members || []).map((m: TeamMember) =>
      typeof m === 'object' ? m._id || m.id : m,
    ),
  );
  const unassignedEmployees = allDbUsers.filter((u: User) => {
    const uid = u.id || u._id;
    return u.role === 4 && !allTeamMemberIds.includes(uid);
  });

  return (
    <div className="space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4 sm:space-y-8">
      {/* Top Banner and "+ Add Member" Button */}
      <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-slate-700/20 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-[#0EA5E9]/10 blur-3xl" />
        <div className="z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/10 px-3 py-1 text-xs font-bold text-[#0EA5E9] backdrop-blur-sm">
            <Users className="size-3.5" />
            Team Operations
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Team Roster Management
          </h1>
          <p className="max-w-xl text-xs font-medium text-slate-300 sm:text-sm">
            Monitor members workload, review department performance indicators,
            filter tasks list by assignees, and provision seats.
          </p>
        </div>
        <div className="z-10 mt-2 flex shrink-0 flex-wrap gap-2 sm:mt-0">
          {isCEO && (
            <button
              onClick={() => setIsCreateTeamOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-[#10B981] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#10B981]/90"
            >
              <FolderPlus className="size-4" />+ Create Team
            </button>
          )}
          {isCEO && (
            <button
              onClick={() => setIsAssignMemberOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/20 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/30"
            >
              <Layers className="size-4" />
              Assign to Team
            </button>
          )}
          {isCEO && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-xl border-0 bg-[#0EA5E9] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:bg-[#0EA5E9]/90"
            >
              <UserPlus className="size-4" />+ Add Member
            </button>
          )}
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        {/* Total Members */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
              Total Members
            </span>
            <span className="block text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {totalMembersCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">
              Assigned Workspace Seats
            </span>
          </div>
          <div className="size-12.5 flex shrink-0 items-center justify-center rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A] sm:size-14">
            <Users className="sm:size-6.5 size-6" />
          </div>
        </div>

        {/* Active Tasks */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
              Active Tasks
            </span>
            <span className="block text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {activeTasksCount}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">
              In Progress / To Do backlog
            </span>
          </div>
          <div className="size-12.5 flex shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9] sm:size-14">
            <Activity className="sm:size-6.5 size-6" />
          </div>
        </div>

        {/* Avg. Completion Rate */}
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
              Avg. Completion Rate
            </span>
            <span className="block text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {avgCompletionRate}%
            </span>
            <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">
              Milestone compliance rate
            </span>
          </div>
          <div className="size-12.5 flex shrink-0 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981] sm:size-14">
            <CheckCircle className="sm:size-6.5 size-6" />
          </div>
        </div>
      </div>

      {/* Teams List (Cards Grid) */}
      <div className="space-y-4">
        <h3 className="text-left text-lg font-bold text-slate-800">
          Teams Overview
        </h3>
        {dbTeams.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-[#FFFFFF] p-8 text-center font-bold text-slate-400">
            No teams created yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dbTeams.map((team: Team) => {
              const managerObj =
                typeof team.managerId === 'object' ? team.managerId : null;
              const managerName = managerObj
                ? `${managerObj.firstName || ''} ${managerObj.lastName || ''}`.trim()
                : 'Unassigned';

              const teamIdStr = (team._id || team.id)?.toString();
              const memberIds = (team.members || []).map((m: TeamMember) =>
                (typeof m === 'object' ? m._id || m.id : m)?.toString(),
              );

              const teamTasks = dbTasks.filter((t: Task) => {
                const taskTeamId = (t.teamId || t.teamInfo?._id)?.toString();
                if (taskTeamId && teamIdStr) {
                  return taskTeamId === teamIdStr;
                }
                const assignedId = getAssignedId(t.assignedTo);
                return assignedId && memberIds.includes(assignedId);
              });

              const totalTasksCount = teamTasks.length;
              const pendingCount = teamTasks.filter(
                (t: Task) => t.status === 0,
              ).length;
              const inProgressCount = teamTasks.filter(
                (t: Task) => t.status === 1,
              ).length;
              const completedCount = teamTasks.filter(
                (t: Task) => t.status === 2,
              ).length;

              return (
                <div
                  key={team._id || team.id}
                  className="relative space-y-4 rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  {/* Delete Team Button (CEO only) */}
                  {isCEO && (
                    <button
                      onClick={() => {
                        const targetId = team._id || team.id;
                        if (
                          targetId &&
                          confirm(
                            `Are you sure you want to delete the team "${team.name}"?`,
                          )
                        ) {
                          deleteTeamMutation.mutate(targetId);
                        }
                      }}
                      className="absolute right-4 top-4 cursor-pointer rounded-lg border-0 bg-transparent p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Delete Team"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}

                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-slate-800">
                      {team.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <span>Manager:</span>
                      <span className="font-bold text-slate-600">
                        {managerName}
                      </span>
                    </div>
                  </div>

                  {/* Task Summary Badges */}
                  <div className="space-y-1.5 border-t border-slate-50 pt-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tasks Breakdown ({totalTasksCount} Total)
                    </span>
                    <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-bold">
                      <div className="rounded-md border border-amber-100 bg-amber-50 p-1 text-amber-700">
                        <span>To Do: </span>
                        <strong>{pendingCount}</strong>
                      </div>
                      <div className="rounded-md border border-sky-100 bg-sky-50 p-1 text-sky-700">
                        <span>In Prog: </span>
                        <strong>{inProgressCount}</strong>
                      </div>
                      <div className="rounded-md border border-emerald-100 bg-emerald-50 p-1 text-emerald-700">
                        <span>Done: </span>
                        <strong>{completedCount}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Members list in team */}
                  <div className="space-y-2 border-t border-slate-50 pt-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Members ({team.members?.length || 0})
                    </span>
                    {!team.members || team.members.length === 0 ? (
                      <span className="text-xs italic text-slate-400">
                        No members assigned yet
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {team.members.map((m: TeamMember) => {
                          const memberObj = typeof m === 'object' ? m : null;
                          const memberId =
                            memberObj?._id ||
                            memberObj?.id ||
                            (typeof m === 'string' ? m : '');
                          const initials = memberObj
                            ? `${memberObj.firstName?.[0] || 'U'}${memberObj.lastName?.[0] || ''}`.toUpperCase()
                            : 'U';
                          const fullName = memberObj
                            ? `${memberObj.firstName || ''} ${memberObj.lastName || ''}`.trim()
                            : memberId;
                          const teamIdVal = team._id || team.id || '';
                          return (
                            <div
                              key={memberId}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 py-0.5 pl-1.5 pr-2 text-[10px] font-bold text-slate-600"
                              title={fullName}
                            >
                              <div className="size-4.5 flex items-center justify-center rounded-md bg-[#1e3a8a]/10 text-[8px] font-extrabold text-[#1e3a8a]">
                                {initials}
                              </div>
                              <span>{fullName}</span>

                              {/* Remove Member Button */}
                              <button
                                onClick={() => {
                                  if (
                                    teamIdVal &&
                                    memberId &&
                                    confirm(
                                      `Remove ${fullName} from ${team.name}?`,
                                    )
                                  ) {
                                    removeTeamMemberMutation.mutate({
                                      teamId: teamIdVal,
                                      userId: memberId,
                                    });
                                  }
                                }}
                                className="cursor-pointer rounded-full border-0 bg-transparent p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-rose-600"
                              >
                                <XCircle className="size-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Roster Grid/Table Card Container */}
      <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        {/* Title, Filter, and Search */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div className="text-left">
            <h3 className="text-base font-bold text-slate-800 sm:text-lg">
              Team Members List
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Click column headers to sort results dynamically
            </p>
          </div>
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            {/* Team Filter Dropdown */}
            <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50 px-3 py-2 transition-all focus-within:border-[#1E3A8A] focus-within:bg-white sm:w-48">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Team:
              </span>
              <select
                value={selectedTeamFilter}
                onChange={(e) => handleTeamFilterChange(e.target.value)}
                className="w-full cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="all">All Teams</option>
                {dbTeams.map((team: Team) => (
                  <option key={team._id || team.id} value={team._id || team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter Dropdown */}
            <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50 px-3 py-2 transition-all focus-within:border-[#1E3A8A] focus-within:bg-white sm:w-44">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Role:
              </span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="w-full cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="ceo">CEO</option>
                <option value="manager">Manager</option>
                <option value="tl">Team Lead</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50 px-3.5 py-2 transition-all focus-within:border-[#1E3A8A] focus-within:bg-white sm:w-64">
              <Search className="size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search team..."
                value={memberSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Data Table (Desktop/Tablet) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="select-none border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th
                  onClick={() => handleSort('name')}
                  className="cursor-pointer px-2 py-3 transition-colors hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Name / Email
                    {sortKey === 'name' &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="cursor-pointer px-2 py-3 transition-colors hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Designation Role
                    {sortKey === 'role' &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('department')}
                  className="cursor-pointer px-2 py-3 transition-colors hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Department
                    {sortKey === 'department' &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('assigned')}
                  className="cursor-pointer px-2 py-3 transition-colors hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Assigned
                    {sortKey === 'assigned' &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('completed')}
                  className="cursor-pointer px-2 py-3 transition-colors hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Completed
                    {sortKey === 'completed' &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('progress')}
                  className="cursor-pointer px-2 py-3 transition-colors hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Progress
                    {sortKey === 'progress' &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      ))}
                  </div>
                </th>
                <th className="px-2 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center font-bold text-slate-400"
                  >
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => {
                  const progress = getProgressVal(m);
                  return (
                    <tr
                      key={m.id}
                      className="transition-colors odd:bg-slate-50/10 even:bg-white hover:bg-slate-50/40"
                    >
                      {/* Avatar + Name */}
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-8 rounded-xl ${m.color} flex items-center justify-center text-xs font-bold text-white shadow-sm`}
                          >
                            {m.avatarInitials}
                          </div>
                          <div className="space-y-0.5 text-left">
                            <span className="block text-sm font-bold text-slate-800">
                              {m.name}
                            </span>
                            <span className="block text-[10px] font-semibold text-slate-400">
                              {m.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-2 py-4 font-semibold text-slate-600">
                        {m.role}
                      </td>

                      {/* Department */}
                      <td className="px-2 py-4 font-semibold text-slate-600">
                        <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {m.department}
                        </span>
                      </td>

                      {/* Assigned */}
                      <td className="px-2 py-4 text-sm font-bold text-slate-500">
                        {m.assigned}
                      </td>

                      {/* Completed */}
                      <td className="px-2 py-4 text-sm font-bold text-emerald-600">
                        {m.completed}
                      </td>

                      {/* Progress */}
                      <td className="max-w-[120px] px-2 py-4">
                        <div className="space-y-1.5">
                          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#0EA5E9] transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                            <span>Output</span>
                            <span className="text-slate-700">{progress}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Action icons */}
                      <td className="px-2 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() =>
                              navigate(
                                `/app/tasks?search=${encodeURIComponent(m.name)}`,
                              )
                            }
                            className="cursor-pointer rounded-lg border-0 bg-transparent p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1E3A8A]"
                            title="View Members Tasks"
                          >
                            <Eye className="size-4" />
                          </button>
                          {isCEO && (
                            <>
                              <button
                                onClick={() =>
                                  navigate(paths.app.editUser.getHref(m.id))
                                }
                                className="cursor-pointer rounded-lg border-0 bg-transparent p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                                title="Edit Member Details"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveMember(m.id)}
                                disabled={deleteUserMutation.isPending}
                                className="cursor-pointer rounded-lg border-0 bg-transparent p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600"
                                title="Remove Member"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive: Table converts to stacked list on Mobile */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {paginatedMembers.length === 0 ? (
            <div className="py-8 text-center font-bold text-slate-400">
              No team members found.
            </div>
          ) : (
            paginatedMembers.map((m) => {
              const progress = getProgressVal(m);
              return (
                <div
                  key={m.id}
                  className="space-y-3.5 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`size-8.5 rounded-xl ${m.color} flex items-center justify-center text-sm font-bold text-white shadow-sm`}
                      >
                        {m.avatarInitials}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold leading-tight text-slate-800">
                          {m.name}
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-400">
                          {m.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          navigate(
                            `/app/tasks?search=${encodeURIComponent(m.name)}`,
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-[#1E3A8A]"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      {isCEO && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-rose-500 hover:bg-rose-50/50"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100/70 pt-2.5 text-[10px] font-bold text-slate-500">
                    <div>
                      <span>Assigned: </span>
                      <strong className="text-slate-800">{m.assigned}</strong>
                    </div>
                    <div>
                      <span>Completed: </span>
                      <strong className="text-emerald-600">
                        {m.completed}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex h-1 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#0EA5E9]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Performance rate</span>
                      <span>{progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {backendTotal > 0 && (
          <div className="flex select-none items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold">
            <span className="text-slate-400">
              Showing{' '}
              <strong className="text-slate-700">
                {backendTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-700">
                {Math.min(currentPage * itemsPerPage, backendTotal)}
              </strong>{' '}
              of <strong className="text-slate-700">{backendTotal}</strong>{' '}
              members
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-500 transition-all hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`flex size-9 cursor-pointer items-center justify-center rounded-xl text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10'
                          : 'border border-transparent bg-white text-slate-500 hover:border-slate-200 hover:text-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-500 transition-all hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* "+ Add Member" Modal Form Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl duration-200 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-extrabold text-slate-800">
                  Add Team Member
                </h3>
                <p className="text-xs font-semibold text-slate-400">
                  Provision a new employee seat in your database
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                }}
                className="cursor-pointer rounded-lg border-0 bg-transparent p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <XCircle className="size-6" />
              </button>
            </div>

            {/* Modal Content - Creation Form */}
            <form
              onSubmit={handleFormSubmit}
              className="space-y-4 p-5 text-left"
            >
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">
                    First Name
                  </label>
                  <div
                    className={`flex items-center gap-2 border bg-slate-50 ${memberErrors.firstName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                  >
                    <UserIcon className="size-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="John"
                      value={newMember.firstName}
                      onChange={(e) =>
                        setNewMember((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                  {memberErrors.firstName && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-500">
                      {memberErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">
                    Last Name
                  </label>
                  <div
                    className={`flex items-center gap-2 border bg-slate-50 ${memberErrors.lastName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                  >
                    <UserIcon className="size-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Doe"
                      value={newMember.lastName}
                      onChange={(e) =>
                        setNewMember((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                  {memberErrors.lastName && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-500">
                      {memberErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Email Address
                </label>
                <div
                  className={`flex items-center gap-2 border bg-slate-50 ${memberErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                >
                  <Mail className="size-3.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="john.doe@taskflow.com"
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
                {memberErrors.email && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    {memberErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Password
                </label>
                <div
                  className={`flex items-center gap-2 border bg-slate-50 ${memberErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                >
                  <Lock className="size-3.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newMember.password}
                    onChange={(e) =>
                      setNewMember((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
                {memberErrors.password && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    {memberErrors.password}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Phone Number (Optional)
                </label>
                <div
                  className={`flex items-center gap-2 border bg-slate-50 ${memberErrors.phoneNumber ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                >
                  <Phone className="size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="1234567890"
                    value={newMember.phoneNumber}
                    onChange={(e) =>
                      setNewMember((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
                {memberErrors.phoneNumber && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    {memberErrors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Role Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Role
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                  <Shield className="size-3.5 text-slate-400" />
                  <select
                    value={newMember.role}
                    onChange={(e) => {
                      const val = e.target.value;
                      const role: MemberRole =
                        val === 'manager' || val === 'tl' ? val : 'employee';
                      setNewMember((prev) => ({ ...prev, role }));
                    }}
                    className="w-full cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="employee">Employee</option>
                    <option value="tl">Team Lead (TL)</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>

              {/* Department Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Department
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                  <Layers className="size-3.5 text-slate-400" />
                  <select
                    value={newMember.department}
                    onChange={(e) =>
                      setNewMember((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    className="w-full cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              {/* Gender Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Gender *
                </label>
                <div
                  className={`flex items-center gap-2 border bg-slate-50 ${memberErrors.gender ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                >
                  <UserIcon className="size-3.5 text-slate-400" />
                  <select
                    value={newMember.gender}
                    onChange={(e) =>
                      setNewMember((prev) => ({
                        ...prev,
                        gender: Number(e.target.value),
                      }))
                    }
                    className="w-full cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    <option value={0}>Male</option>
                    <option value={1}>Female</option>
                    <option value={2}>Other</option>
                  </select>
                </div>
                {memberErrors.gender && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    {memberErrors.gender}
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="cursor-pointer rounded-xl border-0 bg-[#1E3A8A] px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#152a63] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal (CEO Only) */}
      {isCreateTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl duration-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-extrabold text-slate-800">
                  Create New Team
                </h3>
                <p className="text-xs font-semibold text-slate-400">
                  Assign a team name and select its manager
                </p>
              </div>
              <button
                onClick={() => setIsCreateTeamOpen(false)}
                className="cursor-pointer rounded-lg border-0 bg-transparent p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <XCircle className="size-6" />
              </button>
            </div>
            <form
              onSubmit={handleCreateTeam}
              className="space-y-4 p-5 text-left"
            >
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Team Name
                </label>
                <div
                  className={`flex items-center gap-2 border bg-slate-50 ${teamErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                >
                  <FolderPlus className="size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Alpha Engineering"
                    value={newTeam.name}
                    onChange={(e) =>
                      setNewTeam((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
                {teamErrors.name && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    {teamErrors.name}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Assign Team Leader / Manager
                </label>
                <div
                  className={`flex items-center gap-2 border bg-slate-50 ${teamErrors.managerId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                >
                  <Shield className="size-3.5 text-slate-400" />
                  <select
                    value={newTeam.managerId}
                    onChange={(e) =>
                      setNewTeam((p) => ({ ...p, managerId: e.target.value }))
                    }
                    className="w-full cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="">Select a manager or team lead...</option>
                    {managers.map((m: User) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} (
                        {m.role === 1 ? 'Manager' : 'Team Lead'})
                      </option>
                    ))}
                  </select>
                </div>
                {teamErrors.managerId && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    {teamErrors.managerId}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateTeamOpen(false)}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeamMutation.isPending}
                  className="cursor-pointer rounded-xl border-0 bg-[#10B981] px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#0d9668] disabled:opacity-50"
                >
                  {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Member to Team Modal */}
      {isAssignMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl duration-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-extrabold text-slate-800">
                  Assign Employee to Team
                </h3>
                <p className="text-xs font-semibold text-slate-400">
                  Select a team and an employee to add
                </p>
              </div>
              <button
                onClick={() => setIsAssignMemberOpen(false)}
                className="cursor-pointer rounded-lg border-0 bg-transparent p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
              >
                <XCircle className="size-6" />
              </button>
            </div>
            <form
              onSubmit={handleAssignMember}
              className="space-y-4 p-5 text-left"
            >
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Select Team
                </label>
                <div
                  className={`flex items-center gap-2 border bg-slate-50 ${assignErrors.teamId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                >
                  <Layers className="size-3.5 text-slate-400" />
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="">Select a team...</option>
                    {dbTeams.map((t: Team) => (
                      <option key={t._id || t.id} value={t._id || t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                {assignErrors.teamId && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    {assignErrors.teamId}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Select Employee
                </label>
                <div
                  className={`flex items-center gap-2 border bg-slate-50 ${assignErrors.userId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'} rounded-xl px-3.5 py-2`}
                >
                  <UserIcon className="size-3.5 text-slate-400" />
                  <select
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    className="w-full cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="">Select an employee...</option>
                    {unassignedEmployees.map((u: User) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                {assignErrors.userId && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    {assignErrors.userId}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignMemberOpen(false);
                    setAssignErrors({});
                  }}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addTeamMemberMutation.isPending}
                  className="cursor-pointer rounded-xl border-0 bg-[#1E3A8A] px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#152a63] disabled:opacity-50"
                >
                  {addTeamMemberMutation.isPending
                    ? 'Assigning...'
                    : 'Assign to Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Remove Member */}
      {confirmRemoveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-2xl duration-200 animate-in zoom-in-95">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">
                Remove Member?
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Are you sure you want to remove this member from the team
                roster?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveId(null)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveMember}
                disabled={deleteUserMutation.isPending}
                className="cursor-pointer rounded-xl border-0 bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700"
              >
                {deleteUserMutation.isPending ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
