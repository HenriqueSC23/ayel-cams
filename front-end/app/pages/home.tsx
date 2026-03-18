import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { HomeCameraCard } from '../components/home/home-camera-card';
import { ImageWithFallback } from '../components/figma/image-with-fallback';
import { CameraWatchDialog } from '../components/platform/camera-watch-dialog';
import { FilterChips } from '../components/platform/filter-chips';
import { PageHeader } from '../components/platform/page-header';
import { RequestStatePanel } from '../components/platform/request-state-panel';
import { SurfacePanel } from '../components/platform/surface-panel';
import { fallbackPublicCameras } from '../data/fallback-cameras';
import { filterCameraRecords, publicCameraFilters, type CameraRecord, type ViewMode } from '../data/platform';
import { createStaggerContainer, motionTransitions, motionVariants } from '../lib/motion-presets';
import { getCamerasRequest } from '../services/camera-service';
import { getRequestErrorMessage, isNetworkRequestError } from '../services/request-error';

const homeCameraOrder = ['cam-001', 'cam-002', 'cam-003', 'cam-004', 'cam-005'] as const;
const MIN_REFRESH_FEEDBACK_MS = 900;
const gridStaggerVariants = createStaggerContainer({ staggerChildren: 0.05 });

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, token, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>(publicCameraFilters[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [catalog, setCatalog] = useState<CameraRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fallbackNotice, setFallbackNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [watchingCamera, setWatchingCamera] = useState<CameraRecord | null>(null);
  const refreshStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCameras() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const cameras = await getCamerasRequest({ access: 'public' }, token);
        if (isMounted) {
          setCatalog(cameras);
          setFallbackNotice('');
        }
      } catch (error) {
        if (isMounted) {
          if (isNetworkRequestError(error)) {
            setCatalog(fallbackPublicCameras);
            setFallbackNotice('A API esta temporariamente indisponivel. Exibindo dados locais para nao interromper o monitoramento.');
            setErrorMessage('');
            return;
          }
          setFallbackNotice('');
          setErrorMessage(getRequestErrorMessage(error, 'Nao foi possivel carregar as cameras publicas.'));
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

  const orderedCameras = useMemo(() => {
    const orderMap = new Map(homeCameraOrder.map((id, index) => [id, index]));
    return [...catalog].sort((left, right) => {
      const leftOrder = orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.name.localeCompare(right.name);
    });
  }, [catalog]);

  const filteredCameras = filterCameraRecords(orderedCameras, searchQuery, activeFilter);
  const hasSearchOrFilter = searchQuery.trim().length > 0 || activeFilter !== publicCameraFilters[0];
  const contentState = errorMessage ? 'error' : isLoading && catalog.length === 0 ? 'loading' : filteredCameras.length === 0 ? 'empty' : 'data';

  const handleReload = () => {
    if (isRefreshing) {
      return;
    }

    setFallbackNotice('');
    refreshStartedAtRef.current = Date.now();
    setIsRefreshing(true);
    setReloadKey((value) => value + 1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(14,147,216,0.09),transparent_36%),linear-gradient(180deg,#f6fafe_0%,#eff4f9_100%)]">
      <PageHeader
        title="Cameras"
        searchPlaceholder="Buscar camera, local ou setor"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          isAuthenticated
            ? []
            : [
                { label: 'Entrar', href: '/login' },
                { label: 'Cadastrar', href: '/login?mode=signup', variant: 'secondary' },
              ]
        }
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle
        onRefresh={isAuthenticated ? handleReload : undefined}
        isRefreshing={isRefreshing}
        onLogout={isAuthenticated ? handleLogout : undefined}
        showSystemActions={isAuthenticated}
      />

      <div className="sticky top-[94px] z-30 border-b border-[#dbe4ee] bg-white/92 px-10 py-5 shadow-[0_6px_10px_rgba(15,23,42,0.04)] backdrop-blur-md">
        <FilterChips filters={publicCameraFilters} activeFilter={activeFilter} onChange={setActiveFilter} variant="ink" className="gap-3" />
      </div>

      <div className="space-y-6 px-10 pb-12 pt-8">
        <AnimatePresence mode="wait" initial={false}>
          {contentState === 'error' ? (
            <motion.div key="home-error" variants={motionVariants.fadeUp} initial="initial" animate="animate" exit="exit" transition={motionTransitions.enter}>
              <RequestStatePanel
                title="Falha ao carregar catalogo"
                description={errorMessage}
                state="error"
                onRetry={() => setReloadKey((value) => value + 1)}
                className="rounded-[24px] border-[#d8e2ec] bg-white p-5 shadow-[0_6px_10px_rgba(15,23,42,0.05)]"
              />
            </motion.div>
          ) : null}

          {contentState === 'loading' ? (
            <motion.div key="home-loading" variants={motionVariants.fadeUp} initial="initial" animate="animate" exit="exit" transition={motionTransitions.enter}>
              <RequestStatePanel
                title="Carregando cameras publicas"
                description="Aguarde enquanto buscamos os pontos de monitoramento."
                state="loading"
                isLoading
                className="rounded-[24px] border-[#d8e2ec] bg-white p-5 shadow-[0_6px_10px_rgba(15,23,42,0.05)]"
              />
            </motion.div>
          ) : null}

          {contentState === 'empty' ? (
            <motion.div key="home-empty" variants={motionVariants.fadeUp} initial="initial" animate="animate" exit="exit" transition={motionTransitions.enter}>
              <SurfacePanel className="rounded-[24px] border-[#d8e2ec] bg-white p-8 text-center shadow-[0_6px_10px_rgba(15,23,42,0.05)]">
                <h3 className="text-xl font-semibold text-[#002a52]">Nenhuma camera encontrada</h3>
                <p className="mt-2 text-sm text-[#607996]">
                  {hasSearchOrFilter
                    ? 'Ajuste busca ou filtros para localizar outros pontos publicos.'
                    : 'Nenhuma camera publica esta disponivel no momento.'}
                </p>
              </SurfacePanel>
            </motion.div>
          ) : null}

          {contentState === 'data' ? (
            <motion.div key={`home-data-${activeFilter}-${searchQuery}-${filteredCameras.length}`} variants={motionVariants.fadeUp} initial="initial" animate="animate" exit="exit" transition={motionTransitions.enter}>
              <div className="space-y-4">
                {fallbackNotice ? (
                  <RequestStatePanel
                    title="API de cameras indisponivel"
                    description={fallbackNotice}
                    state="warning"
                    onRetry={handleReload}
                    className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5 shadow-[0_6px_10px_rgba(120,53,15,0.06)]"
                  />
                ) : null}

                {viewMode === 'grid' ? (
                  <motion.div
                    key={`home-grid-${activeFilter}-${searchQuery}-${filteredCameras.length}`}
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    variants={gridStaggerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {filteredCameras.map((camera) => (
                      <motion.div key={camera.id} variants={motionVariants.listItem} transition={motionTransitions.enter} layout>
                        <HomeCameraCard camera={camera} onWatch={setWatchingCamera} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`home-list-${activeFilter}-${searchQuery}-${filteredCameras.length}`}
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
                                    <span
                                      className={`inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                                        camera.access === 'restricted'
                                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                      }`}
                                    >
                                      {camera.access === 'restricted' ? 'Restrita' : 'Publica'}
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
                                      disabled={camera.status === 'offline' || !camera.streamUrl}
                                      whileTap={{ scale: 0.97 }}
                                      transition={motionTransitions.pressSpring}
                                      className="group/assistir relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-full border border-[#d7e0ea] bg-white px-5 text-sm font-semibold text-[#35506f] transition hover:border-[#159dde] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <CameraWatchDialog camera={watchingCamera} onClose={() => setWatchingCamera(null)} />
    </div>
  );
}
