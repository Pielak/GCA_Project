import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Lock, Mail, Eye, EyeOff, Shield, Zap } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { USERS } from '../data/mockData';

export function LoginPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAppStore();
  const [email, setEmail] = useState('rafael@gca.dev');
  const [password, setPassword] = useState('••••••••');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.email === email) ?? USERS[0];
      setCurrentUser(user);
      navigate('/');
    }, 800);
  };

  const quickLogin = (userId: string) => {
    const user = USERS.find(u => u.id === userId)!;
    setCurrentUser(user);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-blue-100 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-blue-900 text-lg font-semibold">GCA</span>
            <p className="text-blue-600 text-xs">Gestão de Código Assistida</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-semibold text-blue-900 leading-tight">
              Orquestre projetos.<br />
              <span className="text-blue-600">Governe com confiança.</span>
            </h2>
            <p className="mt-4 text-blue-700 text-base leading-relaxed">
              Meta-plataforma de orquestração, governança e visibilidade de projetos de software com isolamento por tenant, ciclo documental completo e rastreabilidade total.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: '7 pilares', desc: 'Gatekeeper documental' },
              { icon: Code2, label: 'Code Gen', desc: 'Geração assistida de código' },
              { icon: Zap, label: 'QA Readiness', desc: 'Testes em containers isolados' },
              { icon: Lock, label: 'Multi-tenant', desc: 'Isolamento por schema/namespace' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-white/40 border border-blue-200">
                <div className="w-8 h-8 rounded-md bg-blue-900/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-900" />
                </div>
                <div>
                  <p className="text-blue-900 text-sm font-medium">{label}</p>
                  <p className="text-blue-700 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-600 text-sm">© 2026 GCA. Todos os direitos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-blue-100">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-blue-900 text-lg font-semibold">GCA</span>
          </div>

          <h2 className="text-2xl font-semibold text-blue-900">Bem-vindo ao GCA!</h2>
          <p className="mt-1 text-blue-700 text-sm">Para sua segurança, você deve alterar a senha temporária na primeira vez que faz login.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm text-blue-900 font-medium mb-1.5">Nova Senha (Obrigatória)</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                  placeholder="Mínimo 12 caracteres, 1 maiúscula, 1 número, 1 caractere especial"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-blue-900 font-medium mb-1.5">Confirmar Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
                  placeholder="Repita a senha"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex gap-3">
              <Shield className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-yellow-800">⚠ Importante:</p>
                <p className="text-xs text-yellow-700 mt-0.5">Esta ação é obrigatória e você será forçado a fazer isso agora.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Autenticando...</>
              ) : 'Salvar e Continuar'}
            </button>
          </form>

          <div className="mt-6 text-xs text-blue-600 text-center">
            Seus dados estão protegidos com criptografia de ponta a ponta.
          </div>
        </div>
      </div>
    </div>
  );
}
