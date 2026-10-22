import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Globe, 
  Server, 
  Bell, 
  Sun, 
  Moon, 
  ChevronDown, 
  Check, 
  User, 
  Key, 
  FileText, 
  LogOut, 
  CheckCircle2, 
  Layers,
  Command,
  PanelLeft,
  LogIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from '../common/Dropdown';
import { Badge } from '../common/Badge';
import authService from '../../services/authService';
import AuthModal from '../auth/AuthModal';

export const Navbar = () => {
  const location = useLocation();
  const { toast } = useToast();
  const { 
    theme, 
    toggleTheme, 
    toggleSidebar, 
    toggleMobileDrawer, 
    environments, 
    selectedEnvironment, 
    setSelectedEnvironment, 
    servers, 
    globalSearch, 
    setGlobalSearch,
    notifications,
    unreadCount,
    markNotificationsAsRead,
    currentUser,
    setCurrentUser,
    authModalOpen,
    openAuthModal,
    closeAuthModal,
  } = useApp();

  const activeServersCount = servers ? servers.filter(s => s.status === 'running').length : 0;

  // Derive human-readable page title and breadcrumbs from location.pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path === '/apis') return 'APIs / Overview';
    if (path === '/apis/collections') return 'APIs / Collections';
    if (path === '/apis/endpoints') return 'APIs / Endpoints';
    if (path === '/mock-servers') return 'Mock Servers';
    if (path === '/testing') return 'Testing / Overview';
    if (path === '/testing/suites') return 'Testing / Test Suites';
    if (path.startsWith('/testing/suites/')) return 'Testing / Suite Details';
    if (path === '/testing/runs') return 'Testing / Test Runs';
    if (path === '/environments') return 'Environments';
    if (path === '/monitoring/traffic') return 'Monitoring / Traffic';
    if (path === '/monitoring/performance') return 'Monitoring / Performance';
    if (path === '/versions') return 'Versions';
    if (path === '/settings') return 'Settings';
    return 'APIForge';
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-xs">
      {/* Left Section: Mobile Menu / Desktop Toggle & Page Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={toggleMobileDrawer}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle sidebar collapse"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Current Route Breadcrumb / Title */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 tracking-tight hidden sm:inline">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Middle Section: Global Search Interface */}
      <div className="flex-1 max-w-xs md:max-w-md mx-3 sm:mx-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search APIForge (Ctrl+K)..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-12 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-sans transition-all"
          />
          <kbd className="hidden sm:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section: Environment Selector, Mock Status, Notifications, Theme, User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mock Server Status Pill (Hidden on small mobile) */}
        <Link
          to="/mock-servers"
          className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          title="Mock Server Status"
        >
          <Server className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Mock:</span>
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {activeServersCount} Active
          </span>
        </Link>

        {/* Active Environment Selector Dropdown */}
        <Dropdown
          align="right"
          width="w-64"
          trigger={
            <button
              type="button"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="font-mono font-medium max-w-[80px] sm:max-w-[120px] truncate">
                {selectedEnvironment?.name || 'No Env'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          }
        >
          <DropdownHeader>Target Environment</DropdownHeader>
          {environments && environments.length > 0 ? (
            environments.map((env) => (
              <DropdownItem
                key={env.id}
                onClick={() => {
                  setSelectedEnvironment(env);
                  toast.success(`Active environment switched to "${env.name}"`);
                }}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="font-mono font-medium">{env.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]">
                    {env.baseUrl}
                  </span>
                </div>
                {selectedEnvironment?.id === env.id && (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                )}
              </DropdownItem>
            ))
          ) : (
            <div className="p-3 text-xs text-slate-500 font-mono text-center">
              No environments configured
            </div>
          )}
          <DropdownDivider />
          <Link to="/environments" className="block">
            <DropdownItem icon={Layers}>Manage Environments</DropdownItem>
          </Link>
        </Dropdown>

        {/* Notification Bell Dropdown */}
        <Dropdown
          align="right"
          width="w-80"
          trigger={
            <button
              type="button"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
              )}
            </button>
          }
        >
          <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markNotificationsAsRead}
                className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-sans"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {notifications && notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {notif.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-mono">
                No notifications
              </div>
            )}
          </div>
        </Dropdown>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* User Profile Avatar & Dropdown */}
        {currentUser ? (
          <Dropdown
            align="right"
            width="w-56"
            trigger={
              <button
                type="button"
                className="flex items-center space-x-2 pl-1 rounded-lg hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                  {currentUser.name
                    ? currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'US'}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>
            }
          >
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
              <Badge variant="primary" size="sm" className="mt-1.5">
                {currentUser.role || 'Developer'}
              </Badge>
            </div>
            <DropdownItem icon={User} onClick={openAuthModal}>
              Profile & Account
            </DropdownItem>
            <DropdownItem icon={Key}>API Keys & Tokens</DropdownItem>
            <DropdownItem icon={FileText}>Documentation</DropdownItem>
            <Link to="/settings" className="block">
              <DropdownItem icon={Layers}>Platform Settings</DropdownItem>
            </Link>
            <DropdownDivider />
            <DropdownItem
              icon={LogOut}
              danger
              onClick={async () => {
                await authService.logout();
                setCurrentUser(null);
                toast.info('You have been signed out.');
              }}
            >
              Sign Out
            </DropdownItem>
          </Dropdown>
        ) : (
          <button
            type="button"
            onClick={openAuthModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Global Auth Modal for Register / Login */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        onAuthSuccess={() => setCurrentUser(authService.getUser())}
      />
    </header>
  );
};

export default Navbar;
