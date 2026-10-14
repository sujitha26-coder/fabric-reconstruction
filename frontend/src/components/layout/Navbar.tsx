import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, LogOut, Menu, Search, Sparkles, X } from 'lucide-react';
import type { AuthUser } from '../../services/api';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Explore', to: '/explore' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Contact', to: '/contact' }
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const location = useLocation();
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const storedUser = sessionStorage.getItem('auth_user');
    if (!storedUser) {
      setUser(null);
      return;
    }

    try {
      const parsedUser: unknown = JSON.parse(storedUser);
      if (
        typeof parsedUser === 'object' &&
        parsedUser !== null &&
        'id' in parsedUser &&
        typeof parsedUser.id === 'number' &&
        'full_name' in parsedUser &&
        typeof parsedUser.full_name === 'string' &&
        'email' in parsedUser &&
        typeof parsedUser.email === 'string' &&
        'role' in parsedUser &&
        typeof parsedUser.role === 'string' &&
        'is_active' in parsedUser &&
        typeof parsedUser.is_active === 'boolean' &&
        'created_at' in parsedUser &&
        (typeof parsedUser.created_at === 'string' || parsedUser.created_at === null)
      ) {
        setUser({
          id: parsedUser.id,
          full_name: parsedUser.full_name,
          email: parsedUser.email,
          role: parsedUser.role,
          is_active: parsedUser.is_active,
          created_at: parsedUser.created_at
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [location.pathname]);

  const initials = user?.full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const signOut = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('auth_user');
    setUser(null);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#080d1a]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/weaveai-mark.svg"
            alt="WeaveAI home"
            className="h-10 w-10 rounded-[14px] shadow-[0_0_22px_rgba(79,140,255,0.22)]"
          />
          <div>
            <p className="font-sans text-xl font-semibold tracking-[-0.045em] text-white">WeaveAI</p>
            <p className="text-[8px] uppercase tracking-[0.14em] text-slate-400">Fabric pattern research</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative py-2 text-xs transition ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`
              }
            >
              {item.label}
              {location.pathname === item.to && (
                <motion.span
                  layoutId="weaveai-nav-active"
                  className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                  transition={{ duration: reduceMotion ? 0 : 0.24 }}
                />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/#fabric-search" aria-label="Search the textile collection" className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-cyan-200 sm:flex">
            <Search className="h-4 w-4" />
          </Link>
          {user ? (
            <>
              <div className="hidden items-center gap-2 sm:flex" aria-label={`Signed in as ${user.full_name}, user ID ${user.id}`}>
                <div className="grid h-9 w-9 place-items-center rounded-full border border-cyan-200/20 bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-xs font-semibold text-cyan-100" aria-hidden="true">
                  {initials || <Sparkles className="h-4 w-4" />}
                </div>
                <div className="leading-tight">
                  <p className="max-w-32 truncate text-xs font-medium text-white">{user.full_name}</p>
                  <p className="text-[10px] text-slate-400">User ID: {user.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="hidden items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-white sm:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden text-xs font-medium text-slate-300 transition hover:text-cyan-200 sm:inline-flex">
              Sign in
            </Link>
          )}
          <Link
            to="/upload"
            className="weaveai-button-primary hidden items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white sm:inline-flex"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid h-9 w-9 place-items-center rounded-lg text-white transition hover:bg-white/10 md:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
      {menuOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="overflow-hidden border-t border-white/[0.08] bg-[#0b1120] px-5 py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto grid max-w-7xl gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-2.5 text-sm ${isActive ? 'bg-white/[0.06] text-cyan-200' : 'text-slate-300 hover:bg-white/[0.04]'}`}>
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2.5" aria-label={`Signed in as ${user.full_name}, user ID ${user.id}`}>
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-cyan-200/20 bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-xs font-semibold text-cyan-100" aria-hidden="true">
                    {initials || <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-white">{user.full_name}</p>
                    <p className="text-xs text-slate-400">User ID: {user.id}</p>
                  </div>
                </div>
                <button type="button" onClick={signOut} className="px-3 py-2.5 text-left text-sm text-slate-300">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 text-sm text-slate-300">
                Sign in
              </Link>
            )}
            <Link to="/upload" onClick={() => setMenuOpen(false)} className="weaveai-button-primary mt-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.nav>
      )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
