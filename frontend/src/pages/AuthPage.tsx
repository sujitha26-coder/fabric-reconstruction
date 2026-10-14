import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { apiBaseUrl, login, register } from '../services/api';

type AuthMode = 'login' | 'register';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: unknown }>(error)) {
    if (!error.response) {
      return `Cannot reach the authentication server at ${apiBaseUrl}. Run start-local.ps1 from the project folder and wait for the backend to finish starting.`;
    }

    const detail = error.response.data?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (typeof item === 'object' && item !== null && 'msg' in item ? item.msg : ''))
        .filter((message): message is string => typeof message === 'string' && message.length > 0)
        .join(' ');
    }
    return `The authentication server returned an error (${error.response.status}). Please try again.`;
  }
  return 'Something went wrong. Please try again.';
}

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const isRegistering = mode === 'register';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = isRegistering
        ? await register(fullName, email, password)
        : await login(email, password);
      sessionStorage.setItem('access_token', result.access_token);
      sessionStorage.setItem('auth_user', JSON.stringify(result.user));
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2 lg:px-8">
      <div className="hidden rounded-[32px] bg-[#ead9c6] p-10 lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">WeaveAI Studio</p>
        <h1 className="mt-5 max-w-md font-serif text-5xl leading-tight text-[#382B27]">
          Your textile ideas, all in one place.
        </h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-[#6c574b]">
          Sign in to continue exploring fabric reconstruction and your creative workspace.
        </p>
        <div className="mt-10 flex h-44 items-center justify-center rounded-2xl border border-[#d4baa0] bg-[#f5ede4]">
          <span className="font-serif text-4xl italic text-[#ad583b]">Weave something new</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ad583b]">
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </p>
          <h2 className="mt-2 font-serif text-4xl text-[#382B27]">
            {isRegistering ? 'Join WeaveAI' : 'Sign in'}
          </h2>
          <p className="mt-2 text-sm text-[#806d60]">
            {isRegistering ? 'Start building your textile workspace.' : 'Enter your details to access your account.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-full bg-[#f1e8de] p-1" role="tablist" aria-label="Account access">
          {(['login', 'register'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              onClick={() => {
                setMode(tab);
                setErrorMessage('');
              }}
              className={`rounded-full px-4 py-2.5 text-sm transition ${
                mode === tab ? 'bg-white font-medium text-[#ad583b] shadow-sm' : 'text-[#806d60]'
              }`}
            >
              {tab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#514039]">Full name</span>
              <span className="flex items-center gap-3 rounded-xl border border-[#e5d5bd] bg-white px-4 focus-within:border-[#ad583b]">
                <UserRound className="h-4 w-4 text-[#9b8778]" aria-hidden="true" />
                <input
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full bg-transparent py-3 text-sm outline-none"
                  placeholder="Your name"
                />
              </span>
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#514039]">Email address</span>
            <span className="flex items-center gap-3 rounded-xl border border-[#e5d5bd] bg-white px-4 focus-within:border-[#ad583b]">
              <Mail className="h-4 w-4 text-[#9b8778]" aria-hidden="true" />
              <input
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="you@example.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#514039]">Password</span>
            <span className="flex items-center gap-3 rounded-xl border border-[#e5d5bd] bg-white px-4 focus-within:border-[#ad583b]">
              <LockKeyhole className="h-4 w-4 text-[#9b8778]" aria-hidden="true" />
              <input
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="At least 8 characters"
              />
            </span>
          </label>

          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ad583b] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#87412d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in'}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#806d60]">
          By continuing, you agree to use WeaveAI responsibly.{' '}
          <Link to="/" className="font-medium text-[#ad583b] hover:underline">Back to home</Link>
        </p>
      </div>
    </section>
  );
}

export default AuthPage;
