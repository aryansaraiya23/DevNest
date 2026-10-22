import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { WorkspacePage } from './components/workspace/WorkspacePage';
import { ToastContainer } from './components/common/Toast';
import { ToastMessage } from './types/ide';

type ViewMode = 'login' | 'signup' | 'dashboard' | 'workspace';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('login');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    title: string,
    description?: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { id, title, description, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync hash on load
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/workspace')) {
        const params = new URLSearchParams(hash.split('?')[1] || '');
        const pId = params.get('projectId');
        if (pId) {
          setActiveProjectId(pId);
          setCurrentView('workspace');
          return;
        }
      }
      if (hash === '#/signup') {
        setCurrentView('signup');
        return;
      }
      if (hash === '#/login') {
        setCurrentView('login');
        return;
      }
      if (hash === '#/dashboard') {
        setCurrentView('dashboard');
        return;
      }
    };

    parseHash();
  }, []);

  // Sync currentView with auth state
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (currentView !== 'login' && currentView !== 'signup') {
        setCurrentView('login');
        window.location.hash = '#/login';
      }
    } else {
      // Authenticated users shouldn't stay on login or signup
      if (currentView === 'login' || currentView === 'signup') {
        setCurrentView('dashboard');
        window.location.hash = '#/dashboard';
      }
    }
  }, [isAuthenticated, isLoading, currentView]);

  const navigateToDashboard = () => {
    setActiveProjectId(null);
    setCurrentView('dashboard');
    window.location.hash = '#/dashboard';
  };

  const navigateToWorkspace = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentView('workspace');
    window.location.hash = `#/workspace?projectId=${projectId}`;
  };

  const navigateToLogin = () => {
    setCurrentView('login');
    window.location.hash = '#/login';
  };

  const navigateToSignUp = () => {
    setCurrentView('signup');
    window.location.hash = '#/signup';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <svg className="animate-spin h-8 w-8 text-brand-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-xs">Initializing DevNest...</span>
      </div>
    );
  }

  return (
    <>
      {/* Route Switcher */}
      {!isAuthenticated ? (
        currentView === 'signup' ? (
          <SignUpPage onNavigateToLogin={navigateToLogin} />
        ) : (
          <LoginPage onNavigateToSignUp={navigateToSignUp} />
        )
      ) : currentView === 'workspace' && activeProjectId ? (
        <WorkspacePage
          projectId={activeProjectId}
          onBackToDashboard={navigateToDashboard}
          onShowToast={showToast}
        />
      ) : (
        <DashboardPage
          onOpenProject={navigateToWorkspace}
          onShowToast={showToast}
        />
      )}

      {/* Global Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
