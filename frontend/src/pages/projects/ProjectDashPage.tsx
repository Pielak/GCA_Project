import React from 'react';
import { useParams } from 'react-router-dom';
import { GitBranch, Key, Cpu, Users, CheckCircle, XCircle, Clock, FileText, Code2, TestTube2, Shield } from 'lucide-react';
import { getProjectById, getUserById } from '../../data/mockData';
import { StatusBadge, RoleBadge } from '../../components/ui/StatusBadge';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export function ProjectDashPage() {
  const { id } = useParams<{ id: string }>();
  const project = getProjectById(id!);
  if (!project) return null;

  const radarData = project.gatekeeper.pillars.map(p => ({
    subject: p.pillar.split(' ').slice(-1)[0],
    score: p.score,
    fullMark: 100,
  }));

  const testStats = {
    passed: project.testExecutions.filter(t => t.status === 'passed').length,
    failed: project.testExecutions.filter(t => t.status === 'failed').length,
    queued: project.testExecutions.filter(t => t.status === 'queued').length,
  };

  const codeStats = {
    pushed: project.codeGenRequests.filter(c => c.status === 'pushed').length,
    review: project.codeGenRequests.filter(c => c.status === 'in_review').length,
    approved: project.codeGenRequests.filter(c => c.status === 'approved').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniKPI label="Artefatos" value={project.artifacts.length} sub={`${project.artifacts.filter(a => a.status === 'merged').length} consolidados`} icon={<FileText className="w-4 h-4 text-blue-400" />} />
        <MiniKPI label="Gerações" value={project.codeGenRequests.length} sub={`${codeStats.pushed} enviadas`} icon={<Code2 className="w-4 h-4 text-violet-400" />} />
        <MiniKPI label="Testes" value={project.testExecutions.length} sub={`${testStats.passed} passaram`} icon={<TestTube2 className="w-4 h-4 text-emerald-400" />} />
        <MiniKPI label="Tokens IA" value={project.ai.tokensUsed.toLocaleString('pt-BR')} sub={`R$ ${project.ai.costEstimated.toFixed(2)} est.`} icon={<Cpu className="w-4 h-4 text-amber-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gatekeeper Radar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-200 text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Gatekeeper — 7 Pilares
            </h3>
            <StatusBadge status={project.gatekeeper.status} size="sm" />
          </div>
          {project.gatekeeper.pillars.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">Gatekeeper não iniciado</div>
          )}
        </div>

        {/* Stack & Repository */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-slate-200 text-sm font-semibold mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-400" />Stack & IA
            </h3>
            <div className="space-y-2">
              {[
                { k: 'Linguagem', v: project.stack.language },
                { k: 'Framework', v: project.stack.framework },
                { k: 'Banco', v: project.stack.database },
                { k: 'Provedor IA', v: `${project.ai.provider} · ${project.ai.model}` },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500 text-xs">{k}</span>
                  <span className="text-slate-300 text-xs">{v}</span>
                </div>
              ))}
            </div>
          </div>
          {project.repository && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-slate-200 text-sm font-semibold mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-slate-400" />Repositório
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Provedor</span>
                  <span className="text-slate-300 text-xs capitalize">{project.repository.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Branch</span>
                  <span className="text-slate-300 text-xs">{project.repository.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Webhook</span>
                  <StatusBadge status={project.repository.webhook} size="sm" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-slate-200 text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />Equipe
          </h3>
          <div className="space-y-2.5">
            {project.team.map(member => {
              const user = getUserById(member.userId);
              if (!user) return null;
              return (
                <div key={member.userId} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-700/50 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{user.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs">{user.name}</p>
                    {member.capabilities && member.capabilities.length > 0 && (
                      <p className="text-slate-500 text-[10px] truncate">{member.capabilities.join(', ')}</p>
                    )}
                  </div>
                  <RoleBadge role={member.role} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-slate-400" />
          <h3 className="text-slate-200 text-sm font-semibold">Credenciais do Projeto</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {project.credentials.map((cred, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300 text-xs font-medium">{cred.name}</span>
                <StatusBadge status={cred.status} size="sm" />
              </div>
              <p className="text-slate-500 text-xs capitalize">{cred.type}</p>
              {cred.expiresAt && <p className="text-slate-600 text-xs mt-1">Expira: {new Date(cred.expiresAt).toLocaleDateString('pt-BR')}</p>}
            </div>
          ))}
          {project.credentials.length === 0 && <p className="text-slate-500 text-sm col-span-4">Nenhuma credencial configurada.</p>}
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-slate-400 text-xs">{label}</span></div>
      <p className="text-xl font-semibold text-slate-100">{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
    </div>
  );
}
