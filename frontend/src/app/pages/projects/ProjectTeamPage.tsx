import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface PendingInvite {
  invite_id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
}

interface InviteState {
  email: string;
  role: 'tech_lead' | 'dev_senior' | 'dev_pleno' | 'qa' | 'compliance';
  loading: boolean;
  error: string | null;
  success: string | null;
}

export const ProjectTeamPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const [inviteForm, setInviteForm] = useState<InviteState>({
    email: '',
    role: 'dev_pleno',
    loading: false,
    error: null,
    success: null,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  // Carregar convites pendentes
  useEffect(() => {
    loadPendingInvites();
  }, [projectId]);

  const loadPendingInvites = async () => {
    if (!projectId) return;

    setLoadingInvites(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_URL}/projects/${projectId}/invites`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPendingInvites(response.data.invites || []);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteForm(prev => ({ ...prev, error: null, success: null }));

    if (!projectId) {
      setInviteForm(prev => ({ ...prev, error: 'Projeto não encontrado' }));
      return;
    }

    setInviteForm(prev => ({ ...prev, loading: true }));

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/projects/${projectId}/invite`,
        {
          email: inviteForm.email,
          role: inviteForm.role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setInviteForm(prev => ({
          ...prev,
          email: '',
          role: 'dev_pleno',
          success: '✅ Convite enviado com sucesso!',
        }));

        // Recarregar convites pendentes
        await loadPendingInvites();

        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => {
          setInviteForm(prev => ({ ...prev, success: null }));
        }, 3000);
      }
    } catch (error: any) {
      setInviteForm(prev => ({
        ...prev,
        error: error.response?.data?.detail || 'Erro ao enviar convite',
      }));
    } finally {
      setInviteForm(prev => ({ ...prev, loading: false }));
    }
  };

  const getRoleName = (role: string): string => {
    const names: { [key: string]: string } = {
      'tech_lead': 'Tech Lead',
      'dev_senior': 'Dev Sênior',
      'dev_pleno': 'Dev Pleno',
      'qa': 'QA',
      'compliance': 'Compliance',
    };
    return names[role] || role;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
          👥 Gerenciar Equipe do Projeto
        </h1>
        <p style={{ color: '#666' }}>
          Convide membros da sua equipe para colaborar neste projeto
        </p>
      </div>

      {/* Formulário de Convite */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
          🎉 Convidar Novo Membro
        </h2>

        {inviteForm.error && (
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
            ❌ {inviteForm.error}
          </div>
        )}

        {inviteForm.success && (
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
            {inviteForm.success}
          </div>
        )}

        <form onSubmit={handleInviteSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                Email do Membro *
              </label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={e =>
                  setInviteForm(prev => ({ ...prev, email: e.target.value }))
                }
                placeholder="dev@empresa.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                disabled={inviteForm.loading}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                Papel *
              </label>
              <select
                value={inviteForm.role}
                onChange={e =>
                  setInviteForm(prev => ({
                    ...prev,
                    role: e.target.value as InviteState['role'],
                  }))
                }
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                disabled={inviteForm.loading}
              >
                <option value="tech_lead">Tech Lead</option>
                <option value="dev_senior">Dev Sênior</option>
                <option value="dev_pleno">Dev Pleno</option>
                <option value="qa">QA</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviteForm.loading || !inviteForm.email}
              style={{
                padding: '10px 20px',
                backgroundColor: '#60a5fa',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: inviteForm.loading ? 'not-allowed' : 'pointer',
                opacity: inviteForm.loading ? 0.6 : 1,
              }}
            >
              {inviteForm.loading ? '⏳' : '🎉'} Convidar
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Convites Pendentes */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          📋 Convites Pendentes ({pendingInvites.length})
        </h2>

        {loadingInvites ? (
          <p style={{ color: '#666' }}>Carregando convites...</p>
        ) : pendingInvites.length === 0 ? (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              color: '#166534',
            }}
          >
            ✅ Nenhum convite pendente! Sua equipe está toda integrada.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {pendingInvites.map(invite => (
              <div
                key={invite.invite_id}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 150px 150px 100px',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>{invite.email}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    Convidado em {formatDate(invite.invited_at)}
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {getRoleName(invite.role)}
                  </span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    Expira em: {formatDate(invite.expires_at)}
                  </span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    ⏳ Pendente
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: '12px', color: '#999' }}>
          💡 <strong>Dica:</strong> Os convites expiram em 7 dias. Os membros receberão um email com um link para aceitar
          o convite e configurar sua senha na primeira vez.
        </p>
      </div>
    </div>
  );
};

export default ProjectTeamPage;
