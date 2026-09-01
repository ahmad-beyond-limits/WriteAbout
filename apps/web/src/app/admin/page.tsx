'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserRecord {
  id: number;
  username: string;
  email: string | null;
  role: 'admin' | 'user';
  createdAt: string;
  hasApiKey: boolean;
  typingTestsCount: number;
  practicesCount: number;
  lastActive: string;
}

interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalTypingTests: number;
  averageWpm: number;
  totalPractices: number;
}

export default function AdminPortalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [addError, setAddError] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Password reset modal
  const [resetTargetUser, setResetTargetUser] = useState<UserRecord | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Delete confirm modal
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdminData = useCallback(async (user: { id: number; username: string }) => {
    setIsLoading(true);
    try {
      const headers = {
        'x-admin-id': user.id.toString(),
        'x-admin-username': user.username
      };

      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/stats', { headers })
      ]);

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (usersRes.ok && usersData.success) {
        setUsers(usersData.users);
      } else {
        alert(usersData.error || 'Failed to load users');
        router.push('/hub');
        return;
      }

      if (statsRes.ok && statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem('writeabout_user');
    if (!saved) {
      router.push('/login');
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (parsed.role !== 'admin' && parsed.username?.toLowerCase() !== 'muhammad ahmad') {
        alert('Access denied. Administrator privileges required.');
        router.push('/hub');
        return;
      }
      setCurrentUser(parsed);
      fetchAdminData(parsed);
    } catch (e) {
      router.push('/login');
    }
  }, [router, fetchAdminData]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newUsername.trim() || !newPassword.trim()) {
      setAddError('Username and password are required.');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentUser?.id.toString() || '',
          'x-admin-username': currentUser?.username || ''
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim(),
          role: newRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
        if (currentUser) fetchAdminData(currentUser);
      } else {
        setAddError(data.error || 'Failed to create user.');
      }
    } catch (err) {
      setAddError('Network error while adding user.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleToggleRole = async (targetUser: UserRecord) => {
    const updatedRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const confirmMsg = `Are you sure you want to change @${targetUser.username}'s role to ${updatedRole.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentUser?.id.toString() || '',
          'x-admin-username': currentUser?.username || ''
        },
        body: JSON.stringify({ role: updatedRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (currentUser) fetchAdminData(currentUser);
      } else {
        alert(data.error || 'Failed to update user role.');
      }
    } catch (err) {
      alert('Error updating user role.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !resetNewPassword.trim()) return;

    setIsSubmittingReset(true);
    setResetStatus('');
    try {
      const res = await fetch(`/api/admin/users/${resetTargetUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentUser?.id.toString() || '',
          'x-admin-username': currentUser?.username || ''
        },
        body: JSON.stringify({ newPassword: resetNewPassword.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetTargetUser(null);
        setResetNewPassword('');
        alert(`Password for @${resetTargetUser.username} successfully updated!`);
      } else {
        setResetStatus(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setResetStatus('Network error while resetting password.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTargetUser.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-id': currentUser?.id.toString() || '',
          'x-admin-username': currentUser?.username || ''
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteTargetUser(null);
        if (currentUser) fetchAdminData(currentUser);
      } else {
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      alert('Error deleting user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div
      className="min-h-screen bg-[#f6f8f5] text-[#1b2b20] selection:bg-[#d8e6db] selection:text-[#1b2b20] flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden"
      style={{ fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* ── Soft Ambient Glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-35 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(216, 235, 218, 0.6) 0%, rgba(240, 246, 238, 0.4) 50%, transparent 100%)' }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[550px] h-[550px] rounded-full opacity-30 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(245, 230, 190, 0.6) 0%, rgba(246, 248, 245, 0.5) 60%, transparent 100%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-6 flex-1 flex flex-col justify-between">
        
        {/* ── Top Header Navigation ── */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 rounded-2xl bg-white/85 border border-[#e1e9df] shadow-[0_4px_24px_rgba(27,43,32,0.03)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-[#1e3a24] flex items-center justify-center text-[#e8f2e9] font-bold text-sm shadow-xs transition-transform group-hover:scale-105 shrink-0">
                <svg className="w-4 h-4 text-[#a3d9ad]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#1b2b20]">
                duoprep
              </span>
            </Link>
            <span className="text-[#d8e3d6]">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#faedd0] border border-[#e8d09a] text-[#855307] text-[10.5px] font-bold uppercase tracking-wider">
              Administrator Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/hub"
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#d8e3d6] hover:bg-[#edf4ed] text-[#2c4731] text-xs font-semibold tracking-wider transition-all shadow-xs flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Hub</span>
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('writeabout_user');
                router.push('/login');
              }}
              title="Sign Out"
              className="w-8 h-8 rounded-xl bg-white border border-[#d8e3d6] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-[#556b5a] flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── Metric Summary Cards ── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-white/90 border border-[#dbe6d9] shadow-xs">
            <span className="text-[11px] font-semibold text-[#556b5a] uppercase tracking-wider">Total Users</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1b2b20] mt-1 font-['Sora',sans-serif]">
              {stats?.totalUsers ?? '...'}
            </div>
            <div className="text-[10.5px] text-[#6c8574] mt-0.5">Database Accounts</div>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white/90 border border-[#d8e3eb] shadow-xs">
            <span className="text-[11px] font-semibold text-[#3d6077] uppercase tracking-wider">Typing Tests</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#172b38] mt-1 font-['Sora',sans-serif]">
              {stats?.totalTypingTests ?? '...'}
            </div>
            <div className="text-[10.5px] text-[#5b7587] mt-0.5">Avg: {stats?.averageWpm ?? 0} WPM</div>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white/90 border border-[#dce6da] shadow-xs">
            <span className="text-[11px] font-semibold text-[#38593e] uppercase tracking-wider">Write Practices</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1e3a24] mt-1 font-['Sora',sans-serif]">
              {stats?.totalPractices ?? '...'}
            </div>
            <div className="text-[10.5px] text-[#556b5a] mt-0.5">Submitted Evaluations</div>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white/90 border border-[#ecdab0] shadow-xs">
            <span className="text-[11px] font-semibold text-[#855307] uppercase tracking-wider">Administrators</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#5c3702] mt-1 font-['Sora',sans-serif]">
              {stats?.totalAdmins ?? '...'}
            </div>
            <div className="text-[10.5px] text-[#8c7e6c] mt-0.5">Full Privileges</div>
          </div>
        </section>

        {/* ── User Management Station ── */}
        <section className="p-5 sm:p-7 rounded-3xl bg-white/95 border border-[#dbe6d9] shadow-[0_10px_30px_-5px_rgba(40,68,44,0.04)] space-y-4">
          
          {/* Action Header & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1b2b20] font-['Sora',sans-serif] tracking-tight">
                User Directory & Governance
              </h2>
              <p className="text-xs text-[#556b5a]">
                Manage accounts, assign administrator roles, reset credentials, or remove members.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto py-2 px-4 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] text-[#f2f7f2] text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <div className="relative w-full sm:flex-1">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f9986]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#f2f7f1] border border-[#dbe6d9] text-xs text-[#1b2b20] focus:outline-hidden focus:border-[#28442c] focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-[#f2f7f1] p-1 rounded-2xl border border-[#dbe6d9] w-full sm:w-auto justify-center">
              {(['all', 'admin', 'user'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-white text-[#1b2b20] shadow-xs'
                      : 'text-[#556b5a] hover:text-[#1b2b20]'
                  }`}
                >
                  {r === 'all' ? 'All' : r === 'admin' ? 'Admins' : 'Users'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#e1e9df]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7faf6] text-[#4d6353] uppercase font-bold text-[10px] tracking-wider border-b border-[#e1e9df]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-center">API Key</th>
                  <th className="py-3 px-3 text-center">Tests</th>
                  <th className="py-3 px-3 text-center">Practices</th>
                  <th className="py-3 px-3">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3eb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#6c8574]">
                      Loading users directory...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#6c8574]">
                      No users found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="hover:bg-[#f9fbf8] transition-colors">
                        {/* User info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                              u.role === 'admin'
                                ? 'bg-[#faedd0] text-[#784805] border border-[#e9cf97]'
                                : 'bg-[#e8f2e9] text-[#2c4731] border border-[#d0e3cf]'
                            }`}>
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[#1b2b20] flex items-center gap-1.5">
                                <span>{u.username}</span>
                                {isSelf && (
                                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-[#e8f2e9] text-[#2c4731] font-mono">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#788f7e] font-mono">ID: #{u.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-[#faedd0] text-[#784805] border border-[#e9cf97]'
                              : 'bg-[#eef4ee] text-[#4d6353] border border-[#dce6da]'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        {/* API Key */}
                        <td className="py-3 px-3 text-center">
                          {u.hasApiKey ? (
                            <span className="text-[#059669] font-semibold text-[11px] inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                              Saved
                            </span>
                          ) : (
                            <span className="text-[#8c9e90] text-[10.5px]">None</span>
                          )}
                        </td>

                        {/* Tests */}
                        <td className="py-3 px-3 text-center font-semibold text-[#1b2b20]">
                          {u.typingTestsCount}
                        </td>

                        {/* Practices */}
                        <td className="py-3 px-3 text-center font-semibold text-[#1b2b20]">
                          {u.practicesCount}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3 px-3 text-[#556b5a] text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Role Switch Button */}
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={isSelf && u.role === 'admin'}
                              title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              className="px-2 py-1 rounded-xl bg-white border border-[#d8e3d6] hover:bg-[#edf4ed] text-[#2c4731] text-[10.5px] font-semibold transition-all disabled:opacity-40 cursor-pointer"
                            >
                              {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => {
                                setResetTargetUser(u);
                                setResetNewPassword('');
                                setResetStatus('');
                              }}
                              title="Reset Password"
                              className="px-2 py-1 rounded-xl bg-white border border-[#d8e3d6] hover:bg-[#edf4ed] text-[#2c4731] text-[10.5px] font-semibold transition-all cursor-pointer"
                            >
                              Reset Pass
                            </button>

                            {/* Delete User Button */}
                            <button
                              onClick={() => setDeleteTargetUser(u)}
                              disabled={isSelf}
                              title="Delete Account"
                              className="p-1 rounded-xl bg-white border border-[#d8e3d6] hover:bg-rose-50 hover:border-rose-200 text-[#718676] hover:text-rose-600 transition-all disabled:opacity-30 cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
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

        </section>

        {/* ── Footer ── */}
        <footer className="w-full text-center text-xs text-[#6c8574] py-1">
          duoprep • Governance Console
        </footer>
      </div>

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl p-6 sm:p-7 bg-white/95 border border-[#dbe6d9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1e3a24] text-white flex items-center justify-center text-xs font-bold">
                  +
                </div>
                <h3 className="text-lg font-bold text-[#1b2b20] font-['Sora',sans-serif]">
                  Create New Account
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-[#f2f7f1] text-[#556b5a] hover:bg-[#e1ece0] flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4d6353] mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. speedmaster"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f2f7f1] border border-[#dbe6d9] text-xs text-[#1b2b20] focus:outline-hidden focus:border-[#28442c] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4d6353] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Initial temporary password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f2f7f1] border border-[#dbe6d9] text-xs text-[#1b2b20] focus:outline-hidden focus:border-[#28442c] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4d6353] mb-1">
                  Account Role
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('user')}
                    className={`flex-1 py-2 px-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                      newRole === 'user'
                        ? 'bg-[#1e3a24] text-white border-[#1e3a24]'
                        : 'bg-[#f2f7f1] text-[#4d6353] border-[#dbe6d9]'
                    }`}
                  >
                    User (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`flex-1 py-2 px-3 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                      newRole === 'admin'
                        ? 'bg-[#855307] text-white border-[#855307]'
                        : 'bg-[#faedd0] text-[#784805] border-[#e9cf97]'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-[#edf4ed] hover:bg-[#e1ede1] text-[#2c4731] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="flex-[2] py-2.5 px-4 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAdd ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl p-6 bg-white/95 border border-[#dbe6d9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1b2b20] font-['Sora',sans-serif]">
                Reset Password for @{resetTargetUser.username}
              </h3>
              <button
                onClick={() => setResetTargetUser(null)}
                className="w-7 h-7 rounded-full bg-[#f2f7f1] text-[#556b5a] hover:bg-[#e1ece0] flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {resetStatus && (
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {resetStatus}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4d6353] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#f2f7f1] border border-[#dbe6d9] text-xs text-[#1b2b20] focus:outline-hidden focus:border-[#28442c] focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-[#edf4ed] text-[#2c4731] text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="flex-[2] py-2.5 px-4 rounded-2xl bg-[#1e3a24] hover:bg-[#162d1c] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReset ? 'Updating...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-white/95 border border-rose-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#1b2b20] font-['Sora',sans-serif]">
                Delete User Account?
              </h3>
              <p className="text-xs text-[#556b5a] leading-relaxed">
                Permanently delete <strong>@{deleteTargetUser.username}</strong> and all associated typing and writing test records. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetUser(null)}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-[#edf4ed] text-[#2c4731] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
