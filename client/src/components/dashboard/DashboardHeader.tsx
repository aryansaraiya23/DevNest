import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Code2, LogOut, Plus, User as UserIcon } from 'lucide-react';

interface DashboardHeaderProps {
  onCreateProject: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onCreateProject }) => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
      {/* Brand logo & title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-brand-500/20">
          <Code2 className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white flex items-center space-x-2">
            <span>DevNest</span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              Cloud IDE
            </span>
          </span>
        </div>
      </div>

      {/* User and actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onCreateProject}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center space-x-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <span className="text-xs font-medium text-slate-200 hidden sm:inline">{user?.name}</span>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors ml-1"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
