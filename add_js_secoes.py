with open('admin-painel.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Inserir novas funcoes JS apos ocultarLoading
old_js = "function ocultarLoading(){document.getElementById('loading-overlay').style.display='none';}\n// =====================================================================\n// SABORES"

new_js = """function ocultarLoading(){document.getElementById('loading-overlay').style.display='none';}

// =====================================================================
// CARDAPIO -- salvar/carregar dados do cardapio no config.json
// =====================================================================
function preencherCardapio() {
  const cfg = STATE.config || {};
  const c = cfg.cardapio || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  set('card-sorvetes-sabores', (c.sorvetesSabores || []).join('\\n'));
  set('card-sorvetes-btn', c.sorbetesBtn || '');
  set('card-sorvetes-desc', c.sorbetesDesc || '');
  set('card-picoles-fruta', (c.picoleFruta || []).join('\\n'));
  set('card-picoles-leite', (c.picoleLeite || []).join('\\n'));
  set('card-picoles-recheado', (c.picoleRecheado || []).join('\\n'));
  set('card-picoles-ninho', (c.picoleNinho || []).join('\\n'));
  set('card-picoles-esquimo', (c.picoleEsquimo || []).join('\\n'));
  set('card-picoles-btn', c.picolesBtn || '');
  set('card-acai-promo-combos', (c.acaiPromoCombos || []).join('\\n'));
  set('card-acai-promo-btn', c.acaiPromoBtn || '');
  set('card-acai-tamanhos', (c.acaiTamanhos || []).join('\\n'));
  set('card-acai-complementos', (c.acaiComplementos || []).join('\\n'));
  set('card-acai-btn', c.acaiBtn || '');
  set('card-milk-sabores', (c.milkSabores || []).join('\\n'));
  set('card-milk-tamanhos', (c.milkTamanhos || []).join('\\n'));
  set('card-milk-btn', c.milkBtn || '');
  set('card-tacas-lista', (c.tacasLista || []).join('\\n'));
  set('card-tacas-btn', c.tacasBtn || '');
  set('card-tacas-p-lista', (c.tacasPLista || []).join('\\n'));
  set('card-tacas-p-btn', c.tacasPBtn || '');
  set('card-iso-lista', (c.isoLista || []).join('\\n'));
  set('card-iso-btn', c.isoBtn || '');
  set('card-sobremesas-lista', (c.sobremesasLista || []).join('\\n'));
  set('card-sobremesas-btn', c.sobremesasBtn || '');
}
async function salvarCardapio() {
  const cfg = STATE.config || {};
  const lines = id => (document.getElementById(id)?.value || '').split('\\n').map(s=>s.trim()).filter(Boolean);
  const val = id => document.getElementById(id)?.value.trim() || '';
  cfg.cardapio = {
    sorvetesSabores: lines('card-sorvetes-sabores'),
    sorbetesBtn: val('card-sorvetes-btn'),
    sorbetesDesc: val('card-sorvetes-desc'),
    picoleFruta: lines('card-picoles-fruta'),
    picoleLeite: lines('card-picoles-leite'),
    picoleRecheado: lines('card-picoles-recheado'),
    picoleNinho: lines('card-picoles-ninho'),
    picoleEsquimo: lines('card-picoles-esquimo'),
    picolesBtn: val('card-picoles-btn'),
    acaiPromoCombos: lines('card-acai-promo-combos'),
    acaiPromoBtn: val('card-acai-promo-btn'),
    acaiTamanhos: lines('card-acai-tamanhos'),
    acaiComplementos: lines('card-acai-complementos'),
    acaiBtn: val('card-acai-btn'),
    milkSabores: lines('card-milk-sabores'),
    milkTamanhos: lines('card-milk-tamanhos'),
    milkBtn: val('card-milk-btn'),
    tacasLista: lines('card-tacas-lista'),
    tacasBtn: val('card-tacas-btn'),
    tacasPLista: lines('card-tacas-p-lista'),
    tacasPBtn: val('card-tacas-p-btn'),
    isoLista: lines('card-iso-lista'),
    isoBtn: val('card-iso-btn'),
    sobremesasLista: lines('card-sobremesas-lista'),
    sobremesasBtn: val('card-sobremesas-btn'),
  };
  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar cardapio completo');
}

// =====================================================================
// DEPOIMENTOS -- salvar/carregar depoimentos no config.json
// =====================================================================
let _depoimentos = [];
function preencherDepoimentos() {
  const cfg = STATE.config || {};
  const d = cfg.depoimentos || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  set('dep-titulo', d.titulo || '');
  set('dep-subtitulo', d.subtitulo || '');
  set('dep-dicas', (d.dicas || []).join('\\n'));
  _depoimentos = d.lista || [];
  renderDepoimentos();
}
function renderDepoimentos() {
  const lista = document.getElementById('dep-lista');
  if (!lista) return;
  lista.innerHTML = _depoimentos.map((dep, i) => `
    <div class="campo-edit" style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Depoimento ${i+1}</strong>
        <button class="btn" style="background:#ef4444;color:#fff;padding:4px 10px;font-size:12px" onclick="removerDepoimento(${i})">Remover</button>
      </div>
      <label>Nome da pessoa</label>
      <input type="text" value="${dep.nome||''}" oninput="_depoimentos[${i}].nome=this.value" maxlength="60" placeholder="Maria Silva" style="margin-bottom:8px"/>
      <label>Depoimento</label>
      <textarea rows="3" oninput="_depoimentos[${i}].texto=this.value" maxlength="300" placeholder="Melhor sorvete de Cajuru!">${dep.texto||''}</textarea>
      <label>Data (opcional)</label>
      <input type="text" value="${dep.data||''}" oninput="_depoimentos[${i}].data=this.value" maxlength="20" placeholder="Janeiro 2025"/>
    </div>`).join('');
}
function adicionarDepoimento() {
  _depoimentos.push({nome:'', texto:'', data:''});
  renderDepoimentos();
}
function removerDepoimento(i) {
  if (!confirm('Remover este depoimento?')) return;
  _depoimentos.splice(i, 1);
  renderDepoimentos();
}
async function salvarDepoimentos() {
  const cfg = STATE.config || {};
  cfg.depoimentos = {
    titulo: document.getElementById('dep-titulo')?.value.trim() || '',
    subtitulo: document.getElementById('dep-subtitulo')?.value.trim() || '',
    dicas: (document.getElementById('dep-dicas')?.value || '').split('\\n').map(s=>s.trim()).filter(Boolean),
    lista: _depoimentos,
  };
  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar depoimentos e dicas');
}

// =====================================================================
// FALE CONOSCO -- salvar/carregar configuracoes de contato no config.json
// =====================================================================
function preencherFaleConosco() {
  const cfg = STATE.config || {};
  const fc = cfg.faleConosco || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  set('fc-titulo', fc.titulo || '');
  set('fc-subtitulo', fc.subtitulo || '');
  set('fc-msg-sucesso', fc.msgSucesso || '');
  set('fc-whatsapp', fc.whatsapp || '');
  set('fc-email', fc.email || '');
  set('fc-endereco', fc.endereco || '');
  set('fc-horario', fc.horario || '');
  set('fc-chat-inicio', fc.chatInicio || '');
  set('fc-chat-opcoes', (fc.chatOpcoes || []).join('\\n'));
  set('fc-chat-fora', fc.chatFora || '');
}
async function salvarFaleConosco() {
  const cfg = STATE.config || {};
  cfg.faleConosco = {
    titulo: document.getElementById('fc-titulo')?.value.trim() || '',
    subtitulo: document.getElementById('fc-subtitulo')?.value.trim() || '',
    msgSucesso: document.getElementById('fc-msg-sucesso')?.value.trim() || '',
    whatsapp: document.getElementById('fc-whatsapp')?.value.trim() || '',
    email: document.getElementById('fc-email')?.value.trim() || '',
    endereco: document.getElementById('fc-endereco')?.value.trim() || '',
    horario: document.getElementById('fc-horario')?.value.trim() || '',
    chatInicio: document.getElementById('fc-chat-inicio')?.value.trim() || '',
    chatOpcoes: (document.getElementById('fc-chat-opcoes')?.value || '').split('\\n').map(s=>s.trim()).filter(Boolean),
    chatFora: document.getElementById('fc-chat-fora')?.value.trim() || '',
  };
  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar Fale Conosco');
}

// =====================================================================
// SABORES"""

if old_js in content:
    content = content.replace(old_js, new_js, 1)
    print('OK funcoes JS das novas secoes adicionadas')
else:
    print('ERRO padrao JS nao encontrado')

# Atualizar carregarTudo para incluir as novas secoes
old_carregar = "renderDashboard();preencherHome();preencherPromoção();preencherConfig();preencherFidelidade();preencherSorteio();renderPreços();carregarEstoque();renderizarSaboresAdmin();"
new_carregar = "renderDashboard();preencherHome();preencherPromoção();preencherConfig();preencherFidelidade();preencherSorteio();renderPreços();carregarEstoque();renderizarSaboresAdmin();preencherCardapio();preencherDepoimentos();preencherFaleConosco();"

if old_carregar in content:
    content = content.replace(old_carregar, new_carregar, 1)
    print('OK carregarTudo atualizado')
else:
    print('ERRO padrao carregarTudo nao encontrado')

# Atualizar irPara para incluir as novas secoes
old_irpara = "  if(seção==='encomendas')renderEncomendas();\n  if(seção==='participantes')renderParticipantes();\n  if(seção==='clientes')renderClientes();\n  if(seção==='fidelidade')renderCódigos();\n}"
new_irpara = "  if(seção==='encomendas')renderEncomendas();\n  if(seção==='participantes')renderParticipantes();\n  if(seção==='clientes')renderClientes();\n  if(seção==='fidelidade')renderCódigos();\n  if(seção==='cardápio')preencherCardapio();\n  if(seção==='depoimentos')preencherDepoimentos();\n  if(seção==='fale-conosco')preencherFaleConosco();\n}"

if old_irpara in content:
    content = content.replace(old_irpara, new_irpara, 1)
    print('OK irPara atualizado')
else:
    print('ERRO padrao irPara nao encontrado')

with open('admin-painel.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('OK admin-painel.html salvo')
