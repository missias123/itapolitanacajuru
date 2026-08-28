/**
 * ITAPOLITANA — adaptador do catálogo mestre.
 * Fonte oficial: dados/produtos.json > cadastro_skus.por_chave.
 * As telas recebem uma visão agrupada em memória; nome, preço, tamanho, SKU
 * e disponibilidade nunca são alterados fora do cadastro mestre.
 */
(function (window) {
  'use strict';

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function keyPart(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' e ')
      .replace(/\bc\s*\/\s*/g, 'com ')
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function editDistance(a, b, limit) {
    var left = String(a || '');
    var right = String(b || '');
    if (left === right) return 0;
    if (limit != null && Math.abs(left.length - right.length) > limit) return limit + 1;
    var previous = Array.from({ length: right.length + 1 }, function (_, i) { return i; });
    for (var i = 1; i <= left.length; i += 1) {
      var current = [i];
      var rowMin = i;
      for (var j = 1; j <= right.length; j += 1) {
        var cost = left[i - 1] === right[j - 1] ? 0 : 1;
        var value = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
        if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
          value = Math.min(value, previous[j - 2] + 1);
        }
        current[j] = value;
        rowMin = Math.min(rowMin, value);
      }
      if (limit != null && rowMin > limit) return limit + 1;
      previous = current;
    }
    return previous[right.length];
  }

  function recordVariants(record) {
    var aliases = Array.isArray(record && record.aliases) ? record.aliases : [];
    return [record && record.nome].concat(aliases).filter(Boolean).map(normalizeSearchText).filter(Boolean);
  }

  function describeMatch(record, variant, score, status) {
    return {
      sku: record.sku,
      nome: record.nome,
      categoria: record.categoria || '',
      preco: record.preco ?? null,
      ativo: record.ativo !== false,
      matchedText: variant,
      score: Number(score.toFixed(4)),
      status: status,
    };
  }

  function resolveName(raw, query) {
    var master = getMaster(raw);
    var text = String(query || '').trim();
    var normalized = normalizeSearchText(text);
    if (!normalized) return { status: 'not_found', query: text, candidates: [], safeToUse: false };
    var all = Object.values(master).filter(function (record) { return record && record.sku; });
    var active = all.filter(function (record) { return record.ativo !== false; });
    var exactSku = all.find(function (record) { return String(record.sku).toLowerCase() === text.toLowerCase(); });
    if (exactSku) {
      if (exactSku.ativo === false) {
        return { status: 'inactive', query: text, candidates: [describeMatch(exactSku, exactSku.sku, 1, 'inactive')], safeToUse: false };
      }
      return { status: 'exact_sku', query: text, sku: exactSku.sku, candidates: [describeMatch(exactSku, exactSku.sku, 1, 'exact_sku')], safeToUse: true };
    }

    var exact = [];
    var exactInactive = [];
    all.forEach(function (record) {
      recordVariants(record).forEach(function (variant) {
        if (variant !== normalized) return;
        var status = variant === normalizeSearchText(record.nome) ? 'exact_name' : 'exact_alias';
        var match = describeMatch(record, variant, 1, record.ativo === false ? 'inactive' : status);
        (record.ativo === false ? exactInactive : exact).push(match);
      });
    });
    var exactSkus = Array.from(new Set(exact.map(function (match) { return match.sku; })));
    if (exactSkus.length === 1) {
      var exactMatch = exact.find(function (match) { return match.sku === exactSkus[0]; });
      return { status: exactMatch.status, query: text, sku: exactMatch.sku, candidates: [exactMatch], safeToUse: true };
    }
    if (exactSkus.length > 1) {
      return { status: 'ambiguous', query: text, candidates: exact.filter(function (match, index, list) { return list.findIndex(function (item) { return item.sku === match.sku; }) === index; }), safeToUse: false };
    }
    var inactiveSkus = Array.from(new Set(exactInactive.map(function (match) { return match.sku; })));
    if (inactiveSkus.length === 1) {
      var inactiveMatch = exactInactive.find(function (match) { return match.sku === inactiveSkus[0]; });
      return { status: 'inactive', query: text, sku: inactiveMatch.sku, candidates: [inactiveMatch], safeToUse: false };
    }
    if (inactiveSkus.length > 1) {
      return { status: 'ambiguous', query: text, candidates: exactInactive.filter(function (match, index, list) { return list.findIndex(function (item) { return item.sku === match.sku; }) === index; }), safeToUse: false };
    }

    if (normalized.length < 3) return { status: 'not_found', query: text, candidates: [], safeToUse: false };
    var scored = [];
    active.forEach(function (record) {
      var best = null;
      recordVariants(record).forEach(function (variant) {
        var distance = editDistance(normalized, variant, Math.max(2, Math.floor(Math.max(normalized.length, variant.length) * 0.25)));
        var score = 1 - (distance / Math.max(normalized.length, variant.length));
        if (variant.includes(normalized) || normalized.includes(variant)) score = Math.max(score, 0.86);
        var candidate = describeMatch(record, variant, score, 'suggestion');
        if (!best || candidate.score > best.score) best = candidate;
      });
      if (best && best.score >= 0.78) scored.push(best);
    });
    scored.sort(function (a, b) { return b.score - a.score || a.sku.localeCompare(b.sku); });
    var unique = scored.filter(function (match, index, list) { return list.findIndex(function (item) { return item.sku === match.sku; }) === index; }).slice(0, 5);
    if (!unique.length) return { status: 'not_found', query: text, candidates: [], safeToUse: false };
    var top = unique[0];
    var second = unique[1];
    var margin = second ? top.score - second.score : 1;
    if (margin >= 0.08 && top.score >= 0.9) {
      return { status: 'suggestion', query: text, candidates: unique, safeToUse: false, requiresConfirmation: true };
    }
    return { status: 'ambiguous', query: text, candidates: unique, safeToUse: false, requiresConfirmation: true };
  }

  function getMaster(raw) {
    return raw && raw.cadastro_skus && raw.cadastro_skus.por_chave ? raw.cadastro_skus.por_chave : {};
  }

  function item(master, key) {
    return master[key] || null;
  }

  function embalagemAtiva(raw, sku) {
    var embalagem = raw && raw.disponibilidade && raw.disponibilidade.embalagens
      ? raw.disponibilidade.embalagens[sku]
      : null;
    return !embalagem || embalagem.ativo !== false;
  }

  function registroDisponivel(raw, registro) {
    if (!registro || registro.ativo === false) return false;
    return (registro.dependencias_embalagem || []).every(function (skuEmbalagem) {
      return embalagemAtiva(raw, skuEmbalagem);
    });
  }

  function apply(raw) {
    var view = clone(raw);
    var master = getMaster(view);
    if (!Object.keys(master).length) return view;

    Object.keys(master).forEach(function (chave) {
      master[chave].disponivel = registroDisponivel(raw, master[chave]);
    });

    // Formatos de massa: cada tamanho é uma variante vendável com SKU próprio.
    var formatos = (view.sorvetes && (view.sorvetes.preços || view.sorvetes.precos)) || {};
    Object.keys(formatos).forEach(function (formato) {
      var tabela = formatos[formato] || {};
      Object.keys(tabela).forEach(function (tamanho) {
        var registro = item(master, 'sorvetes.' + formato + '.' + keyPart(tamanho));
        if (registro && Number.isFinite(Number(registro.preco))) tabela[tamanho] = Number(registro.preco);
      });
    });

    // Açaí: cada receita/tamanho é um SKU fechado e independente.
    var acai = view['açaí'] || view.acai;
    var registroAcaiMassa = item(master, 'massas.MAS-039');
    var acaiMassaEsgotado = Boolean(registroAcaiMassa && registroAcaiMassa.ativo === false);
    if (acai && Array.isArray(acai.categorias)) {
      acai.categorias.forEach(function (categoria) {
        (categoria.produtos || []).forEach(function (produto, index) {
          var registro = item(master, 'acai.' + keyPart(categoria.id) + '.' + (index + 1));
          if (!registro) return;
          produto.nome = registro.nome;
          produto.preco = registro.preco;
          produto.preço = registro.preco;
          produto.esgotado = registro.disponivel === false;
          if (registro.tamanho) categoria.label = registro.tamanho;
        });
      });
      // Cascata: base esgotada → TODOS os produtos de açaí ficam indisponíveis
      if (acai.esgotado_base === true || acaiMassaEsgotado) {
        acai.esgotado_base = true;
        acai.categorias.forEach(function (categoria) {
          (categoria.produtos || []).forEach(function (produto) {
            produto.esgotado = true;
          });
        });
      }
      view['açaí'] = acai;
      view.acai = acai;
    }

    // Milkshakes: cada tamanho é uma variante vendável.
    if (view.milkshake) {
      ['tradicional', 'top'].forEach(function (linha) {
        Object.keys(view.milkshake[linha] || {}).forEach(function (tamanho) {
          var registro = item(master, 'milkshake.' + linha + '.' + keyPart(tamanho));
          if (registro && Number.isFinite(Number(registro.preco))) view.milkshake[linha][tamanho] = Number(registro.preco);
        });
      });
    }

    // Taças, isopores e sobremesas mantêm a ordem visual, mas usam valores do mestre.
    if (view.tacas) {
      ['tradicionais', 'sujas'].forEach(function (linha) {
        Object.keys(view.tacas[linha] || {}).forEach(function (nome, index) {
          var registro = item(master, 'tacas.' + linha + '.' + (index + 1));
          if (registro && Number.isFinite(Number(registro.preco))) view.tacas[linha][nome] = Number(registro.preco);
        });
      });
    }
    Object.keys(view.isopores_viagem || {}).forEach(function (tamanho) {
      var registro = item(master, 'isopores.' + keyPart(tamanho));
      if (registro && Number.isFinite(Number(registro.preco))) view.isopores_viagem[tamanho] = Number(registro.preco);
    });
    view.isopores_disponibilidade = {};
    Object.keys(view.isopores_viagem || {}).forEach(function (tamanho) {
      var registro = item(master, 'isopores.' + keyPart(tamanho));
      view.isopores_disponibilidade[tamanho] = !registro || registro.disponivel !== false;
    });
    Object.keys(view.sobremesas || {}).forEach(function (nome, index) {
      var registro = item(master, 'sobremesas.' + (index + 1));
      if (registro && Number.isFinite(Number(registro.preco))) view.sobremesas[nome] = Number(registro.preco);
    });

    // Produtos de encomenda e extras.
    ['caixas_enc', 'tortas_enc', 'acrescimos'].forEach(function (grupo) {
      (view[grupo] || []).forEach(function (produto) {
        var prefixo = grupo === 'caixas_enc' ? 'caixas.' : grupo === 'tortas_enc' ? 'tortas.' : 'acrescimos.';
        var registro = item(master, prefixo + produto.id);
        if (!registro) return;
        produto.nome = registro.nome;
        produto.preco = registro.preco;
        produto.preço = registro.preco;
        produto.esgotado = registro.disponivel === false;
      });
    });

    // Picolés: grupo e sabores têm SKU próprio; disponibilidade depende só do SKU do produto.
    var picoles = view['picolés'] || view.picoles;
    Object.keys(picoles || {}).forEach(function (tipo) {
      var grupo = picoles[tipo];
      var registroGrupo = item(master, 'picoles.' + tipo);
      if (registroGrupo) {
        grupo.nome = registroGrupo.nome;
        grupo.preço_varejo = Number(registroGrupo.preco_varejo ?? registroGrupo.preco);
        grupo.preço_atacado = Number(registroGrupo.preco_atacado ?? registroGrupo.preco_varejo ?? registroGrupo.preco);
        grupo.esgotado = registroGrupo.disponivel === false;
      }
      (grupo.sabores || []).forEach(function (sabor) {
        var registro = item(master, 'picoles.' + tipo + '.' + sabor.codigo);
        if (!registro) return;
        sabor.nome = registro.nome;
        sabor.esgotado = registro.disponivel === false;
      });
    });
    if (picoles) {
      view['picolés'] = picoles;
      view.picoles = picoles;
    }

    // Sabores de massa: bloqueia apenas o sabor cujo SKU MAS estiver inativo.
    if (Array.isArray(view.sabores_sorvete)) {
      view.sabores_sorvete.forEach(function (sabor) {
        var registro = item(master, 'massas.' + sabor.codigo);
        if (!registro) return;
        sabor.nome = registro.nome;
        sabor.esgotado = registro.disponivel === false;
      });
    }

    view.cadastro_skus = raw.cadastro_skus;
    return view;
  }

  window.ITAP_CATALOGO_MESTRE = {
    aplicar: apply,
    chaveNormalizada: keyPart,
    normalizarBusca: normalizeSearchText,
    distanciaBusca: editDistance,
    resolverNome: resolveName,
    obterRegistro: function (raw, chave) { return item(getMaster(raw), chave); },
    disponivel: function (raw, chave) { return registroDisponivel(raw, item(getMaster(raw), chave)); },
    listar: function (raw) { return Object.values(getMaster(raw)); },
  };
})(window);
