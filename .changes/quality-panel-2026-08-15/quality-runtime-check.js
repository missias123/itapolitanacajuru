
(function(){
  const pages=[
    ['index.html','Página Inicial'],['encomendas.html','Encomendas'],['promocao.html','Promoção'],
    ['dicas.html','Dicas'],['sobre.html','Sobre'],['galeria.html','Galeria']
  ];
  const dataFiles=['dados/config.json','dados/produtos.json','dados/promo.json','dados/promocoes.json','dados/clientes.json','dados/encomendas.json','dados/fidelidade.json'];
  let issues=[], checks=0;
  const esc=(v)=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const add=(code,severity,scope,title,detail,fix)=>issues.push({code,severity,scope,title,detail,fix});
  const sev=(s)=>s==='critica'?'CRÍTICO':s==='alerta'?'ALERTA':'INFO';
  function render(){
    const count=(s)=>issues.filter(i=>i.severity===s).length;
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('quality-total',issues.length);set('quality-critica',count('critica'));set('quality-alerta',count('alerta'));set('quality-ok',Math.max(0,checks-issues.length));
    const badge=document.getElementById('badge-quality-nav');if(badge){badge.textContent=issues.length;badge.style.display=issues.length?'inline-block':'none';}
    const status=document.getElementById('quality-status');if(status)status.innerHTML=issues.length?'Auditoria concluída: <strong>'+issues.length+'</strong> ocorrência(s) em <strong>'+checks+'</strong> verificações.':'Auditoria concluída sem ocorrências: <strong>'+checks+'</strong> verificações OK.';
    const report=document.getElementById('quality-report');
    const lines=issues.map(i=>i.code+' | '+sev(i.severity)+' | '+i.scope+'\n'+i.title+'\n'+i.detail+'\nCorreção: '+i.fix);
    if(report){report.textContent=lines.length?lines.join('\n\n'):'OK | '+checks+' verificações sem ocorrência.';report.style.display='block';}
    const box=document.getElementById('quality-results');if(box){box.innerHTML=issues.length?issues.map(i=>'<div class="audit-card '+(i.severity==='critica'?'critica':i.severity==='alerta'?'alta':'baixa')+'"><span class="audit-badge '+(i.severity==='critica'?'critica':i.severity==='alerta'?'alta':'baixa')+'">'+sev(i.severity)+'</span> <strong>'+esc(i.code)+'</strong><div style="font-weight:800;margin-top:6px">'+esc(i.title)+'</div><div style="font-size:.82rem;margin-top:4px;line-height:1.45">'+esc(i.detail)+'</div><div style="font-size:.8rem;color:#1565c0;margin-top:6px"><strong>Escopo:</strong> '+esc(i.scope)+'<br><strong>Correção:</strong> '+esc(i.fix)+'</div></div>').join(''):'<div style="background:#e8f5e9;border-radius:12px;padding:24px;text-align:center;color:#2e7d32;font-weight:800">✅ Nenhum erro detectado nas verificações executadas.</div>';} 
  }
  async function pageCheck(path,label){
    checks++;let html;
    try{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);html=await r.text();}catch(e){add('ERR-PAGE-001','critica',path,'Página pública indisponível',e.message,'Verificar arquivo e publicação.');return;}
    const doc=new DOMParser().parseFromString(html,'text/html');
    checks++;if(!doc.querySelector('meta[name=viewport]'))add('ERR-RESP-001','alerta',path,'Meta viewport ausente','A página pode ficar desalinhada no celular.','Adicionar meta viewport responsiva.');
    checks++;if(!doc.title||!doc.title.trim())add('ERR-SEO-001','alerta',path,'Título HTML ausente','A página não possui título.','Preencher o título no Admin.');
    const ids=[...doc.querySelectorAll('[id]')].map(e=>e.id);const dup=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];checks++;if(dup.length)add('ERR-DOM-001','alerta',path,'IDs duplicados',dup.join(', '),'Manter cada ID único.');
    const imgs=[...doc.querySelectorAll('img')];const noAlt=imgs.filter(e=>!(e.getAttribute('alt')||'').trim());checks++;if(noAlt.length)add('ERR-IMG-001','alerta',path,noAlt.length+' imagem(ns) sem alt','Acessibilidade e SEO ficam prejudicados.','Adicionar texto alternativo em português.');
    const links=[...doc.querySelectorAll('a[href]')].filter(e=>{const h=(e.getAttribute('href')||'').trim();return !h||h==='#'||/^javascript:/i.test(h);});checks++;if(links.length)add('ERR-LNK-001','alerta',path,links.length+' link(s) sem destino','Há link vazio ou sem ação.','Definir destino real ou remover o link.');
    const body=doc.body?.textContent||'';checks++;if(/R\$\s*1[,.]50|1[,.]50\s*\(Lote/i.test(body))add('ERR-PRC-001','critica',path,'Preço antigo encontrado','Foi encontrada referência a R$ 1,50.','Usar o mínimo oficial de R$ 1,80.');
  }
  async function dataCheck(path){
    checks++;let data;try{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);data=await r.json();}catch(e){add('ERR-DATA-001','critica',path,'JSON indisponível ou inválido',e.message,'Corrigir o arquivo JSON em UTF-8.');return;}
    const raw=JSON.stringify(data);checks++;if(/R\$\s*1[,.]50|1[,.]50\s*\(Lote/i.test(raw))add('ERR-PRC-003','critica',path,'Texto de preço antigo no JSON','Existe referência a R$ 1,50.','Atualizar para R$ 1,80.');
    if(path.endsWith('produtos.json')){const nums=[...raw.matchAll(/"(?:pre[cç]o|preco|pre[cç]oAtacado|precoAtacado)"\s*:\s*([0-9]+(?:\.[0-9]+)?)/gi)].map(m=>Number(m[1]));checks++;if(nums.some(n=>n>0&&n<1.8))add('ERR-PRC-002','critica',path,'Preço abaixo de R$ 1,80','Há preço numérico menor que o mínimo.','Corrigir o valor no Admin.');}
  }
  window.executarAuditoriaCompleta=async function(){
    issues=[];checks=0;const status=document.getElementById('quality-status');if(status)status.textContent='Executando auditoria completa...';
    const button=document.querySelector('#sec-qualidade .btn-salvar');if(button){button.disabled=true;button.textContent='⏳ Auditando...';}
    try{await Promise.all(pages.map(p=>pageCheck(p[0],p[1])));await Promise.all(dataFiles.map(dataCheck));}catch(e){add('ERR-AUDIT-001','critica','Painel de Qualidade','Falha inesperada',e.message,'Copiar o relatório e enviar para correção.');}
    render();if(button){button.disabled=false;button.textContent='▶️ Executar auditoria';}if(typeof toast==='function')toast(issues.length?'Auditoria concluída com '+issues.length+' ocorrência(s).':'Auditoria concluída sem erros.','sucesso');
  };
  window.copiarRelatorioQualidade=async function(){const report=document.getElementById('quality-report');const value=report?.textContent||'';if(!value){if(typeof toast==='function')toast('Execute a auditoria antes de copiar.','aviso');return;}let ok=false;try{ok=typeof copiarTextoSeguro==='function'?await copiarTextoSeguro(value):false;}catch(e){}if(typeof toast==='function')toast(ok?'Relatório copiado. Cole aqui para correção.':'Selecione o relatório e copie manualmente.',ok?'sucesso':'aviso');};
})();
