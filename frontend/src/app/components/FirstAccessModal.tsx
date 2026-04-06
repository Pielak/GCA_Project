import React, { useState } from 'react';
import axios from 'axios';
import { Lock, CheckCircle2, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';

interface FirstAccessModalProps {
  isOpen: boolean;
  temporaryPassword: string;
  onPasswordChanged: () => void;
}

export const FirstAccessModal: React.FC<FirstAccessModalProps> = ({
  isOpen,
  temporaryPassword,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  const validatePasswordStrength = (password: string) => {
    const hasMinLength = password.length >= 10;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return {
      valid: hasMinLength && hasUppercase && hasNumber && hasSpecial,
      hasMinLength,
      hasUppercase,
      hasNumber,
      hasSpecial,
      message: hasMinLength && hasUppercase && hasNumber && hasSpecial ? 'Senha forte ✅' : 'Preencha todos os requisitos'
    };
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setLoading(true);

    try {
      // Pega o token do localStorage (assumindo que foi feito login com temp password)
      const token = localStorage.getItem('access_token');

      const response = await axios.post(
        `${API_URL}/auth/change-first-password`,
        {
          temporary_password: temporaryPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        onPasswordChanged();
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const passwordValidation = validatePasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-dark-100 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl border border-dark-200">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">🔐 Bem-vindo ao GCA!</h2>
          <p className="text-gray-400 text-sm">
            Para sua segurança, defina uma senha permanente na primeira vez que faz login.
          </p>
        </div>

        {/* Security Notice */}
        <div className="flex gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-6">
          <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-400 font-medium">
            Esta ação é obrigatória. Você será forçado a completar isso agora.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleChangePassword} className="space-y-5">
          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 10 caracteres"
                disabled={loading}
                required
                className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border-2 bg-dark-200 transition-all focus:outline-none ${
                  newPassword.length === 0
                    ? 'border-dark-200 text-gray-300 placeholder-gray-600'
                    : passwordValidation.valid
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

            {/* Password Requirements */}
            {newPassword.length > 0 && (
              <div className="mt-3 space-y-2 p-3 bg-dark-200 rounded-lg border border-dark-200">
                <div className="flex items-center gap-2">
                  {passwordValidation.hasMinLength ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${
                    passwordValidation.hasMinLength ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    Mínimo 10 caracteres
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {passwordValidation.hasUppercase ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${
                    passwordValidation.hasUppercase ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    1 letra maiúscula
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {passwordValidation.hasNumber ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${
                    passwordValidation.hasNumber ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    1 número
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {passwordValidation.hasSpecial ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${
                    passwordValidation.hasSpecial ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    1 caractere especial (!@#$%^&*)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                disabled={loading}
                required
                className={`w-full pl-4 pr-10 py-2.5 text-sm rounded-lg border-2 bg-dark-200 transition-all focus:outline-none ${
                  confirmPassword.length === 0
                    ? 'border-dark-200 text-gray-300 placeholder-gray-600'
                    : passwordsMatch
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
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-2 text-xs text-red-400 font-medium">As senhas não correspondem</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !newPassword || !passwordValidation.valid || !passwordsMatch}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              passwordValidation.valid && passwordsMatch && !loading
                ? 'bg-violet-600 hover:bg-violet-700 text-white cursor-pointer'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Alterando senha...</span>
              </>
            ) : (
              '✅ Salvar e Continuar'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-6 text-xs text-gray-500">
          Seus dados estão protegidos com criptografia de ponta a ponta.
        </p>
      </div>
    </div>
  );
};

export default FirstAccessModal;
