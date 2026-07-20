import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  Layers
} from 'lucide-react';

import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { useUsers } from '@/features/users/api/get-users';
import { useDeleteUser } from '@/features/users/api/delete-user';
import { useCreateUser } from '@/features/users/api/create-user';
import { useTasks } from '@/features/tasks/api/get-tasks';
import { useTeams, useCreateTeam, useAddTeamMember, useRemoveTeamMember } from '../api/teams';

export const TeamManagement = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const currentUser = useUser();
  const isCEO = currentUser.data?.role === 'ADMIN';

  // --- QUERY REAL DATA ---
  const usersQuery = useUsers({ page: 1 });
  const tasksQuery = useTasks({ params: { limit: 1000 } });
  const teamsQuery = useTeams();

  // --- MUTATIONS ---
  const deleteUserMutation = useDeleteUser({
    mutationConfig: {
      onSuccess: () => {
        addNotification({ type: 'success', title: 'Member removed from team roster successfully' });
      },
    },
  });

  const createUserMutation = useCreateUser({
    mutationConfig: {
      onSuccess: () => {
        addNotification({ type: 'success', title: 'New member registered successfully' });
        setIsAddModalOpen(false);
        setNewMember({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', role: 'employee' });
      },
      onError: (err: any) => {
        addNotification({ type: 'error', title: 'Failed to add member', message: err.message || 'Validation error check fields.' });
      }
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

  // --- INTERACTIVE UI STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAssignMemberOpen, setIsAssignMemberOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  
  // New member form state (with role)
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'employee' as 'manager' | 'employee',
  });

  // Create team form state
  const [newTeam, setNewTeam] = useState({ name: '', managerId: '' });
  
  // Sorting states
  const [sortKey, setSortKey] = useState<'name' | 'role' | 'assigned' | 'completed' | 'progress'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  if (usersQuery.isLoading || tasksQuery.isLoading || teamsQuery.isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const dbUsers = usersQuery.data?.data || [];
  const dbTasks = tasksQuery.data?.data || [];
  const dbTeams = (teamsQuery.data as any) || [];

  // Map users to local schema & calculate metrics dynamically
  const teamMembers = dbUsers.map((u: any) => {
    // Count tasks assigned to this user
    const assignedTasks = dbTasks.filter(
      (t: any) => t.assignedTo?._id === u.id || t.assignedTo === u.id
    );
    const assigned = assignedTasks.length;
    const completed = assignedTasks.filter((t: any) => t.status === 2).length; // status 2 is COMPLETED

    // Generate random profile background colors based on user initials
    const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-[#1E3A8A]', 'bg-[#F59E0B]', 'bg-indigo-500', 'bg-pink-500'];
    const idx = Math.abs((u.firstName || '').charCodeAt(0) + (u.lastName || '').charCodeAt(0) || 0) % colors.length;
    const color = colors[idx];

    return {
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'No Name',
      email: u.email || '',
      role: u.role === 0 ? 'CEO' : u.role === 1 ? 'Manager' : 'Developer',
      assigned,
      completed,
      avatarInitials: `${u.firstName?.[0] || 'U'}${u.lastName?.[0] || ''}`.toUpperCase(),
      color,
    };
  });

  // Filter based on search box input
  const searchedMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.role.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Sorting Handler
  const handleSort = (key: 'name' | 'role' | 'assigned' | 'completed' | 'progress') => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getProgressVal = (m: typeof teamMembers[0]) => {
    if (m.assigned === 0) return 0;
    return Math.round((m.completed / m.assigned) * 100);
  };

  // Sort Members List
  const sortedMembers = [...searchedMembers].sort((a, b) => {
    let aVal: any = a[sortKey as keyof typeof a];
    let bVal: any = b[sortKey as keyof typeof b];

    // Override custom progress key sort values
    if (sortKey === 'progress') {
      aVal = getProgressVal(a);
      bVal = getProgressVal(b);
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc'
        ? aVal - bVal
        : bVal - aVal;
    }
  });

  // Derived metrics
  const totalMembersCount = teamMembers.length;
  const activeTasksCount = teamMembers.reduce((acc, m) => acc + (m.assigned - m.completed), 0);
  const avgCompletionRate = totalMembersCount > 0
    ? Math.round(
        (teamMembers.reduce((acc, m) => acc + (m.assigned > 0 ? (m.completed / m.assigned) : 0), 0) / totalMembersCount) * 100
      )
    : 0;

  // Add Member form submit (with role)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.password) {
      addNotification({ type: 'error', title: 'Validation failed', message: 'Please fill in all required fields.' });
      return;
    }

    createUserMutation.mutate({
      data: {
        ...newMember,
        countryCode: '+1',
        phoneNumber: newMember.phoneNumber || '0000000000',
        fatherName: 'Not Provided',
        motherName: 'Not Provided',
        age: 30,
        gender: 0,
        salary: 60000,
        image: '',
        role: newMember.role === 'manager' ? 1 : 4,
      }
    });
  };

  // Create Team handler
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name || !newTeam.managerId) {
      addNotification({ type: 'error', title: 'Please fill team name and select a manager' });
      return;
    }
    createTeamMutation.mutate({ name: newTeam.name, managerId: newTeam.managerId });
  };

  // Assign member to team handler
  const [assignUserId, setAssignUserId] = useState('');
  const handleAssignMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !assignUserId) return;
    addTeamMemberMutation.mutate({ teamId: selectedTeamId, userId: assignUserId });
    setAssignUserId('');
  };

  // Remove Member
  const handleRemoveMember = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from your team?`)) {
      deleteUserMutation.mutate({ userId: id });
    }
  };

  // Get managers list for team creation dropdown
  const managers = dbUsers.filter((u: any) => u.role === 1);
  // Get employees not in any team for assignment
  const allTeamMemberIds = dbTeams.flatMap((t: any) => (t.members || []).map((m: any) => m._id || m.id || m));
  const unassignedEmployees = dbUsers.filter((u: any) => {
    const uid = u.id || u._id;
    return u.role === 4 && !allTeamMemberIds.includes(uid);
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Banner and "+ Add Member" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-slate-700/20">
        <div className="absolute right-0 top-0 size-80 bg-[#0EA5E9]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#0EA5E9] text-xs font-bold border border-white/5 backdrop-blur-sm">
            <Users className="size-3.5" />
            Team Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Team Roster Management</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium">
            Monitor members workload, review department performance indicators, filter tasks list by assignees, and provision seats.
          </p>
        </div>
        <div className="z-10 shrink-0 mt-2 sm:mt-0 flex flex-wrap gap-2">
          {isCEO && (
            <button
              onClick={() => setIsCreateTeamOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer border-0"
            >
              <FolderPlus className="size-4" />
              + Create Team
            </button>
          )}
          <button
            onClick={() => setIsAssignMemberOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-white/10"
          >
            <Layers className="size-4" />
            Assign to Team
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer border-0"
          >
            <UserPlus className="size-4" />
            + Add Member
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Total Members */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Members
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {totalMembersCount}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Assigned Workspace Seats</span>
          </div>
          <div className="flex size-12.5 sm:size-14 items-center justify-center rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A] shrink-0">
            <Users className="size-6 sm:size-6.5" />
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Tasks
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {activeTasksCount}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">In Progress / To Do backlog</span>
          </div>
          <div className="flex size-12.5 sm:size-14 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9] shrink-0">
            <Activity className="size-6 sm:size-6.5" />
          </div>
        </div>

        {/* Avg. Completion Rate */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Avg. Completion Rate
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
              {avgCompletionRate}%
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Milestone compliance rate</span>
          </div>
          <div className="flex size-12.5 sm:size-14 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#10B981] shrink-0">
            <CheckCircle className="size-6 sm:size-6.5" />
          </div>
        </div>

      </div>

      {/* Team Roster Grid/Table Card Container */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        
        {/* Title and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="text-left">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Team Members List</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click column headers to sort results dynamically</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2 w-full sm:max-w-xs focus-within:border-[#1E3A8A] focus-within:bg-white transition-all">
            <Search className="size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search team..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full bg-transparent font-semibold"
            />
          </div>
        </div>

        {/* Data Table (Desktop/Tablet) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-2 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Name / Email
                    {sortKey === 'name' && (sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="py-3 px-2 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Designation Role
                    {sortKey === 'role' && (sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('assigned')}
                  className="py-3 px-2 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Assigned
                    {sortKey === 'assigned' && (sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('completed')}
                  className="py-3 px-2 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Completed
                    {sortKey === 'completed' && (sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('progress')}
                  className="py-3 px-2 cursor-pointer hover:text-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Progress
                    {sortKey === 'progress' && (sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />)}
                  </div>
                </th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                sortedMembers.map((m) => {
                  const progress = getProgressVal(m);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/40 transition-colors odd:bg-slate-50/10 even:bg-white">
                      {/* Avatar + Name */}
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-xl ${m.color} text-white font-bold flex items-center justify-center text-xs shadow-sm`}>
                            {m.avatarInitials}
                          </div>
                          <div className="space-y-0.5 text-left">
                            <span className="font-bold text-slate-800 block text-sm">{m.name}</span>
                            <span className="text-[10px] text-slate-400 block font-semibold">{m.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-2 font-semibold text-slate-600">
                        {m.role}
                      </td>

                      {/* Assigned */}
                      <td className="py-4 px-2 text-slate-500 font-bold text-sm">
                        {m.assigned}
                      </td>

                      {/* Completed */}
                      <td className="py-4 px-2 text-emerald-600 font-bold text-sm">
                        {m.completed}
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-2 max-w-[120px]">
                        <div className="space-y-1.5">
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                            <div
                              className="bg-[#0EA5E9] h-full rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                            <span>Output</span>
                            <span className="text-slate-700">{progress}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Action icons */}
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => navigate(`/app/tasks?search=${encodeURIComponent(m.name)}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#1E3A8A] transition-colors cursor-pointer border-0 bg-transparent"
                            title="View Members Tasks"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m.id, m.name)}
                            disabled={deleteUserMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border-0 bg-transparent"
                            title="Remove Member"
                          >
                            <Trash2 className="size-4" />
                          </button>
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
          {sortedMembers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold">
              No team members found.
            </div>
          ) : (
            sortedMembers.map((m) => {
              const progress = getProgressVal(m);
              return (
                <div key={m.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3.5 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`size-8.5 rounded-xl ${m.color} text-white font-bold flex items-center justify-center text-sm shadow-sm`}>
                        {m.avatarInitials}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{m.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{m.role}</p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/app/tasks?search=${encodeURIComponent(m.name)}`)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#1E3A8A]"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(m.id, m.name)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50/50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 border-t border-slate-100/70 pt-2.5">
                    <div>
                      <span>Assigned: </span>
                      <strong className="text-slate-800">{m.assigned}</strong>
                    </div>
                    <div>
                      <span>Completed: </span>
                      <strong className="text-emerald-600">{m.completed}</strong>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden flex">
                      <div className="bg-[#0EA5E9] h-full rounded-full" style={{ width: `${progress}%` }} />
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

      </div>

      {/* "+ Add Member" Modal Form Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-extrabold text-slate-800">Add Team Member</h3>
                <p className="text-xs text-slate-400 font-semibold">Provision a new employee seat in your database</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer"
              >
                <XCircle className="size-6" />
              </button>
            </div>

            {/* Modal Content - Creation Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-left">
              
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                    <UserIcon className="size-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="John"
                      value={newMember.firstName}
                      onChange={(e) => setNewMember(prev => ({ ...prev, firstName: e.target.value }))}
                      className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                    <UserIcon className="size-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Doe"
                      value={newMember.lastName}
                      onChange={(e) => setNewMember(prev => ({ ...prev, lastName: e.target.value }))}
                      className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <Mail className="size-3.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="john.doe@taskflow.com"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Password</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <Lock className="size-3.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newMember.password}
                    onChange={(e) => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                    className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Phone Number (Optional)</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <Phone className="size-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="1234567890"
                    value={newMember.phoneNumber}
                    onChange={(e) => setNewMember(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium"
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Role</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <Shield className="size-3.5 text-slate-400" />
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value as 'manager' | 'employee' }))}
                    className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium cursor-pointer border-0"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-0"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-extrabold text-slate-800">Create New Team</h3>
                <p className="text-xs text-slate-400 font-semibold">Assign a team name and select its manager</p>
              </div>
              <button onClick={() => setIsCreateTeamOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer">
                <XCircle className="size-6" />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Team Name</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <FolderPlus className="size-3.5 text-slate-400" />
                  <input type="text" placeholder="e.g. Alpha Engineering" value={newTeam.name} onChange={(e) => setNewTeam(p => ({ ...p, name: e.target.value }))} className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Assign Manager</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <Shield className="size-3.5 text-slate-400" />
                  <select value={newTeam.managerId} onChange={(e) => setNewTeam(p => ({ ...p, managerId: e.target.value }))} className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium cursor-pointer border-0" required>
                    <option value="">Select a manager...</option>
                    {managers.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsCreateTeamOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer bg-white">Cancel</button>
                <button type="submit" disabled={createTeamMutation.isPending} className="px-5 py-2 bg-[#10B981] hover:bg-[#0d9668] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer border-0">
                  {createTeamMutation.isPending ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Member to Team Modal */}
      {isAssignMemberOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-extrabold text-slate-800">Assign Employee to Team</h3>
                <p className="text-xs text-slate-400 font-semibold">Select a team and an employee to add</p>
              </div>
              <button onClick={() => setIsAssignMemberOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border-0 bg-transparent cursor-pointer">
                <XCircle className="size-6" />
              </button>
            </div>
            <form onSubmit={handleAssignMember} className="p-5 space-y-4 text-left">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Select Team</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <Layers className="size-3.5 text-slate-400" />
                  <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium cursor-pointer border-0" required>
                    <option value="">Select a team...</option>
                    {dbTeams.map((t: any) => (
                      <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Select Employee</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <UserIcon className="size-3.5 text-slate-400" />
                  <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="text-xs text-slate-800 focus:outline-none w-full bg-transparent font-medium cursor-pointer border-0" required>
                    <option value="">Select an employee...</option>
                    {unassignedEmployees.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-2 justify-end">
                <button type="button" onClick={() => setIsAssignMemberOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer bg-white">Cancel</button>
                <button type="submit" disabled={addTeamMemberMutation.isPending} className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer border-0">
                  {addTeamMemberMutation.isPending ? 'Assigning...' : 'Assign to Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
