import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Lock, Mail, Eye, EyeOff, Shield, Zap } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { USERS } from '../data/mockData';

export function LoginPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAppStore();
  const [email, setEmail] = useState('rafael@gca.dev');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validação de senha: mínimo 10 caracteres, 1 maiúscula, 1 número, 1 especial
  const validatePassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 10;
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    return {
      isValid: hasMinLength && hasUppercase && hasNumber && hasSpecial,
      hasMinLength,
      hasUppercase,
      hasNumber,
      hasSpecial,
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValidation.isValid || !passwordsMatch) {
      return;
    }

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
    <div className="min-h-screen bg-violet-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-100 via-violet-50 to-violet-100 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-violet-900 text-lg font-semibold">GCA</span>
            <p className="text-violet-600 text-xs">Gestão de Codificação Assistida</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-semibold text-violet-900 leading-tight">
              Orquestre projetos.<br />
              <span className="text-violet-600">Governe com confiança.</span>
            </h2>
            <p className="mt-4 text-violet-700 text-base leading-relaxed">
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
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-white/60 border border-violet-200">
                <div className="w-8 h-8 rounded-md bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-violet-700" />
                </div>
                <div>
                  <p className="text-violet-900 text-sm font-medium">{label}</p>
                  <p className="text-violet-700 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-violet-600 text-sm">© 2026 GCA. Todos os direitos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-violet-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-violet-900 text-lg font-semibold">GCA</span>
          </div>

          <h2 className="text-2xl font-semibold text-violet-900">Bem-vindo ao GCA!</h2>
          <p className="mt-1 text-violet-700 text-sm">Defina sua senha permanente para acessar a plataforma. Mínimo 10 caracteres.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm text-violet-900 font-medium mb-1.5">Nova Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full bg-white border rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all ${
                    password.length === 0
                      ? 'border-violet-300 focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30'
                      : passwordValidation.isValid
                      ? 'border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30'
                      : 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-600/30'
                  }`}
                  placeholder="Mínimo 10 caracteres"
                />
              </div>

              {/* Requisitos da senha */}
              {password.length > 0 && (
                <div className="mt-3 space-y-1.5 p-3 bg-violet-50 rounded-lg border border-violet-200">
                  <p className="text-xs font-semibold text-violet-900">Requisitos:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        passwordValidation.hasMinLength ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}>
                        {passwordValidation.hasMinLength && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={passwordValidation.hasMinLength ? 'text-emerald-700' : 'text-gray-600'}>
                        Mínimo 10 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        passwordValidation.hasUppercase ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}>
                        {passwordValidation.hasUppercase && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={passwordValidation.hasUppercase ? 'text-emerald-700' : 'text-gray-600'}>
                        1 letra maiúscula
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        passwordValidation.hasNumber ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}>
                        {passwordValidation.hasNumber && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={passwordValidation.hasNumber ? 'text-emerald-700' : 'text-gray-600'}>
                        1 número
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        passwordValidation.hasSpecial ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}>
                        {passwordValidation.hasSpecial && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={passwordValidation.hasSpecial ? 'text-emerald-700' : 'text-gray-600'}>
                        1 caractere especial (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-violet-900 font-medium mb-1.5">Confirmar Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full bg-white border rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-all ${
                    confirmPassword.length === 0
                      ? 'border-violet-300 focus:border-violet-600 focus:ring-1 focus:ring-violet-600/30'
                      : passwordsMatch
                      ? 'border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30'
                      : 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-600/30'
                  }`}
                  placeholder="Repita a senha"
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 hover:text-violet-700">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1.5 text-xs text-red-600">As senhas não correspondem</p>
              )}
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 flex gap-3">
              <Shield className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-violet-900">Requisito de segurança:</p>
                <p className="text-xs text-violet-700 mt-0.5">Você deve definir uma senha forte antes de continuar.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValidation.isValid || !passwordsMatch}
              className={`w-full rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                passwordValidation.isValid && passwordsMatch
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Autenticando...</>
              ) : 'Salvar e Continuar'}
            </button>
          </form>

          <div className="mt-6 text-xs text-violet-600 text-center">
            Seus dados estão protegidos com criptografia de ponta a ponta.
          </div>
        </div>
      </div>
    </div>
  );
}
