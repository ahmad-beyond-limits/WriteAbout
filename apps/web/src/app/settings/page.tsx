'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/lib/SettingsContext';

interface UserData {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const [user, setUser] = useState<UserData | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states for Danger Zone
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [isResettingData, setIsResettingData] = useState(false);
  const [resetError, setResetError] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('writeabout_user') || localStorage.getItem('swifttype_user');
    if (!stored) {
      router.push('/login');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setFirstName(parsed.firstName || '');
      setLastName(parsed.lastName || '');
    } catch {
      localStorage.removeItem('writeabout_user');
      localStorage.removeItem('swifttype_user');
      router.push('/login');
    } finally {
      setIsReady(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('writeabout_user');
    localStorage.removeItem('swifttype_user');
    localStorage.removeItem('writeabout_apikey');
    router.push('/login');
  };

  // Handle Profile Name Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setProfileMessage({ type: 'error', text: 'First name and last name cannot be empty.' });
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updated: UserData = {
          ...user!,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role || user?.role,
        };
        setUser(updated);
        localStorage.setItem('writeabout_user', JSON.stringify(updated));
        localStorage.setItem('swifttype_user', JSON.stringify(updated));
        setProfileMessage({ type: 'success', text: 'Your name has been updated successfully.' });
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update name.' });
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Reset/Change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordMessage({ type: 'error', text: 'New password cannot be the same as your current password.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMessage({ type: 'success', text: 'Your password has been changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Reset Account Data (Clear practice & typing records)
  const handleResetAccountData = async () => {
    setResetError('');
    if (!resetPasswordInput) {
      setResetError('Please enter your password to confirm data reset.');
      return;
    }

    setIsResettingData(true);
    try {
      const res = await fetch('/api/user/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          password: resetPasswordInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowResetModal(false);
        setResetPasswordInput('');
        alert('All practice records, typing tests, and metrics have been cleared successfully.');
        router.push('/hub');
      } else {
        setResetError(data.error || 'Failed to reset account data.');
      }
    } catch {
      setResetError('Network error while resetting data.');
    } finally {
      setIsResettingData(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePasswordInput) {
      setDeleteError('Please enter your password to confirm deletion.');
      return;
    }

    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE in capital letters to confirm.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          password: deletePasswordInput,
          confirmationText: deleteConfirmText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowDeleteModal(false);
        handleLogout();
        alert('Your account and all associated records have been permanently deleted.');
      } else {
        setDeleteError(data.error || 'Failed to delete account.');
      }
    } catch {
      setDeleteError('Network error while deleting account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-[#f6f8f5] flex items-center justify-center text-[#556b5a] font-mono text-xs">
        Loading settings...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f6f8f5] text-[#1b2b20] selection:bg-[#f3e5c8] selection:text-[#1b2b20] flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden"
      style={{ fontFamily: "'Switzer', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Soft Ambient Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-35 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(245, 230, 190, 0.6) 0%, rgba(240, 246, 238, 0.4) 50%, transparent 100%)' }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[550px] h-[550px] rounded-full opacity-30 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(230, 215, 180, 0.6) 0%, rgba(246, 248, 245, 0.5) 60%, transparent 100%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-6 flex-1 flex flex-col justify-between">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-white/85 border border-[#e1e9df] shadow-[0_4px_24px_rgba(27,43,32,0.03)] backdrop-blur-xl">
          <Link href="/hub" className="flex items-center gap-2.5 group">
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

          <div className="flex items-center gap-2">
            <Link
              href="/hub"
              className="px-3 py-1.5 rounded-xl bg-white border border-[#d8e3d6] hover:bg-[#f0f4ee] text-[#1b2b20] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-[#556b5a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Back to Hub</span>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-9 h-9 rounded-xl bg-white border border-[#d8e3d6] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-[#556b5a] flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1b2b20] font-['Sora',sans-serif]">
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#556b5a] mt-1">
            Manage your personal profile, security credentials, and workspace preferences.
          </p>
        </div>

        {/* Main Settings Grid */}
        <div className="space-y-6">
          {/* Card 1: Profile & Name */}
          <section className="bg-white/90 border border-[#e1e9df] rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(27,43,32,0.04)] backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0f4ee] mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e8f2e9] text-[#1e3a24] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1b2b20] font-['Sora',sans-serif]">
                    Personal Information
                  </h2>
                  <p className="text-xs text-[#556b5a]">
                    Update your full name and display information
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#e8f2e9] text-[#1e3a24] border border-[#cfe2d1]">
                  {user.role === 'admin' ? 'Administrator' : 'Standard Member'}
                </span>
              </div>
            </div>

            {profileMessage && (
              <div
                className={`mb-5 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#354d3b] mb-1.5 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] focus:bg-white text-sm text-[#1b2b20] transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#354d3b] mb-1.5 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] focus:bg-white text-sm text-[#1b2b20] transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#718b76] mb-1.5 uppercase tracking-wider">
                  Username (Identifier)
                </label>
                <input
                  type="text"
                  disabled
                  value={user.username}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#eef2ec] border border-[#d8e3d6] text-sm text-[#718b76] cursor-not-allowed select-none outline-none font-mono"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 rounded-xl bg-[#1e3a24] hover:bg-[#2a4e32] active:scale-95 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Update Name</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Card 2: Security & Password Reset */}
          <section className="bg-white/90 border border-[#e1e9df] rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(27,43,32,0.04)] backdrop-blur-xl">
            <div className="flex items-center gap-3 pb-4 border-b border-[#f0f4ee] mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#faedd0] text-[#855307] flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1b2b20] font-['Sora',sans-serif]">
                  Password & Security
                </h2>
                <p className="text-xs text-[#556b5a]">
                  Change your login password with secure credential verification
                </p>
              </div>
            </div>

            {passwordMessage && (
              <div
                className={`mb-5 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#354d3b] mb-1.5 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] focus:bg-white text-sm text-[#1b2b20] transition-all outline-none pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718b76] hover:text-[#1b2b20] p-1 cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#354d3b] mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] focus:bg-white text-sm text-[#1b2b20] transition-all outline-none pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718b76] hover:text-[#1b2b20] p-1 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#354d3b] mb-1.5 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] focus:bg-white text-sm text-[#1b2b20] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2.5 rounded-xl bg-[#855307] hover:bg-[#99600a] active:scale-95 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Card 3: Caret Smoothing & Typing Physics */}
          <section className="bg-white/90 border border-[#e1e9df] rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(27,43,32,0.04)] backdrop-blur-xl">
            <div className="flex items-center gap-3 pb-4 border-b border-[#f0f4ee] mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#e8f2e9] text-[#1e3a24] flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1b2b20] font-['Sora',sans-serif]">
                  Typing Physics & Caret Smoothing
                </h2>
                <p className="text-xs text-[#556b5a]">
                  Customize hardware-accelerated cursor glide and sliding animation physics
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#354d3b] mb-2 uppercase tracking-wider">
                  Caret Glide Speed
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'slow',
                      title: 'Slow (Cinematic)',
                      badge: 'Default',
                      desc: 'Pronounced, buttery slide effect inspired by MonkeyType.',
                      speed: '0.15s'
                    },
                    {
                      id: 'medium',
                      title: 'Medium (Balanced)',
                      badge: 'Smooth',
                      desc: 'Balanced fluid glide ideal for high-speed typing.',
                      speed: '0.09s'
                    },
                    {
                      id: 'fast',
                      title: 'Fast (Snappy)',
                      badge: 'Quick',
                      desc: 'Snappy response with subtle glide physics.',
                      speed: '0.05s'
                    },
                    {
                      id: 'off',
                      title: 'Off (Instant)',
                      badge: 'Raw',
                      desc: 'Zero animation. Caret snaps instantly between chars.',
                      speed: '0.00s'
                    }
                  ].map((option) => {
                    const currentSmoothness = typeof settings?.smoothCaret === 'string' 
                      ? settings.smoothCaret 
                      : (settings?.smoothCaret ? 'slow' : 'off');
                    const isSelected = currentSmoothness === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => updateSettings({ smoothCaret: option.id as any })}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#eef5ee] border-[#244b2a] shadow-sm ring-2 ring-[#244b2a]/15'
                            : 'bg-[#f8faf7] border-[#d8e3d6] hover:border-[#b8ccb6] hover:bg-[#f0f4ee]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-[#1b2b20] font-['Sora',sans-serif]">
                              {option.title}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isSelected
                                ? 'bg-[#1e3a24] text-white'
                                : 'bg-black/5 text-[#556b5a]'
                            }`}>
                              {option.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#556b5a] leading-relaxed">
                            {option.desc}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-[#d8e3d6]/60 flex items-center justify-between text-[10px] font-mono text-[#718b76]">
                          <span>Transition</span>
                          <span className="font-bold text-[#1b2b20]">{option.speed}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Card 4: Danger Zone */}
          <section className="bg-white/90 border border-rose-200/80 rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(225,29,72,0.04)] backdrop-blur-xl">
            <div className="flex items-center gap-3 pb-4 border-b border-rose-100 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-rose-900 font-['Sora',sans-serif]">
                  Danger Zone
                </h2>
                <p className="text-xs text-rose-700/80">
                  Irreversible actions regarding your test records and user account
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Reset Data Option */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-2xl bg-rose-50/60 border border-rose-200/70 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-rose-950">
                    Reset Practice & Typing History
                  </h3>
                  <p className="text-xs text-rose-800/80 mt-0.5">
                    Clear all your completed typing tests, image writing practices, and speed analytics. Your login credentials remain active.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetError('');
                    setResetPasswordInput('');
                    setShowResetModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Reset Records
                </button>
              </div>

              {/* Delete Account Option */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-2xl bg-rose-50/60 border border-rose-200/70 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-rose-950">
                    Delete User Account
                  </h3>
                  <p className="text-xs text-rose-800/80 mt-0.5">
                    Permanently delete your user profile and wipe all test records from the database. This action cannot be reversed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError('');
                    setDeletePasswordInput('');
                    setDeleteConfirmText('');
                    setShowDeleteModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-[#718b76] py-3">
          duoprep · Workspace settings & account privacy
        </footer>
      </div>

      {/* ── Modal: Reset Account Data ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-[#e1e9df] shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-[#1b2b20] font-['Sora',sans-serif]">
                Confirm Practice Reset
              </h3>
              <p className="text-xs text-[#556b5a] mt-1">
                Are you sure you want to reset all your typing tests and visual writing practices? This action is immediate and cannot be undone.
              </p>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {resetError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#354d3b] mb-1.5 uppercase tracking-wider">
                Enter Password to Confirm
              </label>
              <input
                type="password"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                placeholder="Your account password"
                className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] text-sm outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#d8e3d6] text-[#556b5a] hover:bg-[#f0f4ee] text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResettingData}
                onClick={handleResetAccountData}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isResettingData ? 'Resetting Data...' : 'Confirm & Clear Records'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Account Permanently ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-rose-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-rose-950 font-['Sora',sans-serif]">
                Permanently Delete Account
              </h3>
              <p className="text-xs text-rose-800/80 mt-1">
                This will permanently delete your account (<span className="font-mono font-bold text-rose-950">{user.username}</span>) and all associated practice data from PostgreSQL.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#354d3b] mb-1.5 uppercase tracking-wider">
                  Enter Password
                </label>
                <input
                  type="password"
                  value={deletePasswordInput}
                  onChange={(e) => setDeletePasswordInput(e.target.value)}
                  placeholder="Your account password"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-rose-500 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#354d3b] mb-1.5 uppercase tracking-wider">
                  Type <span className="font-mono text-rose-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-rose-500 text-sm outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#d8e3d6] text-[#556b5a] hover:bg-[#f0f4ee] text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
