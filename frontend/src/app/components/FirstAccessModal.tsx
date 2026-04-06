import React, { useState } from 'react';
import axios from 'axios';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
    return { valid: true, message: 'Senha forte ✅' };
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
          🔐 Bem-vindo ao GCA!
        </h2>

        <p style={{ color: '#666', textAlign: 'center', marginBottom: '24px' }}>
          Para sua segurança, você deve alterar a senha temporária na primeira vez que faz login.
        </p>

        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #10b981',
            color: '#047857',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '13px',
          }}
        >
          <strong>🔒 Segurança:</strong> Esta ação é obrigatória e você será forçado a fazer isso agora.
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              color: '#c00',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
            }}
          >
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Nova Senha (Obrigatória)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 10 caracteres, 1 maiúscula, 1 número, 1 caractere especial"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              disabled={loading}
              required
            />
            {newPassword && (
              <small
                style={{
                  display: 'block',
                  marginTop: '8px',
                  color: passwordValidation.valid ? '#060' : '#c00',
                }}
              >
                {passwordValidation.valid ? '✅' : '❌'} {passwordValidation.message}
              </small>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              style={{
                width: '100%',
                padding: '12px',
                border: newPassword && !passwordsMatch ? '2px solid #c00' : '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              disabled={loading}
              required
            />
            {newPassword && confirmPassword && (
              <small
                style={{
                  display: 'block',
                  marginTop: '8px',
                  color: passwordsMatch ? '#060' : '#c00',
                }}
              >
                {passwordsMatch ? '✅ Senhas conferem' : '❌ Senhas não conferem'}
              </small>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !passwordValidation.valid || !passwordsMatch}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor:
                loading || !newPassword || !passwordValidation.valid || !passwordsMatch
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                loading || !newPassword || !passwordValidation.valid || !passwordsMatch ? 0.6 : 1,
              fontSize: '14px',
            }}
          >
            {loading ? '⏳ Alterando senha...' : '✅ Salvar e Continuar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', color: '#999', fontSize: '12px' }}>
          Seus dados estão protegidos com criptografia de ponta a ponta.
        </p>
      </div>
    </div>
  );
};

export default FirstAccessModal;
