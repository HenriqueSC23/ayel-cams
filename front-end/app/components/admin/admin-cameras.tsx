import React, { useEffect, useState } from 'react';
import { Edit2, Lock, SlidersHorizontal, Trash2, Unlock, Video } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { filterCameraRecords, getCameraSummary, type CameraRecord } from '../../data/platform';
import { motionTransitions, motionVariants } from '../../lib/motion-presets';
import { getRequestErrorMessage } from '../../services/request-error';
import type { CreateCameraInput, UpdateCameraInput } from '../../services/camera-service';
import { FilterChips } from '../platform/filter-chips';
import { PillBadge } from '../platform/pill-badge';
import { PlatformSelect } from '../platform/platform-select';
import { StatCard } from '../platform/stat-card';
import { SurfacePanel } from '../platform/surface-panel';
import { ImageWithFallback } from '../figma/image-with-fallback';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '../ui/alert-dialog';

interface AdminCamerasProps {
  cameras: CameraRecord[];
  searchQuery: string;
  isAddOpen: boolean;
  setIsAddOpen: (value: boolean) => void;
  onCreateCamera: (input: CreateCameraInput) => Promise<void>;
  onUpdateCamera: (cameraId: string, input: UpdateCameraInput) => Promise<void>;
  onDeleteCamera: (cameraId: string) => Promise<void>;
}

type CameraAccessLabel = 'Publica' | 'Restrita';
type CameraStatusLabel = 'Ao vivo' | 'Offline';

interface CameraFormState {
  name: string;
  location: string;
  description: string;
  streamUrl: string;
  access: CameraAccessLabel;
  quality: 'HD' | 'FHD' | '4K';
  category: string;
  status: CameraStatusLabel;
}

const initialCameraForm: CameraFormState = {
  name: '',
  location: '',
  description: '',
  streamUrl: '',
  access: 'Publica',
  quality: 'FHD',
  category: 'Portaria',
  status: 'Ao vivo',
};

