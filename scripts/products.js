/**
 * ITAPOLITANA CAJURU — carregador único de produtos.
 * Fonte ativa: /dados/produtos.json
 * Não manter listas de sabores neste arquivo.
 */
(function (window, document) {
  'use strict';
  window.PRODUTOS_DATA = window.PRODUTOS_DATA || {};
  window.ITAP_PRODUTOS_PROMISE = fetch('dados/produtos.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (resp) {
      if (!resp.ok) throw new Error('produtos.json indisponível');
      return resp.json();
    })
    .then(function (dados) {
      const catalogo = window.ITAP_CATALOGO_MESTRE && typeof window.ITAP_CATALOGO_MESTRE.aplicar === 'function'
        ? window.ITAP_CATALOGO_MESTRE.aplicar(dados)
        : dados;
      window.PRODUTOS_DATA_RAW = dados;
      window.PRODUTOS_DATA = catalogo;
      window.dispatchEvent(new CustomEvent('produtosNuvemCarregados', { detail: catalogo }));
      return catalogo;
    })
    .catch(function (erro) {
      console.warn('[Itap] produtos.json não carregado:', erro.message);
      return window.PRODUTOS_DATA || {};
    });
})(window, document);
