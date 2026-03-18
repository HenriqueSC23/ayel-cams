import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { motionTransitions, motionVariants } from '../../lib/motion-presets';
import { PlatformSelect } from '../platform/platform-select';
import { SurfacePanel } from '../platform/surface-panel';

interface PlatformSettingsState {
  autoRefreshSeconds: string;
  sessionTimeoutMinutes: string;
  defaultQuality: 'HD' | 'FHD' | '4K';
  keepAuditLogsDays: string;
  offlineAlertsEnabled: boolean;
  strictPasswordPolicy: boolean;
  maintenanceMode: boolean;
}

const settingsStorageKey = 'ayel-admin-settings-v1';

const defaultSettings: PlatformSettingsState = {
  autoRefreshSeconds: '30',
  sessionTimeoutMinutes: '30',
  defaultQuality: 'FHD',
  keepAuditLogsDays: '30',
  offlineAlertsEnabled: true,
  strictPasswordPolicy: false,
  maintenanceMode: false,
};

export function AdminSettings() {
  const [formState, setFormState] = useState<PlatformSettingsState>(defaultSettings);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawValue = window.localStorage.getItem(settingsStorageKey);
      if (!rawValue) {
        return;
      }

      const parsed = JSON.parse(rawValue) as Partial<PlatformSettingsState>;
      setFormState({
        autoRefreshSeconds: parsed.autoRefreshSeconds ?? defaultSettings.autoRefreshSeconds,
        sessionTimeoutMinutes: parsed.sessionTimeoutMinutes ?? defaultSettings.sessionTimeoutMinutes,
        defaultQuality: parsed.defaultQuality ?? defaultSettings.defaultQuality,
        keepAuditLogsDays: parsed.keepAuditLogsDays ?? defaultSettings.keepAuditLogsDays,
        offlineAlertsEnabled: parsed.offlineAlertsEnabled ?? defaultSettings.offlineAlertsEnabled,
        strictPasswordPolicy: parsed.strictPasswordPolicy ?? defaultSettings.strictPasswordPolicy,
        maintenanceMode: parsed.maintenanceMode ?? defaultSettings.maintenanceMode,
      });
    } catch {
      setFormState(defaultSettings);
    }
  }, []);

  const summaryText = useMemo(() => {
    return `Atualizacao automatica a cada ${formState.autoRefreshSeconds}s, sessao de ${formState.sessionTimeoutMinutes}min, qualidade padrao ${formState.defaultQuality}.`;
  }, [formState.autoRefreshSeconds, formState.defaultQuality, formState.sessionTimeoutMinutes]);

  const handleChange = <TKey extends keyof PlatformSettingsState>(field: TKey, value: PlatformSettingsState[TKey]) => {
    setSaveMessage('');
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(settingsStorageKey, JSON.stringify(formState));
    }

    const timestamp = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
    setSaveMessage(`Configuracoes salvas as ${timestamp}.`);
  };

  return (
    <div className="space-y-6">
      <SurfacePanel className="rounded-[26px] border-[#d8e2ec] bg-white p-6 shadow-[0_6px_10px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#002a52]">Configuracoes da plataforma</h3>
            <p className="mt-1 text-[15px] text-[#58708e]">Defina parametros base para operacao administrativa no ambiente atual.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e0ea] bg-[#f8fafc] px-4 py-2 text-[14px] font-semibold text-[#35506f]">
            <SlidersHorizontal size={15} />
            <span>Escopo MVP</span>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <InputField
            label="Atualizacao automatica (segundos)"
            value={formState.autoRefreshSeconds}
            onChange={(value) => handleChange('autoRefreshSeconds', value)}
            placeholder="30"
          />
          <InputField
            label="Timeout de sessao (minutos)"
            value={formState.sessionTimeoutMinutes}
            onChange={(value) => handleChange('sessionTimeoutMinutes', value)}
            placeholder="30"
          />
          <SelectField
            label="Qualidade padrao de monitoramento"
            value={formState.defaultQuality}
            onChange={(value) => handleChange('defaultQuality', value as PlatformSettingsState['defaultQuality'])}
            options={['HD', 'FHD', '4K']}
          />
          <InputField
            label="Retencao de logs de auditoria (dias)"
            value={formState.keepAuditLogsDays}
            onChange={(value) => handleChange('keepAuditLogsDays', value)}
            placeholder="30"
          />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <ToggleCard
            label="Alertas de camera offline"
            checked={formState.offlineAlertsEnabled}
            onChange={(value) => handleChange('offlineAlertsEnabled', value)}
          />
          <ToggleCard
            label="Politica de senha forte"
            checked={formState.strictPasswordPolicy}
            onChange={(value) => handleChange('strictPasswordPolicy', value)}
          />
          <ToggleCard
            label="Modo de manutencao"
            checked={formState.maintenanceMode}
            onChange={(value) => handleChange('maintenanceMode', value)}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-[#d7e0ea] bg-[#f8fafc] px-4 py-3 text-[14px] font-medium text-[#58708e]">{summaryText}</div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <motion.button
            type="button"
            onClick={handleSave}
            whileTap={{ scale: 0.98 }}
            transition={motionTransitions.pressSpring}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#159dde] px-6 text-sm font-semibold text-white shadow-[0_6px_10px_rgba(21,157,222,0.24)] transition hover:bg-[#0e93d8]"
          >
            Salvar configuracoes
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setFormState(defaultSettings)}
            whileTap={{ scale: 0.98 }}
            transition={motionTransitions.pressSpring}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d7e0ea] bg-white px-6 text-sm font-semibold text-[#35506f] transition hover:border-[#bfd3e6]"
          >
            Restaurar padrao
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {saveMessage ? (
            <motion.div
              key="settings-save-message"
              variants={motionVariants.fadeUp}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={motionTransitions.quick}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[14px] font-semibold text-emerald-700"
            >
              <CheckCircle2 size={16} />
              <span>{saveMessage}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </SurfacePanel>

      <SurfacePanel className="rounded-[26px] border-[#d8e2ec] bg-white p-6 shadow-[0_6px_10px_rgba(15,23,42,0.05)]">
        <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[#002a52]">Diretrizes de seguranca aplicada</h3>
        <p className="mt-1 text-[15px] text-[#58708e]">Lembrete rapido de controles essenciais enquanto o backend avancado nao entra em producao.</p>

        <div className="mt-5 grid gap-3">
          {[
            'Nao expor URLs sensiveis de stream no front-end.',
            'Validar autorizacao em todas as rotas administrativas do backend.',
            'Manter ao menos um administrador ativo no sistema.',
            'Registrar acao de criacao, edicao e exclusao para auditoria futura.',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#e2eaf3] bg-[#f8fafc] px-4 py-3">
              <ShieldCheck size={18} className="mt-0.5 text-[#0e93d8]" />
              <p className="text-[14px] leading-6 text-[#35506f]">{item}</p>
            </div>
          ))}
        </div>
      </SurfacePanel>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#002a52]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-[#d7e0ea] bg-[#f8fafc] px-4 text-[15px] text-[#35506f] outline-none transition focus:border-[#009fe3] focus:bg-white focus:ring-4 focus:ring-[#d8eefb]"
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
        triggerClassName="h-11 text-[15px]"
      />
    </div>
  );
}

function ToggleCard({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#d7e0ea] bg-[#f8fafc] px-4 py-3">
      <span className="text-[14px] font-medium text-[#35506f]">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#159dde]" />
    </label>
  );
}
