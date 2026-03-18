import React, { useEffect, useState } from 'react';
import { Edit2, KeyRound, Shield, Trash2, UserCheck, UserMinus, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { matchesUserFilter, userFilters, type UserRecord } from '../../data/platform';
import { motionTransitions, motionVariants } from '../../lib/motion-presets';
import { getRequestErrorMessage } from '../../services/request-error';
import type { CreateUserInput, UpdateUserInput } from '../../services/user-service';
import { FilterChips } from '../platform/filter-chips';
import { PillBadge } from '../platform/pill-badge';
import { PlatformSelect } from '../platform/platform-select';
import { StatCard } from '../platform/stat-card';
import { SurfacePanel } from '../platform/surface-panel';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '../ui/alert-dialog';

interface AdminUsersProps {
  users: UserRecord[];
  searchQuery: string;
  isAddOpen: boolean;
  setIsAddOpen: (value: boolean) => void;
  onCreateUser: (input: CreateUserInput) => Promise<void>;
  onUpdateUser: (userId: string, input: UpdateUserInput) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

interface UserFormState {
  fullName: string;
  email: string;
  password: string;
  profile: 'Administrador' | 'Cliente';
  access: 'Administrador' | 'Area restrita' | 'Sem acesso';
  status: 'Ativo' | 'Inativo';
  unit: string;
}

const initialUserForm: UserFormState = {
  fullName: '',
  email: '',
  password: '',
  profile: 'Cliente',
  access: 'Area restrita',
  status: 'Ativo',
  unit: 'Matriz',
};

function normalizeValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function AdminUsers({
  users,
  searchQuery,
  isAddOpen,
  setIsAddOpen,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}: AdminUsersProps) {
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formState, setFormState] = useState<UserFormState>(initialUserForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [tableActionError, setTableActionError] = useState('');
  const [loadingActionUserId, setLoadingActionUserId] = useState<string | null>(null);
  const [userPendingDelete, setUserPendingDelete] = useState<UserRecord | null>(null);
  const canUsePortal = typeof window !== 'undefined' && typeof document !== 'undefined';

  const normalizedQuery = normalizeValue(searchQuery);
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      normalizeValue([user.name, user.email, user.unit, user.profile, user.access].join(' ')).includes(normalizedQuery);

    return matchesSearch && matchesUserFilter(user, activeFilter);
  });

  const adminCount = users.filter((user) => user.profile === 'Administrador').length;
  const activeCount = users.filter((user) => user.status === 'Ativo').length;
  const inactiveCount = users.filter((user) => user.status === 'Inativo').length;
  const isEditMode = editingUser !== null;
  const accessOptions = formState.profile === 'Administrador' ? ['Administrador'] : ['Area restrita', 'Sem acesso'];

  useEffect(() => {
    if (!isAddOpen) {
      setFormState(initialUserForm);
      setFormError('');
      setIsSubmitting(false);
      setEditingUser(null);
      return;
    }

    if (editingUser) {
      setFormState(mapUserToForm(editingUser));
      setFormError('');
      return;
    }

    setFormState(initialUserForm);
    setFormError('');
  }, [editingUser, isAddOpen]);

  const closeDrawer = () => {
    setIsAddOpen(false);
    setEditingUser(null);
    setFormError('');
  };

  const handleFieldChange = <TKey extends keyof UserFormState>(field: TKey, value: UserFormState[TKey]) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleProfileChange = (profile: UserFormState['profile']) => {
    setFormState((current) => ({
      ...current,
      profile,
      access: profile === 'Administrador' ? 'Administrador' : current.access === 'Administrador' ? 'Area restrita' : current.access,
    }));
  };

  const handleStartEdit = (user: UserRecord) => {
    setTableActionError('');
    setEditingUser(user);
    setIsAddOpen(true);
  };

  const closeDeleteModal = () => {
    if (loadingActionUserId) {
      return;
    }

    setUserPendingDelete(null);
  };

  const handleRequestDeleteUser = (user: UserRecord) => {
    setUserPendingDelete(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userPendingDelete) {
      return;
    }

    setTableActionError('');
    setLoadingActionUserId(userPendingDelete.id);

    try {
      await onDeleteUser(userPendingDelete.id);
      setUserPendingDelete(null);
    } catch (error) {
      setTableActionError(getRequestErrorMessage(error, 'Nao foi possivel remover o usuario.'));
    } finally {
      setLoadingActionUserId(null);
    }
  };

  const handleToggleAccess = async (user: UserRecord) => {
    if (user.profile === 'Administrador') {
      return;
    }

    const nextAccess = user.access === 'Sem acesso' ? 'Area restrita' : 'Sem acesso';
    setTableActionError('');
    setLoadingActionUserId(user.id);

    try {
      await onUpdateUser(user.id, { access: nextAccess, status: nextAccess === 'Sem acesso' ? user.status : 'Ativo' });
    } catch (error) {
      setTableActionError(getRequestErrorMessage(error, 'Nao foi possivel atualizar o acesso do usuario.'));
    } finally {
      setLoadingActionUserId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = formState.fullName.trim();
    const email = formState.email.trim().toLowerCase();
    const password = formState.password;
    const unit = formState.unit.trim() || 'Matriz';

    if (!fullName || !email) {
      setFormError('Nome e e-mail sao obrigatorios.');
      return;
    }

    if (!email.includes('@')) {
      setFormError('Informe um e-mail valido.');
      return;
    }

    if (!isEditMode && !password) {
      setFormError('Senha provisoria e obrigatoria para cadastro.');
      return;
    }

    if (password && password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingUser) {
        const payload: UpdateUserInput = {
          fullName,
          email,
          profile: formState.profile,
          access: formState.access,
          status: formState.status,
          unit,
        };

        if (password.length > 0) {
          payload.password = password;
        }

        await onUpdateUser(editingUser.id, payload);
      } else {
        await onCreateUser({
          fullName,
          email,
          password,
          profile: formState.profile,
          access: formState.access,
          status: formState.status,
          unit,
        });
      }

      closeDrawer();
    } catch (error) {
      setFormError(getRequestErrorMessage(error, `Nao foi possivel ${editingUser ? 'atualizar' : 'cadastrar'} o usuario.`));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard label="Total de usuarios" value={users.length} icon={<Users size={22} />} />
        <StatCard label="Administradores" value={adminCount} icon={<Shield size={22} />} />
        <StatCard label="Usuarios ativos" value={activeCount} icon={<UserCheck size={22} />} />
        <StatCard label="Usuarios inativos" value={inactiveCount} icon={<UserMinus size={22} />} />
      </div>

      {tableActionError ? (
        <SurfacePanel className="rounded-[20px] border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-none">
          {tableActionError}
        </SurfacePanel>
      ) : null}

      <SurfacePanel className="overflow-hidden rounded-[26px] border-[#d8e2ec] bg-white shadow-[0_6px_10px_rgba(15,23,42,0.05)]">
        <div className="border-b border-[#e8eef5] px-5 py-4">
          <FilterChips filters={userFilters} activeFilter={activeFilter} onChange={setActiveFilter} variant="ink" />
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-[#e8eef5] text-left">
            <thead>
              <tr className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c7698]">
                <th className="px-8 py-5">Usuario</th>
                <th className="px-8 py-5">E-mail</th>
                <th className="px-8 py-5">Perfil</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Acesso</th>
                <th className="px-8 py-5">Ultimo acesso</th>
                <th className="px-8 py-5 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-10 text-center text-[15px] font-medium text-[#58708e]">
                    Nenhum usuario encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : null}

              <AnimatePresence initial={false}>
                {filteredUsers.map((user) => {
                  const isActionLoading = loadingActionUserId === user.id;
                  return (
                    <motion.tr
                      key={user.id}
                      layout
                      variants={motionVariants.listItem}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={motionTransitions.enter}
                      className="bg-white transition hover:bg-[#f8fbfe]"
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <img src={user.avatar} alt={user.name} className="h-11 w-11 rounded-full object-cover" />
                          <span className="text-[18px] font-medium tracking-[-0.02em] text-[#002a52]">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-[16px] text-[#577190]">{user.email}</td>
                      <td className="px-8 py-4">
                        <PillBadge tone="muted" className="text-[12px] normal-case tracking-[0.02em]">
                          {user.profile}
                        </PillBadge>
                      </td>
                      <td className="px-8 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-medium ${
                            user.status === 'Ativo'
                              ? 'border-[#d9e4ef] bg-white text-[#35506f]'
                              : 'border-rose-200 bg-rose-50 text-rose-500'
                          }`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${user.status === 'Ativo' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-[16px] text-[#577190]">{user.access}</td>
                      <td className="px-8 py-4 text-[16px] text-[#8fa3bb]">{user.lastAccess}</td>
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-end gap-4 text-[#90a3bb]">
                          <ActionButton
                            label="Redefinir acesso"
                            icon={<KeyRound size={17} />}
                            onClick={() => handleToggleAccess(user)}
                            disabled={isActionLoading || user.profile === 'Administrador'}
                          />
                          <ActionButton label="Editar" icon={<Edit2 size={17} />} onClick={() => handleStartEdit(user)} />
                          <ActionButton
                            label="Excluir"
                            icon={<Trash2 size={17} />}
                            onClick={() => handleRequestDeleteUser(user)}
                            disabled={isActionLoading}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 p-5 lg:hidden">
          {filteredUsers.map((user) => (
            <SurfacePanel key={user.id} className="rounded-[22px] border-[#dde6ef] p-4 shadow-none">
              <div className="flex items-start gap-4">
                <img src={user.avatar} alt={user.name} className="h-12 w-12 rounded-full object-cover" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <h3 className="text-[18px] font-medium text-[#002a52]">{user.name}</h3>
                    <p className="text-[15px] text-[#577190]">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PillBadge tone="muted" className="normal-case tracking-[0.02em]">
                      {user.profile}
                    </PillBadge>
                    <PillBadge tone={user.status === 'Ativo' ? 'muted' : 'danger'}>{user.status}</PillBadge>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(user)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[#d7e0ea] bg-white text-sm font-semibold text-[#35506f]"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDeleteUser(user)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-600"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </SurfacePanel>
          ))}
        </div>
      </SurfacePanel>

      <AlertDialog open={Boolean(userPendingDelete)} onOpenChange={(isOpen) => (!isOpen ? closeDeleteModal() : undefined)}>
        <AlertDialogContent className="max-w-[520px] overflow-hidden rounded-[24px] border border-[#d8e2ec] bg-white p-0 shadow-[0_6px_10px_rgba(15,23,42,0.12)]">
          <div className="border-b border-[#e8eef5] p-6">
            <AlertDialogTitle className="text-[24px] font-semibold tracking-[-0.03em] text-[#002a52]">Excluir usuario</AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-[15px] leading-6 text-[#58708e]">
              Tem certeza que deseja remover o usuario <strong className="font-semibold text-[#002a52]">{userPendingDelete?.name}</strong>? Esta acao nao
              pode ser desfeita.
            </AlertDialogDescription>
          </div>

          <div className="flex gap-3 bg-[#f8fbfe] p-6">
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={Boolean(loadingActionUserId)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-[#d7e0ea] bg-white text-sm font-semibold text-[#35506f] transition hover:border-[#bfd3e6] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmDeleteUser()}
              disabled={Boolean(loadingActionUserId)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loadingActionUserId ? 'Excluindo...' : 'Excluir usuario'}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {canUsePortal
        ? createPortal(
            <AnimatePresence>
              {isAddOpen ? (
                <>
                  <motion.button
                    type="button"
                    variants={motionVariants.overlay}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={motionTransitions.quick}
                    onClick={closeDrawer}
                    className="fixed inset-0 z-[70] bg-[#002441]/35 backdrop-blur-sm"
                    aria-label="Fechar formulario"
                  />
                  <motion.aside
                    variants={motionVariants.drawer}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={motionTransitions.modalSpring}
                    className="fixed inset-y-0 right-0 z-[80] w-full max-w-xl border-l border-[#dde6ef] bg-white shadow-[0_6px_10px_rgba(15,23,42,0.18)]"
                  >
                    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
                      <div className="border-b border-[#e8eef5] bg-[#f8fbfe] p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#009fe3]">{isEditMode ? 'Edicao' : 'Cadastro'}</p>
                            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-[#002a52]">
                              {isEditMode ? 'Editar usuario' : 'Adicionar usuario'}
                            </h2>
                            <p className="mt-2 text-[15px] leading-6 text-[#58708e]">
                              {isEditMode ? 'Ajuste os dados e permissoes do usuario selecionado.' : 'Preencha os dados para cadastrar um novo usuario.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={closeDrawer}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e0ea] bg-white text-[#58708e] transition hover:text-[#002a52]"
                            aria-label="Fechar"
                          >
                            x
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 space-y-5 overflow-y-auto p-6">
                        <FormField
                          label="Nome completo *"
                          placeholder="Ex: Joao da Silva"
                          value={formState.fullName}
                          onChange={(value) => handleFieldChange('fullName', value)}
                        />
                        <FormField
                          label="E-mail *"
                          placeholder="usuario@empresa.com.br"
                          value={formState.email}
                          onChange={(value) => handleFieldChange('email', value)}
                        />
                        <FormField
                          label={isEditMode ? 'Nova senha (opcional)' : 'Senha provisoria *'}
                          placeholder={isEditMode ? 'Preencha apenas se quiser alterar' : 'Digite uma senha inicial'}
                          value={formState.password}
                          onChange={(value) => handleFieldChange('password', value)}
                          type="password"
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <SelectField
                            label="Perfil"
                            value={formState.profile}
                            onChange={(value) => handleProfileChange(value as UserFormState['profile'])}
                            options={['Cliente', 'Administrador']}
                          />
                          <SelectField
                            label="Acesso"
                            value={formState.access}
                            onChange={(value) => handleFieldChange('access', value as UserFormState['access'])}
                            options={accessOptions}
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <SelectField
                            label="Status inicial"
                            value={formState.status}
                            onChange={(value) => handleFieldChange('status', value as UserFormState['status'])}
                            options={['Ativo', 'Inativo']}
                          />
                          <FormField
                            label="Unidade"
                            placeholder="Ex: Matriz"
                            value={formState.unit}
                            onChange={(value) => handleFieldChange('unit', value)}
                          />
                        </div>

                        <AnimatePresence initial={false}>
                          {formError ? (
                            <motion.div
                              key="user-form-error"
                              variants={motionVariants.fadeUp}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              transition={motionTransitions.quick}
                              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
                            >
                              {formError}
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>

                      <div className="flex gap-3 border-t border-[#e8eef5] bg-[#f8fbfe] p-6">
                        <button
                          type="button"
                          onClick={closeDrawer}
                          className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-[#d7e0ea] bg-white text-sm font-semibold text-[#35506f] transition hover:border-[#bfd3e6]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-[#159dde] text-sm font-semibold text-white shadow-[0_6px_10px_rgba(21,157,222,0.24)] transition hover:bg-[#0e93d8] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Salvar usuario'}
                        </button>
                      </div>
                    </form>
                  </motion.aside>
                </>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}

function mapUserToForm(user: UserRecord): UserFormState {
  return {
    fullName: user.name,
    email: user.email,
    password: '',
    profile: user.profile,
    access: user.access,
    status: user.status,
    unit: user.unit,
  };
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="transition hover:text-[#0e93d8] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {icon}
    </button>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#002a52]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-[#d7e0ea] bg-[#f8fafc] px-4 text-[15px] text-[#35506f] outline-none transition focus:border-[#009fe3] focus:bg-white focus:ring-4 focus:ring-[#d8eefb]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#002a52]">{label}</label>
      <PlatformSelect
        value={value}
        onValueChange={onChange}
        options={options.map((option) => ({ value: option, label: option }))}
        triggerClassName="h-12 text-[15px]"
      />
    </div>
  );
}
