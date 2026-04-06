import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Code2, Plus, Eye, Check, X, GitCommit, Sparkles, Clock, ChevronDown, Terminal, FileCode } from 'lucide-react';
import { getProjectById } from '../../data/mockData';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAppStore } from '../../store/appStore';

const LANG_COLORS: Record<string, string> = {
  Python: 'text-yellow-400 bg-yellow-900/20',
  TypeScript: 'text-blue-400 bg-blue-900/20',
  SQL: 'text-green-400 bg-green-900/20',
  JavaScript: 'text-yellow-300 bg-yellow-900/20',
};

export function CodeGeneratorPage() {
  const { id } = useParams<{ id: string }>();
  const project = getProjectById(id!);
  const { currentUser } = useAppStore();
  const [showRequest, setShowRequest] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLang, setNewLang] = useState('Python');
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  if (!project) return null;

  const canRequest = ['tech_lead', 'senior_dev', 'admin'].includes(currentUser.role);
  const canApprove = ['tech_lead', 'admin'].includes(currentUser.role);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setShowRequest(false); setNewTitle(''); setNewDesc(''); }, 1500);
  };

  const selectedReq = project.codeGenRequests.find(r => r.id === selected);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">M8 — Code Generator</h2>
          <p className="text-slate-500 text-sm mt-0.5">Geração assistida de artefatos técnicos com revisão humana obrigatória</p>
        </div>
        {canRequest && (
          <button
            onClick={() => setShowRequest(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Nova Geração
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Enviadas', value: project.codeGenRequests.filter(r => r.status === 'pushed').length, color: 'emerald' },
          { label: 'Em Revisão', value: project.codeGenRequests.filter(r => r.status === 'in_review').length, color: 'amber' },
          { label: 'Aprovadas', value: project.codeGenRequests.filter(r => r.status === 'approved').length, color: 'blue' },
          { label: 'Rejeitadas', value: project.codeGenRequests.filter(r => r.status === 'rejected').length, color: 'red' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-semibold ${stat.color === 'emerald' ? 'text-emerald-400' : stat.color === 'amber' ? 'text-amber-400' : stat.color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>{stat.value}</p>
            <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Request List */}
        <div className="lg:col-span-2 space-y-2">
          {project.codeGenRequests.map(req => (
            <button
              key={req.id}
              onClick={() => setSelected(req.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selected === req.id ? 'border-indigo-600/50 bg-indigo-900/10' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <p className="text-slate-200 text-sm font-medium line-clamp-1">{req.title}</p>
                </div>
                <StatusBadge status={req.status} size="sm" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${LANG_COLORS[req.language] ?? 'text-slate-400 bg-slate-800'}`}>{req.language}</span>
                {req.lines && <span className="text-slate-500 text-xs">{req.lines} linhas</span>}
                {req.commitHash && <span className="text-slate-500 text-xs font-mono">#{req.commitHash}</span>}
              </div>
              <p className="text-slate-600 text-xs mt-1.5">{new Date(req.requestedAt).toLocaleDateString('pt-BR')}</p>
            </button>
          ))}
          {project.codeGenRequests.length === 0 && (
            <div className="p-8 text-center border border-slate-800 rounded-xl">
              <Code2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhuma geração solicitada</p>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {selectedReq ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-5 border-b border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-slate-200 font-semibold">{selectedReq.title}</h3>
                    <p className="text-slate-400 text-sm mt-1">{selectedReq.description}</p>
                  </div>
                  <StatusBadge status={selectedReq.status} />
                </div>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className="text-slate-500 text-xs">Solicitado por: <span className="text-slate-300">{selectedReq.requestedBy}</span></span>
                  {selectedReq.approvedBy && <span className="text-slate-500 text-xs">Aprovado por: <span className="text-slate-300">{selectedReq.approvedBy}</span></span>}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${LANG_COLORS[selectedReq.language] ?? 'text-slate-400 bg-slate-800'}`}>{selectedReq.language}</span>
                </div>
              </div>

              {/* Simulated code output */}
              {(selectedReq.status === 'pushed' || selectedReq.status === 'approved' || selectedReq.status === 'in_review') && (
                <div className="p-5 border-b border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400 text-xs font-medium">Artefato Gerado</span>
                    {selectedReq.lines && <span className="text-slate-600 text-xs ml-auto">{selectedReq.lines} linhas · {selectedReq.language}</span>}
                  </div>
                  <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-400 overflow-x-auto">
                    <p className="text-emerald-400"># Gerado pelo GCA Code Generator</p>
                    <p className="text-blue-400 mt-1">from fastapi import APIRouter, Depends, HTTPException</p>
                    <p className="text-blue-400">from app.core.security import verify_token</p>
                    <p className="text-blue-400">from app.services.auth import AuthService</p>
                    <p className="mt-2 text-slate-500"># ... {selectedReq.lines && selectedReq.lines - 5} linhas geradas</p>
                    <p className="text-violet-400 mt-1">router = APIRouter(prefix="/auth", tags=["auth"])</p>
                    <p className="text-amber-400">@router.post("/login")</p>
                    <p>async def login(credentials: LoginSchema):</p>
                    <p className="pl-4">return await AuthService.authenticate(credentials)</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-4 flex items-center gap-3">
                {selectedReq.status === 'in_review' && canApprove && (
                  <>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-sm hover:bg-emerald-600/30 transition-colors">
                      <Check className="w-4 h-4" /> Aprovar e Fazer Push
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 text-sm hover:bg-red-900/30 transition-colors">
                      <X className="w-4 h-4" /> Rejeitar
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                      <Eye className="w-4 h-4" /> Ajustar
                    </button>
                  </>
                )}
                {selectedReq.status === 'pushed' && selectedReq.commitHash && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <GitCommit className="w-4 h-4" />
                    <span>Commit: <code className="font-mono">{selectedReq.commitHash}</code></span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-center">
                <Code2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Selecione uma geração para ver detalhes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-700/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-slate-100 font-semibold">Solicitar Nova Geração</h3>
                <p className="text-slate-500 text-xs">Contexto lido do OCG: {project.stack.language} · {project.ai.model}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm block mb-1.5">Título da geração</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" placeholder="Ex: Service de autenticação JWT" />
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-1.5">Instrução técnica</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none focus:outline-none focus:border-indigo-500" placeholder="Descreva o que deve ser gerado, padrões esperados e contexto..." />
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-1.5">Linguagem</label>
                <select value={newLang} onChange={e => setNewLang(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none">
                  <option>Python</option><option>TypeScript</option><option>SQL</option><option>JavaScript</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowRequest(false)} className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
              <button
                onClick={handleGenerate}
                disabled={!newTitle.trim() || generating}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {generating ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Gerando...</> : <><Sparkles className="w-4 h-4" />Gerar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
