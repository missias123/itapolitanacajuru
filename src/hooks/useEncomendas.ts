import { useCallback, useMemo, useState } from 'react';
import { getCache, saveWithAutoInvalidation, setCache } from '../lib/cache';
import type { Encomenda, StatusEncomenda } from '../types/admin';

const CACHE_KEY = 'encomendas:list';

const seedEncomendas: Encomenda[] = [
  {
    id: 'ENC-001',
    clienteNome: 'Cliente Exemplo',
    clienteTelefone: '(41) 99999-0000',
    status: 'novo',
    itens: ['Pizza Calabresa'],
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    timeline: [
      {
        id: 'TL-001',
        status: 'novo',
        descricao: 'Pedido criado.',
        criadoEm: new Date().toISOString(),
      },
    ],
  },
];

export function useEncomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>(() => {
    return getCache<Encomenda[]>(CACHE_KEY) ?? seedEncomendas;
  });

  const atualizarStatus = useCallback(async (id: string, status: StatusEncomenda, descricao?: string) => {
    const updated = encomendas.map((item) => {
      if (item.id !== id) return item;

      const evento = {
        id: `TL-${Date.now()}`,
        status,
        descricao: descricao ?? `Status alterado para ${status}.`,
        criadoEm: new Date().toISOString(),
      };

      return {
        ...item,
        status,
        atualizadoEm: new Date().toISOString(),
        timeline: [...item.timeline, evento],
      };
    });

    await saveWithAutoInvalidation('encomendas:', async () => updated);
    setCache(CACHE_KEY, updated);
    setEncomendas(updated);
  }, [encomendas]);

  const porId = useMemo(() => {
    return new Map(encomendas.map((item) => [item.id, item]));
  }, [encomendas]);

  return { encomendas, atualizarStatus, porId };
}
