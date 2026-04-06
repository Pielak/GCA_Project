import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, XCircle, Zap, Lock, Info, ChevronDown } from 'lucide-react';
import { getProjectById } from '../../data/mockData';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppStore } from '../../store/appStore';

const pillarStatusColor = (status: string) => {
  if (status === 'ok') return 'text-emerald-400';
  if (status === 'warning') return 'text-amber-400';
  return 'text-red-400';
};

const pillarStatusBg = (status: string) => {
  if (status === 'ok') return 'border-emerald-800/30 bg-emerald-950/10';
  if (status === 'warning') return 'border-amber-800/30 bg-amber-950/10';
  return 'border-red-800/30 bg-red-950/10';
};

export function GatekeeperPage() {
  const { id } = useParams<{ id: string }>();
  const project = getProjectById(id!);
  const { currentUser } = useAppStore();
  const [showOverride, setShowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  if (!project) return null;

  const canOverride = currentUser.role === 'tech_lead' || currentUser.role === 'admin';
  const blockers = project.gatekeeper.pillars.filter(p => p.status === 'blocker');
  const warnings = project.gatekeeper.pillars.filter(p => p.status === 'warning');

  const radarData = project.gatekeeper.pillars.map(p => ({
    subject: p.pillar.split(' ').slice(-1)[0],
    score: p.score,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">M5 — Gatekeeper</h2>
          <p className="text-slate-500 text-sm mt-0.5">Avaliação dos 7 pilares documentais com scoring formal</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={project.gatekeeper.status} />
          {canOverride && project.gatekeeper.status === 'blocked' && (
            <button
              onClick={() => setShowOverride(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/20 border border-amber-700/30 text-amber-400 text-sm hover:bg-amber-900/30 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" /> Override
            </button>
          )}
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={project.gatekeeper.score >= 90 ? '#34d399' : project.gatekeeper.score >= 70 ? '#fbbf24' : '#f87171'}
                strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 40 * project.gatekeeper.score / 100} ${2 * Math.PI * 40}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-100">{project.gatekeeper.score}</span>
              <span className="text-slate-500 text-xs">/ 100</span>
            </div>
          </div>
          <p className="text-slate-200 text-sm font-medium mt-3">Score Global</p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3.5 h-3.5" />{blockers.length} blocker{blockers.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3.5 h-3.5" />{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {project.gatekeeper.pillars.length > 0 && (
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-slate-200 text-sm font-semibold mb-3">Visão Radar — 7 Pilares</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' }} formatter={(v: number) => [`${v}/100`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pillar Details */}
      {project.gatekeeper.pillars.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {project.gatekeeper.pillars.map((pillar, i) => (
            <div key={i} className={`border rounded-xl p-4 ${pillarStatusBg(pillar.status)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs font-mono w-4">{i + 1}</span>
                  <p className="text-slate-200 text-sm font-medium">{pillar.pillar}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-28 bg-slate-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pillar.score}%`, backgroundColor: pillar.status === 'ok' ? '#34d399' : pillar.status === 'warning' ? '#fbbf24' : '#f87171' }} />
                    </div>
                    <span className={`text-sm font-semibold ${pillarStatusColor(pillar.status)}`}>{pillar.score}</span>
                  </div>
                  {pillar.status === 'blocker' && <span className="px-2 py-0.5 rounded text-xs bg-red-900/40 text-red-400 border border-red-800/40">BLOCKER</span>}
                  {pillar.status === 'warning' && <span className="px-2 py-0.5 rounded text-xs bg-amber-900/40 text-amber-400 border border-amber-800/40">WARNING</span>}
                  {pillar.status === 'ok' && <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/40">OK</span>}
                </div>
              </div>
              {pillar.notes && <p className="text-slate-400 text-xs ml-7">{pillar.notes}</p>}
              {pillar.status === 'blocker' && (
                <div className="ml-7 mt-2 flex gap-2">
                  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50 transition-colors">
                    <Zap className="w-3 h-3" /> Acionar Arguidor
                  </button>
                  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
                    <Info className="w-3 h-3" /> Ver detalhes
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-center">
            <Shield className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Gatekeeper ainda não iniciado</p>
            <p className="text-slate-600 text-xs mt-1">Inicie após a consolidação dos artefatos no Merge Engine</p>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverride && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-700/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-900/40 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-slate-100 font-semibold">Override do Gatekeeper</h3>
                <p className="text-amber-400 text-xs">Requer justificativa formal · Registrado em auditoria</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">Esta ação aprova o projeto mesmo com blockers ativos. A justificativa será permanentemente registrada na trilha de auditoria.</p>
            <div>
              <label className="text-slate-400 text-sm block mb-1.5">Justificativa técnica obrigatória</label>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                rows={4}
                placeholder="Descreva a razão técnica para o override e o plano de mitigação dos blockers..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowOverride(false)} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
              <button
                disabled={!overrideReason.trim()}
                onClick={() => setShowOverride(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-500 disabled:opacity-50 transition-colors"
              >
                Registrar Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
