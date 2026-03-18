import React, { useEffect, useMemo, useState } from 'react';
import { LockKeyhole, LogOut, Save, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { PageHeader } from '../components/platform/page-header';
import { RequestStatePanel } from '../components/platform/request-state-panel';
import { SurfacePanel } from '../components/platform/surface-panel';
import { getRequestErrorMessage } from '../services/request-error';
import { getProfileRequest, updateProfilePasswordRequest, updateProfileRequest } from '../services/profile-service';

interface AccountState {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  unit: string;
}

const emptyAccount: AccountState = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  jobTitle: '',
  unit: '',
};

export function Profile() {
  const navigate = useNavigate();
  const { user, token, updateUser, logout } = useAuth();
  const [account, setAccount] = useState<AccountState>(emptyAccount);
  const [baseAccount, setBaseAccount] = useState<AccountState>(emptyAccount);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [pageError, setPageError] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setPageError('');

      try {
        const loadedUser = await getProfileRequest(token);
        if (!isMounted) {
          return;
        }

        const nextAccount = mapUserToAccountState(loadedUser);
        setAccount(nextAccount);
        setBaseAccount(nextAccount);
        updateUser(loadedUser);
      } catch (error) {
        if (isMounted) {
          setPageError(getRequestErrorMessage(error, 'Nao foi possivel carregar os dados do perfil.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, [token, reloadKey]);

  const currentUserName = user?.name || account.fullName || 'Usuario';
  const hasAccountChanges = useMemo(() => {
    return account.fullName.trim() !== baseAccount.fullName.trim() || account.email.trim().toLowerCase() !== baseAccount.email.trim().toLowerCase();
  }, [account.email, account.fullName, baseAccount.email, baseAccount.fullName]);

  const handleAccountChange = (field: keyof Pick<AccountState, 'fullName' | 'email'>, value: string) => {
    setAccountError('');
    setAccountMessage('');
    setAccount((current) => ({ ...current, [field]: value }));
  };

  const handleSaveAccount = async () => {
    if (!token) {
      return;
    }

    const fullName = account.fullName.trim();
    const email = account.email.trim().toLowerCase();

    if (!fullName || !email) {
      setAccountError('Nome e e-mail sao obrigatorios.');
      return;
    }

    if (!email.includes('@')) {
      setAccountError('Informe um e-mail valido.');
      return;
    }

    setAccountError('');
    setAccountMessage('');
    setIsSavingAccount(true);

    try {
      const updatedUser = await updateProfileRequest(
        {
          fullName,
          email,
          phone: account.phone.trim(),
          company: account.company.trim(),
          jobTitle: account.jobTitle.trim(),
          unit: account.unit.trim(),
        },
        token,
      );

      const nextAccount = mapUserToAccountState(updatedUser);
      setAccount(nextAccount);
      setBaseAccount(nextAccount);
      updateUser(updatedUser);
      setAccountMessage('Dados da conta atualizados com sucesso.');
    } catch (error) {
      setAccountError(getRequestErrorMessage(error, 'Nao foi possivel salvar os dados da conta.'));
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSavePassword = async () => {
    if (!token) {
      return;
    }

    const currentPassword = passwordForm.currentPassword;
    const newPassword = passwordForm.newPassword;
    const confirmNewPassword = passwordForm.confirmNewPassword;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Preencha os tres campos de senha para atualizar.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('A confirmacao da nova senha nao confere.');
      return;
    }

    setPasswordError('');
    setPasswordMessage('');
    setIsSavingPassword(true);

    try {
      await updateProfilePasswordRequest(
        {
          currentPassword,
          newPassword,
        },
        token,
      );
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setPasswordMessage('Senha atualizada com sucesso.');
    } catch (error) {
      setPasswordError(getRequestErrorMessage(error, 'Nao foi possivel atualizar a senha.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] px-10 py-8">
        <RequestStatePanel title="Carregando perfil" description="Sincronizando os dados da sua conta com o servidor." state="loading" isLoading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <PageHeader
        title="Meu perfil"
        subtitle="Ajuste apenas os dados essenciais da sua conta."
        searchPlaceholder=""
        searchValue=""
        onSearchChange={() => undefined}
        showSearch={false}
        searchWidthClass="max-w-[520px]"
        showSystemActions={false}
      />

      <div className="space-y-6 px-10 py-8">
        {pageError ? (
          <RequestStatePanel
            title="Falha ao carregar perfil"
            description={pageError}
            state="error"
            onRetry={() => setReloadKey((value) => value + 1)}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <SurfacePanel className="border-[#d8e2ec] p-6 md:p-7">
            <div className="mb-5 flex items-center gap-3 text-[#0e93d8]">
              <User size={18} />
              <h2 className="text-[15px] font-semibold uppercase tracking-[0.08em]">Informacoes da conta</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[120px_1fr]">
              <div>
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80'}
                  alt={`Avatar de ${currentUserName}`}
                  className="h-24 w-24 rounded-[22px] border-2 border-white object-cover shadow-[0_6px_10px_rgba(15,23,42,0.16)]"
                />
              </div>

              <div className="space-y-4">
                <Field label="Nome completo" value={account.fullName} onChange={(value) => handleAccountChange('fullName', value)} type="text" />
                <Field label="E-mail" value={account.email} onChange={(value) => handleAccountChange('email', value)} type="email" />

                {accountError ? <InlineMessage tone="error">{accountError}</InlineMessage> : null}
                {accountMessage ? <InlineMessage tone="success">{accountMessage}</InlineMessage> : null}

                <button
                  type="button"
                  onClick={handleSaveAccount}
                  disabled={!hasAccountChanges || isSavingAccount}
                  className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#159dde] px-6 text-sm font-semibold text-white shadow-[0_6px_10px_rgba(21,157,222,0.24)] transition hover:bg-[#0e93d8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {isSavingAccount ? 'Salvando...' : 'Salvar alteracoes'}
                </button>
              </div>
            </div>
          </SurfacePanel>

          <SurfacePanel className="border-[#d8e2ec] p-6 md:p-7">
            <div className="mb-5 flex items-center gap-3 text-[#0e93d8]">
              <LockKeyhole size={18} />
              <h2 className="text-[15px] font-semibold uppercase tracking-[0.08em]">Seguranca</h2>
            </div>

            <div className="space-y-4">
              <Field
                label="Senha atual"
                value={passwordForm.currentPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
                type="password"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Nova senha"
                  value={passwordForm.newPassword}
                  onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
                  type="password"
                />
                <Field
                  label="Confirmar nova senha"
                  value={passwordForm.confirmNewPassword}
                  onChange={(value) => setPasswordForm((current) => ({ ...current, confirmNewPassword: value }))}
                  type="password"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {passwordError ? <InlineMessage tone="error">{passwordError}</InlineMessage> : null}
              {passwordMessage ? <InlineMessage tone="success">{passwordMessage}</InlineMessage> : null}

              <button
                type="button"
                onClick={handleSavePassword}
                disabled={isSavingPassword}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#159dde] px-6 text-sm font-semibold text-white shadow-[0_6px_10px_rgba(21,157,222,0.24)] transition hover:bg-[#0e93d8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingPassword ? 'Atualizando...' : 'Atualizar senha'}
              </button>
            </div>
          </SurfacePanel>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-6 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            <LogOut size={16} />
            Sair da plataforma
          </button>
        </div>
      </div>
    </div>
  );
}

function mapUserToAccountState(user: {
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  unit: string;
}): AccountState {
  return {
    fullName: user.name,
    email: user.email,
    phone: user.phone,
    company: user.company,
    jobTitle: user.jobTitle,
    unit: user.unit,
  };
}

function Field({
  label,
  value,
  onChange,
  type,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[#002a52]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#d7e0ea] bg-[#f8fafc] px-4 text-[15px] text-[#35506f] outline-none transition focus:border-[#009fe3] focus:bg-white focus:ring-4 focus:ring-[#d8eefb]"
      />
    </label>
  );
}

function InlineMessage({
  tone,
  children,
}: {
  tone: 'success' | 'error';
  children: React.ReactNode;
}) {
  const toneClassName = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-600';

  return <div className={`rounded-xl border px-3 py-2 text-sm font-medium ${toneClassName}`}>{children}</div>;
}
