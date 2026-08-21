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
    obterRegistro: function (raw, chave) { return item(getMaster(raw), chave); },
    disponivel: function (raw, chave) { return registroDisponivel(raw, item(getMaster(raw), chave)); },
    listar: function (raw) { return Object.values(getMaster(raw)); },
  };
})(window);
