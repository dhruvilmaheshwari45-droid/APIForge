import React, { createContext, useContext, useState, useEffect } from 'react';
import { environmentService } from '../services/environmentService';
import { mockServers } from '../data/mockServers';
import authService from '../services/authService';

const AppContext = createContext();

const STORAGE_KEYS = {
  THEME: 'apiforge_theme',
  SIDEBAR_COLLAPSED: 'apiforge_sidebar_collapsed',
};

export const AppProvider = ({ children }) => {
  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => authService.getUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Attempt hydrating authenticated user session from backend
    authService.getMe().then((user) => {
      if (user) setCurrentUser(user);
    }).catch(() => {});
  }, []);
  // Theme state: dark-first theme default, persisted in localStorage
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  // Desktop sidebar collapsed state, persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Environments backed by environmentService (localStorage)
  const [environments, setEnvironments] = useState(() => environmentService.getEnvironments());
  const [selectedEnvironment, setSelectedEnvironmentState] = useState(() => environmentService.getActiveEnvironment());

  const setSelectedEnvironment = (envOrId) => {
    if (!envOrId) {
      setSelectedEnvironmentState(null);
      return;
    }
    const id = typeof envOrId === 'string' ? envOrId : envOrId.id;
    try {
      const updated = environmentService.setActiveEnvironment(id);
      setSelectedEnvironmentState(updated);
      // Refresh list to keep active flags in sync if needed
      setEnvironments(environmentService.getEnvironments());
    } catch (e) {
      console.warn('Error setting active environment:', e);
      if (typeof envOrId === 'object') {
        setSelectedEnvironmentState(envOrId);
      }
    }
  };

  const refreshEnvironments = () => {
    const list = environmentService.getEnvironments();
    const active = environmentService.getActiveEnvironment();
    setEnvironments(list);
    setSelectedEnvironmentState(active);
  };

  // Servers
  const [servers, setServers] = useState(mockServers);

  // Global search input
  const [globalSearch, setGlobalSearch] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Environment Ready',
      message: 'Active environment set to ' + (selectedEnvironment?.name || 'Default'),
      time: 'Just now',
      read: false,
      type: 'info'
    },
    {
      id: 'notif-2',
      title: 'Platform Initialized',
      message: 'APIForge layout and design system loaded successfully.',
      time: '2 mins ago',
      read: false,
      type: 'success'
    }
  ]);

  // Sync theme with HTML root element & localStorage
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
  }, [theme]);

  // Sync sidebar collapse with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(sidebarCollapsed));
    } catch (e) {
      console.warn('Failed to save sidebar state to localStorage:', e);
    }
  }, [sidebarCollapsed]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const toggleMobileDrawer = () => {
    setMobileDrawerOpen(prev => !prev);
  };

  const closeMobileDrawer = () => {
    setMobileDrawerOpen(false);
  };

  const toggleServerStatus = (serverId) => {
    setServers(prev => prev.map(srv => {
      if (srv.id === serverId) {
        const nextStatus = srv.status === 'running' ? 'stopped' : 'running';
        return { ...srv, status: nextStatus };
      }
      return srv;
    }));
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
      mobileDrawerOpen,
      setMobileDrawerOpen,
      toggleMobileDrawer,
      closeMobileDrawer,
      environments,
      setEnvironments,
      selectedEnvironment,
      setSelectedEnvironment,
      refreshEnvironments,
      servers,
      setServers,
      toggleServerStatus,
      globalSearch,
      setGlobalSearch,
      notifications,
      unreadCount,
      markNotificationsAsRead,
      currentUser,
      setCurrentUser,
      authModalOpen,
      openAuthModal: () => setAuthModalOpen(true),
      closeAuthModal: () => setAuthModalOpen(false),
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
