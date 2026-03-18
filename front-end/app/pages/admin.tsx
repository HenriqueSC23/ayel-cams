import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { AdminCameras } from '../components/admin/admin-cameras';
import { AdminUsers } from '../components/admin/admin-users';
import { AdminAccesses } from '../components/admin/admin-accesses';
import { AdminSettings } from '../components/admin/admin-settings';
import { PageHeader } from '../components/platform/page-header';
import { RequestStatePanel } from '../components/platform/request-state-panel';
import type { CameraRecord, UserRecord } from '../data/platform';
import { motionTransitions } from '../lib/motion-presets';
import {
  createCameraRequest,
  deleteCameraRequest,
  getCamerasRequest,
  updateCameraRequest,
  type CreateCameraInput,
  type UpdateCameraInput,
} from '../services/camera-service';
import { getRequestErrorMessage } from '../services/request-error';
import {
  createUserRequest,
  deleteUserRequest,
  getUsersRequest,
  updateUserRequest,
  type CreateUserInput,
  type UpdateUserInput,
} from '../services/user-service';

const tabs = ['Cameras', 'Usuarios', 'Acessos', 'Configuracoes'] as const;
type AdminTab = (typeof tabs)[number];
const MIN_REFRESH_FEEDBACK_MS = 900;

export function Admin() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('Cameras');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [cameras, setCameras] = useState<CameraRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const refreshStartedAtRef = useRef<number | null>(null);
  const shouldShowLoadingPanel = isLoading && cameras.length === 0 && users.length === 0;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (!isAddOpen) {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [isAddOpen]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!token) {
        setCameras([]);
        setUsers([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const [loadedCameras, loadedUsers] = await Promise.all([getCamerasRequest({}, token), getUsersRequest(token)]);
        if (isMounted) {
          setCameras(loadedCameras);
          setUsers(loadedUsers);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getRequestErrorMessage(error, 'Nao foi possivel carregar os dados administrativos.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          if (refreshStartedAtRef.current) {
            const elapsedMs = Date.now() - refreshStartedAtRef.current;
            const remainingMs = Math.max(0, MIN_REFRESH_FEEDBACK_MS - elapsedMs);
            if (remainingMs > 0) {
              await new Promise((resolve) => setTimeout(resolve, remainingMs));
            }
          }
          setIsRefreshing(false);
          refreshStartedAtRef.current = null;
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [token, reloadKey]);

  const handleReload = () => {
    if (isRefreshing) {
      return;
    }

    refreshStartedAtRef.current = Date.now();
    setIsRefreshing(true);
    setReloadKey((value) => value + 1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleCreateCamera = async (input: CreateCameraInput) => {
    if (!token) {
      throw new Error('Sessao invalida. Faca login novamente.');
    }

    const createdCamera = await createCameraRequest(input, token);
    setCameras((current) => [createdCamera, ...current]);
  };

  const handleCreateUser = async (input: CreateUserInput) => {
    if (!token) {
      throw new Error('Sessao invalida. Faca login novamente.');
    }

    const createdUser = await createUserRequest(input, token);
    setUsers((current) => [createdUser, ...current]);
  };

  const handleUpdateCamera = async (cameraId: string, input: UpdateCameraInput) => {
    if (!token) {
      throw new Error('Sessao invalida. Faca login novamente.');
    }

    const updatedCamera = await updateCameraRequest(cameraId, input, token);
    setCameras((current) => current.map((camera) => (camera.id === cameraId ? updatedCamera : camera)));
  };

  const handleDeleteCamera = async (cameraId: string) => {
    if (!token) {
      throw new Error('Sessao invalida. Faca login novamente.');
    }

    await deleteCameraRequest(cameraId, token);
    setCameras((current) => current.filter((camera) => camera.id !== cameraId));
  };

  const handleUpdateUser = async (userId: string, input: UpdateUserInput) => {
    if (!token) {
      throw new Error('Sessao invalida. Faca login novamente.');
    }

    const updatedUser = await updateUserRequest(userId, input, token);
    setUsers((current) => current.map((user) => (user.id === userId ? updatedUser : user)));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) {
      throw new Error('Sessao invalida. Faca login novamente.');
    }

    await deleteUserRequest(userId, token);
    setUsers((current) => current.filter((user) => user.id !== userId));
  };

  const canCreateEntity = activeTab === 'Cameras' || activeTab === 'Usuarios';

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <PageHeader
        title="Administracao"
        subtitle="Gerencie cameras, usuarios e permissoes da plataforma."
        searchPlaceholder="Buscar camera, usuario ou local"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          canCreateEntity
            ? [
                {
                  label: `Adicionar ${activeTab === 'Usuarios' ? 'usuario' : 'camera'}`,
                  onClick: () => setIsAddOpen(true),
                  icon: <Plus size={20} />,
                },
              ]
            : []
        }
        searchWidthClass="max-w-[500px]"
        onRefresh={handleReload}
        isRefreshing={isRefreshing}
        onLogout={handleLogout}
      />

      {errorMessage || shouldShowLoadingPanel ? (
        <div className="space-y-5 px-10 pt-6">
          {errorMessage ? (
            <RequestStatePanel
              title="Falha ao carregar painel administrativo"
              description={errorMessage}
              onRetry={handleReload}
              className="rounded-[24px] border-[#d8e2ec] p-5"
            />
          ) : null}

          {shouldShowLoadingPanel ? (
            <RequestStatePanel
              title="Carregando dados administrativos"
              description="Aguarde enquanto sincronizamos cameras e usuarios."
              isLoading
              className="rounded-[24px] border-[#d8e2ec] p-5"
            />
          ) : null}
        </div>
      ) : null}

      <div className="sticky top-[94px] z-20 border-b border-[#dbe4ee] bg-white px-10">
        <div className="flex items-center gap-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setIsAddOpen(false);
                }}
                className={`relative py-7 text-[15px] font-medium transition-colors ${
                  isActive ? 'text-[#009fe3]' : 'text-[#58708e] hover:text-[#002a52]'
                }`}
              >
                {tab}
                {isActive ? (
                  <motion.span
                    layoutId="admin-tab-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-[#009fe3]"
                    transition={motionTransitions.gentleSpring}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionTransitions.enter}
          >
            {activeTab === 'Cameras' ? (
              <AdminCameras
                cameras={cameras}
                searchQuery={searchQuery}
                isAddOpen={isAddOpen}
                setIsAddOpen={setIsAddOpen}
                onCreateCamera={handleCreateCamera}
                onUpdateCamera={handleUpdateCamera}
                onDeleteCamera={handleDeleteCamera}
              />
            ) : null}

            {activeTab === 'Usuarios' ? (
              <AdminUsers
                users={users}
                searchQuery={searchQuery}
                isAddOpen={isAddOpen}
                setIsAddOpen={setIsAddOpen}
                onCreateUser={handleCreateUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            ) : null}

            {activeTab === 'Acessos' ? (
              <AdminAccesses users={users} cameras={cameras} onUpdateUser={handleUpdateUser} />
            ) : null}

            {activeTab === 'Configuracoes' ? <AdminSettings /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
