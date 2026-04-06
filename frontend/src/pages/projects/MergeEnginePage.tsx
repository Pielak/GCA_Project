import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { GitMerge, AlertCircle, CheckCircle, ChevronRight, FileText, RefreshCw, ArrowRight } from 'lucide-react';
import { getProjectById } from '../../data/mockData';

const CONFLICTS = [
  { id: 'c1', type: 'Contradição', artifacts: ['Especificação Funcional v3.pdf', 'Backlog Técnico.md'], description: 'Prazo de entrega diverge: "Q2 2026" vs "Julho 2026"', severity: 'warning', resolved: false },
  { id: 'c2', type: 'Incompletude', artifacts: ['Backlog Técnico.md'], description: 'Requisito RF-042 sem critério de aceite definido', severity: 'info', resolved: true },
];

const MASTER_SECTIONS = [
  { id: 's1', title: 'Visão Geral do Produto', sources: ['Especificação Funcional v3.pdf'], status: 'merged', wordCount: 842 },
  { id: 's2', title: 'Requisitos Funcionais', sources: ['Especificação Funcional v3.pdf', 'Backlog Técnico.md'], status: 'merged', wordCount: 2341 },
  { id: 's3', title: 'Requisitos Não-Funcionais', sources: ['Especificação Funcional v3.pdf'], status: 'conflict', wordCount: 419 },
  { id: 's4', title: 'Arquitetura Técnica', sources: ['Backlog Técnico.md'], status: 'pending', wordCount: 0 },
  { id: 's5', title: 'Segurança e Compliance', sources: ['Requisitos de Segurança.txt'], status: 'pending', wordCount: 0 },
];

export function MergeEnginePage() {
  const { id } = useParams<{ id: string }>();
  const project = getProjectById(id!);
  const [activeTab, setActiveTab] = useState<'master' | 'conflicts' | 'map'>('master');
  if (!project) return null;

  const mergedArtifacts = project.artifacts.filter(a => a.status === 'merged' || a.status === 'classified');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">M6 — Merge Engine</h2>
          <p className="text-slate-500 text-sm mt-0.5">Documento mestre consolidado · Resolução de conflitos · Mapa de origem</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Regredir Merge
        </button>
      </div>

      {/* Merge Flow */}
      <div className="flex items-center gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl flex-wrap">
        {mergedArtifacts.slice(0, 3).map((art, i) => (
          <React.Fragment key={art.id}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300 text-xs">{art.name.slice(0, 20)}…</span>
            </div>
            {i < Math.min(mergedArtifacts.length, 3) - 1 && <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />}
          </React.Fragment>
        ))}
        <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-900/30 border border-indigo-700/40">
          <GitMerge className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-indigo-300 text-xs font-medium">Documento Mestre</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {(['master', 'conflicts', 'map'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            {tab === 'master' ? 'Documento Mestre' : tab === 'conflicts' ? `Conflitos (${CONFLICTS.filter(c => !c.resolved).length})` : 'Mapa de Origem'}
          </button>
        ))}
      </div>

      {activeTab === 'master' && (
        <div className="space-y-3">
          {MASTER_SECTIONS.map(sec => (
            <div key={sec.id} className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className={`w-2 h-10 rounded-full flex-shrink-0 ${sec.status === 'merged' ? 'bg-emerald-500' : sec.status === 'conflict' ? 'bg-red-500' : 'bg-slate-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 text-sm font-medium">{sec.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {sec.sources.map(s => <span key={s} className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{s.slice(0, 25)}…</span>)}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {sec.wordCount > 0 && <p className="text-slate-500 text-xs">{sec.wordCount.toLocaleString('pt-BR')} palavras</p>}
                <span className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${sec.status === 'merged' ? 'bg-emerald-900/40 text-emerald-400' : sec.status === 'conflict' ? 'bg-red-900/40 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
                  {sec.status === 'merged' ? 'Consolidado' : sec.status === 'conflict' ? 'Conflito' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          {CONFLICTS.map(conflict => (
            <div key={conflict.id} className={`p-5 rounded-xl border ${conflict.resolved ? 'border-slate-800 opacity-60' : conflict.severity === 'warning' ? 'border-amber-800/30 bg-amber-950/10' : 'border-blue-800/20 bg-blue-950/5'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {conflict.resolved ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className={`w-4 h-4 flex-shrink-0 ${conflict.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'}`} />}
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${conflict.severity === 'warning' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'}`}>{conflict.type}</span>
                    <p className="text-slate-200 text-sm font-medium mt-1">{conflict.description}</p>
                  </div>
                </div>
                {conflict.resolved ? (
                  <span className="text-emerald-400 text-xs">Resolvido</span>
                ) : (
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Detalhar</button>
                    <button className="px-3 py-1 text-xs rounded bg-indigo-600/20 border border-indigo-600/30 text-indigo-400 hover:bg-indigo-600/30 transition-colors">Resolver</button>
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-7 flex-wrap">
                {conflict.artifacts.map(a => (
                  <span key={a} className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                    <FileText className="w-3 h-3" />{a}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'map' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-slate-200 text-sm font-semibold mb-4">Mapa de Origem dos Requisitos</h3>
          <div className="space-y-3">
            {project.artifacts.filter(a => a.status !== 'rejected').map(art => (
              <div key={art.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40">
                <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">{art.name}</p>
                  <p className="text-slate-500 text-xs">v{art.version} · {art.hash.slice(0, 20)}…</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <span className={`text-xs px-2 py-0.5 rounded ${art.status === 'merged' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {art.status === 'merged' ? 'No Mestre' : 'Fora do Mestre'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
