import React, { useState } from 'react';
import { Activity, Building2, ShieldCheck, Video } from 'lucide-react';
import { Link } from 'react-router';
import {
  filterCameraRecords,
  getCameraSummary,
  type CameraRecord,
  type ViewMode,
} from '../../data/platform';
import { CameraCard } from '../camera-card';
import { FilterChips } from './filter-chips';
import { PageHeader } from './page-header';
import { PillBadge } from './pill-badge';
import { StatCard } from './stat-card';
import { SurfacePanel } from './surface-panel';

interface CameraGalleryProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  catalog: CameraRecord[];
  filters: readonly string[];
  accentTitle: string;
  accentDescription: string;
  accentLinkLabel: string;
  accentLinkTo: string;
}

export function CameraGallery({
  title,
  subtitle,
  searchPlaceholder,
  catalog,
  filters,
  accentTitle,
  accentDescription,
  accentLinkLabel,
  accentLinkTo,
}: CameraGalleryProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filteredCameras = filterCameraRecords(catalog, query, activeFilter);
  const summary = getCameraSummary(catalog);
  const unitCount = new Set(catalog.map((camera) => camera.unit)).size;

  const handleRefresh = () => {
    setQuery('');
    setActiveFilter(filters[0]);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <PageHeader
        title={title}
        subtitle={subtitle}
        searchPlaceholder={searchPlaceholder}
        searchValue={query}
        onSearchChange={setQuery}
        actions={[{ label: accentLinkLabel, href: accentLinkTo, variant: 'secondary' }]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle
        onRefresh={handleRefresh}
      />

      <div className="space-y-6 px-10 py-8">
        <div className="grid gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_1.15fr]">
          <StatCard
            label="Câmeras em operação"
            value={summary.total}
            note="Lista pronta para futura integração com stream real."
            icon={<Video size={22} />}
          />
          <StatCard
            label="Sinais ao vivo"
            value={summary.live}
            note="Entradas com transmissão instantânea neste momento."
            icon={<Activity size={22} />}
          />
          <StatCard
            label="Unidades monitoradas"
            value={unitCount}
            note="Cobertura distribuída entre matriz e filiais."
            icon={<Building2 size={22} />}
            accent="ink"
          />

          <SurfacePanel className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(0,159,227,0.22),transparent_48%),linear-gradient(180deg,#ffffff_0%,#f4f8fb_100%)] p-5">
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[color:var(--ayel-cyan-soft)] blur-3xl" />
            <div className="relative space-y-4">
              <PillBadge tone="brand" icon={<ShieldCheck size={11} />}>
                Continuidade visual
              </PillBadge>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--ayel-ink)]">{accentTitle}</h2>
                <p className="text-[15px] leading-6 text-slate-500">{accentDescription}</p>
              </div>
              <Link
                to={accentLinkTo}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--ayel-cyan)] px-5 text-sm font-semibold text-white shadow-[0_6px_10px_rgba(0,159,227,0.22)] transition hover:bg-[color:var(--ayel-cyan-deep)]"
              >
                {accentLinkLabel}
              </Link>
            </div>
          </SurfacePanel>
        </div>

        <SurfacePanel className="p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[color:var(--ayel-ink)]">Filtros e navegação</h2>
              <p className="text-sm text-slate-500">
                {filteredCameras.length} resultado(s) encontrados para a visualização atual.
              </p>
            </div>
            <FilterChips filters={filters} activeFilter={activeFilter} onChange={setActiveFilter} />
          </div>
        </SurfacePanel>

        {filteredCameras.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid gap-5 md:grid-cols-2 2xl:grid-cols-3' : 'space-y-4'}>
            {filteredCameras.map((camera) => (
              <CameraCard key={camera.id} camera={camera} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <SurfacePanel className="p-10 text-center">
            <p className="text-lg font-semibold text-[color:var(--ayel-ink)]">Nenhuma câmera encontrada</p>
            <p className="mt-2 text-sm text-slate-500">
              Ajuste os filtros ou refine a busca para localizar outro ponto de monitoramento.
            </p>
          </SurfacePanel>
        )}
      </div>
    </div>
  );
}
