import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, XCircle, Eye, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { PROJECTS, PENDING_PROJECT_REQUESTS, getUserById } from '../../data/mockData';
import { StatusBadge } from '../../components/ui/StatusBadge';

const OUTPUT_LABELS: Record<string, string> = {
  web_app: 'Web App', api: 'API', desktop: 'Desktop', mobile: 'Mobile', improvement: 'Melhoria', new_feature: 'Nova Feature',
};

export function AdminProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState(PENDING_PROJECT_REQUESTS);

  const filtered = PROJECTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleApprove = (id: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== id));
    setApproveId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Gestão de Projetos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Consolide solicitações, avalie pré-requisitos e libere tenants.</p>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-amber-300 text-sm font-semibold">Solicitações Pendentes ({pendingRequests.length})</h3>
          </div>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-lg border border-slate-800">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-900/30 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{req.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{req.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-slate-500 text-xs">Solicitado por: <span className="text-slate-400">{req.requestedBy}</span></span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500 text-xs">{OUTPUT_LABELS[req.outputProfile]}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500 text-xs">{new Date(req.requestedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setRejectId(req.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-800/40 text-red-400 hover:bg-red-900/50 transition-colors text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rejeitar
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/50 transition-colors text-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Aprovar e Liberar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar projeto..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="degraded">Degradado</option>
          <option value="provisioning">Provisionando</option>
          <option value="draft">Rascunho</option>
          <option value="suspended">Suspenso</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>

      {/* Projects Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">PROJETO</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">STATUS</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">OUTPUT</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">FASE</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">GP</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">GATEKEEPER</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">PENDÊNCIAS</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proj, i) => {
                const gp = getUserById(proj.gpId);
                return (
                  <tr key={proj.id} className={`border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors cursor-pointer ${i === filtered.length - 1 ? 'border-b-0' : ''}`}
                    onClick={() => navigate(`/projects/${proj.id}`)}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-200 text-sm font-medium">{proj.name}</p>
                        <p className="text-slate-500 text-xs">{proj.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={proj.status} size="sm" /></td>
                    <td className="px-4 py-3"><span className="text-slate-400 text-xs">{OUTPUT_LABELS[proj.outputProfile]}</span></td>
                    <td className="px-4 py-3"><span className="text-slate-300 text-sm">{proj.phase}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-700/60 flex items-center justify-center text-white text-xs">{gp?.name.charAt(0)}</div>
                        <span className="text-slate-400 text-xs">{gp?.name.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-700 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${proj.gatekeeper.score}%`, backgroundColor: proj.gatekeeper.score >= 90 ? '#34d399' : proj.gatekeeper.score >= 70 ? '#fbbf24' : '#f87171' }} />
                        </div>
                        <span className="text-xs text-slate-400">{proj.gatekeeper.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {proj.pendingIssues > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 text-xs">{proj.pendingIssues}</span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
