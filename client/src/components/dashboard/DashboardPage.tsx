import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceProject, CreateProjectForm } from '../../types/project';
import { projectApiService } from '../../services/projectApi';
import { DashboardHeader } from './DashboardHeader';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';
import { RenameProjectModal } from './RenameProjectModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Search, FolderPlus, Terminal, Sparkles, FolderX } from 'lucide-react';

interface DashboardPageProps {
  onOpenProject: (projectId: string) => void;
  onShowToast: (title: string, description?: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenProject, onShowToast }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<WorkspaceProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceProject | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await projectApiService.getProjects();
      setProjects(data);
    } catch {
      onShowToast('Error', 'Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (form: CreateProjectForm) => {
    if (!user) return;
    try {
      const created = await projectApiService.createProject(form, user.id, user.name);
      setProjects((prev) => [created, ...prev]);
      onShowToast('Project Created', `"${created.title}" is ready in your workspace.`, 'success');
    } catch (err) {
      onShowToast('Creation Failed', err instanceof Error ? err.message : 'Unknown error', 'error');
      throw err;
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const updated = await projectApiService.renameProject(id, newTitle);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      onShowToast('Renamed', `Project renamed to "${newTitle}".`, 'info');
    } catch (err) {
      onShowToast('Rename Failed', err instanceof Error ? err.message : 'Unknown error', 'error');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await projectApiService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      onShowToast('Project Deleted', 'Project removed from workspace.', 'warning');
    } catch (err) {
      onShowToast('Delete Failed', err instanceof Error ? err.message : 'Unknown error', 'error');
      throw err;
    }
  };

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.language.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DashboardHeader onCreateProject={() => setIsCreateOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Welcome hero banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CLOUD WORKSPACE</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Welcome back, {user?.name || 'Developer'}
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Choose a project below to launch the Monaco code editor or initialize a new multi-language environment.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-md shadow-brand-500/20"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create New Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & filters bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or languages..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/80 transition-colors"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium self-end sm:self-auto">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
          </div>
        </div>

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <svg className="animate-spin h-6 w-6 text-brand-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-xs text-slate-400">Loading your workspaces...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={onOpenProject}
                onRename={(p) => setRenameTarget(p)}
                onDelete={(p) => setDeleteTarget(p)}
              />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="py-16 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-6">
            <FolderX className="w-10 h-10 text-slate-500 mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">No matching projects</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              We couldn't find any projects matching "{searchQuery}". Try searching for another keyword or language.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-lg transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="py-16 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-6">
            <Terminal className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No projects yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Get started by creating your first in-browser coding project.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />

      <RenameProjectModal
        isOpen={!!renameTarget}
        project={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRename={handleRename}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
