import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Activity, Building2, LockKeyhole, ShieldCheck, Video } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { RestrictedCameraCard } from '../components/area/restricted-camera-card';
import { FilterChips } from '../components/platform/filter-chips';
import { PageHeader } from '../components/platform/page-header';
import { PillBadge } from '../components/platform/pill-badge';
import { PlatformSelect } from '../components/platform/platform-select';
import { RequestStatePanel } from '../components/platform/request-state-panel';
import { SurfacePanel } from '../components/platform/surface-panel';
import { filterCameraRecords, getCameraSummary, restrictedAreaFilters, type CameraRecord, type ViewMode } from '../data/platform';
import { createStaggerContainer, motionTransitions, motionVariants } from '../lib/motion-presets';
import { getCamerasRequest } from '../services/camera-service';
import { getRequestErrorMessage } from '../services/request-error';

const statusOptions = ['Todos status', 'Ao vivo', 'Offline'] as const;
const MIN_REFRESH_FEEDBACK_MS = 900;
const cameraStaggerVariants = createStaggerContainer({ staggerChildren: 0.05 });

function matchesStatus(camera: CameraRecord, status: (typeof statusOptions)[number]) {
  if (status === 'Todos status') {
    return true;
  }

  if (status === 'Ao vivo') {
    return camera.status === 'live';
  }

  return camera.status === 'offline';
}

