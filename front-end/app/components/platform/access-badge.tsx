import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { PillBadge } from './pill-badge';
import type { CameraAccess } from '../../data/platform';

interface AccessBadgeProps {
  access: CameraAccess;
}

export function AccessBadge({ access }: AccessBadgeProps) {
  const isRestricted = access === 'restricted';

  return (
    <PillBadge tone={isRestricted ? 'warning' : 'brand'} icon={isRestricted ? <Lock size={11} /> : <Unlock size={11} />}>
      {isRestricted ? 'Restrita' : 'Pública'}
    </PillBadge>
  );
}
