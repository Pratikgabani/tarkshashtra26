'use client';

import { useEffect, useState } from 'react';
import { fetchStudentDashboardData, type StudentDashboardData } from '@/src/lib/studentDashboardClient';
import { Mail, BookOpen, GraduationCap, Users } from 'lucide-react';

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="app-topbar">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingMeeting, setRequestingMeeting] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const result = await fetchStudentDashboardData();
      if (result.ok) {
        setData(result.data);
        setError('');
        setFormFullName(result.data.student.fullName || '');
        setFormEmail(result.data.student.email || '');
      } else {
        setError(result.message);
      }
      setLoading(false);
    }

    void loadProfile();
  }, []);

  function openEditProfileModal() {
    if (!data) return;
    setFormFullName(data.student.fullName || '');
    setFormEmail(data.student.email || '');
    setError('');
    setNotice('');
    setEditingProfile(true);
  }

  async function handleSaveProfile() {
    const nextName = formFullName.trim();
    const nextEmail = formEmail.trim().toLowerCase();

    if (!nextName || !nextEmail) {
      setError('Full name and email are required.');
      return;
    }

    setSavingProfile(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: nextName,
          email: nextEmail,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json?.success) {
        setError(json?.message || 'Failed to update profile.');
        return;
      }

      const refreshed = await fetchStudentDashboardData();
      if (refreshed.ok) {
        setData(refreshed.data);
      }

      setEditingProfile(false);
      setNotice(json?.message || 'Profile updated successfully.');
    } catch {
      setError('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleRequestMeeting() {
    setRequestingMeeting(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/student/mentor-meeting', {
        method: 'POST',
      });
      const json = await response.json();

      if (!response.ok || !json?.success) {
        setError(json?.message || 'Failed to send meeting request.');
        return;
      }

      setNotice(json?.message || 'Meeting request sent.');
    } catch {
      setError('Failed to send meeting request.');
    } finally {
      setRequestingMeeting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">Profile unavailable</p>
          <p className="text-xs font-medium text-gray-500 mt-1">{error || 'Please refresh to retry.'}</p>
        </div>
      </div>
    );
  }

  const initials = data.student.fullName
    ? data.student.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';

  const mentorInitials = data.student.mentor?.fullName
    ? data.student.mentor.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'MN';

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#F8FAFC]">
      <Topbar title="My Profile" subtitle="Manage your academic details and mentorship information" />

      <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs font-semibold">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-xs font-semibold">
            {notice}
          </div>
        )}
        
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-r from-blue-600 to-indigo-600" />
          
          <div className="w-32 h-32 rounded-full border-4 border-white bg-linear-to-tr from-gray-100 to-gray-200 shadow-md flex items-center justify-center relative z-10 shrink-0">
             <span className="text-3xl font-black text-gray-500">{initials}</span>
          </div>
          
          <div className="flex-1 text-center md:text-left relative z-10 pt-4 md:pt-16">
            <h2 className="text-2xl font-black text-gray-900">{data.student.fullName}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" /> {data.student.email}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:block" />
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
                <GraduationCap className="w-4 h-4 text-gray-400" /> ID: {data.student.studentId}
              </span>
            </div>
          </div>

          <div className="relative z-10 md:pt-16 self-center md:self-auto">
            <button
              type="button"
              onClick={openEditProfileModal}
              className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors shadow-sm"
            >
              Edit Details
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Academic Details */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" /> Academic Information
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Department</p>
                <p className="text-sm font-bold text-gray-900">{data.student.department}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Semester</p>
                  <p className="text-sm font-bold text-gray-900">Semester {data.student.semester}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Batch</p>
                  <p className="text-sm font-bold text-gray-900">{data.student.batch}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Mentorship */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Mentorship
            </h3>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-indigo-600">
                  {mentorInitials}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Assigned Mentor</p>
                <p className="text-sm font-bold text-gray-900 mb-2">{data.student.mentor?.fullName || 'Not Assigned'}</p>
                {data.student.mentor?.email && (
                  <p className="text-xs font-semibold text-gray-500 mb-2">{data.student.mentor.email}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void handleRequestMeeting();
                  }}
                  disabled={requestingMeeting || !data.student.mentor}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 shadow-sm px-3 py-1.5 rounded-md transition-colors disabled:opacity-60"
                >
                  {requestingMeeting ? 'Sending...' : 'Request Meeting'}
                </button>
              </div>
            </div>
          </section>

          {/* Enrolled Subjects */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm md:col-span-2">
            <h3 className="text-base font-bold text-gray-900 mb-6">Enrolled Subjects</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.subjectPerformance.map((subject) => (
                <div key={subject.subjectId} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start justify-between group">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{subject.name}</h4>
                    <p className="text-[10px] font-medium text-gray-500 mt-1">{subject.faculty}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {editingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-gray-900">Edit Profile Details</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Update your display name and email address.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Full Name
                  </span>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(event) => setFormFullName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter full name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Email
                  </span>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(event) => setFormEmail(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter email address"
                  />
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(false);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSaveProfile();
                  }}
                  disabled={savingProfile}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

