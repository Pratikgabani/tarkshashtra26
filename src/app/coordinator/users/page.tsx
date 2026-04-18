'use client';

import { useState } from 'react';
import { MOCK_USERS, type Department, UserRecord, UserRole } from '@/src/lib/coordinatorData';
import { Pencil, Trash2, Plus, Users as UsersIcon, X } from 'lucide-react';

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

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>(MOCK_USERS);
  const [filterRole, setFilterRole] = useState<string>('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Student');
  const [department, setDepartment] = useState<Department>('Computer Eng.');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const filteredUsers = filterRole === 'All' ? users : users.filter(u => u.role === filterRole);

  const handleDelete = (id: string) => {
    if(confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('Student');
    setDepartment('Computer Eng.');
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setDepartment(user.department);
    setStatus(user.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name, email, role, department, status } : u));
    } else {
      const newUser: UserRecord = {
        id: `U00${users.length + 1}`,
        name, email, role, department, status
      };
      setUsers([...users, newUser]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB] h-full overflow-hidden">
      <Topbar title="User Management" subtitle="Create, edit, and assign roles for students, teachers, and mentors" />

      <main className="flex-1 flex flex-col p-8 overflow-hidden max-w-[1400px]">
        
        {/* Actions Bar */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
              <UsersIcon className="w-4 h-4 text-[#6B7280]" />
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Role Base:</span>
            </div>
            {['All', 'Student', 'Teacher', 'Mentor'].map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterRole === r 
                    ? 'bg-[#111827] text-white' 
                    : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:text-[#111827]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
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
                 {filteredUsers.map(user => (
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
                     <td className="px-6 py-4 text-[13px] font-medium text-[#4B5563]">
                       {user.email}
                     </td>
                     <td className="px-6 py-4">
                       <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold border ${user.status === 'Active' ? 'bg-emerald-50 text-[#10B981] border-emerald-200' : 'bg-gray-50 text-[#6B7280] border-[#E5E7EB]'}`}>
                         {user.status}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(user)} className="p-2 text-[#6B7280] hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                     </td>
                   </tr>
                 ))}
                 {filteredUsers.length === 0 && (
                   <tr>
                     <td colSpan={5} className="py-12 text-center text-[13px] font-semibold text-[#6B7280]">No users found for this role.</td>
                   </tr>
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
                <button onClick={() => setIsModalOpen(false)} className="text-[#6B7280] hover:text-[#111827]"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Full Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Email Address</label>
                  <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]" placeholder="user@college.edu" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option value="Student">Student</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Mentor">Mentor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Department</label>
                    <select value={department} onChange={e => setDepartment(e.target.value as Department)} className="w-full border border-[#E5E7EB] rounded-lg text-sm text-[#111827] px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]">
                      <option value="Computer Eng.">Computer Eng.</option>
                      <option value="Mechanical Eng.">Mechanical Eng.</option>
                      <option value="Civil Eng.">Civil Eng.</option>
                      <option value="Electrical Eng.">Electrical Eng.</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Status</label>
                  <div className="flex items-center gap-4 border border-[#E5E7EB] rounded-lg px-3 py-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] cursor-pointer">
                      <input type="radio" value="Active" checked={status === 'Active'} onChange={() => setStatus('Active')} className="accent-[#2563EB]" /> Active
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] cursor-pointer">
                      <input type="radio" value="Inactive" checked={status === 'Inactive'} onChange={() => setStatus('Inactive')} className="accent-[#2563EB]"/> Inactive
                    </label>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-[#E5E7EB] mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB] rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2 font-bold text-sm text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-sm transition-colors">{editingUser ? 'Save Changes' : 'Create User'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
