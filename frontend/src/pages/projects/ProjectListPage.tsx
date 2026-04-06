import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Activity, Shield, Code2, TestTube2, ChevronRight } from 'lucide-react';
import { PROJECTS } from '../../data/mockData';
import { useAppStore } from '../../store/appStore';
import { StatusBadge } from '../../components/ui/StatusBadge';

const OUTPUT_LABELS: Record<string, string> = {
  web_app: 'Web App', api: 'API', desktop: 'Desktop', mobile: 'Mobile', improvement: 'Melhoria em Sistema', new_feature: 'Nova Feature',
};

const PHASES = ['—', 'Governança', 'OCG + Prov.', 'Ingestão', 'Arguição', 'Code Gen', 'QA', 'Docs Viva'];

export function ProjectListPage() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const isAdmin = currentUser.role === 'admin';

  const myProjects = PROJECTS.filter(p =>
    p.gpId === currentUser.id || p.team.some(m => m.userId === currentUser.id) || isAdmin
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Meus Projetos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{myProjects.length} projeto{myProjects.length !== 1 ? 's' : ''} acessíveis ao seu perfil</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {myProjects.map(proj => (
          <div
            key={proj.id}
            onClick={() => navigate(`/projects/${proj.id}`)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-indigo-600/40 hover:bg-slate-800/60 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-900/40 border border-indigo-800/40 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                  {proj.name.charAt(0)}
                </div>
                <div>
                  <p className="text-slate-200 text-sm font-medium group-hover:text-indigo-300 transition-colors">{proj.name}</p>
                  <p className="text-slate-500 text-xs">{OUTPUT_LABELS[proj.outputProfile]}</p>
                </div>
              </div>
              <StatusBadge status={proj.status} size="sm" />
            </div>

            <p className="text-slate-400 text-xs leading-relaxed mb-4">{proj.description}</p>

            {/* Phase progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-500 text-xs">Fase {proj.phase} · {PHASES[proj.phase] ?? 'Operação'}</span>
                <span className="text-slate-500 text-xs">{Math.round((proj.phase / 7) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1">
                <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${(proj.phase / 7) * 100}%` }} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400">
                  <Shield className="w-3 h-3" />
                  <span className="text-xs">{proj.gatekeeper.score || '—'}</span>
                </div>
                <p className="text-slate-600 text-[10px] mt-0.5">Gatekeeper</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400">
                  <Code2 className="w-3 h-3" />
                  <span className="text-xs">{proj.codeGenRequests.length}</span>
                </div>
                <p className="text-slate-600 text-[10px] mt-0.5">Gerações</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400">
                  <TestTube2 className="w-3 h-3" />
                  <span className="text-xs">{proj.testExecutions.filter(t => t.status === 'passed').length}/{proj.testExecutions.length}</span>
                </div>
                <p className="text-slate-600 text-[10px] mt-0.5">Testes</p>
              </div>
            </div>

            {/* Stack */}
            <div className="flex flex-wrap gap-1">
              {[proj.stack.language, proj.stack.framework.split('/')[0].trim(), proj.stack.database.split(' ')[0]].map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700">{tag}</span>
              ))}
            </div>

            {proj.pendingIssues > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-amber-400 text-xs">
                <Activity className="w-3 h-3" />
                <span>{proj.pendingIssues} pendência{proj.pendingIssues !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
