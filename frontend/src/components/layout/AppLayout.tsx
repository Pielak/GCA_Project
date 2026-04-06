import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { FirstAccessModal } from '../../app/components/FirstAccessModal';
import { useAppStore } from '../../store/appStore';
import { USERS } from '../../data/mockData';
import { RoleBadge } from '../ui/StatusBadge';
import { useEffect, useState } from 'react';

export function AppLayout() {
  const { currentUser, sidebarOpen, toggleSidebar } = useAppStore();
  const navigate = useNavigate();
  const [showFirstAccessModal, setShowFirstAccessModal] = useState(false);

  useEffect(() => {
    // Check if user needs to change password on first access
    // In production, this would check currentUser.first_access_completed from the auth context
    if (currentUser && !(currentUser as any).first_access_completed) {
      setShowFirstAccessModal(true);
    }
  }, [currentUser]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={toggleSidebar} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar projetos, artefatos..."
                className="bg-slate-800 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-semibold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm text-slate-200">{currentUser.name}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>
            {/* Role switcher for demo */}
            <RoleSwitcher />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* First Access Modal */}
      <FirstAccessModal
        isOpen={showFirstAccessModal}
        temporaryPassword="TempPass123!@#"
        onPasswordChanged={() => setShowFirstAccessModal(false)}
      />
    </div>
  );
}

function RoleSwitcher() {
  const { currentUser, setCurrentUser } = useAppStore();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span>Demo: {currentUser.role}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-48 py-1">
          <p className="px-3 py-1.5 text-xs text-slate-500 border-b border-slate-700">Trocar perfil (demo)</p>
          {USERS.map(user => (
            <button
              key={user.id}
              onClick={() => { setCurrentUser(user); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${currentUser.id === user.id ? 'text-indigo-400' : 'text-slate-300'}`}
            >
              <div className="w-5 h-5 rounded-full bg-indigo-700/60 flex items-center justify-center text-white text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-xs">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
