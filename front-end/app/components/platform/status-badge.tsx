import React from 'react';
import { Radio, WifiOff } from 'lucide-react';
import { PillBadge } from './pill-badge';
import type { CameraStatus } from '../../data/platform';

interface StatusBadgeProps {
  status: CameraStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'live') {
    return (
      <PillBadge tone="live" icon={<Radio size={11} />}>
        Ao vivo
      </PillBadge>
    );
  }

  return (
    <PillBadge tone="danger" icon={<WifiOff size={11} />}>
      Offline
    </PillBadge>
  );
}
