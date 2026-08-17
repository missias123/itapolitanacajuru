/**
 * DATASET DE PRODUTOS — Sorveteria Itapolitana Cajuru
 * Este arquivo contém a base local de produtos e preços.
 * Ele é sincronizado automaticamente com /dados/produtos.json via fetch.
 */

window.PRODUTOS_DATA = {};

/**
 * Sincroniza os preços locais com o arquivo JSON na nuvem.
 */
async function carregarPreçosNuvem() {
  try {
    const resp = await fetch('dados/produtos.json');
    if (!resp.ok) return;
    const dados = await resp.json();
    const pData = window.PRODUTOS_DATA;

    if (dados.sorvetes) {
      if (dados.sorvetes.sabores) pData.sorvetes.sabores = dados.sorvetes.sabores;
      if (dados.sorvetes.precos) {
        const p = dados.sorvetes.precos;
        pData.sorvetes.preços = {
          casquinha_copão: p.casquinha_copo  || p.casquinha_copão,
          copão_recheado:  p.copo_recheado   || p.copão_recheado,
          cascão:          p.cascão,
          cestinha:        p.cestinha
        };
      }
    }

    if (dados.picoles) {
      Object.entries(dados.picoles).forEach(([key, p]) => {
        if (pData.picolés[key]) {
          if (p.preco_varejo  !== undefined) pData.picolés[key].preço_varejo  = p.preco_varejo;
          if (p.preco_atacado !== undefined) pData.picolés[key].preço_atacado = p.preco_atacado;
          if (p.estoque       !== undefined) pData.picolés[key].estoque       = p.estoque;
          if (p.sabores)                     pData.picolés[key].sabores       = p.sabores;
        }
      });
    }

    if (dados.caixas_enc) {
      pData.caixas_enc = dados.caixas_enc;
      window._itap_caixas = dados.caixas_enc.map(c => ({
        id: c.id, nome: c.nome, preço: c.preço || c.preco || 100,
        maxSabores: c.maxSabores || 2, estoque: c.estoque || 0,
        esgotado: !!(c.esgotado || c.estoque <= 0)
      }));
    }

    if (dados.tortas_enc) {
      pData.tortas_enc = dados.tortas_enc;
      window._itap_tortas = dados.tortas_enc.map(t => ({
        id: t.id, nome: t.nome, preço: t.preço || t.preco || 100,
        maxSabores: t.maxSabores || 3, estoque: t.estoque || 0,
        esgotado: !!(t.esgotado || t.estoque <= 0)
      }));
    }

    if (dados.acrescimos)       pData.acrescimos       = dados.acrescimos;
    if (dados.milkshake)        pData.milkshake        = dados.milkshake;
    if (dados.tacas)            pData.tacas            = dados.tacas;
    if (dados.açaí || dados.acai) pData.açaí           = dados.açaí || dados.acai;
    if (dados.caixas_viagem)    pData.caixas_viagem    = dados.caixas_viagem;
    if (dados.isopores_viagem)  pData.isopores_viagem  = dados.isopores_viagem;
    if (dados.sobremesas)       pData.sobremesas       = dados.sobremesas;
    
    window.dispatchEvent(new CustomEvent('produtosNuvemCarregados', { detail: pData }));

  } catch (e) {
    console.warn('[Itap] carregarPreçosNuvem falhou:', e.message);
  }
}

// Iniciar carregamento
carregarPreçosNuvem();
