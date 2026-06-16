'use client';

import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Lock, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Profile Form State
  const [email, setEmail] = useState(user?.email || '');
  const [geminiApiKey, setGeminiApiKey] = useState(user?.gemini_api_key || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Delete Account State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email address cannot be empty');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = await authApi.updateProfile(email, geminiApiKey || undefined);
      // Update store state
      useAuthStore.setState({ user: updatedUser });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to update profile';
      toast.error(errMsg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    setIsSavingPassword(true);
    try {
      await authApi.updatePassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to update password';
      toast.error(errMsg);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.toLowerCase() !== 'delete my account') {
      toast.error('Please type the exact phrase to confirm deletion');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await authApi.deleteAccount();
      toast.success('Your account and all associated data have been permanently deleted');
      setDeleteDialogOpen(false);
      
      // Call logout to clear localStorage and cookies, then redirect
      await logout();
      router.push('/signup');
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || error.message || 'Failed to delete account';
      toast.error(errMsg);
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-text-secondary to-text-muted bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-text-muted text-sm md:text-base mt-1">
          Manage your account profile, change security options, and edit application preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="p-6 bg-surface border-white/10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
          <div className="mb-6">
            <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Information
            </h2>
            <p className="text-xs md:text-sm text-text-muted mt-1">
              Update your account details and email address.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label
                htmlFor="email"
                className="block text-xs md:text-sm font-semibold text-text-secondary mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-surface-secondary border-white/10 text-text-primary focus-visible:ring-primary focus-visible:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="gemini-api-key"
                className="block text-xs md:text-sm font-semibold text-text-secondary mb-2"
              >
                Gemini API Key (Optional)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="gemini-api-key"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key (e.g. AIzaSy...)"
                  className="pl-10 bg-surface-secondary border-white/10 text-text-primary focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                If left blank, the system's global API key will be used instead.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSavingProfile}
              className="bg-primary hover:bg-primary/90 text-white font-medium shadow-lg hover:shadow-primary/20 transition-all duration-200"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 bg-surface border-white/10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
          <div className="mb-6">
            <h2 className="text-lg md:text-xl font-bold text-text-primary flex items-center gap-2">
              <Lock className="w-5 h-5 text-secondary" />
              Security & Credentials
            </h2>
            <p className="text-xs md:text-sm text-text-muted mt-1">
              Ensure your account is using a long, secure password to stay safe.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            <div>
              <label
                htmlFor="current-password"
                className="block text-xs md:text-sm font-semibold text-text-secondary mb-2"
              >
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 bg-surface-secondary border-white/10 text-text-primary focus-visible:ring-secondary focus-visible:border-secondary"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs md:text-sm font-semibold text-text-secondary mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 bg-surface-secondary border-white/10 text-text-primary focus-visible:ring-secondary focus-visible:border-secondary"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs md:text-sm font-semibold text-text-secondary mb-2"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-surface-secondary border-white/10 text-text-primary focus-visible:ring-secondary focus-visible:border-secondary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSavingPassword}
              className="bg-secondary hover:bg-secondary/90 text-white font-medium shadow-lg hover:shadow-secondary/20 transition-all duration-200"
            >
              {isSavingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </Card>

        {/* Danger Zone Card */}
        <Card className="p-6 bg-surface border-error/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-error" />
          <div className="mb-6">
            <h2 className="text-lg md:text-xl font-bold text-error flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-error" />
              Danger Zone
            </h2>
            <p className="text-xs md:text-sm text-text-muted mt-1">
              Irreversible settings for your account. All stored document indexes, conversation memory, and access data will be permanently wiped.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            className="bg-error/10 border border-error text-error hover:bg-error hover:text-white transition-all duration-200"
          >
            Delete Account
          </Button>
        </Card>
      </div>

      {/* Delete Account confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-surface border border-white/10 text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-error flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-error" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="text-text-secondary text-sm">
              This action is <span className="font-semibold text-error">permanent and cannot be undone</span>. All documents, vector embeddings, chat history, and account records will be destroyed immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <p className="text-xs text-text-muted">
              To proceed, please type <span className="font-semibold text-text-primary select-none">"delete my account"</span> in the box below:
            </p>
            <Input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder='Type "delete my account"'
              className="bg-surface-secondary border-white/10 text-text-primary focus-visible:ring-error focus-visible:border-error"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmationText('');
              }}
              disabled={isDeletingAccount}
              className="border-white/10 text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || deleteConfirmationText.toLowerCase() !== 'delete my account'}
              className="bg-error hover:bg-error/90 text-white flex items-center gap-2"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wiping Account Data...
                </>
              ) : (
                'Permanently Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
