import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  X,
  Mail,
  Phone,
  Briefcase,
} from 'lucide-react';
import { useState, useMemo } from 'react';

import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/utils/format';

import { createClientInputSchema, useCreateClient } from '../api/create-client';
import { useDeleteClient } from '../api/delete-client';
import { useClients } from '../api/get-clients';
import { useUpdateClient } from '../api/update-client';
import { Client } from '../types';

export const ClientsList = () => {
  const { addNotification } = useNotifications();
  const { data: clients = [], isLoading, isError } = useClients();

  const [searchVal, setSearchVal] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(0);
  const [clientFormErrors, setClientFormErrors] = useState<
    Record<string, string>
  >({});

  const createMutation = useCreateClient({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Client added successfully',
        });
        closeModals();
      },
    },
  });

  const updateMutation = useUpdateClient({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Client updated successfully',
        });
        closeModals();
      },
    },
  });

  const deleteMutation = useDeleteClient({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Client deleted successfully',
        });
        closeModals();
      },
    },
  });

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingClient(null);
    setDeletingClientId(null);
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setDescription('');
    setStatus(0);
    setClientFormErrors({});
  };

  const openCreateModal = () => {
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setDescription('');
    setStatus(0);
    setClientFormErrors({});
    setIsCreateModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name || '');
    setCompanyName(client.companyName || '');
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setDescription(client.description || '');
    setStatus(client.status ?? 0);
    setClientFormErrors({});
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: name.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      description: description.trim(),
      status,
    };

    const result = createClientInputSchema.safeParse(payload);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errs[err.path[0] as string] = err.message;
        }
      });
      setClientFormErrors(errs);
      return;
    }

    setClientFormErrors({});
    createMutation.mutate(payload);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    const clientId = editingClient._id || editingClient.id || '';

    const payload = {
      name: name.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      description: description.trim(),
      status,
    };

    const result = createClientInputSchema.safeParse(payload);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errs[err.path[0] as string] = err.message;
        }
      });
      setClientFormErrors(errs);
      return;
    }

    setClientFormErrors({});
    updateMutation.mutate({
      clientId,
      data: payload,
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingClientId) return;
    deleteMutation.mutate({ clientId: deletingClientId });
  };

  const filteredClients = useMemo(() => {
    if (!searchVal.trim()) return clients;
    const term = searchVal.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.companyName && c.companyName.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term)),
    );
  }, [clients, searchVal]);

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-48 w-full items-center justify-center gap-2 font-bold text-red-500">
        <AlertCircle className="size-5" />
        Failed to load clients.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-4 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="block w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-5 text-sm shadow-inner transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 sm:inline-flex">
            {filteredClients.length}{' '}
            {filteredClients.length === 1 ? 'Client' : 'Clients'}
          </span>
        </div>

        <button
          onClick={openCreateModal}
          className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 transition-all hover:bg-indigo-500"
        >
          <Plus className="size-4" />
          Add Client
        </button>
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 text-slate-500 shadow-sm duration-500 animate-in fade-in">
          <div className="mb-4 rounded-full border border-slate-100 bg-slate-50 p-4">
            <Users className="size-8 text-slate-400" />
          </div>
          <span className="text-lg font-bold text-slate-700">
            No clients found
          </span>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Add a new client to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm duration-500 animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 pl-6">Client Name</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredClients.map((client) => {
                  const clientId = client._id || client.id || '';
                  return (
                    <tr
                      key={clientId}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                            <Briefcase className="size-4" />
                          </div>
                          <span className="text-sm font-extrabold text-slate-900">
                            {client.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-700">
                          {client.companyName || 'N/A'}
                        </span>
                      </td>
                      <td className="space-y-0.5 p-4">
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="size-3 text-slate-400" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="size-3 text-slate-400" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {!client.email && !client.phone && (
                          <span className="font-normal italic text-slate-400">
                            No contact info
                          </span>
                        )}
                      </td>
                      <td className="max-w-xs truncate p-4 text-slate-500">
                        {client.description || 'No description'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                            client.status === 0
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${client.status === 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}
                          />
                          {client.status === 0 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-400">
                        {client.createdAt
                          ? formatDate(new Date(client.createdAt).getTime())
                          : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(client)}
                            className="cursor-pointer rounded-lg border-0 bg-transparent p-1.5 text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                            title="Edit Client"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeletingClientId(clientId)}
                            className="cursor-pointer rounded-lg border-0 bg-transparent p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title="Delete Client"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Briefcase className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Add Client
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    Create a new client entry
                  </p>
                </div>
              </div>
              <button
                onClick={closeModals}
                className="rounded-lg border-0 bg-transparent p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Client Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full border bg-slate-50 p-3 text-xs ${clientFormErrors.name ? 'border-rose-400' : 'border-slate-200'} rounded-xl font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none`}
                />
                {clientFormErrors.name && (
                  <p className="text-[11px] font-medium text-rose-500">
                    {clientFormErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email
                  </label>
                  <input
                    type="text"
                    placeholder="client@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border bg-slate-50 p-3 text-xs ${clientFormErrors.email ? 'border-rose-400' : 'border-slate-200'} rounded-xl font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none`}
                  />
                  {clientFormErrors.email && (
                    <p className="text-[11px] font-medium text-rose-500">
                      {clientFormErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief notes or description about the client..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none"
                >
                  <option value={0}>Active</option>
                  <option value={1}>Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="cursor-pointer rounded-xl border-0 bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Edit2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Edit Client
                  </h3>
                  <p className="text-xs font-medium text-slate-400">
                    Update client details
                  </p>
                </div>
              </div>
              <button
                onClick={closeModals}
                className="rounded-lg border-0 bg-transparent p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full border bg-slate-50 p-3 text-xs ${clientFormErrors.name ? 'border-rose-400' : 'border-slate-200'} rounded-xl font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none`}
                />
                {clientFormErrors.name && (
                  <p className="text-[11px] font-medium text-rose-500">
                    {clientFormErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border bg-slate-50 p-3 text-xs ${clientFormErrors.email ? 'border-rose-400' : 'border-slate-200'} rounded-xl font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none`}
                  />
                  {clientFormErrors.email && (
                    <p className="text-[11px] font-medium text-rose-500">
                      {clientFormErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 transition-all focus:border-[#1E3A8A] focus:outline-none"
                >
                  <option value={0}>Active</option>
                  <option value={1}>Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="cursor-pointer rounded-xl border-0 bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Client Modal */}
      {deletingClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-2xl duration-200 animate-in zoom-in-95">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">
                Delete Client?
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Are you sure you want to delete this client?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={closeModals}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="cursor-pointer rounded-xl border-0 bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
