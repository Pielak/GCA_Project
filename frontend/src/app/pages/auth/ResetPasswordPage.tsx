import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordState {
  step: 'request' | 'verify' | 'confirm';
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  error: string | null;
  success: string | null;
}

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, setState] = useState<ResetPasswordState>({
    step: searchParams.get('token') ? 'verify' : 'request',
    email: '',
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    error: null,
    success: null,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  // Validar token na primeira vez que a página carrega
  useEffect(() => {
    if (state.token && state.step === 'verify') {
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axios.post(`${API_URL}/auth/verify-reset-token`, {
        token: state.token,
      });

      if (response.data.valid) {
        setState(prev => ({ ...prev, step: 'confirm', loading: false }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.data.message || 'Token inválido ou expirado',
          loading: false,
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.detail || 'Erro ao validar token',
        loading: false,
      }));
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email: state.email,
      });

      setState(prev => ({
        ...prev,
        success: 'Se o email existe no sistema, um link de recuperação foi enviado',
        loading: false,
      }));

      // Limpar após 3 segundos
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.detail || 'Erro ao solicitar reset de senha',
        loading: false,
      }));
    }
  };

  const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
    if (password.length < 10) {
      return { valid: false, message: 'Mínimo 10 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Deve conter letra maiúscula' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Deve conter número' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: 'Deve conter caractere especial' };
    }
    return { valid: true, message: 'Senha forte' };
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, error: null }));

    if (state.newPassword !== state.confirmPassword) {
      setState(prev => ({ ...prev, error: 'As senhas não conferem' }));
      return;
    }

    const validation = validatePasswordStrength(state.newPassword);
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.message }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      await axios.post(`${API_URL}/auth/reset-password-confirm`, {
        token: state.token,
        new_password: state.newPassword,
      });

      setState(prev => ({
        ...prev,
        success: 'Senha alterada com sucesso! Redirecionando para login...',
        loading: false,
      }));

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.detail || 'Erro ao confirmar reset de senha',
        loading: false,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <a href="/login" className="flex items-center gap-2 text-violet-500 hover:text-violet-400 text-sm font-medium mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar para login
        </a>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔐 Recuperar Senha</h1>
          <p className="text-gray-400">
            {state.step === 'request' && 'Insira seu email para receber um link de recuperação'}
            {state.step === 'confirm' && 'Defina sua nova senha'}
          </p>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {state.error}
          </div>
        )}

        {/* Success Message */}
        {state.success && (
          <div className="bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-lg mb-6 text-sm font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {state.success}
          </div>
        )}

        {/* Request Email Step */}
        {state.step === 'request' && (
          <form onSubmit={handleRequestReset} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                <input
                  type="email"
                  value={state.email}
                  onChange={e => setState(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                  disabled={state.loading}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border-2 border-dark-200 bg-dark-200 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={state.loading}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                !state.loading
                  ? 'bg-violet-600 hover:bg-violet-700 text-white cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {state.loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                '📧 Enviar Link de Recuperação'
              )}
            </button>
          </form>
        )}

        {/* Confirm Password Step */}
        {state.step === 'confirm' && (
          <form onSubmit={handleConfirmReset} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={state.newPassword}
                  onChange={e => setState(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Mínimo 10 caracteres"
                  disabled={state.loading}
                  required
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border-2 bg-dark-200 transition-all focus:outline-none ${
                    state.newPassword.length === 0
                      ? 'border-dark-200 text-gray-300 placeholder-gray-600'
                      : validatePasswordStrength(state.newPassword).valid
                      ? 'border-emerald-500 text-white'
                      : 'border-red-500 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 hover:text-violet-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {state.newPassword && (
                <div className="mt-3 p-3 bg-dark-200 rounded-lg border border-dark-200 flex items-start gap-2">
                  {validatePasswordStrength(state.newPassword).valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-xs font-medium ${
                    validatePasswordStrength(state.newPassword).valid ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {validatePasswordStrength(state.newPassword).message}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={state.confirmPassword}
                  onChange={e => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Repita a senha"
                  disabled={state.loading}
                  required
                  className={`w-full pl-4 pr-10 py-2.5 text-sm rounded-lg border-2 bg-dark-200 transition-all focus:outline-none ${
                    state.confirmPassword.length === 0
                      ? 'border-dark-200 text-gray-300 placeholder-gray-600'
                      : state.newPassword === state.confirmPassword
                      ? 'border-emerald-500 text-white'
                      : 'border-red-500 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 hover:text-violet-400 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {state.newPassword && state.confirmPassword && (
                <small className={`block mt-2 text-xs font-medium ${
                  state.newPassword === state.confirmPassword ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {state.newPassword === state.confirmPassword ? '✅ Senhas conferem' : '❌ Senhas não conferem'}
                </small>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={state.loading || !state.newPassword || state.newPassword !== state.confirmPassword}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                !state.loading && state.newPassword && state.newPassword === state.confirmPassword
                  ? 'bg-violet-600 hover:bg-violet-700 text-white cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {state.loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Alterando...</span>
                </>
              ) : (
                '🔐 Alterar Senha'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
