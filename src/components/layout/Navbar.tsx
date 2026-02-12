import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Globe, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserStats } from '@/hooks/useUserStats';
import { Button } from '@/components/ui/button';
import { LevelBadge } from '@/components/ui/level-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { t, lang, setLang, dir } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, userRole, signOut } = useAuth();
  const { stats } = useUserStats();
  const location = useLocation();
  const navigate = useNavigate();

  const isPrivileged = userRole === 'admin' || userRole === 'algorithm_editor';

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { href: '/docs', label: t('nav.docs') },
    { href: '/roadmap', label: t('nav.roadmap') },
    { href: '/leaderboard', label: t('nav.leaderboard') },
  ];

  const isActive = (path: string) => {
    if (path === '/docs') {
      return location.pathname === '/' || location.pathname === '/docs';
    }
    return location.pathname === path;
  };

  // Custom Logo Icon SVG - with rotation animation
  const LogoIcon = () => (
    <svg 
      className="logo-icon animate-spin-slow" 
      width="32" 
      height="32" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );

  // Sun Icon SVG for theme toggle
  const SunIcon = () => (
    <svg 
      className="sun-icon" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );

  // Moon Icon SVG for theme toggle
  const MoonIcon = () => (
    <svg 
      className="moon-icon" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );

  return (
    <nav 
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled 
          ? "bg-background/95 backdrop-blur-md shadow-sm border-border" 
          : "bg-transparent border-transparent"
      )}
      dir={dir}
      id="navbar"
    >
      
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo with spinning icon */}
          <Link 
            to="/docs" 
            className="flex items-center gap-3 text-xl font-bold text-primary hover:opacity-80 transition-opacity group"
          >
            <LogoIcon />
            <span>{t('app.name')}</span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-1" id="navLinks">
            {navLinks.map((link, index) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors nav-link",
                    isActive(link.href) ? "active text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {user && (
              <li>
                <Link
                  to="/dashboard"
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors nav-link",
                    isActive('/dashboard') ? "active text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {t('nav.dashboard')}
                </Link>
              </li>
            )}
          </ul>

          {/* Right side controls */}
          <div className="flex items-center gap-2 nav-actions">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium lang-toggle text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="تبديل اللغة"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-lg theme-toggle text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="تبديل الوضع الليلي"
              id="themeToggle"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* Auth Button (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className='dash'>
                    <Button variant="ghost" className="gap-2">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.username || 'User'} 
                          className="w-6 h-6 rounded-full object-cover dash-img"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs text-primary">
                            {profile?.username?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <span className="max-w-24 truncate">
                        {profile?.username || t('nav.dashboard')}
                      </span>
                      {/* Level badge - hidden for privileged users */}
                      {!isPrivileged && stats?.currentLevel && (
                        <LevelBadge level={stats.currentLevel} size="sm" className="dash-badge" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className='dash-item'>
                      <LayoutDashboard className="h-4 w-4 me-2" />
                      {t('nav.dashboard')}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className='dash-out'>
                      <LogOut className="h-4 w-4 me-2" />
                      {t('nav.signout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild className="px-4">
                  <Link to="/auth">{t('nav.signin')}</Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg menu-toggle hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="menuToggle"
            >
              <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current my-1.5 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-lg text-sm font-medium transition-colors text-right nav-link",
                      isActive(link.href) 
                        ? "active bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {user && (
                <li>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors nav-link",
                      isActive('/dashboard') 
                        ? "active bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <span>{t('nav.dashboard')}</span>
                    {!isPrivileged && stats?.currentLevel && (
                      <LevelBadge level={stats.currentLevel} size="sm" />
                    )}
                  </Link>
                </li>
              )}
              {user ? (
                <li>
                  <Button
                    variant="ghost"
                    className="w-full justify-end px-4 py-3 text-right"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 ms-2" />
                    {t('nav.signout')}
                  </Button>
                </li>
              ) : (
                <li>
                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center hover:bg-primary/90 transition-colors"
                  >
                    {t('nav.signin')}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
