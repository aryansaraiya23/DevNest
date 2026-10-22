import React from 'react';
import { WorkspaceProject } from '../../types/project';
import { SUPPORTED_LANGUAGES } from '@devnest/shared';
import { Clock, ArrowUpRight, Edit2, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  project: WorkspaceProject;
  onOpen: (id: string) => void;
  onRename: (project: WorkspaceProject) => void;
  onDelete: (project: WorkspaceProject) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpen,
  onRename,
  onDelete,
}) => {
  const langConfig = SUPPORTED_LANGUAGES[project.language];
  const langName = langConfig ? langConfig.name : project.language;

  // Format relative/short time
  const formattedDate = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Language badge accent colors
  const getBadgeColors = (lang: string) => {
    switch (lang) {
      case 'cpp':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'python':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'javascript':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';
      case 'java':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-slate-950/50 group">
      <div>
        {/* Top bar of card */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h3
            onClick={() => onOpen(project.id)}
            className="text-base font-semibold text-white group-hover:text-brand-400 transition-colors cursor-pointer line-clamp-1"
            title={project.title}
          >
            {project.title}
          </h3>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${getBadgeColors(
              project.language
            )}`}
          >
            {langName}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Bottom actions & metadata */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {formattedDate}</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onRename(project)}
            title="Rename project"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Rename project"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(project)}
            title="Delete project"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            aria-label="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onOpen(project.id)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-brand-300 rounded-md font-medium transition-colors ml-1"
          >
            <span>Open</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
