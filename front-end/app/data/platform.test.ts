import { describe, expect, it } from 'vitest';
import { filterCameraRecords, getCameraSummary, matchesCameraFilter, normalizeValue, type CameraRecord } from './platform';

const catalog: CameraRecord[] = [
  {
    id: 'cam-a',
    name: 'Portaria Principal',
    location: 'Entrada externa',
    unit: 'Matriz',
    category: 'Portaria',
    access: 'public',
    status: 'live',
    quality: 'FHD',
    image: 'https://example.com/portaria.jpg',
    hasStream: true,
    description: 'Monitoramento da entrada principal',
    updatedAt: 'Atualizado agora',
  },
  {
    id: 'cam-b',
    name: 'Corredor Interno',
    location: 'Bloco administrativo',
    unit: 'Matriz',
    category: 'Administrativo',
    access: 'restricted',
    status: 'offline',
    quality: 'HD',
    image: 'https://example.com/corredor.jpg',
    hasStream: false,
    description: 'Area de acesso controlado',
    updatedAt: 'Sem sinal',
  },
];

describe('platform data helpers', () => {
  it('normaliza texto com acento para busca', () => {
    expect(normalizeValue('ÁREA EXTERNA')).toBe('area externa');
  });

  it('aplica filtro por status ao vivo', () => {
    expect(matchesCameraFilter(catalog[0], 'Ao vivo')).toBe(true);
    expect(matchesCameraFilter(catalog[1], 'Ao vivo')).toBe(false);
  });

  it('combina busca textual com filtro ativo', () => {
    const result = filterCameraRecords(catalog, 'entrada', 'Portaria');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('cam-a');
  });

  it('gera resumo agregado de cameras', () => {
    expect(getCameraSummary(catalog)).toEqual({
      total: 2,
      live: 1,
      offline: 1,
      public: 1,
      restricted: 1,
    });
  });
});
