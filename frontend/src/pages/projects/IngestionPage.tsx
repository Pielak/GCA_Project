import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, FileText, AlertTriangle, Shield, Hash, CheckCircle, Eye, XCircle, Clock } from 'lucide-react';
import { getProjectById } from '../../data/mockData';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function IngestionPage() {
  const { id } = useParams<{ id: string }>();
  const project = getProjectById(id!);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState('all');
  if (!project) return null;

  const quarantined = project.artifacts.filter(a => a.status === 'pii_quarantine');
  const filtered = filter === 'all' ? project.artifacts : project.artifacts.filter(a => a.status === filter);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">M4 — Ingestão de Artefatos</h2>
        <p className="text-slate-500 text-sm mt-0.5">Upload, extração local, pré-triagem de PII, classificação e quarentena LGPD</p>
      </div>

      {/* Quarantine Alert */}
      {quarantined.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/20 border border-red-800/30">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-300 text-sm font-semibold">{quarantined.length} artefato(s) em Quarentena LGPD</p>
            <p className="text-red-700 text-xs mt-0.5">Artefatos com indício de PII não autorizado. Aguardam decisão de Compliance (rejeitar, mascarar ou aprovar).</p>
            <div className="mt-2 space-y-1.5">
              {quarantined.map(art => (
                <div key={art.id} className="flex items-center justify-between p-2 rounded-md bg-red-900/20">
                  <div>
                    <p className="text-slate-300 text-xs font-medium">{art.name}</p>
                    <p className="text-red-400 text-xs">{art.piiFlags?.join(' · ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 text-xs rounded bg-slate-800 text-amber-400 hover:bg-slate-700 transition-colors">Mascarar</button>
                    <button className="px-2 py-1 text-xs rounded bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors">Aprovar</button>
                    <button className="px-2 py-1 text-xs rounded bg-slate-800 text-red-400 hover:bg-slate-700 transition-colors">Rejeitar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); }}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${dragging ? 'border-indigo-500 bg-indigo-900/10' : 'border-slate-700 hover:border-slate-600'}`}
      >
        <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-300 text-sm font-medium">Arraste artefatos ou clique para selecionar</p>
        <p className="text-slate-500 text-xs mt-1">Suportado: PDF, DOCX, TXT, Markdown · Hash SHA-256 · Pré-triagem local de PII automática</p>
        <button className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors">
          Selecionar Arquivo
        </button>
      </div>

      {/* Pipeline Info */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Upload + Hash', icon: <Upload className="w-4 h-4" />, color: 'text-blue-400', desc: 'SHA-256 calculado' },
          { label: 'Extração Local', icon: <FileText className="w-4 h-4" />, color: 'text-violet-400', desc: 'Texto extraído' },
          { label: 'Pré-triagem PII', icon: <Shield className="w-4 h-4" />, color: 'text-amber-400', desc: 'Regex + dicionários' },
          { label: 'Classificação', icon: <Hash className="w-4 h-4" />, color: 'text-emerald-400', desc: 'Categoria definida' },
        ].map(step => (
          <div key={step.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className={`${step.color} mx-auto mb-2 flex justify-center`}>{step.icon}</div>
            <p className="text-slate-300 text-xs font-medium">{step.label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Artifacts List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-slate-200 text-sm font-semibold">Artefatos ({project.artifacts.length})</h3>
          <div className="flex gap-1">
            {['all', 'merged', 'classified', 'pending_review', 'pii_quarantine', 'rejected'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 rounded-md text-xs transition-colors ${filter === s ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30' : 'text-slate-500 hover:text-slate-300'}`}>
                {s === 'all' ? 'Todos' : s}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">Nenhum artefato encontrado.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map(art => (
              <div key={art.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium">{art.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-slate-500 text-xs">{art.type}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500 text-xs">{art.size}</span>
                    <span className="text-slate-600">·</span>
                    <code className="text-slate-600 text-xs font-mono">{art.hash.slice(0, 24)}…</code>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500 text-xs">v{art.version}</span>
                  </div>
                  {art.piiFlags && art.piiFlags.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {art.piiFlags.map(flag => <span key={flag} className="text-xs text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">{flag}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-slate-500 text-xs">{new Date(art.uploadedAt).toLocaleDateString('pt-BR')}</span>
                  <StatusBadge status={art.status} size="sm" />
                  <button className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
