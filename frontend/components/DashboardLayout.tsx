'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Target, BookOpen, Menu, X, LogOut, FileText, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/okrs', icon: Target, label: 'My OKRs' },
    { path: '/dashboard/journal', icon: BookOpen, label: 'Journal' },
    { path: '/dashboard/time-analytics', icon: Clock, label: 'Pomodoro Timer' },
    { path: '/dashboard/weekly-report', icon: FileText, label: 'Weekly Report' },
  ];

  const NavItem = ({ path, icon: Icon, label }: { path: string; icon: any; label: string }) => {
    const isActive = pathname === path;

    return (
      <button
        onClick={() => {
          router.push(path);
          setIsMobileMenuOpen(false);
        }}
        className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center z-20 relative shadow-sm">
        <h1 className="text-xl font-bold text-indigo-600 tracking-tight">Orbit</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}
      >
        <div className="h-full flex flex-col p-6">
          <div className="mb-8 px-2 hidden md:block">
            <h1 className="text-2xl font-bold text-indigo-600 tracking-tight flex items-center gap-2">
              <span className="bg-indigo-600 text-white rounded-lg p-1">
                <Target className="h-5 w-5" />
              </span>
              Orbit
            </h1>
            <p className="text-xs text-gray-400 mt-1 pl-1">Plan. Act. Reflect.</p>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <NavItem key={item.path} {...item} />
            ))}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="px-2 mb-3">
              <p className="text-xs text-gray-500">Logged in as</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-2">
              &quot;Discipline is the bridge between goals and accomplishment.&quot;
            </p>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Jim Rohn
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-4rem)] md:h-screen">
        {children}
      </main>
    </div>
  );
};
