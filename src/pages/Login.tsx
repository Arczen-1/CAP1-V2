import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetInfo, setResetInfo] = useState('');
  const [resetCodePreview, setResetCodePreview] = useState('');
  const [resetExpiresInMinutes, setResetExpiresInMinutes] = useState<number | null>(null);
  const [isResetStepReady, setIsResetStepReady] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { login, requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();

  const clearResetFlow = () => {
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetInfo('');
    setResetCodePreview('');
    setResetExpiresInMinutes(null);
    setIsResetStepReady(false);
    setIsRequestingReset(false);
    setIsResettingPassword(false);
  };

  const openResetDialog = () => {
    clearResetFlow();
    setResetEmail(email.trim().toLowerCase());
    setIsResetDialogOpen(true);
  };

  const handleResetDialogChange = (open: boolean) => {
    setIsResetDialogOpen(open);
    if (!open) {
      clearResetFlow();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResetCode = async () => {
    const normalizedResetEmail = resetEmail.trim().toLowerCase();

    if (!normalizedResetEmail) {
      setResetError('Enter the email address used for your account.');
      return;
    }

    setResetError('');
    setResetInfo('');
    setResetCodePreview('');
    setResetExpiresInMinutes(null);
    setIsRequestingReset(true);

    try {
      const response = await requestPasswordReset(normalizedResetEmail);
      setResetEmail(normalizedResetEmail);
      setResetInfo(response.message);
      setResetCodePreview(response.resetCode || '');
      setResetExpiresInMinutes(response.expiresInMinutes || null);
      setIsResetStepReady(true);
    } catch (err: any) {
      const validationMessage = err?.errors?.[0]?.msg;
      setResetError(validationMessage || err.message || 'Unable to start the password reset process.');
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleResetPassword = async () => {
    const normalizedResetEmail = resetEmail.trim().toLowerCase();

    if (!normalizedResetEmail) {
      setResetError('Enter the email address used for your account.');
      return;
    }

    if (!resetCode.trim()) {
      setResetError('Enter the 6-digit reset code.');
      return;
    }

    if (newPassword.length < 8) {
      setResetError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('New password and confirmation must match.');
      return;
    }

    setResetError('');
    setIsResettingPassword(true);

    try {
      const response = await resetPassword(normalizedResetEmail, resetCode.trim(), newPassword);
      setEmail(normalizedResetEmail);
      setPassword('');
      setError('');
      setNotice(response.message);
      handleResetDialogChange(false);
    } catch (err: any) {
      const validationMessage = err?.errors?.[0]?.msg;
      setResetError(validationMessage || err.message || 'Unable to reset the password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#491321]/5 to-[#491321]/15 p-4">
      <Card className="w-full max-w-lg shadow-xl border-[#491321]/20">
        <CardHeader className="pb-3 pt-8 text-center">
          <div className="flex justify-center">
            <div className="h-24 w-80 max-w-full overflow-hidden sm:h-28 sm:w-[26rem]">
              <img
                src="/logo.png"
                alt="Juan Carlos"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {notice && (
            <Alert className="mb-4">
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                <Button type="button" variant="link" className="h-auto px-0 text-xs" onClick={openResetDialog}>
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Sign in using your assigned work account. If you need access, contact the project administrator for your login details.
          </div>
        </CardContent>
      </Card>

      <Dialog open={isResetDialogOpen} onOpenChange={handleResetDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Request a temporary reset code, then use it to set a new password for your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {resetError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resetError}</AlertDescription>
              </Alert>
            )}

            {resetInfo && (
              <Alert>
                <AlertDescription>{resetInfo}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reset-email">Account Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your work email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
              />
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={handleRequestResetCode} disabled={isRequestingReset}>
              {isRequestingReset ? 'Sending reset code...' : isResetStepReady ? 'Send New Code' : 'Send Reset Code'}
            </Button>

            {isResetStepReady && (
              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                {resetCodePreview && (
                  <div className="rounded-lg border border-dashed bg-background p-4 text-sm">
                    <p className="font-medium">Temporary reset code</p>
                    <p className="mt-2 font-mono text-2xl tracking-[0.4em] text-[#491321]">{resetCodePreview}</p>
                    <p className="mt-2 text-muted-foreground">
                      Email delivery is not configured yet in this local setup, so the code is shown here
                      {resetExpiresInMinutes ? ` and expires in ${resetExpiresInMinutes} minutes.` : '.'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reset-code">Reset Code</Label>
                  <Input
                    id="reset-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter the 6-digit code"
                    value={resetCode}
                    onChange={(event) => setResetCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter the new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleResetDialogChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleResetPassword} disabled={!isResetStepReady || isResettingPassword}>
              {isResettingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
