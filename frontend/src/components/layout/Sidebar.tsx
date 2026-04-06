import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Users, Shield, ChevronDown, ChevronRight,
  LogOut, Settings, Code2, FileText, GitBranch, Zap, TestTube2,
  History, BookOpen, Activity, ScrollText, Menu, X, Circle,
  AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { PROJECTS } from '../../data/mockData';
import { RoleBadge } from '../ui/StatusBadge';

const statusIcon = (status: string) => {
  if (status === 'active') return <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />;
  if (status === 'degraded') return <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />;
  if (status === 'provisioning') return <span className="w-2 h-2 rounded-full bg-blue-400 inline-block animate-pulse" />;
  if (status === 'draft') return <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />;
};

export function Sidebar() {
  const { currentUser, sidebarOpen, toggleSidebar } = useAppStore();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = currentUser.role === 'admin';
  const myProjects = PROJECTS.filter(p =>
    p.gpId === currentUser.id || p.team.some(m => m.userId === currentUser.id) || isAdmin
  );

  const handleLogout = () => navigate('/login');

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center w-14 bg-slate-900 border-r border-slate-800 py-4 gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">G</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-60 bg-slate-900 border-r border-slate-800 h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-slate-100 text-sm font-semibold">GCA</span>
            <p className="text-slate-500 text-[10px] leading-none">Gestão de Código</p>
          </div>
        </div>
        <button onClick={toggleSidebar} className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-slate-200 text-xs font-medium truncate">{currentUser.name}</p>
            <div className="mt-0.5"><RoleBadge role={currentUser.role} /></div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {/* Admin section */}
        {isAdmin && (
          <div className="mb-4">
            <p className="text-slate-500 text-[10px] uppercase tracking-wider px-2 mb-2 font-semibold">Administração</p>
            <NavItem to="/admin" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard Global" end />
            <NavItem to="/admin/projects" icon={<FolderOpen className="w-4 h-4" />} label="Projetos" />
            <NavItem to="/admin/users" icon={<Users className="w-4 h-4" />} label="Usuários" />
            <NavItem to="/admin/audit" icon={<ScrollText className="w-4 h-4" />} label="Auditoria Global" />
          </div>
        )}

        {/* Projects */}
        <div>
          <button
            onClick={() => setProjectsOpen(v => !v)}
            className="w-full flex items-center justify-between px-2 py-1 text-slate-500 text-[10px] uppercase tracking-wider font-semibold hover:text-slate-400 transition-colors"
          >
            <span>Meus Projetos</span>
            {projectsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {projectsOpen && (
            <div className="mt-1 space-y-0.5">
              {myProjects.map(proj => {
                const isInProject = location.pathname.startsWith(`/projects/${proj.id}`);
                return (
                  <div key={proj.id}>
                    <NavLink
                      to={`/projects/${proj.id}`}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                          isActive || isInProject
                            ? 'bg-slate-800 text-slate-100'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
                        }`
                      }
                      end
                    >
                      {statusIcon(proj.status)}
                      <span className="truncate text-xs">{proj.name}</span>
                    </NavLink>
                    {isInProject && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                        <SubNavItem to={`/projects/${proj.id}`} label="Dashboard" icon={<Activity className="w-3 h-3" />} end />
                        <SubNavItem to={`/projects/${proj.id}/ocg`} label="OCG" icon={<Settings className="w-3 h-3" />} />
                        <SubNavItem to={`/projects/${proj.id}/ingestion`} label="M4 · Ingestão" icon={<FileText className="w-3 h-3" />} />
                        <SubNavItem to={`/projects/${proj.id}/gatekeeper`} label="M5 · Gatekeeper" icon={<Shield className="w-3 h-3" />} />
                        <SubNavItem to={`/projects/${proj.id}/merge`} label="M6 · Merge Engine" icon={<GitBranch className="w-3 h-3" />} />
                        <SubNavItem to={`/projects/${proj.id}/arguider`} label="M7 · Arguidor" icon={<Zap className="w-3 h-3" />} />
                        <SubNavItem to={`/projects/${proj.id}/codegen`} label="M8 · Code Gen" icon={<Code2 className="w-3 h-3" />} />
                        <SubNavItem to={`/projects/${proj.id}/qa`} label="M9 · QA Readiness" icon={<TestTube2 className="w-3 h-3" />} />
                        <SubNavItem to={`/projects/${proj.id}/legacy`} label="M10 · Legado" icon={<History className="w-3 h-3" />} />
                        <SubNavItem to={`/projects/${proj.id}/roadmap`} label="M11 · Roadmap" icon={<Clock className="w-3 h-3" />} />
                        <SubNavItem to={`/projects/${proj.id}/docs`} label="M12 · Docs Viva" icon={<BookOpen className="w-3 h-3" />} />
                      </div>
                    )}
                  </div>
                );
              })}
              <NavLink
                to="/projects"
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
              >
                <span>Ver todos os projetos →</span>
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-800 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function SubNavItem({ to, label, icon, end }: { to: string; label: string; icon: React.ReactNode; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-1.5 py-1 px-1 rounded text-xs transition-colors ${
          isActive ? 'text-indigo-400 font-medium' : 'text-slate-500 hover:text-slate-300'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
