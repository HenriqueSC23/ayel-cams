import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, ShieldAlert, UserCheck, UserX } from 'lucide-react';
import type { CameraRecord, UserRecord } from '../../data/platform';
import { motionTransitions, motionVariants } from '../../lib/motion-presets';
import { getRequestErrorMessage } from '../../services/request-error';
import type { UpdateUserInput } from '../../services/user-service';
import { PillBadge } from '../platform/pill-badge';
import { StatCard } from '../platform/stat-card';
import { SurfacePanel } from '../platform/surface-panel';

interface AdminAccessesProps {
  users: UserRecord[];
  cameras: CameraRecord[];
  onUpdateUser: (userId: string, input: UpdateUserInput) => Promise<void>;
}

const routePolicies = [
  { route: '/', visitor: 'Permitido', cliente: 'Permitido', administrador: 'Permitido' },
  { route: '/login', visitor: 'Permitido', cliente: 'Redireciona', administrador: 'Redireciona' },
  { route: '/area', visitor: 'Negado', cliente: 'Permitido', administrador: 'Permitido' },
  { route: '/admin', visitor: 'Negado', cliente: 'Negado', administrador: 'Permitido' },
  { route: '/perfil', visitor: 'Negado', cliente: 'Permitido', administrador: 'Permitido' },
] as const;

export function AdminAccesses({ users, cameras, onUpdateUser }: AdminAccessesProps) {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const restrictedUsers = users.filter((user) => user.access === 'Area restrita' && user.status === 'Ativo');
  const blockedUsers = users.filter((user) => user.access === 'Sem acesso' || user.status === 'Inativo');
  const adminUsers = users.filter((user) => user.profile === 'Administrador' && user.status === 'Ativo');
  const restrictedCameras = cameras.filter((camera) => camera.access === 'restricted');

  const manageableUsers = useMemo(() => users.filter((user) => user.profile !== 'Administrador'), [users]);

  const handleToggleAccess = async (user: UserRecord) => {
    const shouldEnableAccess = user.access === 'Sem acesso' || user.status === 'Inativo';
    const payload: UpdateUserInput = shouldEnableAccess
      ? { access: 'Area restrita', status: 'Ativo' }
      : { access: 'Sem acesso', status: user.status };

    setErrorMessage('');
    setUpdatingUserId(user.id);

    try {
      await onUpdateUser(user.id, payload);
    } catch (error) {
      setErrorMessage(getRequestErrorMessage(error, 'Nao foi possivel atualizar o acesso do usuario.'));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard label="Administradores ativos" value={adminUsers.length} icon={<ShieldAlert size={22} />} />
        <StatCard label="Usuarios com acesso" value={restrictedUsers.length} icon={<UserCheck size={22} />} />
        <StatCard label="Usuarios bloqueados" value={blockedUsers.length} icon={<UserX size={22} />} />
        <StatCard label="Cameras restritas" value={restrictedCameras.length} icon={<Camera size={22} />} />
      </div>

      {errorMessage ? (
        <SurfacePanel className="rounded-[20px] border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-none">
          {errorMessage}
        </SurfacePanel>
      ) : null}

      <SurfacePanel className="overflow-hidden rounded-[26px] border-[#d8e2ec] bg-white shadow-[0_6px_10px_rgba(15,23,42,0.05)]">
        <div className="border-b border-[#e8eef5] px-6 py-4">
          <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#002a52]">Controle de acesso operacional</h3>
          <p className="mt-1 text-[15px] text-[#58708e]">Ajuste rapido de permissao para usuarios cliente sem abrir o formulario completo.</p>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-[#e8eef5] text-left">
            <thead>
              <tr className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c7698]">
                <th className="px-8 py-5">Usuario</th>
                <th className="px-8 py-5">Perfil</th>
                <th className="px-8 py-5">Acesso atual</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Ultimo acesso</th>
                <th className="px-8 py-5 text-right">Acao rapida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7]">
              <AnimatePresence initial={false}>
                {manageableUsers.map((user) => {
                  const isPending = updatingUserId === user.id;
                  const shouldEnableAccess = user.access === 'Sem acesso' || user.status === 'Inativo';

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
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                          <span className="text-[17px] font-medium text-[#002a52]">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-[15px] text-[#577190]">{user.profile}</td>
                      <td className="px-8 py-4">
                        <PillBadge tone={user.access === 'Sem acesso' ? 'danger' : 'muted'} className="normal-case tracking-[0.02em]">
                          {user.access}
                        </PillBadge>
                      </td>
                      <td className="px-8 py-4">
                        <PillBadge tone={user.status === 'Ativo' ? 'success' : 'danger'} className="normal-case tracking-[0.02em]">
                          {user.status}
                        </PillBadge>
                      </td>
                      <td className="px-8 py-4 text-[15px] text-[#8fa3bb]">{user.lastAccess}</td>
                      <td className="px-8 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleAccess(user)}
                          disabled={isPending}
                          className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-4 text-[14px] font-semibold text-[#35506f] transition hover:border-[#009fe3] hover:text-[#009fe3] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isPending ? 'Aplicando...' : shouldEnableAccess ? 'Liberar acesso' : 'Bloquear acesso'}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <motion.div className="grid gap-3 p-5 lg:hidden" variants={motionVariants.fadeUp} initial="initial" animate="animate">
          {manageableUsers.map((user) => {
            const isPending = updatingUserId === user.id;
            const shouldEnableAccess = user.access === 'Sem acesso' || user.status === 'Inativo';

            return (
              <SurfacePanel key={user.id} className="rounded-[18px] border-[#dde6ef] p-4 shadow-none">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-medium text-[#002a52]">{user.name}</p>
                    <p className="text-[14px] text-[#577190]">{user.email}</p>
                  </div>
                  <PillBadge tone={user.access === 'Sem acesso' ? 'danger' : 'muted'} className="normal-case tracking-[0.02em]">
                    {user.access}
                  </PillBadge>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleAccess(user)}
                  disabled={isPending}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-4 text-[14px] font-semibold text-[#35506f] transition hover:border-[#009fe3] hover:text-[#009fe3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? 'Aplicando...' : shouldEnableAccess ? 'Liberar acesso' : 'Bloquear acesso'}
                </button>
              </SurfacePanel>
            );
          })}
        </motion.div>
      </SurfacePanel>

      <SurfacePanel className="rounded-[26px] border-[#d8e2ec] bg-white p-6 shadow-[0_6px_10px_rgba(15,23,42,0.05)]">
        <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#002a52]">Matriz de rotas e permissoes</h3>
        <p className="mt-1 text-[15px] text-[#58708e]">Referencia rapida da regra de autorizacao aplicada no MVP.</p>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[680px] divide-y divide-[#e8eef5]">
            <thead>
              <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c7698]">
                <th className="py-4 pr-6">Rota</th>
                <th className="py-4 pr-6">Visitante</th>
                <th className="py-4 pr-6">Cliente</th>
                <th className="py-4 pr-6">Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7] text-[15px] text-[#35506f]">
              {routePolicies.map((policy) => (
                <tr key={policy.route}>
                  <td className="py-4 pr-6 font-semibold text-[#002a52]">{policy.route}</td>
                  <td className="py-4 pr-6">{policy.visitor}</td>
                  <td className="py-4 pr-6">{policy.cliente}</td>
                  <td className="py-4 pr-6">{policy.administrador}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfacePanel>
    </div>
  );
}
