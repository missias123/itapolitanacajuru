(function() {
  'use strict';

  var FORM_IDS = [
    'promo-nome',
    'promo-descricao',
    'promo-data-inicio',
    'promo-data-fim',
    'promo-produtos-afetados',
    'promo-regras',
    'promo-status'
  ];
  var eventsBound = false;

  function normalizePromoDate(value) {
    var raw = String(value || '').trim();
    var m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    var ano = parseInt(m[1], 10);
    var mes = parseInt(m[2], 10);
    var dia = parseInt(m[3], 10);
    var d = new Date(ano, mes - 1, dia);
    if (d.getFullYear() !== ano || d.getMonth() !== (mes - 1) || d.getDate() !== dia) return null;
    return raw;
  }

  function getPromoPeriodo(dataInicio, dataFim) {
    return (dataInicio || '-') + ' até ' + (dataFim || '-');
  }

  function setPromoFeedback(msg, tipo) {
    var el = document.getElementById('promo-feedback-message');
    if (!el) return;
    el.style.display = msg ? 'block' : 'none';
    el.textContent = msg || '';
    var cls = 'hint';
    if (tipo === 'erro') cls += ' hint-erro';
    if (tipo === 'ok') cls += ' hint-ok';
    if (tipo === 'aviso') cls += ' hint-aviso';
    el.className = cls;
  }

  function fieldValue(id) {
    var el = document.getElementById(id);
    return (el && el.value ? el.value : '').trim();
  }

  function promoNomeValido() {
    return fieldValue('promo-nome').length >= 3;
  }
  function promoDescricaoValida() {
    return fieldValue('promo-descricao').length >= 10;
  }
  function promoDataInicioValida() {
    return !!normalizePromoDate(fieldValue('promo-data-inicio'));
  }
  function promoDataFimValida() {
    var ini = normalizePromoDate(fieldValue('promo-data-inicio'));
    var fim = normalizePromoDate(fieldValue('promo-data-fim'));
    return !!(ini && fim && fim >= ini);
  }
  function promoProdutosValidos() {
    return fieldValue('promo-produtos-afetados').length >= 1;
  }
  function promoRegrasValidas() {
    return fieldValue('promo-regras').length >= 5;
  }
  function promoStatusValido() {
    return !!fieldValue('promo-status');
  }

  function setPromoFieldState(el, enabled, valid) {
    if (!el) return;
    el.disabled = !enabled;
    el.classList.toggle('form-control-disabled', !enabled);
    if (!enabled) {
      el.classList.remove('is-valid', 'is-invalid');
      return;
    }
    if (valid === true) {
      el.classList.add('is-valid');
      el.classList.remove('is-invalid');
    } else if (valid === false) {
      el.classList.add('is-invalid');
      el.classList.remove('is-valid');
    } else {
      el.classList.remove('is-valid', 'is-invalid');
    }
  }

  function validatePromocaoForm() {
    var elNome = document.getElementById('promo-nome');
    var elDesc = document.getElementById('promo-descricao');
    var elInicio = document.getElementById('promo-data-inicio');
    var elFim = document.getElementById('promo-data-fim');
    var elProdutos = document.getElementById('promo-produtos-afetados');
    var elRegras = document.getElementById('promo-regras');
    var elStatus = document.getElementById('promo-status');
    var elSalvar = document.getElementById('promo-salvar');
    if (!elNome || !elDesc || !elInicio || !elFim || !elProdutos || !elRegras || !elStatus || !elSalvar) return false;

    var nomeOk = promoNomeValido();
    var descOk = promoDescricaoValida();
    var inicioOk = promoDataInicioValida();
    var fimOk = promoDataFimValida();
    var produtosOk = promoProdutosValidos();
    var regrasOk = promoRegrasValidas();
    var statusOk = promoStatusValido();

    var descEnabled = nomeOk;
    var inicioEnabled = nomeOk && descOk;
    var fimEnabled = inicioEnabled && inicioOk;
    var produtosEnabled = fimEnabled && fimOk;
    var regrasEnabled = produtosEnabled && produtosOk;
    var statusEnabled = regrasEnabled && regrasOk;

    setPromoFieldState(elNome, true, fieldValue('promo-nome') ? nomeOk : null);
    setPromoFieldState(elDesc, descEnabled, descEnabled ? (fieldValue('promo-descricao') ? descOk : null) : null);
    setPromoFieldState(elInicio, inicioEnabled, inicioEnabled ? (fieldValue('promo-data-inicio') ? inicioOk : null) : null);
    setPromoFieldState(elFim, fimEnabled, fimEnabled ? (fieldValue('promo-data-fim') ? fimOk : null) : null);
    setPromoFieldState(elProdutos, produtosEnabled, produtosEnabled ? (fieldValue('promo-produtos-afetados') ? produtosOk : null) : null);
    setPromoFieldState(elRegras, regrasEnabled, regrasEnabled ? (fieldValue('promo-regras') ? regrasOk : null) : null);
    setPromoFieldState(elStatus, statusEnabled, statusEnabled ? (fieldValue('promo-status') ? statusOk : null) : null);

    var allOk = nomeOk && descOk && inicioOk && fimOk && produtosOk && regrasOk && statusOk;
    elSalvar.disabled = !allOk;
    return allOk;
  }

  function bindPromocaoFormEvents() {
    if (eventsBound) return;
    FORM_IDS.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function() {
        validatePromocaoForm();
        setPromoFeedback('', '');
      });
      el.addEventListener('change', function() {
        validatePromocaoForm();
        setPromoFeedback('', '');
      });
    });
    eventsBound = true;
  }

  window.renderPromocoesTable = function renderPromocoesTable() {
    var lista = (window.STATE && window.STATE.promocoes && window.STATE.promocoes.promocoes) || [];
    var tbody = document.getElementById('tabela-promocoes');
    if (!tbody) return;
    if (!lista.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px">Nenhuma promoção cadastrada. Clique em "Adicionar promoção" para começar.</td></tr>';
      return;
    }
    tbody.innerHTML = lista.map(function(p, i) {
      var statusHtml = p.status === 'ativa'
        ? '<span style="color:#2e7d32;font-weight:700">✅ Ativa</span>'
        : '<span style="color:#999;font-weight:700">❌ Inativa</span>';
      var periodoExib = p.periodo || ((p.dataInicio || p.dataFim) ? getPromoPeriodo(p.dataInicio, p.dataFim) : '-');
      return '<tr style="' + (p.status === 'ativa' ? '' : 'opacity:.6') + '">' +
        '<td style="font-weight:600">' + p.nome + '</td>' +
        '<td style="font-size:.82rem;color:#666">' + periodoExib + '</td>' +
        '<td>' + statusHtml + '</td>' +
        '<td style="display:flex;gap:5px;flex-wrap:wrap">' +
          '<button class="btn btn-amarelo" style="padding:4px 9px;font-size:.76rem" onclick="abrirFormPromocao(' + i + ')">✏️ Editar</button>' +
          '<button class="btn btn-vermelho" style="padding:4px 9px;font-size:.76rem" onclick="excluirPromocaoItem(' + i + ')">🗑️ Excluir</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  };

  window.abrirFormPromocao = function abrirFormPromocao(idx) {
    var panel = document.getElementById('promos-form-panel');
    var tit = document.getElementById('promos-form-titulo');
    if (!panel || !tit) return;
    bindPromocaoFormEvents();
    setPromoFeedback('', '');

    if (idx !== undefined) {
      var p = window.STATE && window.STATE.promocoes && window.STATE.promocoes.promocoes && window.STATE.promocoes.promocoes[idx];
      if (!p) return;
      tit.textContent = '✏️ Editar Promoção';
      document.getElementById('promo-nome').value = p.nome || '';
      document.getElementById('promo-descricao').value = p.descricao || '';
      document.getElementById('promo-data-inicio').value = p.dataInicio || '';
      document.getElementById('promo-data-fim').value = p.dataFim || '';
      document.getElementById('promo-produtos-afetados').value = p.produtosAfetados || '';
      document.getElementById('promo-regras').value = p.regras || '';
      document.getElementById('promo-status').value = p.status || '';
      document.getElementById('promo-idx').value = String(idx);
    } else {
      tit.textContent = '➕ Nova Promoção';
      document.getElementById('promo-nome').value = '';
      document.getElementById('promo-descricao').value = '';
      document.getElementById('promo-data-inicio').value = '';
      document.getElementById('promo-data-fim').value = '';
      document.getElementById('promo-produtos-afetados').value = '';
      document.getElementById('promo-regras').value = '';
      document.getElementById('promo-status').value = '';
      document.getElementById('promo-idx').value = '';
    }

    validatePromocaoForm();
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.fecharFormPromocao = function fecharFormPromocao() {
    var panel = document.getElementById('promos-form-panel');
    if (panel) panel.style.display = 'none';
    setPromoFeedback('', '');
  };

  window.salvarPromocaoItem = async function salvarPromocaoItem() {
    if (!validatePromocaoForm()) {
      setPromoFeedback('⚠️ Revise os campos destacados para liberar o salvamento.', 'erro');
      return;
    }

    var nome = fieldValue('promo-nome');
    var descricao = fieldValue('promo-descricao');
    var dataInicio = fieldValue('promo-data-inicio');
    var dataFim = fieldValue('promo-data-fim');
    var produtosAfetados = fieldValue('promo-produtos-afetados');
    var regras = fieldValue('promo-regras');
    var status = fieldValue('promo-status');
    var idxRaw = fieldValue('promo-idx');
    var periodo = getPromoPeriodo(dataInicio, dataFim);

    if (!window.STATE.promocoes) window.STATE.promocoes = { promocoes: [] };
    if (!Array.isArray(window.STATE.promocoes.promocoes)) window.STATE.promocoes.promocoes = [];

    if (idxRaw !== '') {
      var idx = parseInt(idxRaw, 10);
      window.STATE.promocoes.promocoes[idx] = { nome: nome, periodo: periodo, descricao: descricao, dataInicio: dataInicio, dataFim: dataFim, produtosAfetados: produtosAfetados, regras: regras, status: status };
    } else {
      window.STATE.promocoes.promocoes.push({ nome: nome, periodo: periodo, descricao: descricao, dataInicio: dataInicio, dataFim: dataFim, produtosAfetados: produtosAfetados, regras: regras, status: status });
    }

    setPromoFeedback('Salvando promoção...', 'aviso');
    var ok = await window.salvarArquivo(window.PATHS.promocoes, window.STATE.promocoes, 'promocoesSha', 'Admin: ' + (idxRaw !== '' ? 'editar' : 'adicionar') + ' promoção ' + nome);
    if (ok) {
      setPromoFeedback('✅ Promoção salva com sucesso.', 'ok');
      window.renderPromocoesTable();
      window.fecharFormPromocao();
      if (typeof window.toast === 'function') window.toast('✅ Promoção salva com sucesso.','sucesso');
      return;
    }
    setPromoFeedback('⚠️ Não foi possível salvar a promoção agora. Tente novamente.', 'erro');
  };

  window.excluirPromocaoItem = function excluirPromocaoItem(idx) {
    var p = window.STATE && window.STATE.promocoes && window.STATE.promocoes.promocoes && window.STATE.promocoes.promocoes[idx];
    if (!p) return;
    window.confirmarAcao(
      'Excluir Promoção',
      'Tem certeza que deseja excluir a promoção <strong>' + p.nome + '</strong>?<br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita.</span>',
      'Sim, excluir promoção',
      async function() {
        window.STATE.promocoes.promocoes.splice(idx, 1);
        var ok = await window.salvarArquivo(window.PATHS.promocoes, window.STATE.promocoes, 'promocoesSha', 'Admin: excluir promoção ' + p.nome);
        if (ok) {
          setPromoFeedback('✅ Promoção excluída com sucesso.', 'ok');
          if (typeof window.toast === 'function') window.toast('🗑️ Promoção excluída.','ok');
          window.renderPromocoesTable();
        } else {
          setPromoFeedback('⚠️ Falha ao excluir promoção. Tente novamente.', 'erro');
        }
      }
    );
  };

  window.copiarListaPromocoes = function copiarListaPromocoes() {
    var lista = (window.STATE && window.STATE.promocoes && window.STATE.promocoes.promocoes) || [];
    if (!lista.length) {
      if (typeof window.toast === 'function') window.toast('Nenhuma promoção para copiar.','aviso');
      return;
    }
    var header = 'Nome;Período;Status';
    var rows = lista.map(function(p) { return p.nome + ';' + (p.periodo || '-') + ';' + p.status; });
    navigator.clipboard.writeText([header].concat(rows).join('\n')).then(function() {
      if (typeof window.toast === 'function') window.toast(lista.length + ' promoções copiadas!','sucesso');
    });
  };

  window.exportarPromocoesCSV = function exportarPromocoesCSV() {
    var lista = (window.STATE && window.STATE.promocoes && window.STATE.promocoes.promocoes) || [];
    if (!lista.length) {
      if (typeof window.toast === 'function') window.toast('Nenhuma promoção para exportar.','aviso');
      return;
    }
    var BOM = '\uFEFF';
    var header = 'Nome,Período,Descrição,Status';
    var rows = lista.map(function(p) {
      return '"' + (p.nome || '').replace(/"/g, '""') + '","' + (p.periodo || '').replace(/"/g, '""') + '","' + (p.descricao || '').replace(/"/g, '""') + '",' + p.status;
    });
    var csv = BOM + [header].concat(rows).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'promocoes_itapolitana_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    if (typeof window.toast === 'function') window.toast('CSV com ' + lista.length + ' promoções exportado!','sucesso');
  };
})();
