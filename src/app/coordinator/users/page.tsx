'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, Plus, Users as UsersIcon, X } from 'lucide-react';

type UserRole = 'Student' | 'Teacher' | 'Mentor' | 'Coordinator';
type UserStatus = 'Active' | 'Inactive';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: UserStatus;
}

const ROLE_OPTIONS: UserRole[] = ['Student', 'Teacher', 'Mentor', 'Coordinator'];
const DEPARTMENT_SUGGESTIONS = [
  'Computer Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
];

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-[72px] bg-[#FFFFFF] border-b border-[#E5E7EB] px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-[#111827] tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-[#6B7280] font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function normalizeRole(role: string): UserRole {
  if (role === 'Student' || role === 'Teacher' || role === 'Mentor' || role === 'Coordinator') {
    return role;
  }
  return 'Student';
}

function normalizeStatus(status: string): UserStatus {
  return status === 'Inactive' ? 'Inactive' : 'Active';
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [department, setDepartment] = useState(DEPARTMENT_SUGGESTIONS[0]);
  const [status, setStatus] = useState<UserStatus>('Active');
  const [password, setPassword] = useState('');

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/coordinator/users', { cache: 'no-store' });
      const json = await response.json();

      if (response.ok && json?.success && Array.isArray(json?.data?.users)) {
        const records: UserRecord[] = json.data.users.map((user: UserRecord) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: normalizeRole(user.role),
          department: user.department || 'Unknown',
          status: normalizeStatus(user.status),
        }));

        setUsers(records);
      } else {
        setBanner({
          type: 'error',
          text: json?.message || 'Unable to load users from backend.',
        });
      }
    } catch {
      setBanner({
        type: 'error',
        text: 'Unable to load users from backend.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadUsers]);

  const filteredUsers = useMemo(
    () => (filterRole === 'All' ? users : users.filter((user) => user.role === filterRole)),
    [users, filterRole]
  );

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('Student');
    setDepartment(DEPARTMENT_SUGGESTIONS[0]);
    setStatus('Active');
    setPassword('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setDepartment(user.department);
    setStatus(user.status);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/coordinator/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await response.json();

      if (response.ok && json?.success) {
        setBanner({ type: 'success', text: json?.message || 'User deleted successfully.' });
        await loadUsers();
      } else {
        setBanner({
          type: 'error',
          text: json?.message || 'Failed to delete user.',
        });
      }
    } catch {
      setBanner({ type: 'error', text: 'Failed to delete user.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !department.trim()) {
      setBanner({ type: 'error', text: 'Name, email, and department are required.' });
      return;
    }

    if (!editingUser && password.trim().length < 8) {
      setBanner({
        type: 'error',
        text: 'Password must be at least 8 characters for new users.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const method = editingUser ? 'PUT' : 'POST';
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: department.trim(),
        status,
      };

      if (editingUser) {
        payload.id = editingUser.id;
      }

      if (password.trim()) {
        payload.password = password.trim();
      }

      const response = await fetch('/api/coordinator/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (response.ok && json?.success) {
        setBanner({
          type: 'success',
          text: json?.message || (editingUser ? 'User updated successfully.' : 'User created successfully.'),
        });
        setIsModalOpen(false);
        await loadUsers();
      } else {
        setBanner({
          type: 'error',
          text: json?.message || 'Unable to save user.',
        });
      }
    } catch {
      setBanner({
        type: 'error',
        text: 'Unable to save user.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB] h-full overflow-hidden">
      <Topbar title="User Management" subtitle="Create, edit, and assign roles for students, teachers, mentors, and coordinators" />

      <main className="flex-1 flex flex-col p-8 overflow-hidden max-w-[1400px]">
        {banner && (
          <div
            className={`mb-4 rounded-lg p-3 text-xs font-semibold border ${
              banner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {banner.text}
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <UsersIcon className="w-4 h-4 text-[#6B7280]" />
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Role Base:</span>
            </div>
            {['All', ...ROLE_OPTIONS].map((roleOption) => (
              <button
                key={roleOption}
                onClick={() => setFilterRole(roleOption)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterRole === roleOption
                    ? 'bg-[#111827] text-white'
                    : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:text-[#111827]'
                }`}
              >
                {roleOption}
              </button>
            ))}
          </div>

          <button
            onClick={openAddModal}
            disabled={submitting}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Name & ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Role & Department</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[13px] font-semibold text-[#6B7280]">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[13px] font-semibold text-[#6B7280]">
                      No users found for this role.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#F9FAFB]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-[14px] font-bold text-[#111827]">{user.name}</div>
                        <div className="text-[11px] font-medium text-[#6B7280] mt-0.5">{user.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex bg-[#F9FAFB] border border-[#E5E7EB] text-[#111827] px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase mr-2">
                          {user.role}
                        </span>
                        <div className="text-[12px] font-semibold text-[#6B7280] mt-1.5">{user.department}</div>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-[#4B5563]">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                            user.status === 'Active'
                              ? 'bg-emerald-50 text-[#10B981] border-emerald-200'
                              : 'bg-gray-50 text-[#6B7280] border-[#E5E7EB]'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-[#6B7280] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit"
                            disabled={submitting}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handleDelete(user.id)}
                            className="p-2 text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                            disabled={submitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal CRUD Interface */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#FFFFFF] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#111827]">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-[#6B7280] hover:text-[#111827]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(event) => void handleSubmit(event)} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    type="text"
                    className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="user@college.edu"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Role</label>
                    <select
                      value={role}
                      onChange={(event) => setRole(event.target.value as UserRole)}
                      className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {ROLE_OPTIONS.map((roleOption) => (
                        <option key={roleOption} value={roleOption}>
                          {roleOption}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value as UserStatus)}
                      className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Department</label>
                  <input
                    required
                    list="department-options"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    type="text"
                    className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder="Department"
                  />
                  <datalist id="department-options">
                    {DEPARTMENT_SUGGESTIONS.map((departmentOption) => (
                      <option key={departmentOption} value={departmentOption} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">
                    {editingUser ? 'New Password (Optional)' : 'Temporary Password'}
                  </label>
                  <input
                    required={!editingUser}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    placeholder={editingUser ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-[#E5E7EB] mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 font-bold text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded-lg transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-sm text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-60"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
