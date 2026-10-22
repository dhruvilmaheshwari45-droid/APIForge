import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Navbar from './Navbar';

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-200">
      {/* Desktop & Mobile Responsive Sidebar */}
      <Sidebar />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
