import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Code2, 
  FolderGit2, 
  Send, 
  Server, 
  CheckCircle2, 
  TestTube2, 
  PlayCircle, 
  Layers, 
  Activity, 
  Radio, 
  Zap, 
  GitBranch, 
  Settings,
  ChevronDown,
  ChevronRight,
  Flame,
  PanelLeftClose,
  PanelLeft,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar = () => {
  const location = useLocation();
  const { 
    sidebarCollapsed, 
    toggleSidebar, 
    mobileDrawerOpen, 
    closeMobileDrawer 
  } = useApp();

  // Collapsible nav groups
  const [apisOpen, setApisOpen] = useState(true);
  const [testingOpen, setTestingOpen] = useState(true);
  const [monitoringOpen, setMonitoringOpen] = useState(true);

  // Automatically expand group accordion when navigating to a child or section route
  useEffect(() => {
    if (location.pathname.startsWith('/apis')) {
      setApisOpen(true);
    }
    if (location.pathname.startsWith('/testing')) {
      setTestingOpen(true);
    }
    if (location.pathname.startsWith('/monitoring')) {
      setMonitoringOpen(true);
    }
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isChildActive = (path) => {
    if (path === '/apis' || path === '/testing') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleNavClick = () => {
    // Automatically close mobile drawer when any link is clicked
    closeMobileDrawer();
  };

  const navLinkClass = (path, isChild = false) => {
    const active = isChild ? isChildActive(path) : isActive(path);
    return `
      flex items-center rounded-lg text-xs font-medium transition-all duration-150 select-none
      ${isChild ? 'py-1.5 pl-8 pr-3' : 'py-2 px-3'}
      ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'space-x-3'}
      ${
        active
          ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold border-l-2 border-brand-500 shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
      }
    `;
  };

  const renderNavContent = (isMobile = false) => {
    const isCollapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200">
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800 shrink-0 px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            className="flex items-center space-x-3 focus:outline-none"
            title="APIForge Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 font-mono leading-none">
                  APIForge
                </h1>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 tracking-wider font-mono font-medium mt-1">
                  DEV PLATFORM
                </p>
              </div>
            )}
          </NavLink>

          {isMobile ? (
            <button
              onClick={closeMobileDrawer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Close mobile menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                isCollapsed ? 'hidden' : 'block'
              }`}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {/* Dashboard */}
          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            className={navLinkClass('/dashboard')}
            title="Dashboard"
          >
            <LayoutDashboard className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          {/* APIs Group */}
          <div>
            {isCollapsed ? (
              <NavLink
                to="/apis"
                onClick={handleNavClick}
                className={navLinkClass('/apis')}
                title="APIs"
              >
                <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              </NavLink>
            ) : (
              <>
                <div
                  className={`flex items-center justify-between rounded-lg transition-colors ${
                    isActive('/apis')
                      ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <NavLink
                    to="/apis"
                    onClick={() => {
                      setApisOpen(true);
                      handleNavClick();
                    }}
                    className="flex-1 flex items-center space-x-3 px-3 py-2 text-xs font-medium"
                    title="APIs Overview"
                  >
                    <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span>APIs</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setApisOpen(!apisOpen);
                    }}
                    aria-label={apisOpen ? 'Collapse APIs submenu' : 'Expand APIs submenu'}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-r-lg"
                  >
                    {apisOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {apisOpen && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/apis"
                      end
                      onClick={handleNavClick}
                      className={navLinkClass('/apis', true)}
                    >
                      <Code2 className="w-3.5 h-3.5 opacity-75 shrink-0" />
                      <span>Overview</span>
                    </NavLink>
                    <NavLink
                      to="/apis/collections"
                      onClick={handleNavClick}
                      className={navLinkClass('/apis/collections', true)}
                    >
                      <FolderGit2 className="w-3.5 h-3.5 opacity-75 shrink-0" />
                      <span>Collections</span>
                    </NavLink>
                    <NavLink
                      to="/apis/endpoints"
                      onClick={handleNavClick}
                      className={navLinkClass('/apis/endpoints', true)}
                    >
                      <Send className="w-3.5 h-3.5 opacity-75 shrink-0" />
                      <span>Endpoints</span>
                    </NavLink>
                    <NavLink
                      to="/apis/request"
                      onClick={handleNavClick}
                      className={navLinkClass('/apis/request', true)}
                    >
                      <PlayCircle className="w-3.5 h-3.5 opacity-75 shrink-0" />
                      <span>Request Builder</span>
                    </NavLink>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mock Servers */}
          <NavLink
            to="/mock-servers"
            onClick={handleNavClick}
            className={navLinkClass('/mock-servers')}
            title="Mock Servers"
          >
            <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {!isCollapsed && <span>Mock Servers</span>}
          </NavLink>

          {/* Testing Group */}
          <div>
            {isCollapsed ? (
              <NavLink
                to="/testing"
                onClick={handleNavClick}
                className={navLinkClass('/testing')}
                title="Testing"
              >
                <TestTube2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              </NavLink>
            ) : (
              <>
                <div
                  className={`flex items-center justify-between rounded-lg transition-colors ${
                    isActive('/testing')
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <NavLink
                    to="/testing"
                    onClick={() => {
                      setTestingOpen(true);
                      handleNavClick();
                    }}
                    className="flex-1 flex items-center space-x-3 px-3 py-2 text-xs font-medium"
                    title="Testing Overview"
                  >
                    <TestTube2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Testing</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTestingOpen(!testingOpen);
                    }}
                    aria-label={testingOpen ? 'Collapse Testing submenu' : 'Expand Testing submenu'}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-r-lg"
                  >
                    {testingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {testingOpen && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/testing"
                      end
                      onClick={handleNavClick}
                      className={navLinkClass('/testing', true)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 opacity-75 shrink-0" />
                      <span>Overview</span>
                    </NavLink>
                    <NavLink
                      to="/testing/suites"
                      onClick={handleNavClick}
                      className={navLinkClass('/testing/suites', true)}
                    >
                      <TestTube2 className="w-3.5 h-3.5 opacity-75 shrink-0" />
                      <span>Test Suites</span>
                    </NavLink>
                    <NavLink
                      to="/testing/runs"
                      onClick={handleNavClick}
                      className={navLinkClass('/testing/runs', true)}
                    >
                      <PlayCircle className="w-3.5 h-3.5 opacity-75 shrink-0" />
                      <span>Test Runs</span>
                    </NavLink>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Environments */}
          <NavLink
            to="/environments"
            onClick={handleNavClick}
            className={navLinkClass('/environments')}
            title="Environments"
          >
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            {!isCollapsed && <span>Environments</span>}
          </NavLink>

          {/* Monitoring Group */}
          <div>
            {isCollapsed ? (
              <NavLink
                to="/monitoring/traffic"
                onClick={handleNavClick}
                className={navLinkClass('/monitoring/traffic')}
                title="Monitoring"
              >
                <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              </NavLink>
            ) : (
              <>
                <div
                  className={`flex items-center justify-between rounded-lg transition-colors ${
                    isActive('/monitoring')
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <NavLink
                    to="/monitoring/traffic"
                    onClick={() => {
                      setMonitoringOpen(true);
                      handleNavClick();
                    }}
                    className="flex-1 flex items-center space-x-3 px-3 py-2 text-xs font-medium"
                    title="Traffic Monitoring"
                  >
                    <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Monitoring</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMonitoringOpen(!monitoringOpen);
                    }}
                    aria-label={monitoringOpen ? 'Collapse Monitoring submenu' : 'Expand Monitoring submenu'}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-r-lg"
                  >
                    {monitoringOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {monitoringOpen && (
                  <div className="mt-1 space-y-0.5">
                    <NavLink
                      to="/monitoring/traffic"
                      onClick={handleNavClick}
                      className={navLinkClass('/monitoring/traffic', true)}
                    >
                      <Radio className="w-3.5 h-3.5 opacity-75 shrink-0" />
                      <span>Traffic</span>
                    </NavLink>
                    <NavLink
                      to="/monitoring/performance"
                      onClick={handleNavClick}
                      className={navLinkClass('/monitoring/performance', true)}
                    >
                      <Zap className="w-3.5 h-3.5 opacity-75 shrink-0" />
                      <span>Performance</span>
                    </NavLink>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Versions */}
          <NavLink
            to="/versions"
            onClick={handleNavClick}
            className={navLinkClass('/versions')}
            title="Versions"
          >
            <GitBranch className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            {!isCollapsed && <span>Versions</span>}
          </NavLink>

          {/* Settings */}
          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className={navLinkClass('/settings')}
            title="Settings"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        </nav>

        {/* Footer Toggle / Operational Status */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 shrink-0">
          {isCollapsed ? (
            <button
              onClick={toggleSidebar}
              title="Expand sidebar"
              className="w-full flex justify-center py-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Platform Live</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">v1.0.0</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 shrink-0 z-20 ${
          sidebarCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer Overlay & Slide-in Sidebar */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={closeMobileDrawer}
            aria-hidden="true"
          />

          {/* Slide-in Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slideDown">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
