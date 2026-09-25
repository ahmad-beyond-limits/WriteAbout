'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/lib/SettingsContext';
import { DuolingoCatIcon } from '@/components/DuolingoCatIcon';

interface UserData {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface GroqModelItem {
  id: string;
  name: string;
  owned_by?: string;
  context_window?: number | null;
  active?: boolean;
  supports_vision?: boolean;
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

  // API Key & Model state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<GroqModelItem[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modelHealth, setModelHealth] = useState<{ testing: boolean; valid?: boolean; latencyMs?: number; error?: string } | null>(null);

  // Real-time model health check probe
  const checkModelHealth = async (modelToCheck: string) => {
    if (!modelToCheck || !modelToCheck.trim()) return;
    setModelHealth({ testing: true });
    try {
      const key = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('writeabout_apikey') || '' : '');
      const res = await fetch('/api/models/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelToCheck.trim(), apiKey: key, userId: user?.id })
      });
      const data = await res.json();
      if (data.success && data.valid) {
        setModelHealth({ testing: false, valid: true, latencyMs: data.latencyMs });
      } else {
        setModelHealth({
          testing: false,
          valid: false,
          error: data.error || 'Model is not accepting chat completions on your API key.'
        });
      }
    } catch {
      setModelHealth({ testing: false, valid: false, error: 'Connection check timed out.' });
    }
  };

  useEffect(() => {
    if (selectedModel) {
      checkModelHealth(selectedModel);
    }
  }, [selectedModel, apiKey, user?.id]);

  // Dynamically fetch live models from Groq API
  const fetchLiveModels = async (keyToUse?: string, forceRefresh: boolean = false) => {
    const key = keyToUse || apiKey || (typeof window !== 'undefined' ? localStorage.getItem('writeabout_apikey') || '' : '');
    setIsLoadingModels(true);
    try {
      let modelsData: GroqModelItem[] = [];
      let defModel = '';

      if (key && key.trim()) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${key.trim()}` }
          });
          if (res.ok) {
            const json = await res.json();
            const list: any[] = Array.isArray(json.data) ? json.data : [];
            const filtered = list.filter((m: any) => {
              const id = (m.id || '').toLowerCase();
              return (
                !id.includes('whisper') &&
                !id.includes('tts') &&
                !id.includes('guard') &&
                !id.includes('safeguard') &&
                !id.includes('prompt-guard') &&
                !id.includes('embedding') &&
                !id.includes('distil-whisper') &&
                !id.includes('orpheus') &&
                !id.includes('gemma2-9b-it') &&
                !id.includes('gemma-7b') &&
                m.active !== false
              );
            });
            modelsData = filtered.map((m: any) => ({
              id: m.id,
              name: m.id,
              owned_by: m.owned_by || 'groq',
              context_window: m.context_window,
              active: m.active ?? true,
              supports_vision: Array.isArray(m.input_modalities) ? m.input_modalities.includes('image') : (m.id.toLowerCase().includes('vision') || m.id.toLowerCase().includes('vl'))
            }));
            const qwen = modelsData.find(m => m.id.toLowerCase().includes('qwen') && m.supports_vision) || modelsData.find(m => m.id.toLowerCase().includes('qwen'));
            defModel = qwen ? qwen.id : (modelsData[0]?.id || '');
          }
        } catch (clientErr) {
          console.error('Direct Groq models fetch error, trying backend route:', clientErr);
        }
      }

      if (modelsData.length === 0) {
        const res = await fetch(`/api/models?${key ? `apiKey=${encodeURIComponent(key)}&` : ''}refresh=${forceRefresh}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.models) && data.models.length > 0) {
            modelsData = data.models;
            defModel = data.defaultModel || modelsData[0].id;
          }
        }
      }

      if (modelsData.length > 0) {
        setAvailableModels(modelsData);
        setSelectedModel(prev => {
          if (prev && modelsData.some(m => m.id === prev)) return prev;
          return defModel || modelsData[0].id;
        });
      }
    } catch (err) {
      console.error('Failed to fetch live models in settings:', err);
    } finally {
      setIsLoadingModels(false);
    }
  };

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

      const storedKey = localStorage.getItem('writeabout_apikey') || '';
      const storedModel = localStorage.getItem('writeabout_model') || '';
      setApiKey(storedKey);
      if (storedModel) {
        setSelectedModel(storedModel);
      }
      fetchLiveModels(storedKey);
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
    localStorage.removeItem('writeabout_model');
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

  // Handle Save API Key & Model Selection
  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiKeyMessage(null);

    if (!apiKey.trim()) {
      setApiKeyMessage({ type: 'error', text: 'Please enter a valid Groq API key (e.g. gsk_...).' });
      return;
    }

    setIsSavingApiKey(true);
    try {
      const verifyRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` }
      });
      if (!verifyRes.ok) {
        setApiKeyMessage({ type: 'error', text: 'Invalid Groq API key. Please check your key on groq.com.' });
        setIsSavingApiKey(false);
        return;
      }

      // Also parse live models from the verified response
      try {
        const modelsJson = await verifyRes.json();
        if (Array.isArray(modelsJson.data)) {
          const filtered = modelsJson.data
            .filter((m: any) => {
              const id = (m.id || '').toLowerCase();
              return (
                !id.includes('whisper') &&
                !id.includes('tts') &&
                !id.includes('guard') &&
                !id.includes('safeguard') &&
                !id.includes('prompt-guard') &&
                !id.includes('embedding') &&
                !id.includes('distil-whisper') &&
                !id.includes('orpheus') &&
                m.active !== false
              );
            })
            .map((m: any) => ({
              id: m.id,
              name: m.id,
              owned_by: m.owned_by || 'groq',
              active: m.active ?? true
            }));
          if (filtered.length > 0) {
            setAvailableModels(filtered);
          }
        }
      } catch {}

      const modelToSave = isCustomModel && customModelInput.trim() ? customModelInput.trim() : selectedModel;
      const saveRes = await fetch('/api/auth/save-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, apiKey: apiKey.trim() })
      });
      const saveData = await saveRes.json();
      if (saveRes.ok && saveData.success) {
        localStorage.setItem('writeabout_apikey', apiKey.trim());
        if (modelToSave) {
          localStorage.setItem('writeabout_model', modelToSave);
          setSelectedModel(modelToSave);
        }
        setApiKeyMessage({ type: 'success', text: `Groq API Key verified & saved! Active model: ${modelToSave || selectedModel}` });
      } else {
        setApiKeyMessage({ type: 'error', text: saveData.error || 'Failed to save API key to server.' });
      }
    } catch {
      setApiKeyMessage({ type: 'error', text: 'Network error verifying API key. Please check your internet connection.' });
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('writeabout_apikey');
    setApiKey('');
    setApiKeyMessage({ type: 'success', text: 'API key has been cleared from local workspace.' });
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
            <DuolingoCatIcon className="w-8 h-8 rounded-xl shadow-xs transition-transform group-hover:scale-105 shrink-0" />
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

          {/* Card 3: AI Engine & Model Configuration */}
          <section className="bg-white/90 border border-[#e1e9df] rounded-3xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(27,43,32,0.04)] backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0f4ee] mb-6">
              <div className="flex items-center gap-3">
                <DuolingoCatIcon className="w-10 h-10 rounded-2xl shadow-xs shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-[#1b2b20] font-['Sora',sans-serif]">
                    AI Evaluation & Groq API Engine
                  </h2>
                  <p className="text-xs text-[#556b5a]">
                    Configure your free Groq API key and select the AI model for WriteAbout evaluation
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#e8f2e9] text-[#1e3a24] border border-[#cfe2d1]">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span>Free & Unlimited</span>
              </span>
            </div>

            {apiKeyMessage && (
              <div
                className={`mb-5 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                  apiKeyMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {apiKeyMessage.type === 'success' ? (
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
                <span>{apiKeyMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              {/* Model Selection Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#354d3b] uppercase tracking-wider">
                    Evaluation Model
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchLiveModels(apiKey, true)}
                    disabled={isLoadingModels}
                    className="text-[11px] font-medium text-[#556b5a] hover:text-[#1b2b20] transition-colors cursor-pointer"
                  >
                    {isLoadingModels ? 'Fetching models...' : 'Refresh list'}
                  </button>
                </div>

                {!isCustomModel ? (
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomModel(true);
                        setCustomModelInput(selectedModel);
                      } else {
                        setSelectedModel(e.target.value);
                        localStorage.setItem('writeabout_model', e.target.value);
                      }
                    }}
                    disabled={isLoadingModels && availableModels.length === 0}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] focus:bg-white text-sm text-[#1b2b20] transition-all outline-none cursor-pointer"
                  >
                    {availableModels.length > 0 ? (
                      <>
                        {/* Dynamic Qwen Models */}
                        {availableModels.some(m => m.id.toLowerCase().includes('qwen')) && (
                          <optgroup label="Recommended (Qwen)">
                            {availableModels
                              .filter(m => m.id.toLowerCase().includes('qwen'))
                              .map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.id}{m.supports_vision ? ' (Vision)' : ''}
                                </option>
                              ))}
                          </optgroup>
                        )}

                        {/* Dynamic Meta Llama Models */}
                        {availableModels.some(m => m.id.toLowerCase().includes('llama')) && (
                          <optgroup label="Meta Llama">
                            {availableModels
                              .filter(m => m.id.toLowerCase().includes('llama'))
                              .map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.id}{m.supports_vision ? ' (Vision)' : ''}
                                </option>
                              ))}
                          </optgroup>
                        )}

                        {/* Dynamic DeepSeek Models */}
                        {availableModels.some(m => m.id.toLowerCase().includes('deepseek')) && (
                          <optgroup label="DeepSeek">
                            {availableModels
                              .filter(m => m.id.toLowerCase().includes('deepseek'))
                              .map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.id}{m.supports_vision ? ' (Vision)' : ''}
                                </option>
                              ))}
                          </optgroup>
                        )}

                        {/* Dynamic Other Models */}
                        {availableModels.some(m => !m.id.toLowerCase().includes('qwen') && !m.id.toLowerCase().includes('llama') && !m.id.toLowerCase().includes('deepseek')) && (
                          <optgroup label="Other Models">
                            {availableModels
                              .filter(m => !m.id.toLowerCase().includes('qwen') && !m.id.toLowerCase().includes('llama') && !m.id.toLowerCase().includes('deepseek'))
                              .map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.id}{m.supports_vision ? ' (Vision)' : ''}
                                </option>
                              ))}
                          </optgroup>
                        )}

                        <optgroup label="Custom">
                          <option value="__custom__">Enter custom model ID...</option>
                        </optgroup>
                      </>
                    ) : (
                      <>
                        <option value={selectedModel || ''}>
                          {selectedModel ? selectedModel : 'Loading available models...'}
                        </option>
                        <option value="__custom__">Enter custom model ID...</option>
                      </>
                    )}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customModelInput}
                        onChange={(e) => setCustomModelInput(e.target.value)}
                        placeholder="e.g. qwen/qwen3.8-27b"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] focus:bg-white text-sm font-mono text-[#1b2b20] transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customModelInput.trim()) {
                            setSelectedModel(customModelInput.trim());
                            localStorage.setItem('writeabout_model', customModelInput.trim());
                          }
                          setIsCustomModel(false);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#1e3a24] text-white text-xs font-bold hover:bg-[#2d5236] transition-colors cursor-pointer"
                      >
                        Set Model
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCustomModel(false)}
                        className="px-3 py-2.5 rounded-xl bg-[#e8f2e9] text-[#1e3a24] text-xs font-bold hover:bg-[#d8e8da] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Model Health Status */}
                {modelHealth && (
                  <div className="pt-2">
                    {modelHealth.testing ? (
                      <div className="flex items-center gap-2 text-xs text-[#556b5a] font-medium">
                        <span className="w-2.5 h-2.5 border-2 border-slate-300 border-t-[#1e3a24] rounded-full animate-spin shrink-0" />
                        <span>Checking model availability...</span>
                      </div>
                    ) : modelHealth.valid ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>
                          Active & responding{typeof modelHealth.latencyMs === 'number' ? ` (${modelHealth.latencyMs}ms)` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="font-semibold">Model status: </span>
                            <span className="text-rose-700">{modelHealth.error}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[11px] text-slate-500 font-medium">Choose alternative model:</span>
                          {availableModels
                            .filter(m => m.id !== selectedModel)
                            .slice(0, 3)
                            .map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedModel(m.id);
                                  localStorage.setItem('writeabout_model', m.id);
                                }}
                                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                              >
                                {m.id.split('/').pop()}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* API Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#354d3b] uppercase tracking-wider">
                    Groq API Key
                  </label>
                  <a
                    href="https://groq.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#059669] hover:text-[#047857] inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Get Free Key on Groq.com</span>
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f8faf7] border border-[#d8e3d6] focus:border-[#1e3a24] focus:bg-white text-sm font-mono text-[#1b2b20] transition-all outline-none pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718b76] hover:text-[#1b2b20] p-1 cursor-pointer"
                  >
                    {showApiKey ? (
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
                {apiKey.startsWith('gsk_') && (
                  <div className="flex items-center gap-1 text-[11px] text-[#059669] font-medium mt-1">
                    <span>✓</span>
                    <span>Valid Groq API key format</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                {apiKey ? (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="px-3.5 py-2 rounded-xl bg-white border border-[#d8e3d6] hover:bg-rose-50 hover:border-rose-200 text-rose-700 font-semibold text-xs transition-all cursor-pointer"
                  >
                    Clear API Key
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  disabled={isSavingApiKey}
                  className="px-5 py-2.5 rounded-xl bg-[#1e3a24] hover:bg-[#2a4e32] active:scale-95 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingApiKey ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying & Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Verify & Save API Key</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Card 4: Caret Smoothing & Typing Physics */}
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
