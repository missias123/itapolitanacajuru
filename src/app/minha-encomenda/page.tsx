'use client';

import { useState } from 'react';
import { useEncomendas } from '../../hooks/useEncomendas';

export default function MinhaEncomendaPage() {
  const { encomendas } = useEncomendas();
  const [codigo, setCodigo] = useState('');

  const pedido = encomendas.find((item) => item.id.toLowerCase() === codigo.trim().toLowerCase());

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h1>Minha Encomenda</h1>
      <p>Consulte o status e a timeline do seu pedido.</p>

      <label htmlFor="pedido">Código do pedido</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input id="pedido" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: ENC-001" />
      </div>

      {pedido ? (
        <section>
          <h2>Status: {pedido.status}</h2>
          <ol>
            {pedido.timeline.map((evento) => (
              <li key={evento.id}>
                <strong>{evento.status}</strong> - {evento.descricao}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        codigo && <p>Nenhum pedido encontrado para este código.</p>
      )}
    </main>
  );
}
