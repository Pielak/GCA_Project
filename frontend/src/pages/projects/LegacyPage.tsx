import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { History, GitBranch, Search, FileCode, AlertTriangle, CheckCircle, Scan, Eye, Lock } from 'lucide-react';
import { getProjectById } from '../../data/mockData';

const LEGACY_FINDINGS = [
  { id: 'f1', type: 'Vulnerabilidade', severity: 'high', file: 'auth/views.py', line: 142, description: 'SQL query construída via concatenação — risco de SQLi', status: 'open' },
  { id: 'f2', type: 'Código Legado', severity: 'medium', file: 'utils/pdf_parser.py', line: 88, description: 'Biblioteca PDFMiner v1.2 com CVE-2023-4512 reportado', status: 'open' },
  { id: 'f3', type: 'Padrão obsoleto', severity: 'low', file: 'models/user.py', line: 15, description: 'Uso de MD5 para hash de senha — não recomendado (deve migrar para bcrypt)', status: 'acknowledged' },
  { id: 'f4', type: 'Dependência', severity: 'medium', file: 'requirements.txt', line: 23, description: 'Django 3.2 — sem suporte desde abril 2024', status: 'open' },
  { id: 'f5', type: 'Lógica crítica', severity: 'high', file: 'payments/processor.py', line: 201, description: 'Sem tratamento de race condition em transações concorrentes', status: 'open' },
];

const severityColor = (s: string) => {
  if (s === 'high') return 'text-red-400 bg-red-900/20 border-red-800/30';
  if (s === 'medium') return 'text-amber-400 bg-amber-900/20 border-amber-800/30';
  return 'text-blue-400 bg-blue-900/20 border-blue-800/30';
};

export function LegacyPage() {
  const { id } = useParams<{ id: string }>();
  const project = getProjectById(id!);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(!!project?.legacyRepo);
  const [scope, setScope] = useState('auth/, payments/, models/');
  if (!project) return null;

  const hasLegacy = !!project.legacyRepo || analyzed;

  const startAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true); }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">M10 — Análise de Legado</h2>
        <p className="text-slate-500 text-sm mt-0.5">Leitura controlada read-only do repositório legado com análise assistida por IA</p>
      </div>

      {/* Repository Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-4 h-4 text-blue-400" />
          <h3 className="text-slate-200 text-sm font-semibold">Repositório Legado</h3>
          <span className="ml-auto px-2 py-0.5 rounded text-xs bg-blue-900/30 text-blue-400 border border-blue-700/30">read-only</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-500 text-xs block mb-1.5">URL do repositório</label>
            <input
              defaultValue={project.legacyRepo ?? ''}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              placeholder="https://github.com/empresa/projeto-legado"
            />
          </div>
          <div>
            <label className="text-slate-500 text-xs block mb-1.5">Escopo de análise</label>
            <input
              value={scope}
              onChange={e => setScope(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              placeholder="ex: src/, lib/, models/"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 p-3 rounded-lg bg-amber-950/10 border border-amber-800/20">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-xs">Credenciais read-only necessárias. Configure em <span className="text-indigo-400">Dashboard → Credenciais</span>. Nenhum segredo é persistido em texto claro.</p>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={startAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {analyzing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analisando...</> : <><Scan className="w-4 h-4" />Iniciar Análise</>}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors">
            <Eye className="w-4 h-4" /> Testar Conectividade
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {analyzed && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold text-slate-100">47</p>
              <p className="text-slate-500 text-xs mt-1">Arquivos analisados</p>
            </div>
            <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold text-red-400">{LEGACY_FINDINGS.filter(f => f.severity === 'high').length}</p>
              <p className="text-slate-500 text-xs mt-1">Alta severidade</p>
            </div>
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold text-amber-400">{LEGACY_FINDINGS.filter(f => f.severity === 'medium').length}</p>
              <p className="text-slate-500 text-xs mt-1">Média severidade</p>
            </div>
            <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-semibold text-blue-400">{LEGACY_FINDINGS.filter(f => f.severity === 'low').length}</p>
              <p className="text-slate-500 text-xs mt-1">Baixa severidade</p>
            </div>
          </div>

          {/* Findings */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-slate-200 text-sm font-semibold">Achados de Análise</h3>
              <button className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                <FileCode className="w-3.5 h-3.5" /> Consolidar em Docs Viva
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {LEGACY_FINDINGS.map(finding => (
                <div key={finding.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                  <div className="mt-0.5">
                    {finding.severity === 'high' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : finding.severity === 'medium' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <AlertTriangle className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${severityColor(finding.severity)}`}>{finding.severity}</span>
                      <span className="text-slate-500 text-xs bg-slate-800 px-1.5 py-0.5 rounded">{finding.type}</span>
                      <code className="text-slate-400 text-xs font-mono">{finding.file}:{finding.line}</code>
                    </div>
                    <p className="text-slate-300 text-sm">{finding.description}</p>
                  </div>
                  <span className={`text-xs flex-shrink-0 ${finding.status === 'acknowledged' ? 'text-slate-500' : 'text-amber-400'}`}>{finding.status === 'acknowledged' ? 'Reconhecido' : 'Aberto'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* IA Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-indigo-400" />
              <h3 className="text-slate-200 text-sm font-semibold">Resumo de IA — Contexto do Legado</h3>
              <span className="ml-auto text-xs text-slate-500">{project.ai.provider} · {project.ai.model}</span>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <p className="text-slate-300 text-sm leading-relaxed">
                O sistema legado utiliza Django 3.2 com PostgreSQL 12. A autenticação é baseada em sessão com tokens MD5 (alto risco). O módulo de pagamentos não possui idempotência garantida para transações concorrentes. Recomenda-se migração gradual com strangler fig pattern, priorizando refatoração do módulo de autenticação (auth/) e pagamentos (payments/) antes da integração com o novo sistema.
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-slate-500 text-xs">Gerado em: 2026-04-01 14:22 · Tokens: 4.821</span>
                <button className="text-xs text-indigo-400 hover:text-indigo-300">Publicar em Docs Viva →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {!analyzed && (
        <div className="flex items-center justify-center h-40 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-center">
            <History className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Configure o repositório legado e inicie a análise</p>
            <p className="text-slate-600 text-xs mt-1">Obrigatório para projetos de melhoria ou nova funcionalidade em sistema existente</p>
          </div>
        </div>
      )}
    </div>
  );
}