export function AdminCameras({
  cameras,
  searchQuery,
  isAddOpen,
  setIsAddOpen,
  onCreateCamera,
  onUpdateCamera,
  onDeleteCamera,
}: AdminCamerasProps) {
  const [activeFilter, setActiveFilter] = useState<string>('Todas');
  const [editingCamera, setEditingCamera] = useState<CameraRecord | null>(null);
  const [formState, setFormState] = useState<CameraFormState>(initialCameraForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [tableActionError, setTableActionError] = useState('');
  const [deletingCameraId, setDeletingCameraId] = useState<string | null>(null);
  const [cameraPendingDelete, setCameraPendingDelete] = useState<CameraRecord | null>(null);
  const canUsePortal = typeof window !== 'undefined' && typeof document !== 'undefined';

  const summary = getCameraSummary(cameras);
  const filters = ['Todas', 'Publicas', 'Restritas', 'Ao vivo', 'Offline', 'Portaria', 'Recepcao'] as const;
  const filteredCameras = filterCameraRecords(cameras, searchQuery, activeFilter);
  const isEditMode = editingCamera !== null;

  useEffect(() => {
    if (!isAddOpen) {
      setFormState(initialCameraForm);
      setFormError('');
      setIsSubmitting(false);
      setEditingCamera(null);
      return;
    }

    if (editingCamera) {
      setFormState(mapCameraToForm(editingCamera));
      setFormError('');
      return;
    }

    setFormState(initialCameraForm);
    setFormError('');
  }, [editingCamera, isAddOpen]);

  const handleFormFieldChange = <TKey extends keyof CameraFormState>(field: TKey, value: CameraFormState[TKey]) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const closeDrawer = () => {
    setIsAddOpen(false);
    setEditingCamera(null);
    setFormError('');
  };

  const handleStartEdit = (camera: CameraRecord) => {
    setTableActionError('');
    setEditingCamera(camera);
    setIsAddOpen(true);
  };

  const closeDeleteModal = () => {
    if (deletingCameraId) {
      return;
    }

    setCameraPendingDelete(null);
  };

  const handleRequestDelete = (camera: CameraRecord) => {
    setCameraPendingDelete(camera);
  };

  const handleConfirmDelete = async () => {
    if (!cameraPendingDelete) {
      return;
    }

    setTableActionError('');
    setDeletingCameraId(cameraPendingDelete.id);

    try {
      await onDeleteCamera(cameraPendingDelete.id);
      setCameraPendingDelete(null);
    } catch (error) {
      setTableActionError(getRequestErrorMessage(error, 'Nao foi possivel remover a camera.'));
    } finally {
      setDeletingCameraId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = formState.name.trim();
    const location = formState.location.trim();
    const category = formState.category.trim();
    const description = formState.description.trim();
    const streamUrl = formState.streamUrl.trim();

    if (!name || !location || !category) {
      setFormError('Nome, local e categoria sao obrigatorios.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const payload: UpdateCameraInput = {
        name,
        location,
        category,
        description,
        streamUrl,
        quality: formState.quality,
        access: formState.access === 'Restrita' ? 'restricted' : 'public',
        status: formState.status === 'Offline' ? 'offline' : 'live',
      };

      if (editingCamera) {
        await onUpdateCamera(editingCamera.id, payload);
      } else {
        await onCreateCamera(payload as CreateCameraInput);
      }

      closeDrawer();
    } catch (error) {
      setFormError(getRequestErrorMessage(error, `Nao foi possivel ${editingCamera ? 'atualizar' : 'cadastrar'} a camera.`));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard label="Total de cameras" value={summary.total} icon={<Video size={22} />} />
        <StatCard label="Cameras publicas" value={summary.public} icon={<Unlock size={22} />} />
        <StatCard label="Cameras restritas" value={summary.restricted} icon={<Lock size={22} />} />
        <StatCard label="Cameras offline" value={summary.offline} icon={<SlidersHorizontal size={22} />} />
      </div>

      {tableActionError ? (
        <SurfacePanel className="rounded-[20px] border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 shadow-none">
          {tableActionError}
        </SurfacePanel>
      ) : null}

      <SurfacePanel className="overflow-hidden rounded-[26px] border-[#d8e2ec] bg-white shadow-[0_6px_10px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[#e8eef5] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterChips filters={filters} activeFilter={activeFilter} onChange={setActiveFilter} variant="ink" />

          <span className="pr-3 text-[16px] font-medium text-[#58708e]">Filtros</span>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-[#e8eef5] text-left">
            <thead>
              <tr className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5c7698]">
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
              {filteredCameras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-10 text-center text-[15px] font-medium text-[#58708e]">
                    Nenhuma camera encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : null}

              <AnimatePresence initial={false}>
                {filteredCameras.map((camera) => {
                  const isDeleting = deletingCameraId === camera.id;
                  return (
                    <motion.tr
                      key={camera.id}
                      layout
                      variants={motionVariants.listItem}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={motionTransitions.enter}
                      className="bg-white transition hover:bg-[#f8fbfe]"
                    >
                      <td className="px-8 py-4">
                        <div className="h-[50px] w-[78px] overflow-hidden rounded-[14px] border border-[#dde6ef] bg-slate-100">
                          <ImageWithFallback src={camera.image} alt={camera.name} className="h-full w-full object-cover" />
                        </div>
                      </td>
                      <td className="px-8 py-4 text-[18px] font-medium tracking-[-0.02em] text-[#002a52]">{camera.name}</td>
                      <td className="px-8 py-4 text-[16px] text-[#577190]">{camera.location}</td>
                      <td className="px-8 py-4">
                        <PillBadge tone={camera.access === 'restricted' ? 'warning' : 'success'} className="text-[11px] tracking-[0.08em]">
                          {camera.access === 'restricted' ? 'Restrita' : 'Publica'}
                        </PillBadge>
                      </td>
                      <td className="px-8 py-4">
                        <span
                          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[15px] font-medium ${
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
                        <PillBadge tone="muted" className="text-[12px] tracking-[0.02em] normal-case">
                          {camera.quality}
                        </PillBadge>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center justify-end gap-2 text-[#90a3bb]">
                          <ActionButton label="Editar" icon={<Edit2 size={17} />} onClick={() => handleStartEdit(camera)} />
                          <ActionButton label="Excluir" icon={<Trash2 size={17} />} onClick={() => handleRequestDelete(camera)} disabled={isDeleting} />
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
          {filteredCameras.map((camera) => (
            <SurfacePanel key={camera.id} className="rounded-[22px] border-[#dde6ef] p-4 shadow-none">
              <div className="flex items-start gap-4">
                <div className="h-[56px] w-[86px] overflow-hidden rounded-[14px] border border-[#dde6ef] bg-slate-100">
                  <ImageWithFallback src={camera.image} alt={camera.name} className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <h3 className="text-[18px] font-medium text-[#002a52]">{camera.name}</h3>
                    <p className="text-[15px] text-[#577190]">{camera.location}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <PillBadge tone={camera.access === 'restricted' ? 'warning' : 'success'}>
                      {camera.access === 'restricted' ? 'Restrita' : 'Publica'}
                    </PillBadge>
                    <PillBadge
                      tone={camera.status === 'offline' ? 'muted' : 'live'}
                      className={camera.status === 'offline' ? 'whitespace-nowrap border-slate-300 bg-slate-100 text-slate-600' : 'whitespace-nowrap'}
                    >
                      {camera.status === 'offline' ? 'Offline' : 'Ao vivo'}
                    </PillBadge>
                    <PillBadge tone="muted" className="normal-case tracking-[0.02em]">
                      {camera.quality}
                    </PillBadge>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(camera)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[#d7e0ea] bg-white text-sm font-semibold text-[#35506f]"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(camera)}
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

      <AlertDialog open={Boolean(cameraPendingDelete)} onOpenChange={(isOpen) => (!isOpen ? closeDeleteModal() : undefined)}>
        <AlertDialogContent className="max-w-[520px] overflow-hidden rounded-[24px] border border-[#d8e2ec] bg-white p-0 shadow-[0_6px_10px_rgba(15,23,42,0.12)]">
          <div className="border-b border-[#e8eef5] p-6">
            <AlertDialogTitle className="text-[24px] font-semibold tracking-[-0.03em] text-[#002a52]">Excluir camera</AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-[15px] leading-6 text-[#58708e]">
              Tem certeza que deseja remover a camera <strong className="font-semibold text-[#002a52]">{cameraPendingDelete?.name}</strong>? Esta acao
              nao pode ser desfeita.
            </AlertDialogDescription>
          </div>

          <div className="flex gap-3 bg-[#f8fbfe] p-6">
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={Boolean(deletingCameraId)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-[#d7e0ea] bg-white text-sm font-semibold text-[#35506f] transition hover:border-[#bfd3e6] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmDelete()}
              disabled={Boolean(deletingCameraId)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {deletingCameraId ? 'Excluindo...' : 'Excluir camera'}
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
                              {isEditMode ? 'Editar camera' : 'Adicionar camera'}
                            </h2>
                            <p className="mt-2 text-[15px] leading-6 text-[#58708e]">
                              {isEditMode ? 'Ajuste os dados da camera selecionada.' : 'Preencha os dados para cadastrar uma nova camera.'}
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
                          label="Nome da camera *"
                          placeholder="Ex: Portaria Principal"
                          value={formState.name}
                          onChange={(value) => handleFormFieldChange('name', value)}
                        />
                        <FormField
                          label="Local / setor *"
                          placeholder="Ex: Entrada externa"
                          value={formState.location}
                          onChange={(value) => handleFormFieldChange('location', value)}
                        />
                        <FormField
                          label="Descricao"
                          placeholder="Breve observacao operacional"
                          value={formState.description}
                          onChange={(value) => handleFormFieldChange('description', value)}
                        />
                        <FormField
                          label="URL do stream"
                          placeholder="rtsp://usuario:senha@ip/stream"
                          value={formState.streamUrl}
                          onChange={(value) => handleFormFieldChange('streamUrl', value)}
                          mono
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <SelectField
                            label="Tipo de acesso"
                            value={formState.access}
                            onChange={(value) => handleFormFieldChange('access', value as CameraAccessLabel)}
                            options={['Publica', 'Restrita']}
                          />
                          <SelectField
                            label="Qualidade"
                            value={formState.quality}
                            onChange={(value) => handleFormFieldChange('quality', value as CameraFormState['quality'])}
                            options={['HD', 'FHD', '4K']}
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <SelectField
                            label="Categoria *"
                            value={formState.category}
                            onChange={(value) => handleFormFieldChange('category', value)}
                            options={['Portaria', 'Recepcao', 'Estacionamento', 'Administrativo', 'Galpao']}
                          />
                          <SelectField
                            label="Status inicial"
                            value={formState.status}
                            onChange={(value) => handleFormFieldChange('status', value as CameraStatusLabel)}
                            options={['Ao vivo', 'Offline']}
                          />
                        </div>

                        <AnimatePresence initial={false}>
                          {formError ? (
                            <motion.div
                              key="camera-form-error"
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
                          {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Salvar camera'}
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

function mapCameraToForm(camera: CameraRecord): CameraFormState {
  return {
    name: camera.name,
    location: camera.location,
    description: camera.description,
    streamUrl: camera.streamUrl,
    access: camera.access === 'restricted' ? 'Restrita' : 'Publica',
    quality: camera.quality,
    category: camera.category,
    status: camera.status === 'offline' ? 'Offline' : 'Ao vivo',
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
  mono = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#002a52]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-12 w-full rounded-2xl border border-[#d7e0ea] bg-[#f8fafc] px-4 text-[15px] text-[#35506f] outline-none transition focus:border-[#009fe3] focus:bg-white focus:ring-4 focus:ring-[#d8eefb] ${
          mono ? 'font-mono text-sm' : ''
        }`}
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
