import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminService } from '../../services/adminService';
import Modal from '../../components/Modal';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { UserPlus, CheckCircle, XCircle, Shield } from 'lucide-react';

const ROLE_COLORS = {
  admin: 'bg-rose-100 text-rose-700',
  collector: 'bg-amber-100 text-amber-800',
  technician: 'bg-blue-100 text-blue-800',
  user: 'bg-slate-100 text-slate-700',
};

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'collector',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, fromDate, toDate, sort, pagination.page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAllUsers({
        search: search || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sort,
      });
      if (res.success) {
        setUsers(res.users || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Users could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminService.createStaff(form);
      if (res.success) {
        setFeedback(`${form.name} added as ${form.role}!`);
        setShowAddModal(false);
        setForm({ name: '', email: '', password: '', role: 'collector', phone: '' });
        fetchUsers();
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create staff');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (userId, currentStatus) => {
    try {
      await adminService.toggleUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Manage all registered users and staff accounts."
    >
      <ErrorNotice message={error} />
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <FilterBar
          search={search}
          onSearchChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })); }}
          searchPlaceholder="Search name or email..."
          filters={[{ name: 'role', label: 'Role', value: roleFilter, onChange: (value) => { setRoleFilter(value); setPagination((current) => ({ ...current, page: 1 })); }, options: [
            { value: 'ALL', label: 'All roles' }, { value: 'admin', label: 'Admin' },
            { value: 'collector', label: 'Collector' }, { value: 'technician', label: 'Technician' },
            { value: 'user', label: 'User' },
          ] }]}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
          onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
          sort={sort}
          sortOptions={[{ value: '-createdAt', label: 'Newest first' }, { value: 'createdAt', label: 'Oldest first' }, { value: 'name', label: 'Name' }, { value: 'email', label: 'Email' }]}
          onSortChange={(value) => { setSort(value); setPagination((current) => ({ ...current, page: 1 })); }}
          onClear={() => { setSearch(''); setRoleFilter('ALL'); setFromDate(''); setToDate(''); setSort('-createdAt'); setPagination((current) => ({ ...current, page: 1 })); }}
        />
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-700">
            {pagination.total} users
          </p>
        </div>
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Points</th>
                  <th className="py-4 px-6">Joined</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs shrink-0">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{u.email}</td>
                    <td className="py-4 px-6 text-slate-500">{u.phone || '—'}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${ROLE_COLORS[u.role]}`}>
                        <Shield className="w-3 h-3" />
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-700">{u.rewardPoints || 0} pts</td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggle(u._id, u.isActive !== false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition"
                        >
                          {u.isActive !== false ? (
                            <span className="flex items-center space-x-1 text-red-600">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-emerald-700">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-10 text-center text-xs text-slate-400">No users found.</div>
            )}
            {!loading && <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Staff Member"
      >
        <form onSubmit={handleAdd} className="space-y-4 text-xs">
          <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-100 rounded-xl p-3">
            Staff accounts (collector/technician) are created directly by admins.
          </p>
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Ravi Kumar' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'e.g. ravi@retech.com' },
            { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
            { label: 'Initial Password', key: 'password', type: 'password', placeholder: 'Set a temporary password' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block font-bold text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="collector">Collector</option>
              <option value="technician">Technician</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default UsersManagement;
