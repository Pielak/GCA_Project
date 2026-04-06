import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Lock, Mail, Eye, EyeOff, Shield, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { USERS } from '../data/mockData';

export function LoginPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAppStore();
  const [email, setEmail] = useState('pielak.ctba@gmail.com');
  const [password, setPassword] = useState('Topazio01#');
  const [confirmPassword, setConfirmPassword] = useState('Topazio01#');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const isFormValid = passwordValidation.isValid && passwordsMatch;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user = USERS.find(u => u.email === email) ?? USERS[0];
      setCurrentUser(user);
      navigate('/');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-50 flex">
      {/* Left Panel - Brand & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-violet-700 to-violet-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white text-lg font-semibold">GCA</span>
            <p className="text-violet-200 text-xs">Gestão de Codificação Assistida</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Orquestre projetos.<br />
              <span className="text-emerald-300">Governe com confiança.</span>
            </h2>
            <p className="text-violet-100 text-base leading-relaxed">
              Meta-plataforma de orquestração, governança e visibilidade de projetos de software com isolamento por tenant, ciclo documental completo e rastreabilidade total.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: '7 Pilares', desc: 'Gatekeeper Documental' },
              { icon: Code2, label: 'Code Gen', desc: 'Geração Assistida' },
              { icon: Zap, label: 'QA Ready', desc: 'Containers Isolados' },
              { icon: Lock, label: 'Multi-tenant', desc: 'Isolamento Seguro' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-white/10 border border-white/20 backdrop-blur-sm">
                <Icon className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-semibold">{label}</p>
                  <p className="text-violet-200 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-violet-200 text-sm">© 2026 GCA. Todos os direitos reservados.</p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-violet-900 text-lg font-bold">GCA</span>
              <p className="text-violet-600 text-xs">Gestão de Codificação Assistida</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-violet-900 mb-2">Bem-vindo!</h1>
            <p className="text-violet-700">Defina sua senha para acessar a plataforma.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-violet-900 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 10 caracteres"
                  className={`w-full pl-10 pr-4 py-3 text-sm rounded-lg border-2 transition-all focus:outline-none ${
                    password.length === 0
                      ? 'border-violet-200 bg-white text-gray-900 placeholder-gray-500'
                      : passwordValidation.isValid
                      ? 'border-emerald-500 bg-emerald-50 text-gray-900'
                      : 'border-red-400 bg-red-50 text-gray-900'
                  }`}
                />
              </div>

              {/* Password Requirements */}
              {password.length > 0 && (
                <div className="mt-4 space-y-2 p-4 bg-violet-50 rounded-lg border border-violet-200">
                  <p className="text-xs font-semibold text-violet-900 mb-3">Requisitos da senha:</p>

                  <div className="flex items-center gap-2">
                    {passwordValidation.hasMinLength ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${
                      passwordValidation.hasMinLength ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      Mínimo 10 caracteres
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {passwordValidation.hasUppercase ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${
                      passwordValidation.hasUppercase ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      Pelo menos 1 letra maiúscula
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {passwordValidation.hasNumber ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${
                      passwordValidation.hasNumber ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      Pelo menos 1 número
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {passwordValidation.hasSpecial ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${
                      passwordValidation.hasSpecial ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      Pelo menos 1 caractere especial (!@#$%^&*)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-violet-900 mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className={`w-full pl-10 pr-10 py-3 text-sm rounded-lg border-2 transition-all focus:outline-none ${
                    confirmPassword.length === 0
                      ? 'border-violet-200 bg-white text-gray-900 placeholder-gray-500'
                      : passwordsMatch
                      ? 'border-emerald-500 bg-emerald-50 text-gray-900'
                      : 'border-red-400 bg-red-50 text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-600 hover:text-violet-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-2 text-xs text-red-600 font-medium">As senhas não correspondem</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-900">Dados protegidos</p>
                <p className="text-xs text-emerald-700 mt-0.5">Criptografia de ponta a ponta em todas as comunicações.</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                isFormValid && !loading
                  ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-xl cursor-pointer'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                'Salvar e Continuar'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-violet-600 mt-8">
            Seus dados estão protegidos com criptografia de ponta a ponta.
          </p>
        </div>
      </div>
    </div>
  );
}
