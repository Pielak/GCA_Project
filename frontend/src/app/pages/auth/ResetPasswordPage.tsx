import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    if (password.length < 12) {
      return { valid: false, message: 'Mínimo 12 caracteres' };
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
    <div style={{ maxWidth: '500px', margin: '60px auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
          🔐 Recuperar Senha
        </h1>
        <p style={{ color: '#666' }}>
          {state.step === 'request' && 'Insira seu email para receber um link de recuperação'}
          {state.step === 'confirm' && 'Digite sua nova senha'}
        </p>
      </div>

      {state.error && (
        <div
          style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            color: '#c00',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          style={{
            backgroundColor: '#efe',
            border: '1px solid #cfc',
            color: '#060',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          ✅ {state.success}
        </div>
      )}

      {state.step === 'request' && (
        <form onSubmit={handleRequestReset}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={state.email}
              onChange={e => setState(prev => ({ ...prev, email: e.target.value }))}
              placeholder="seu@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              disabled={state.loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={state.loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#60a5fa',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: state.loading ? 'not-allowed' : 'pointer',
              opacity: state.loading ? 0.6 : 1,
            }}
          >
            {state.loading ? '⏳ Enviando...' : '📧 Enviar Link de Recuperação'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '12px' }}>
            Lembrou sua senha? <a href="/login" style={{ color: '#60a5fa' }}>Faça login</a>
          </p>
        </form>
      )}

      {state.step === 'confirm' && (
        <form onSubmit={handleConfirmReset}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Nova Senha
            </label>
            <input
              type="password"
              value={state.newPassword}
              onChange={e => setState(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Mínimo 12 caracteres"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              disabled={state.loading}
              required
            />
            {state.newPassword && (
              <small
                style={{
                  display: 'block',
                  marginTop: '8px',
                  color: validatePasswordStrength(state.newPassword).valid ? '#060' : '#c00',
                }}
              >
                {validatePasswordStrength(state.newPassword).valid ? '✅' : '❌'}{' '}
                {validatePasswordStrength(state.newPassword).message}
              </small>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Confirmar Senha
            </label>
            <input
              type="password"
              value={state.confirmPassword}
              onChange={e => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Repita a senha"
              style={{
                width: '100%',
                padding: '12px',
                border: state.newPassword && state.newPassword !== state.confirmPassword ? '2px solid #c00' : '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              disabled={state.loading}
              required
            />
            {state.newPassword && state.confirmPassword && (
              <small
                style={{
                  display: 'block',
                  marginTop: '8px',
                  color: state.newPassword === state.confirmPassword ? '#060' : '#c00',
                }}
              >
                {state.newPassword === state.confirmPassword ? '✅ Senhas conferem' : '❌ Senhas não conferem'}
              </small>
            )}
          </div>

          <button
            type="submit"
            disabled={state.loading || !state.newPassword || state.newPassword !== state.confirmPassword}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: state.loading ? 'not-allowed' : 'pointer',
              opacity: state.loading ? 0.6 : 1,
            }}
          >
            {state.loading ? '⏳ Alterando...' : '🔐 Alterar Senha'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordPage;
