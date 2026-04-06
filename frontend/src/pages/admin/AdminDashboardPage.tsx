import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Users, Activity, AlertTriangle, TrendingUp,
  CheckCircle2, Clock, XCircle, Zap, Shield, GitBranch, Key
} from 'lucide-react';
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PROJECTS, AUDIT_EVENTS, USERS } from '../../data/mockData';
import { StatusBadge } from '../../components/ui/StatusBadge';

const statusCounts = {
  active: PROJECTS.filter(p => p.status === 'active').length,
  degraded: PROJECTS.filter(p => p.status === 'degraded').length,
  provisioning: PROJECTS.filter(p => p.status === 'provisioning').length,
  draft: PROJECTS.filter(p => p.status === 'draft').length,
  suspended: PROJECTS.filter(p => p.status === 'suspended').length,
};

const pieData = [
  { name: 'Ativo', value: statusCounts.active, color: '#34d399' },
  { name: 'Degradado', value: statusCounts.degraded, color: '#fbbf24' },
  { name: 'Provisionando', value: statusCounts.provisioning, color: '#60a5fa' },
  { name: 'Rascunho', value: statusCounts.draft, color: '#64748b' },
];

const gatekeeperData = PROJECTS.filter(p => p.gatekeeper.score > 0).map(p => ({
  name: p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name,
  score: p.gatekeeper.score,
  fill: p.gatekeeper.score >= 90 ? '#34d399' : p.gatekeeper.score >= 70 ? '#fbbf24' : '#f87171',
}));

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const allCredentials = PROJECTS.flatMap(p => p.credentials.map(c => ({ ...c, project: p.name })));
  const criticalCreds = allCredentials.filter(c => c.status === 'expired' || c.status === 'suspected');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Dashboard Global</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão consolidada de todos os projetos e indicadores do GCA</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<FolderOpen className="w-5 h-5 text-indigo-400" />} label="Total de Projetos" value={PROJECTS.length} sub="todos os tenants" color="indigo" />
        <KPICard icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} label="Projetos Ativos" value={statusCounts.active} sub="em operação" color="emerald" />
        <KPICard icon={<AlertTriangle className="w-5 h-5 text-amber-400" />} label="Degradados" value={statusCounts.degraded} sub="requerem atenção" color="amber" />
        <KPICard icon={<Users className="w-5 h-5 text-blue-400" />} label="Usuários" value={USERS.filter(u => u.active).length} sub={`${USERS.filter(u => !u.active).length} inativos`} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-slate-200 text-sm font-semibold mb-4">Distribuição de Status</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} cx={55} cy={55} innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-400 text-xs">{d.name}</span>
                  <span className="text-slate-200 text-xs font-medium ml-auto pl-4">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gatekeeper Scores */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 lg:col-span-2">
          <h3 className="text-slate-200 text-sm font-semibold mb-4">Score Gatekeeper por Projeto</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={gatekeeperData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' }}
                formatter={(v: number) => [`${v}/100`, 'Score']}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {gatekeeperData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-200 text-sm font-semibold">Projetos Recentes</h3>
            <button onClick={() => navigate('/admin/projects')} className="text-xs text-indigo-400 hover:text-indigo-300">Ver todos →</button>
          </div>
          <div className="space-y-2">
            {PROJECTS.slice(0, 5).map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-indigo-900/40 border border-indigo-800/40 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-200 text-xs font-medium truncate">{p.name}</p>
                  <p className="text-slate-500 text-xs">Fase {p.phase} · {p.outputProfile}</p>
                </div>
                <StatusBadge status={p.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-4">
          {/* Critical Credentials */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-200 text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Credenciais com Alerta
              </h3>
              <span className="text-xs text-red-400 font-medium">{criticalCreds.length} críticas</span>
            </div>
            {criticalCreds.length === 0 ? (
              <p className="text-slate-500 text-xs">Todas as credenciais estão válidas.</p>
            ) : (
              <div className="space-y-2">
                {criticalCreds.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-md bg-red-950/30 border border-red-900/30">
                    <div>
                      <p className="text-slate-300 text-xs font-medium">{c.name}</p>
                      <p className="text-slate-500 text-xs">{c.project}</p>
                    </div>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-200 text-sm font-semibold">Atividade Recente</h3>
              <button onClick={() => navigate('/admin/audit')} className="text-xs text-indigo-400 hover:text-indigo-300">Ver trilha →</button>
            </div>
            <div className="space-y-2.5">
              {AUDIT_EVENTS.slice(0, 5).map(ev => (
                <div key={ev.id} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${ev.level === 'critical' ? 'bg-red-400' : ev.level === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <div className="min-w-0">
                    <p className="text-slate-300 text-xs leading-snug">{ev.detail.slice(0, 80)}{ev.detail.length > 80 ? '…' : ''}</p>
                    <p className="text-slate-600 text-xs mt-0.5">{new Date(ev.timestamp).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number; sub: string; color: string }) {
  const bg = { indigo: 'bg-indigo-900/20 border-indigo-800/30', emerald: 'bg-emerald-900/20 border-emerald-800/30', amber: 'bg-amber-900/20 border-amber-800/30', blue: 'bg-blue-900/20 border-blue-800/30' }[color] ?? 'bg-slate-800 border-slate-700';
  return (
    <div className={`${bg} border rounded-xl p-4`}>
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-slate-800/60">{icon}</div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold text-slate-100">{value}</p>
        <p className="text-slate-300 text-xs font-medium mt-0.5">{label}</p>
        <p className="text-slate-500 text-xs">{sub}</p>
      </div>
    </div>
  );
}
