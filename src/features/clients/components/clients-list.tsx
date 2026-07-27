import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Users, AlertCircle, X, Mail, Phone, Briefcase } from 'lucide-react';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { useClients } from '../api/get-clients';
import { useCreateClient } from '../api/create-client';
import { useUpdateClient } from '../api/update-client';
import { useDeleteClient } from '../api/delete-client';
import { Client } from '../types';
import { formatDate } from '@/utils/format';

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

  const createMutation = useCreateClient({
    mutationConfig: {
      onSuccess: () => {
        addNotification({ type: 'success', title: 'Client added successfully' });
        closeModals();
      },
    },
  });

  const updateMutation = useUpdateClient({
    mutationConfig: {
      onSuccess: () => {
        addNotification({ type: 'success', title: 'Client updated successfully' });
        closeModals();
      },
    },
  });

  const deleteMutation = useDeleteClient({
    mutationConfig: {
      onSuccess: () => {
        addNotification({ type: 'success', title: 'Client deleted successfully' });
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
  };

  const openCreateModal = () => {
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setDescription('');
    setStatus(0);
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
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      description: description.trim(),
      status,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !name.trim()) return;
    const clientId = editingClient._id || editingClient.id || '';
    updateMutation.mutate({
      clientId,
      data: {
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        description: description.trim(),
        status,
      },
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
      <div className="flex h-48 w-full items-center justify-center text-red-500 gap-2 font-bold">
        <AlertCircle className="size-5" />
        Failed to load clients.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-100 p-4 rounded-3xl shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-4 top-2.5 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="block w-full rounded-full pl-10 pr-5 py-2 border border-slate-200 bg-white shadow-inner focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm transition-all"
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full hidden sm:inline-flex">
            {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'}
          </span>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/15 border-0 cursor-pointer transition-all h-10 px-6 text-sm shrink-0"
        >
          <Plus className="size-4" />
          Add Client
        </button>
      </div>

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <div className="flex h-64 w-full flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-8 text-slate-500 shadow-sm animate-in fade-in duration-500">
          <div className="rounded-full bg-slate-50 p-4 mb-4 border border-slate-100">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <span className="text-lg font-bold text-slate-700">No clients found</span>
          <p className="text-sm text-slate-400 mt-1 font-medium">Add a new client to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
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
                    <tr key={clientId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                            <Briefcase className="size-4" />
                          </div>
                          <span className="font-extrabold text-slate-900 text-sm">{client.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-700">
                          {client.companyName || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 space-y-0.5">
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
                          <span className="text-slate-400 font-normal italic">No contact info</span>
                        )}
                      </td>
                      <td className="p-4 max-w-xs truncate text-slate-500">
                        {client.description || 'No description'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            client.status === 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${client.status === 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {client.status === 0 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-semibold">
                        {client.createdAt ? formatDate(new Date(client.createdAt).getTime()) : 'N/A'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(client)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border-0 bg-transparent"
                            title="Edit Client"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeletingClientId(clientId)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-0 bg-transparent"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 border border-slate-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Briefcase className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Add Client</h3>
                  <p className="text-xs text-slate-400 font-medium">Create a new client entry</p>
                </div>
              </div>
              <button
                onClick={closeModals}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors border-0 bg-transparent"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Email</label>
                  <input
                    type="email"
                    placeholder="client@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief notes or description about the client..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all cursor-pointer"
                >
                  <option value={0}>Active</option>
                  <option value={1}>Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer border-0 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 border border-slate-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Edit2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Edit Client</h3>
                  <p className="text-xs text-slate-400 font-medium">Update client details</p>
                </div>
              </div>
              <button
                onClick={closeModals}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors border-0 bg-transparent"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Client Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(Number(e.target.value))}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-800 transition-all cursor-pointer"
                >
                  <option value={0}>Active</option>
                  <option value={1}>Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer border-0 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="size-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">Delete Client?</h3>
              <p className="text-xs text-slate-500 font-medium">Are you sure you want to delete this client?</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer border-0 disabled:opacity-50"
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