export function Area() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [catalog, setCatalog] = useState<CameraRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('Restritas');
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('Todos status');
  const [locationFilter, setLocationFilter] = useState('Todos locais');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const refreshStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCameras() {
      if (!token) {
        setCatalog([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const cameras = await getCamerasRequest({ access: 'restricted' }, token);
        if (isMounted) {
          setCatalog(cameras);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getRequestErrorMessage(error, 'Nao foi possivel carregar as cameras restritas.'));
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

    loadCameras();

    return () => {
      isMounted = false;
    };
  }, [token, reloadKey]);

  const locationOptions = useMemo(
    () => ['Todos locais', ...Array.from(new Set(catalog.map((camera) => camera.location))).sort((left, right) => left.localeCompare(right))],
    [catalog],
  );

  const summary = useMemo(() => getCameraSummary(catalog), [catalog]);
  const unitCount = useMemo(() => new Set(catalog.map((camera) => camera.unit)).size, [catalog]);
  const sectorCount = useMemo(() => new Set(catalog.map((camera) => camera.category)).size, [catalog]);

  const filteredCameras = useMemo(() => {
    return filterCameraRecords(catalog, searchQuery, activeFilter).filter((camera) => {
      const passesStatus = matchesStatus(camera, statusFilter);
      const passesLocation = locationFilter === 'Todos locais' || camera.location === locationFilter;
      return passesStatus && passesLocation;
    });
  }, [catalog, searchQuery, activeFilter, statusFilter, locationFilter]);
  const contentState = errorMessage ? 'error' : isLoading && catalog.length === 0 ? 'loading' : filteredCameras.length === 0 ? 'empty' : 'data';

  const handleRefresh = () => {
    if (isRefreshing) {
      return;
    }

    refreshStartedAtRef.current = Date.now();
    setIsRefreshing(true);
    setSearchQuery('');
    setActiveFilter('Restritas');
    setStatusFilter('Todos status');
    setLocationFilter('Todos locais');
    setReloadKey((value) => value + 1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <PageHeader
        title="Area restrita"
        subtitle="Visualize as cameras com acesso controlado da plataforma."
        searchPlaceholder="Buscar camera, local ou setor"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onLogout={handleLogout}
      />

      <div className="space-y-6 px-10 py-8">
        <SurfacePanel className="relative overflow-hidden border-[#d8e2ec] bg-[radial-gradient(circle_at_top_right,rgba(0,159,227,0.16),transparent_48%),linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] p-6 md:p-7">
          <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-[#d8eefb] blur-2xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <PillBadge tone="warning" icon={<LockKeyhole size={11} />}>
                Acesso autorizado
              </PillBadge>
              <div>
                <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#002a52]">Bem-vindo a area restrita</h2>
                <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#58708e]">
                  Acesse com seguranca as cameras autorizadas para seu perfil e mantenha o acompanhamento continuo dos setores estrategicos.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PillBadge tone="ink" icon={<ShieldCheck size={11} />}>
                Area protegida
              </PillBadge>
              <PillBadge tone="brand">Perfil autenticado</PillBadge>
            </div>
          </div>
        </SurfacePanel>

        <AnimatePresence mode="wait" initial={false}>
          {contentState === 'error' ? (
            <motion.div key="area-error" variants={motionVariants.fadeUp} initial="initial" animate="animate" exit="exit" transition={motionTransitions.enter}>
              <RequestStatePanel
                title="Falha ao carregar monitoramento restrito"
                description={errorMessage}
                state="error"
                onRetry={() => setReloadKey((value) => value + 1)}
                className="rounded-[24px] border-[#d8e2ec] p-5"
              />
            </motion.div>
          ) : null}

          {contentState === 'loading' ? (
            <motion.div key="area-loading" variants={motionVariants.fadeUp} initial="initial" animate="animate" exit="exit" transition={motionTransitions.enter}>
              <RequestStatePanel
                title="Carregando cameras restritas"
                description="Aguarde enquanto sincronizamos os pontos protegidos."
                state="loading"
                isLoading
                className="rounded-[24px] border-[#d8e2ec] p-5"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.div className="grid gap-4 xl:grid-cols-3" variants={cameraStaggerVariants} initial="initial" animate="animate">
          <motion.div variants={motionVariants.listItem} transition={motionTransitions.enter}>
            <SurfacePanel className="rounded-[24px] border-[#d8e2ec] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#58708e]">Cameras disponiveis</p>
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#002a52]">{summary.total}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6fc] text-[#009fe3]">
                  <Video size={22} />
                </div>
              </div>
            </SurfacePanel>
          </motion.div>

          <motion.div variants={motionVariants.listItem} transition={motionTransitions.enter}>
            <SurfacePanel className="rounded-[24px] border-[#d8e2ec] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#58708e]">Ao vivo agora</p>
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#002a52]">{summary.live}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6fc] text-[#009fe3]">
                  <Activity size={22} />
                </div>
              </div>
            </SurfacePanel>
          </motion.div>

          <motion.div variants={motionVariants.listItem} transition={motionTransitions.enter}>
            <SurfacePanel className="rounded-[24px] border-[#d8e2ec] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#58708e]">Setores monitorados</p>
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#002a52]">{sectorCount}</p>
                  <p className="mt-1 text-xs font-medium text-[#7f95ac]">{unitCount} unidade(s) protegida(s)</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6fc] text-[#009fe3]">
                  <Building2 size={22} />
                </div>
              </div>
            </SurfacePanel>
          </motion.div>
        </motion.div>

        <SurfacePanel className="rounded-[26px] border-[#d8e2ec] p-5 md:p-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[#002a52]">Filtros da area protegida</h2>
                <p className="text-sm text-[#607996]">{filteredCameras.length} camera(s) para a visualizacao atual.</p>
              </div>
              <PillBadge tone="brand">Acesso controlado</PillBadge>
            </div>

            <div className="flex flex-col gap-4">
              <FilterChips filters={restrictedAreaFilters} activeFilter={activeFilter} onChange={setActiveFilter} variant="ink" className="gap-3" />

              <div className="flex flex-wrap gap-3">
                <div className="w-fit space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f86a2]">Status</span>
                  <PlatformSelect
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as (typeof statusOptions)[number])}
                    options={statusOptions.map((statusOption) => ({ value: statusOption, label: statusOption }))}
                    ariaLabel="Selecionar status"
                    triggerClassName="h-11 w-fit rounded-full bg-white text-sm"
                    contentClassName="w-fit min-w-0"
                  />
                </div>

                <div className="w-fit space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f86a2]">Local</span>
                  <PlatformSelect
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                    options={locationOptions.map((locationOption) => ({ value: locationOption, label: locationOption }))}
                    ariaLabel="Selecionar local"
                    triggerClassName="h-11 w-fit rounded-full bg-white text-sm"
                    contentClassName="w-fit min-w-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </SurfacePanel>

        <AnimatePresence mode="wait" initial={false}>
          {contentState === 'data' ? (
            <motion.div
              key={`area-catalog-${viewMode}-${activeFilter}-${statusFilter}-${locationFilter}-${searchQuery}-${filteredCameras.length}`}
              className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'space-y-4'}
              variants={cameraStaggerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {filteredCameras.map((camera) => (
                <motion.div key={camera.id} variants={motionVariants.listItem} transition={motionTransitions.enter} layout>
                  <RestrictedCameraCard camera={camera} viewMode={viewMode} />
                </motion.div>
              ))}
            </motion.div>
          ) : null}

          {contentState === 'empty' ? (
            <motion.div key="area-empty" variants={motionVariants.fadeUp} initial="initial" animate="animate" exit="exit" transition={motionTransitions.enter}>
              <SurfacePanel className="rounded-[26px] border-[#d8e2ec] p-10 text-center">
                <h3 className="text-xl font-semibold text-[#002a52]">Nenhuma camera encontrada</h3>
                <p className="mt-2 text-sm text-[#607996]">Ajuste filtros, status ou local para encontrar outro ponto monitorado.</p>
              </SurfacePanel>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
