import { Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableColumn } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { formatDate } from '@/utils/format';

import { useUsers } from '../api/get-users';
import { useUpdateUserStatus } from '../api/update-user-status';
import { DeleteUser } from './delete-user';

export enum UserStatus {
  ACTIVE = 0,
  INACTIVE = 1,
  PENDING = 2,
}

export enum UserRole {
  CEO = 0,
  MANAGER = 1,
  TL = 2,
  EMPLOYEE = 4,
}

export const UsersList = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = +(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';

  const [searchVal, setSearchVal] = useState(search);

  const updateStatusMutation = useUpdateUserStatus({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Status Updated',
        });
      },
    },
  });

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchVal) {
          next.set('search', searchVal);
        } else {
          next.delete('search');
        }
        next.set('page', '1'); // Reset to page 1 on search change
        return next;
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchVal, setSearchParams]);

  const usersQuery = useUsers({
    page,
    search,
  });

  if (usersQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (usersQuery.isError) {
    return (
      <div className="flex h-48 w-full items-center justify-center text-red-500">
        Failed to load users.
      </div>
    );
  }

  const users = usersQuery.data?.data;
  const meta = usersQuery.data?.meta;

  const columns: TableColumn<any>[] = useMemo(() => [
    {
      title: 'Image',
      field: 'image',
      Cell({ entry: { image } }: any) {
        return (
          <div className="h-10 w-10 shrink-0">
            {image ? (
              <img
                className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                src={image}
                alt="Profile"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 border-2 border-white shadow-sm">
                <span className="text-slate-400 text-xs font-medium">N/A</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Name',
      field: 'firstName',
      Cell({ entry: { firstName, lastName } }: any) {
        return <span className="font-medium text-slate-900">{`${firstName} ${lastName}`}</span>;
      },
    },
    {
      title: 'Email',
      field: 'email',
      Cell({ entry: { email } }: any) {
        const emailStr = typeof email === 'object' && email !== null ? (email as any).id : email;
        return <a href={`mailto:${emailStr}`} className="text-slate-500 hover:text-indigo-600 transition-colors">{emailStr}</a>;
      },
    },
    {
      title: 'Role',
      field: 'role',
      Cell({ entry: { role } }: any) {
        let roleString = 'Unknown';
        if (role === UserRole.CEO) roleString = 'CEO';
        else if (role === UserRole.MANAGER) roleString = 'Manager';
        else if (role === UserRole.TL) roleString = 'Team Lead';
        else if (role === UserRole.EMPLOYEE) roleString = 'Employee';
        else roleString = String(role);
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            {roleString}
          </span>
        );
      }
    },
    {
      title: 'Status',
      field: 'status',
      Cell({ entry: { id, status } }: any) {
        const getStatusColor = (s: number) => {
          switch(s) {
            case UserStatus.ACTIVE: return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20'; // Active
            case UserStatus.INACTIVE: return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500/20'; // Inactive
            case UserStatus.PENDING: return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20'; // Pending
            default: return 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-500/20';
          }
        };

        return (
          <select
            className={`block w-28 rounded-full border px-3 py-1.5 shadow-sm text-xs font-semibold focus:ring-4 transition-all cursor-pointer ${getStatusColor(status as number)}`}
            value={status}
            onChange={(e) => {
              updateStatusMutation.mutate({
                userId: id,
                status: Number(e.target.value),
              });
            }}
            disabled={updateStatusMutation.isPending}
          >
            <option value={UserStatus.ACTIVE}>Active</option>
            <option value={UserStatus.INACTIVE}>Inactive</option>
            <option value={UserStatus.PENDING}>Pending</option>
          </select>
        );
      },
    },
    {
      title: 'Created At',
      field: 'createdAt',
      Cell({ entry: { createdAt } }: any) {
        return <span>{formatDate(createdAt)}</span>;
      },
    },
    {
      title: '',
      field: 'id',
      Cell({ entry: { id } }: any) {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-200">
              <MoreVertical className="size-5 text-gray-600" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate(paths.app.editUser.getHref(id))}
              >
                <Edit2 className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DeleteUser
                id={id}
                triggerButton={
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [updateStatusMutation, navigate]);

  const pagination = useMemo(() => (
    meta && {
      totalPages: meta.totalPages,
      currentPage: meta.page,
      rootUrl: '',
    }
  ), [meta]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="w-full max-w-sm">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="block w-full rounded-full px-5 py-2.5 border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:text-sm transition-all"
          />
        </div>
      </div>

      {usersQuery.isFetching && !usersQuery.isLoading ? (
        <div className="flex h-64 w-full items-center justify-center animate-in fade-in duration-500">
          <Spinner size="lg" />
        </div>
      ) : !users || users.length === 0 ? (
        <div className="flex h-64 w-full flex-col items-center justify-center bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl p-8 text-slate-500 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="rounded-full bg-slate-100 p-4 mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <span className="text-lg font-medium text-slate-700">No users found</span>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Table
          data={users}
          columns={columns}
          pagination={pagination}
        />
        </div>
      )}
    </div>
  );
};
