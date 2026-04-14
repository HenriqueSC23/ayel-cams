import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Activity, Building2, LockKeyhole, Play, ShieldCheck, Video } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { RestrictedCameraCard } from '../components/area/restricted-camera-card';
import { ImageWithFallback } from '../components/figma/image-with-fallback';
import { FilterChips } from '../components/platform/filter-chips';
import { CameraWatchDialog } from '../components/platform/camera-watch-dialog';
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
  const [watchingCamera, setWatchingCamera] = useState<CameraRecord | null>(null);
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
            viewMode === 'grid' ? (
              <motion.div
                key={`area-grid-${activeFilter}-${statusFilter}-${locationFilter}-${searchQuery}-${filteredCameras.length}`}
                className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                variants={cameraStaggerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {filteredCameras.map((camera) => (
                  <motion.div key={camera.id} variants={motionVariants.listItem} transition={motionTransitions.enter} layout>
                    <RestrictedCameraCard camera={camera} token={token} viewMode="grid" onWatch={setWatchingCamera} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={`area-list-${activeFilter}-${statusFilter}-${locationFilter}-${searchQuery}-${filteredCameras.length}`}
                variants={motionVariants.fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={motionTransitions.enter}
              >
                <SurfacePanel className="overflow-hidden rounded-[26px] border-[#d8e2ec] bg-white p-0 shadow-[0_8px_14px_rgba(15,23,42,0.07)]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] divide-y divide-[#e8eef5] text-left">
                      <thead>
                        <tr className="bg-[#f8fbfe] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c7698]">
                          <th className="px-8 py-5">Preview</th>
                          <th className="px-8 py-5">Nome da camera</th>
                          <th className="px-8 py-5">Local</th>
                          <th className="px-8 py-5">Acesso</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5">Qualidade</th>
                          <th className="px-8 py-5 text-right">Acoes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf2f7]">
                        <AnimatePresence initial={false}>
                          {filteredCameras.map((camera) => (
                            <motion.tr
                              key={camera.id}
                              layout
                              variants={motionVariants.listItem}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              transition={motionTransitions.enter}
                              className="bg-white transition-colors hover:bg-[#f7fbff]"
                            >
                              <td className="px-8 py-4">
                                <div className="h-[62px] w-[98px] overflow-hidden rounded-[14px] border border-[#dde6ef] bg-slate-100">
                                  <ImageWithFallback src={camera.image} alt={camera.name} className="h-full w-full object-cover" />
                                </div>
                              </td>
                              <td className="px-8 py-4 text-[18px] font-medium tracking-[-0.02em] text-[#002a52]">{camera.name}</td>
                              <td className="px-8 py-4 text-[16px] leading-7 text-[#577190]">{camera.location}</td>
                              <td className="px-8 py-4">
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                                  Restrita
                                </span>
                              </td>
                              <td className="px-8 py-4">
                                <span
                                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-5 py-2 text-[15px] font-medium ${
                                    camera.status === 'offline'
                                      ? 'border-slate-300 bg-slate-100 text-slate-600'
                                      : 'border-red-200 bg-red-50 text-red-600'
                                  }`}
                                >
                                  <span className={`h-2.5 w-2.5 rounded-full ${camera.status === 'offline' ? 'bg-slate-500' : 'bg-red-500'}`} />
                                  {camera.status === 'offline' ? 'Offline' : 'Ao vivo'}
                                </span>
                              </td>
                              <td className="px-8 py-4">
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.02em] text-[#5f7289]">
                                  {camera.quality}
                                </span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <motion.button
                                  type="button"
                                  onClick={() => setWatchingCamera(camera)}
                                  disabled={camera.status === 'offline' || !camera.hasStream}
                                  whileTap={{ scale: 0.97 }}
                                  transition={motionTransitions.pressSpring}
                                  className="group/assistir relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-full border border-[#d7e0ea] bg-white px-5 text-sm font-semibold text-[#35506f] transition hover:border-[#159dde] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label={`Visualizar stream da camera ${camera.name}`}
                                >
                                  <span className="absolute inset-0 origin-left scale-x-0 bg-[#159dde] transition-transform duration-300 ease-out group-hover/assistir:scale-x-100" />
                                  <Play size={15} className="relative z-10" />
                                  <span className="relative z-10">Assistir</span>
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </SurfacePanel>
              </motion.div>
            )
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

      <CameraWatchDialog camera={watchingCamera} token={token} onClose={() => setWatchingCamera(null)} />
    </div>
  );
}
