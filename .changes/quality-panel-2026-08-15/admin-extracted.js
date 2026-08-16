
// ────────────────────────────────────────────────────────────
// Utilitário: escape HTML — evita XSS ao renderizar dados de usuário via innerHTML
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '\x26amp;').replace(/</g, '\x26lt;')
    .replace(/>/g, '\x26gt;').replace(/"/g, '\x26quot;').replace(/'/g, '\x26#39;');
}
async function copiarTextoSeguro(texto){
  const valor=String(texto==null?'':texto);
  if(!valor)return false;
  try{
    if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
      await navigator.clipboard.writeText(valor);
      return true;
    }
  }catch(err){
    console.warn('[copiarTextoSeguro] Clipboard API indisponível, tentando fallback.',err);
  }
  let area=null;
  try{
    area=document.createElement('textarea');
    area.value=valor;
    area.setAttribute('readonly','');
    area.style.position='fixed';
    area.style.opacity='0';
    area.style.left='-9999px';
    area.style.top='0';
    document.body.appendChild(area);
    area.focus({preventScroll:true});
    area.select();
    area.setSelectionRange(0,area.value.length);
    const ok=document.execCommand('copy');
    return Boolean(ok);
  }catch(err){
    console.error('[copiarTextoSeguro] Falha no fallback de cópia.',err);
    return false;
  }finally{
    if(area&&area.parentNode)area.parentNode.removeChild(area);
  }
}
function lsGet(k){try{return localStorage.getItem(k)||'';}catch(e){console.warn('[Admin] localStorage indisponível (get)',e);return '';}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){console.warn('[Admin] localStorage indisponível (set)',e);return false;}}
function lsRemove(k){try{localStorage.removeItem(k);return true;}catch(e){console.warn('[Admin] localStorage indisponível (remove)',e);return false;}}
// Debug (prefill): habilite com localStorage.setItem('itap_admin_prefill_debug','1')
const PREFILL_DEBUG = (lsGet('itap_admin_prefill_debug') === '1');
function prefillLog(...args){ if(PREFILL_DEBUG) console.log(...args); }
function setFieldValue(id, value, ctx=''){
  try{
    const el=document.getElementById(id);
    if(!el){
      prefillLog('[prefill] elemento não encontrado', { id, ctx });
      return false;
    }
    if(!('value' in el)){
      prefillLog('[prefill] elemento sem .value', { id, tag: el.tagName, ctx });
      return false;
    }
    el.value = (value == null ? '' : String(value));
    return true;
  }catch(e){
    console.error('[prefill] erro ao preencher campo', { id, ctx, err: e });
    return false;
  }
}
// sessionStorage — usado para dados de sessão sensíveis (ex.: GitHub token) que não devem persistir
function ssGet(k){try{return sessionStorage.getItem(k)||'';}catch(e){return '';}}
function ssSet(k,v){try{sessionStorage.setItem(k,v);return true;}catch(e){return false;}}
function ssRemove(k){try{sessionStorage.removeItem(k);return true;}catch(e){return false;}}
function getToken(){return GITHUB_PAT||ssGet('itap_github_token')||'';}
function getAuthHeaders(extraHeaders={}, tokenOverride=''){
  const tok=(tokenOverride||getToken()).trim();
  const headers={...extraHeaders};
  if(tok)headers['Authorization']=`token ${tok}`;
  return headers;
}
// GitHub classic PAT tokens are usually 40 chars (ghp_/gho_/ghu_/ghs_ + payload).
const MIN_CLASSIC_TOKEN_LENGTH=40;
// Fine-grained PATs (github_pat_) are significantly longer; keep a safe minimum.
const MIN_FINE_GRAINED_TOKEN_LENGTH=80;
// Accepts common GitHub token formats (classic/fine-grained PAT and app/oauth tokens).
function tokenFormatoValido(tok){
  const t=(tok||'').trim();
  const regras=[
    {prefix:'github_pat_',minLen:MIN_FINE_GRAINED_TOKEN_LENGTH},
    {prefix:'ghp_',minLen:MIN_CLASSIC_TOKEN_LENGTH},
    {prefix:'gho_',minLen:MIN_CLASSIC_TOKEN_LENGTH},
    {prefix:'ghu_',minLen:MIN_CLASSIC_TOKEN_LENGTH},
    {prefix:'ghs_',minLen:MIN_CLASSIC_TOKEN_LENGTH}
  ];
  if(regras.some(r=>t.startsWith(r.prefix)&&t.length>=r.minLen))return true;
  // Legacy fallback: older classic token shapes can appear as 40-char alphanumeric strings.
  return new RegExp(`^[a-zA-Z0-9]{${MIN_CLASSIC_TOKEN_LENGTH}}$`).test(t);
}

// ── Validação proativa do token GitHub ────────────────────────────────────────
// Feedback inline no campo de token da tela de login
function validarCampoToken(input){
  const v = input.value.trim();
  const ok = !v || tokenFormatoValido(v);
  const hint = document.getElementById('token-hint');
  const statusEl = document.getElementById('token-status');
  if (hint) hint.style.display = v && !ok ? 'block' : 'none';
  if(statusEl){
    if(!v) statusEl.textContent='ℹ️ Nenhum token salvo neste navegador.';
    else if(!ok) statusEl.textContent='⚠️ Token com formato inválido (não será salvo).';
    else statusEl.textContent='✅ Token com formato válido.';
  }
}

function preencherTokenSalvoNoLogin(){
  // Verificar se há token GitHub ativo no sessionStorage
  const token=ssGet('itap_github_token');
  if(token){
    GITHUB_PAT=token;
    GH_WRITE_ALLOWED=true;
    atualizarStatusGitHubToken('✅ Token GitHub recuperado nesta aba.','success');
  }else{
    GH_WRITE_ALLOWED=false;
    GITHUB_PAT='';
    atualizarStatusGitHubToken('ℹ️ Sem token GitHub ativo. Admin em modo somente leitura.','info');
  }
  atualizarBannerGitHubToken(GH_WRITE_ALLOWED);
}

function limparTokenSalvo(){
  ssRemove('itap_github_token');
  GITHUB_PAT='';
  GH_WRITE_ALLOWED=false;
  GH_TOKEN_CAN_WRITE=null;
  atualizarStatusGitHubToken('ℹ️ Token GitHub removido. Informe um novo token para habilitar escrita.','info');
  atualizarBannerGitHubToken(false);
  toast('Token GitHub removido com sucesso.','sucesso');
}

function atualizarStatusGitHubToken(msg,tipo='info'){
  const ghStatus=document.getElementById('github-token-status');
  if(!ghStatus)return;
  const cores={info:'#90caf9',success:'#9ccc65',warning:'#ffd54f',error:'#ef9a9a'};
  ghStatus.style.color=cores[tipo]||cores.info;
  ghStatus.textContent=msg||'';
}
function atualizarBannerGitHubToken(ativo=GH_WRITE_ALLOWED){
  const bannerGitHub=document.getElementById('aviso-github-token');
  if(bannerGitHub)bannerGitHub.style.display=ativo?'none':'flex';
  const bannerExpired=document.getElementById('aviso-token-expirado');
  if(bannerExpired)bannerExpired.style.display=ativo?'none':'flex';
}
// Mantém compatibilidade com código legado
function atualizarStatusSessaoWorker(msg,tipo){atualizarStatusGitHubToken(msg,tipo);}
function atualizarBannerSessaoWorker(ativo){atualizarBannerGitHubToken(ativo);}
const GITHUB_TOKEN_MODAL_FOCUS_DELAY_MILLIS=30;
function abrirModalGitHubToken(){
  const modal=document.getElementById('github-token-modal');
  const input=document.getElementById('github-token-modal-input');
  if(!modal||!input)return;
  modal.style.display='flex';
  input.value='';
  setTimeout(()=>input.focus(),GITHUB_TOKEN_MODAL_FOCUS_DELAY_MILLIS);
}
function fecharModalGitHubToken(){
  const modal=document.getElementById('github-token-modal');
  const input=document.getElementById('github-token-modal-input');
  if(input)input.value='';
  if(modal)modal.style.display='none';
}
// Mantém compatibilidade com código legado
const WORKER_MODAL_FOCUS_DELAY_MILLIS=30;
function abrirModalSessaoWorker(){abrirModalGitHubToken();}
function fecharModalSessaoWorker(){fecharModalGitHubToken();}

async function validarToken(tok){
  const token=(tok||'').trim();
  if(!token) return {ok:false,canWrite:false,reason:'ausente'};
  if(!GH_OWNER||!GH_REPO){
    console.warn('[Admin] validarToken: GH_OWNER/GH_REPO not configured');
    return {ok:false,canWrite:false,reason:'repo_not_configured'};
  }
  try{
    // Using /repos/{owner}/{repo} validates auth and confirms this token can access
    // the exact repository used by the admin (avoids false positives from /user-only checks).
    const r=await fetchWithTimeout(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}`,{
      headers:getAuthHeaders({'X-GitHub-Api-Version':GH_API_VERSION,'Accept':GH_API_ACCEPT},token),
      cache:'no-store'
    },8000);
    if(!r.ok){
      console.warn('[Admin] validarToken: status',r.status);
      return {ok:false,canWrite:false,reason:'invalid_or_expired',status:r.status};
    }
    let canWrite=false;
    let permissaoConfirmada=false;
    try{
      const repoInfo=await r.json();
      const perms=repoInfo&&repoInfo.permissions?repoInfo.permissions:{};
      permissaoConfirmada=Object.keys(perms).length>0;
      canWrite=Boolean(perms.push||perms.admin||perms.maintain);
    }catch(e){
      console.warn('[Admin] validarToken: não foi possível ler permissões',e?.message||e);
    }
    return{
      ok:true,
      canWrite:permissaoConfirmada?canWrite:null,
      reason:canWrite?'ok':(permissaoConfirmada?'missing_write_permission':'permissions_unknown')
    };
  }catch(e){
    console.warn('[Admin] validarToken: erro de rede',e.message);
    // Evita falso bloqueio em instabilidade de rede; o salvamento confirma no retorno da API.
    return {ok:true,canWrite:null,reason:'network_error_unverified'};
  }
}

// ── Helper: exibe erro visível numa seção quando dados não carregaram ──────────
function adminMostrarErroCarregamento(containerId, nomeArquivo){
  const el=document.getElementById(containerId);
  if(!el)return;
  el.innerHTML=`<div style="background:#ffebee;border-left:4px solid #c62828;padding:14px 18px;border-radius:8px;margin:12px 0;font-size:.85rem;color:#b71c1c">
    ⚠️ <strong>Erro ao carregar dados.</strong> O arquivo <code>${nomeArquivo}</code> não foi carregado ou está inválido.<br>
    <strong>O que fazer:</strong> verifique conexão e tente <button onclick="recarregarTodosDados()" style="background:#c62828;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:.82rem">🔄 Recarregar</button>.
  </div>`;
}

// ── Recarregar todos os dados manualmente ─────────────────────────────────────
async function recarregarTodosDados(){
  toast('🔄 Recarregando dados do admin...','aviso');
  await carregarTudo();
}

function atualizarToken(){
  // Legado: redireciona para o modal de token GitHub
  abrirModalGitHubToken();
}const GH_OWNER='missias123';
const GH_REPO='itapolitanacajuru';
const GH_BRANCH='main';
const GH_API=`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/`;
const GH_RAW=`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/`;
const GH_API_ACCEPT='application/vnd.github+json';
const GH_API_VERSION='2022-11-28';
	const PATHS={produtos:'dados/produtos.json',promo:'dados/promo.json',clientes:'dados/clientes.json',fidelidade:'dados/fidelidade.json',encomendas:'dados/encomendas.json',config:'dados/config.json',promocoes:'dados/promocoes.json',auth:'dados/auth.json'};
	const STATE={produtos:null,produtosSha:null,promo:null,promoSha:null,clientes:null,clientesSha:null,fidelidade:null,fidelidadeSha:null,encomendas:null,encomendasSha:null,config:null,configSha:null,promocoes:null,promocoesSha:null,auth:null,authSha:null,pagClientes:0,senhaAdmin:null};
	window.STATE=STATE;
	let GH_WRITE_ALLOWED=false;
let GH_TOKEN_CAN_WRITE=null;
let GITHUB_PAT=ssGet('itap_github_token')||'';
const PATH_SHA_KEYS={
  [PATHS.produtos]:'produtosSha',
  [PATHS.promo]:'promoSha',
  [PATHS.clientes]:'clientesSha',
  [PATHS.fidelidade]:'fidelidadeSha',
  [PATHS.encomendas]:'encomendasSha',
  [PATHS.config]:'configSha',
  [PATHS.promocoes]:'promocoesSha',
  [PATHS.auth]:'authSha'
};
function pathShaKey(path){return PATH_SHA_KEYS[path]||null;}
function pathPrecisaSha(path){return Boolean(pathShaKey(path));}
function pathEstaSemSha(path){
  const key=pathShaKey(path);
  return Boolean(key)&&!STATE[key];
}
const WORKER_GH_PATHS=new Set([PATHS.config,PATHS.produtos,PATHS.promo,PATHS.fidelidade,PATHS.promocoes]);

// ── Compatibilidade legada (funções antigas de sessão) ─────────────────────────
const ITAP_WORKER_API='https://api.itapolitanacajuru.com.br';
const WORKER_SESSION_TOKEN_KEY='itap_worker_session_token';
// Mantém o nome legado para evitar refatoração ampla no arquivo.
function getAdminToken(){return GH_WRITE_ALLOWED?getToken():'';}
function workerAdminHeaders(extra={}){return{'Content-Type':'application/json','Authorization':`token ${getAdminToken()}`,...extra};}
function workerRepoPathAllowed(path){return true;} // Todos os arquivos agora podem ser salvos via GitHub API
function getWorkerSessionToken(){return ssGet(WORKER_SESSION_TOKEN_KEY)||'';}
function setWorkerSessionToken(token){if(token)ssSet(WORKER_SESSION_TOKEN_KEY,token);}
function clearWorkerSessionToken(){ssRemove(WORKER_SESSION_TOKEN_KEY);}
function getWorkerAuthHeaders(extra={}){
  const sessionToken=getWorkerSessionToken();
  return {'Content-Type':'application/json',...(sessionToken?{'X-Itap-Session-Token':sessionToken}:{}),...extra};
}
async function iniciarSessaoWorkerComSenha(senha){
  if(!senha)return{ok:false,error:'Senha ausente'};
  try{
    const r=await fetchWithTimeout(ITAP_WORKER_API+'/api/admin/session',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:senha})
    },12000);
    const ct=r.headers.get('content-type')||'';
    if(!ct.includes('application/json'))return{ok:false,error:'Resposta inesperada de autenticação do Worker.'};
    const dados=await r.json();
    if(!r.ok||!dados.ok||!dados.token)return{ok:false,error:dados.error||'Falha na autenticação do Worker.'};
    setWorkerSessionToken(dados.token);
    return{ok:true};
  }catch(e){
    return{ok:false,error:e&&e.message?e.message:'Falha de rede no Worker.'};
  }
}
function invalidarTokenGitHub(msg='⚠️ Token GitHub expirado. Informe um novo token para continuar editando.'){
  ssRemove('itap_github_token');
  GITHUB_PAT='';
  GH_WRITE_ALLOWED=false;
  GH_TOKEN_CAN_WRITE=null;
  atualizarStatusGitHubToken(msg,'warning');
  atualizarBannerGitHubToken(false);
  // Desabilitar botões de escrita imediatamente
  document.querySelectorAll('[data-fid-write]').forEach(el=>{
    const tag=(el.tagName||'').toUpperCase();
    if(['BUTTON','INPUT','SELECT','TEXTAREA'].includes(tag))el.disabled=true;
    el.classList.add('is-disabled');
  });
}
// Mantém compatibilidade com código legado
function invalidarSessaoWorker(msg){invalidarTokenGitHub(msg);}
async function iniciarSessaoWorker(secret){
  // Função legada mantida apenas para compatibilidade
  // Agora redireciona para validação de token GitHub
  console.warn('[Admin] iniciarSessaoWorker é legado. Use token GitHub diretamente.');
  return{ok:false,error:'Função descontinuada. Use token GitHub.'};
}
async function fetchWithTimeout(url,options={},timeoutMs=10000){
  if(options&&options.signal&&options.signal.aborted)throw new Error('Abortado antes do fetch');
  const controller=new AbortController();
  if(options&&options.signal){
    options.signal.addEventListener('abort',()=>controller.abort(),{once:true});
  }
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetch(url,{...options,signal:controller.signal});
  }catch(e){
    if(e&&e.name==='AbortError')throw new Error(`Timeout ${timeoutMs}ms em ${url}`);
    throw e;
  }finally{
    clearTimeout(timer);
  }
}
async function workerGet(endpoint){
  // Função legada - não mais utilizada, pois carregamos direto do GitHub
  console.warn('[Admin] workerGet é legado. Dados carregados via GitHub Raw/API.');
  return{content:null,sha:null};
}
async function workerSalvar(endpoint,data,method='PUT'){
  // Função legada - não mais utilizada, salvamos direto via GitHub API
  console.warn('[Admin] workerSalvar é legado. Use salvarArquivo() que usa GitHub API.');
  toast('⚠️ Função descontinuada. Os dados são salvos diretamente via GitHub API.','aviso');
  return false;
}
async function workerGetRepo(path){
  // Função legada - não mais utilizada
  console.warn('[Admin] workerGetRepo é legado. Dados carregados via GitHub API.');
  return{content:null,sha:null};
}
async function workerSalvarRepo(path,data,sha,msg){
  // Função legada - não mais utilizada, redirecionada para ghPut
  console.warn('[Admin] workerSalvarRepo é legado. Usando GitHub API diretamente via ghPut.');
  const token=getAdminToken();
  if(!token)return{ok:false,erro:'Token GitHub inativo ou expirado.'};
  return await ghPut(path,data,sha,msg);
}
// Dirty-check: rastreia se há alterações não salvas na aba atual
let adminDirty=false;
function markDirty(){adminDirty=true;}
function clearDirty(){adminDirty=false;}
function checkDirty(){
  if(!adminDirty)return true;
  return confirm('⚠️ Há alterações não salvas nesta aba. Se sair agora elas serão perdidas.\n\nContinuar mesmo assim?');
}
const POR_PAGINA=50;
function fidCodigosKey(){
  if(!STATE.fidelidade)return'códigos';
  if(STATE.fidelidade['códigos'])return'códigos';
  if(STATE.fidelidade.codigos)return'codigos';
  return'códigos';
}
function fidGetCodigos(){
  if(!STATE.fidelidade)return{};
  const key=fidCodigosKey();
  const codigos=STATE.fidelidade[key];
  return codigos&&typeof codigos==='object'?codigos:{};
}
function fidEnsureCodigos(){
  if(!STATE.fidelidade)STATE.fidelidade={};
  const key=fidCodigosKey();
  if(!STATE.fidelidade[key]||typeof STATE.fidelidade[key]!=='object')STATE.fidelidade[key]={};
  return{key,codigos:STATE.fidelidade[key]};
}
function ensureSafeState(){
  if(!STATE.clientes||typeof STATE.clientes!=='object')STATE.clientes={clientes:{},indice_celular:{}};
  else if(!STATE.clientes.clientes||typeof STATE.clientes.clientes!=='object')STATE.clientes.clientes={};
  if(!STATE.encomendas||typeof STATE.encomendas!=='object')STATE.encomendas={registros:[]};
  else if(!Array.isArray(STATE.encomendas.registros))STATE.encomendas.registros=[];
  if(!STATE.fidelidade||typeof STATE.fidelidade!=='object')STATE.fidelidade={};
  if(!STATE.promocoes||typeof STATE.promocoes!=='object')STATE.promocoes={promocoes:[]};
  else if(!Array.isArray(STATE.promocoes.promocoes))STATE.promocoes.promocoes=[];
}
function fidIsReadOnly(){
  // Fidelidade (fidelidade.json) requer token GitHub ativo + SHA.
  return !GH_WRITE_ALLOWED||!STATE.fidelidadeSha;
}
function fidPathReadOnly(path){
  return (path===PATHS.fidelidade&&!STATE.fidelidadeSha)||(path===PATHS.clientes&&!GH_WRITE_ALLOWED);
}
const FID_DISABLEABLE_TAGS=['BUTTON','INPUT','SELECT','TEXTAREA','OPTION','OPTGROUP','FIELDSET'];
function fidApplyReadOnlyGuard(){
  const isReadOnly=fidIsReadOnly();
  document.querySelectorAll('.fid-readonly-aviso').forEach(el=>{el.style.display=isReadOnly?'block':'none';});
  document.querySelectorAll('[data-fid-write]').forEach(el=>{
    const tag=(el.tagName||'').toUpperCase();
    if(FID_DISABLEABLE_TAGS.includes(tag))el.disabled=isReadOnly;
    el.classList.toggle('is-disabled',isReadOnly);
  });
}
function fidRequireWrite(){
  if(!fidIsReadOnly())return true;
  fidApplyReadOnlyGuard();
  const msg=!STATE.fidelidadeSha
    ? '⚠️ Modo leitura ativo. Adicione um token GitHub para editar esta área do admin.'
    : '⚠️ Token GitHub inativo. Adicione um novo token para editar esta área do admin.';
  toast(msg,'aviso');
  return false;
}
async function ghGetRepo(path){
  try{
    const r=await fetchWithTimeout(GH_API+path+'?t='+Date.now(),{headers:getAuthHeaders({'Accept':GH_API_ACCEPT,'X-GitHub-Api-Version':GH_API_VERSION})},9000);
    if(r.status===404)return{content:null,sha:null};
    if(!r.ok)throw new Error(r.status);
    const d=await r.json();
    const bin=atob(d.content.replace(/\n/g,''));
    const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    const content=new TextDecoder('utf-8').decode(bytes);
    return{content:JSON.parse(content),sha:d.sha};
  }catch(e){
    // Fallback 1: tentar ler do próprio site (mesma origem) quando existir /dados/*.json
    try{
      if(typeof path==='string'&&(path.startsWith('dados/')||path.startsWith('/dados/'))){
        const localPath=path.startsWith('/')?path:('/'+path);
        const rLocal=await fetchWithTimeout(localPath+'?t='+Date.now(),{cache:'no-store'},7000);
        if(rLocal.ok){const c=await rLocal.json();return{content:c,sha:null,readonly:true};}
      }
    }catch(eLocal){
      console.warn('[admin] ghGet local fallback falhou para',path,eLocal);
    }
    // Fallback 2: repo público — lê via URL raw (sem autenticação, sem SHA para salvar)
    try{
      const r2=await fetchWithTimeout(GH_RAW+path+'?t='+Date.now(),{cache:'no-store'},7000);
      if(r2.ok){const c=await r2.json();return{content:c,sha:null,readonly:true};}
    }catch(e2){
      console.warn('[admin] ghGet fallback falhou para',path,e2);
    }
    return{content:null,sha:null};
  }
}
async function ghGet(path){
  return ghGetRepo(path);
}
let _configLoadPromise=null;
function aplicarConfigAdmin(cfg){
  if(cfg&&cfg.content){
    STATE.config=cfg.content;
    STATE.configSha=cfg.sha;
    if(!STATE.senhaAdmin&&cfg.content.senhaAdmin)STATE.senhaAdmin=cfg.content.senhaAdmin;
  }
  return cfg;
}
let _authLoadPromise=null;
function aplicarAuth(result){
  if(result&&result.content){
    STATE.auth=result.content;
    STATE.authSha=result.sha;
    if(result.content.senhaAdmin)STATE.senhaAdmin=result.content.senhaAdmin;
  }
  return result;
}
async function carregarAuth(forceRefresh=false){
  if(forceRefresh||!_authLoadPromise){
    _authLoadPromise=ghGet(PATHS.auth)
      .then(aplicarAuth)
      .catch(e=>{
        console.warn('[Admin] carregarAuth falhou',e);
        return{content:null,sha:null};
      });
  }
  return _authLoadPromise;
}
async function carregarConfigAdmin(forceRefresh=false){
  const deveAtualizarConfig=Boolean(getAdminToken()&&STATE.config&&STATE.configSha===null);
  if(forceRefresh||!_configLoadPromise||deveAtualizarConfig){
    _configLoadPromise=ghGet(PATHS.config)
      .then(aplicarConfigAdmin)
      .catch(e=>{
        console.warn('[Admin] carregarConfigAdmin falhou',e);
        return{content:null,sha:null};
      });
  }
  const cfg=await _configLoadPromise;
  if(!cfg?.content)_configLoadPromise=null;
  return cfg;
}
async function ghPut(path,data,sha,msg){
  const MAX_TENTATIVAS = 3;
  for(let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++){
    try{
      const content=btoa(unescape(encodeURIComponent(JSON.stringify(data,null,2))));
      const body={message:msg,content};
      if(sha)body.sha=sha;
      const r=await fetch(GH_API+path,{method:'PUT',headers:getAuthHeaders({'Content-Type':'application/json'}),body:JSON.stringify(body)});
      // Rate limit (429) ou servidor temporariamente indisponível (503) → aguardar e tentar novamente
      if((r.status===429||r.status===503)&&tentativa<MAX_TENTATIVAS){
        const espera=tentativa*2000; // tentativa 1→2s, tentativa 2→4s
        console.warn(`[Admin] API retornou ${r.status}. Tentativa ${tentativa}/${MAX_TENTATIVAS}. Aguardando ${espera/1000}s...`);
        await new Promise(res=>setTimeout(res,espera));
        continue;
      }
      if(!r.ok){const e=await r.json();throw new Error(e.message);}
      const d=await r.json();
      return{ok:true,sha:d.content.sha};
    }catch(e){
      if(tentativa<MAX_TENTATIVAS&&(e.message==='Failed to fetch'||e.message==='NetworkError')){
        const espera=tentativa*1500;
        console.warn(`[Admin] Erro de rede. Tentativa ${tentativa}/${MAX_TENTATIVAS}. Aguardando ${espera/1000}s...`);
        await new Promise(res=>setTimeout(res,espera));
        continue;
      }
      return{ok:false,erro:e.message};
    }
  }
  return{ok:false,erro:'Falha após '+MAX_TENTATIVAS+' tentativas. Verifique sua conexão.'};
}
async function salvarArquivo(path,data,shaKey,msg){
  if(!GH_WRITE_ALLOWED||!getToken()){
    const banner=document.getElementById('aviso-token-expirado');
    if(banner)banner.style.display='flex';
    toast('⚠️ Modo somente leitura. Informe um token GitHub válido para salvar alterações.','aviso');
    return false;
  }
  // Salvar diretamente via GitHub API
  console.log('[Admin] Salvando via GitHub API:', path, 'SHA:', STATE[shaKey]);
  const r=await ghPut(path,data,STATE[shaKey],msg);
  if(r.ok){
    STATE[shaKey]=r.sha;
    clearDirty();
    toast('✅ Salvo com sucesso!', 'sucesso');
    console.log('[Admin] Salvo com sucesso. Novo SHA:', r.sha);
    return true;
  }
  console.error('[Admin] Erro ao salvar:', r.erro);
  if(r.erro&&(r.erro.includes('401')||r.erro.toLowerCase().includes('unauthorized'))){
    invalidarTokenGitHub();
    toast('⚠️ Token GitHub expirado ou inválido. Informe um novo token.','erro');
  }else if(r.erro&&(r.erro.includes('409')||r.erro.toLowerCase().includes('conflict'))){
    toast('⚠️ Conflito de versão! Outra pessoa alterou os dados. Recarregue a página (F5).','erro');
  }else{
    toast('❌ Erro ao salvar: '+(r.erro||'Erro desconhecido'),'erro');
  }
  return false;
}
function toggleSenhaAdmin(){const i=document.getElementById('inp-senha');i.type=i.type==='password'?'text':'password';}
function toggleGitHubToken(){const i=document.getElementById('inp-github-token');if(i)i.type=i.type==='password'?'text':'password';}
function toggleSenhaCfg(){const i=document.getElementById('cfg-nova-senha');i.type=i.type==='password'?'text':'password';}
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function entrar(){
  const senha=document.getElementById('inp-senha').value;
  const githubToken=(document.getElementById('inp-github-token')?.value||'').trim();
  const loginErro=document.getElementById('login-erro');
  if(!senha){
    loginErro.innerHTML='&#x274C; Informe a senha do administrador.';
    loginErro.style.display='block';
    return;
  }
  mostrarLoading('Verificando...');
  const[cfg,_,senhaHash]=await Promise.all([carregarConfigAdmin(),carregarAuth(),sha256(senha)]);
  if(!cfg.content){
    ocultarLoading();
    loginErro.innerHTML='⚠️ Não foi possível carregar a configuração do admin. Verifique a conexão e tente novamente.';
    loginErro.style.display='block';
    return;
  }
  const senhaOk = STATE.senhaAdmin && (senhaHash === STATE.senhaAdmin || senha === STATE.senhaAdmin);
  if(!senhaOk){
    ocultarLoading();
    loginErro.innerHTML='&#x274C; Senha incorreta.';
    loginErro.style.display='block';
    return;
  }
  // --- GitHub Token: validar token e habilitar escrita ---
  let tokenOk=false;
  if(githubToken){
    if(!tokenFormatoValido(githubToken)){
      atualizarStatusGitHubToken('⚠️ Token GitHub com formato inválido. Admin em modo somente leitura.','warning');
    }else{
      const validacao=await validarToken(githubToken);
      if(validacao.ok){
        ssSet('itap_github_token',githubToken);
        GITHUB_PAT=githubToken;
        GH_WRITE_ALLOWED=validacao.canWrite!==false;
        GH_TOKEN_CAN_WRITE=validacao.canWrite;
        tokenOk=true;
        if(GH_WRITE_ALLOWED){
          atualizarStatusGitHubToken('✅ Token GitHub válido. Edição e salvamento liberados.','success');
        }else if(validacao.canWrite===false){
          atualizarStatusGitHubToken('⚠️ Token válido, mas sem permissão de escrita no repositório. Admin em modo somente leitura.','warning');
        }else{
          atualizarStatusGitHubToken('⚠️ Token válido, mas permissões não confirmadas. Admin em modo somente leitura.','warning');
        }
      }else{
        atualizarStatusGitHubToken('⚠️ Token GitHub inválido ou expirado. Admin em modo somente leitura.','warning');
      }
    }
  }
  if(!tokenOk){
    GH_WRITE_ALLOWED=false;
    GITHUB_PAT='';
    if(!githubToken){
      atualizarStatusGitHubToken('ℹ️ Token GitHub não informado. Admin em modo somente leitura.','info');
    }
  }
  const workerAuth=await iniciarSessaoWorkerComSenha(senha);
  if(!workerAuth.ok){
    console.warn('[Admin] Sessão do Worker indisponível:',workerAuth.error);
    clearWorkerSessionToken();
  }
  ocultarLoading();
  loginErro.style.display='none';
  document.getElementById('login-screen').style.display='none';
  document.getElementById('admin-app').style.display='block';
  atualizarBannerGitHubToken(GH_WRITE_ALLOWED);
  if(!GH_WRITE_ALLOWED)toast('ℹ️ Você entrou em modo somente leitura. Informe um token GitHub válido para salvar alterações.','aviso');
  await carregarTudo();
  const btnPaginaInicial=document.getElementById('nav-btn-pagina-inicial');
  irPara('pagina-inicial',btnPaginaInicial);
}
async function reativarTokenGitHub(){
  const input=document.getElementById('github-token-modal-input');
  const token=(input?.value||'').trim();
  if(!token){
    toast('Informe o token GitHub para continuar.','aviso');
    if(input)input.focus();
    return;
  }
  if(!tokenFormatoValido(token)){
    toast('⚠️ Token GitHub com formato inválido.','aviso');
    if(input)input.focus();
    return;
  }
  mostrarLoading('Validando token GitHub...');
  try{
    const validacao=await validarToken(token);
    if(!validacao.ok){
      toast('⚠️ Não foi possível validar o token GitHub. Confira o token e tente novamente.','aviso');
      if(input)input.focus();
      return;
    }
    if(validacao.canWrite===false){
      toast('⚠️ Token válido, mas sem permissão de escrita no repositório.','aviso');
    }
    ssSet('itap_github_token',token);
    GITHUB_PAT=token;
    GH_WRITE_ALLOWED=validacao.canWrite!==false;
    GH_TOKEN_CAN_WRITE=validacao.canWrite;
    atualizarStatusGitHubToken('✅ Token GitHub validado. Edição e salvamento liberados.','success');
    atualizarBannerGitHubToken(GH_WRITE_ALLOWED);
    fecharModalGitHubToken();
    toast('✅ Token GitHub ativado com sucesso!','sucesso');
  }finally{
    ocultarLoading();
  }
  await carregarTudo();
}
// Mantém compatibilidade com código legado
async function reativarSessaoWorker(){await reativarTokenGitHub();}
function sair(){
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('admin-app').style.display='none';
  document.getElementById('inp-senha').value='';
  const tokenInput=document.getElementById('inp-github-token');
  if(tokenInput)tokenInput.value='';
  document.getElementById('login-erro').style.display='none';
  // Limpar token GitHub ao sair
  ssRemove('itap_github_token');
  clearWorkerSessionToken();
  GITHUB_PAT='';
  GH_WRITE_ALLOWED=false;
}
async function carregarTudo(){
  mostrarLoading('Carregando dados...');
  let pr={content:null,sha:null},cl={content:null,sha:null},fi={content:null,sha:null},en={content:null,sha:null},prod={content:null,sha:null},promos={content:null,sha:null},cfg={content:null,sha:null};
  try{
    const fontes=['promo','clientes','fidelidade','encomendas','produtos','promocoes','config'];
    const resultados=await Promise.allSettled([ghGet(PATHS.promo),ghGet(PATHS.clientes),ghGet(PATHS.fidelidade),ghGet(PATHS.encomendas),ghGet(PATHS.produtos),ghGet(PATHS.promocoes),ghGet(PATHS.config)]);
    resultados.forEach((r,idx)=>{if(r.status==='rejected')console.warn('[BOOT] Fonte',fontes[idx],'falhou:',r.reason);});
    [pr,cl,fi,en,prod,promos,cfg]=resultados.map(r=>r.status==='fulfilled'?r.value:{content:null,sha:null});
    if(pr.content){STATE.promo=pr.content;STATE.promoSha=pr.sha;}
    if(cl.content){STATE.clientes=cl.content;STATE.clientesSha=cl.sha;}else{console.error('[BOOT] Falha ao carregar clientes');}
    if(fi.content){STATE.fidelidade=fi.content;STATE.fidelidadeSha=fi.sha;}
    if(en.content){STATE.encomendas=en.content;STATE.encomendasSha=en.sha;}
    if(prod.content){STATE.produtos=prod.content;STATE.produtosSha=prod.sha;}
    if(promos.content){STATE.promocoes=promos.content;STATE.promocoesSha=promos.sha;}else{STATE.promocoes={promocoes:[]};}
    if(cfg.content){STATE.config=cfg.content;STATE.configSha=cfg.sha;if(!STATE.senhaAdmin&&cfg.content.senhaAdmin)STATE.senhaAdmin=cfg.content.senhaAdmin;}else{console.error('[BOOT] Falha ao carregar config');}
    const falhasCarregamento=[
      [PATHS.promo,pr],
      [PATHS.clientes,cl],
      [PATHS.fidelidade,fi],
      [PATHS.encomendas,en],
      [PATHS.produtos,prod],
      [PATHS.promocoes,promos],
      [PATHS.config,cfg]
    ].filter(([,resp])=>!resp.content).map(([path])=>path);
    if(falhasCarregamento.length){
      toast(`⚠️ Falha ao carregar: ${falhasCarregamento.join(', ')}. Alguns campos podem ficar vazios até recarregar.`,'aviso');
    }
    const arquivosSemSha=[
      [PATHS.promo,pr],
      [PATHS.clientes,cl],
      [PATHS.fidelidade,fi],
      [PATHS.encomendas,en],
      [PATHS.produtos,prod],
      [PATHS.promocoes,promos],
      [PATHS.config,cfg]
    ].filter(([_,resp])=>Boolean(resp?.content)&&!resp?.sha).map(([path])=>path);
    if(arquivosSemSha.length){
      console.warn('[ADMIN][SHA] Arquivos carregados sem SHA:',arquivosSemSha);
      toast(`⚠️ Arquivos sem SHA (somente leitura parcial): ${arquivosSemSha.join(', ')}.`,'aviso');
    }
    console.table([
      {arquivo:PATHS.promo,sha:Boolean(STATE.promoSha),readonly:Boolean(pr?.readonly),carregado:Boolean(pr?.content)},
      {arquivo:PATHS.clientes,sha:Boolean(STATE.clientesSha),readonly:Boolean(cl?.readonly),carregado:Boolean(cl?.content)},
      {arquivo:PATHS.fidelidade,sha:Boolean(STATE.fidelidadeSha),readonly:Boolean(fi?.readonly),carregado:Boolean(fi?.content)},
      {arquivo:PATHS.encomendas,sha:Boolean(STATE.encomendasSha),readonly:Boolean(en?.readonly),carregado:Boolean(en?.content)},
      {arquivo:PATHS.produtos,sha:Boolean(STATE.produtosSha),readonly:Boolean(prod?.readonly),carregado:Boolean(prod?.content)},
      {arquivo:PATHS.promocoes,sha:Boolean(STATE.promocoesSha),readonly:Boolean(promos?.readonly),carregado:Boolean(promos?.content)},
      {arquivo:PATHS.config,sha:Boolean(STATE.configSha),readonly:Boolean(cfg?.readonly),carregado:Boolean(cfg?.content)}
    ]);
    // Banner de escrita: exibe quando algum arquivo do admin caiu em leitura, falhou no carregamento ou o token não está válido
    const semToken=[pr,cl,fi,en,prod,promos,cfg].some(r=>r.content&&r.readonly)||!GH_WRITE_ALLOWED;
    const avisoComFalhas=Boolean(falhasCarregamento.length||arquivosSemSha.length);
    const banner=document.getElementById('aviso-token-expirado');
    const bannerMsg=document.getElementById('aviso-token-expirado-msg');
    if(banner){
      banner.style.display=(semToken||avisoComFalhas)?'flex':'none';
    }
    if(bannerMsg){
      bannerMsg.innerHTML=avisoComFalhas
        ?`<strong>Falha parcial no carregamento dos dados.</strong> Verifique conexão/token e use “🔄 Recarregar Dados”. ${falhasCarregamento.length?`Falha ao carregar: ${falhasCarregamento.map(esc).join(', ')}. `:''}${arquivosSemSha.length?`Sem SHA: ${arquivosSemSha.map(esc).join(', ')}.`:''}`
        :'<strong>Admin em modo somente leitura.</strong> Adicione um token GitHub para liberar edição e salvamento.';
    }
    // Banner: mostrar quando token de escrita não está válido
    atualizarBannerGitHubToken(GH_WRITE_ALLOWED);
  }catch(e){
    console.error('[BOOT] carregarTudo falhou',e);
    toast('⚠️ Falha ao carregar parte dos dados. Verifique a conexão/token e tente Recarregar.','aviso');
  }finally{
    ocultarLoading();
  }
  ensureSafeState();
  renderDashboard();
  try{preencherHome();}catch(e){console.error('[Admin] preencherHome',e);}
  try{preencherPromoção();}catch(e){console.error('[Admin] preencherPromoção',e);}
  try{preencherConfig();}catch(e){console.error('[Admin] preencherConfig',e);}
  try{preencherFidelidade();}catch(e){console.error('[Admin] preencherFidelidade',e);}
  try{preencherSorteio();}catch(e){console.error('[Admin] preencherSorteio',e);}
  try{renderPreços();}catch(e){console.error('[Admin] renderPreços',e);}
  try{renderizarEstoqueAdmin();}catch(e){console.error('[Admin] renderizarEstoqueAdmin',e);}
  try{carregarTitulosCardapio();}catch(e){console.error('[Admin] carregarTitulosCardapio',e);}
  try{renderizarSaboresAdmin();}catch(e){console.error('[Admin] renderizarSaboresAdmin',e);}
  try{preencherCardapio();}catch(e){console.error('[Admin] preencherCardapio',e);}
  try{preencherDepoimentos();}catch(e){console.error('[Admin] preencherDepoimentos',e);}
  try{preencherFaleConosco();}catch(e){console.error('[Admin] preencherFaleConosco',e);}
  try{preencherNotasOperacionais();}catch(e){console.error('[Admin] preencherNotasOperacionais',e);}
  try{carregarSobre();}catch(e){console.error('[Admin] carregarSobre',e);}
  try{carregarCarrosselConfig();}catch(e){console.error('[Admin] carregarCarrosselConfig',e);}
  try{carregarGaleria();}catch(e){console.error('[Admin] carregarGaleria',e);}
  try{carregarEncomendas();}catch(e){console.error('[Admin] carregarEncomendas',e);}
  try{carregarFidelidadePagina();}catch(e){console.error('[Admin] carregarFidelidadePagina',e);}
  fidApplyReadOnlyGuard();
}
function irPara(seção,btn){
  if(!checkDirty())return; // avisa se há alterações não salvas
  const safeInit=(tabName,fn)=>{
    try{fn();}
    catch(e){
      console.error(`[irPara] Falha ao inicializar ${tabName}: ${e?.message||e}`,e);
      toast(`⚠️ Erro ao abrir a aba ${tabName}. Veja o console para detalhes.`,'erro');
    }
  };
  // Mapa: aba → lista de seções que compõem cada página do site
  const sectionMap={
    'pagina-inicial': ['home','carrossel-config','carrossel-admin','fale-conosco','config'],
    'cardapio-admin': ['preços','cardapio-titulos','cardápio','produtos','sabores'],
    'encomendas-admin':['encomendas','estoque','encomendas-config'],
    'promocao-admin': ['promoção','participantes'],
    'dicas-admin':    ['depoimentos'],
    'sobre-admin':    ['sobre'],
    'galeria-admin':  ['galeria'],
    'qualidade-admin': ['qualidade']
  };
  console.log(`[irPara] Navegando para: ${seção}`);
  document.querySelectorAll('.seção').forEach(s=>s.classList.remove('ativo'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('ativo'));
  const ids=sectionMap[seção]||[seção];
  console.log(`[irPara] IDs das seções a ativar:`, ids);
  ids.forEach(id=>{
    const el=document.getElementById('sec-'+id);
    if(el){
      el.classList.add('ativo');
      console.log(`[irPara] ✓ Seção ativada: sec-${id}`);
    }else{
      console.error(`[irPara] ✗ Seção NÃO encontrada: sec-${id}`);
    }
  });
  if(btn)btn.classList.add('ativo');
  // Inicializar funções necessárias para cada seção visível
  if(ids.includes('home')){console.log('[irPara] Inicializando HOME');safeInit('HOME',()=>preencherHome());}
  if(ids.includes('preços')){console.log('[irPara] Inicializando PREÇOS');safeInit('PREÇOS',()=>renderPreços());}
  if(ids.includes('cardapio-titulos')){console.log('[irPara] Inicializando CARDAPIO TITULOS');safeInit('CARDAPIO TITULOS',()=>carregarTitulosCardapio());}
  if(ids.includes('cardápio')){console.log('[irPara] Inicializando CARDÁPIO');safeInit('CARDÁPIO',()=>preencherCardapio());}
  if(ids.includes('fale-conosco')){console.log('[irPara] Inicializando FALE CONOSCO');safeInit('FALE CONOSCO',()=>preencherFaleConosco());}
  if(ids.includes('config')){console.log('[irPara] Inicializando CONFIG');safeInit('CONFIG',()=>preencherConfig());}
  if(ids.includes('encomendas')){console.log('[irPara] Inicializando ENCOMENDAS');safeInit('ENCOMENDAS',()=>renderEncomendas());}
  if(ids.includes('sabores')){console.log('[irPara] Inicializando SABORES');safeInit('SABORES',()=>renderizarSaboresAdmin());}
  if(ids.includes('estoque')){console.log('[irPara] Inicializando ESTOQUE');safeInit('ESTOQUE',()=>renderizarEstoqueAdmin());}
  if(ids.includes('produtos')){console.log('[irPara] Inicializando PRODUTOS');safeInit('PRODUTOS',()=>renderProdutosAdmin());}
  if(ids.includes('promoção')){console.log('[irPara] Inicializando PROMOÇÃO');safeInit('PROMOÇÃO',()=>{preencherPromoção();preencherSorteio();renderPromocoesTable();carregarInscritosSorteio();});}
  if(ids.includes('participantes')){console.log('[irPara] Inicializando PARTICIPANTES');safeInit('PARTICIPANTES',()=>renderParticipantes());}
  if(ids.includes('clientes')){
    console.log('[irPara] Inicializando CLIENTES');
    safeInit('CLIENTES',()=>{
      renderClientes();
      if(typeof renderDuplicidades==='function')renderDuplicidades();
    });
  }
  if(ids.includes('fidelidade')){
    console.log('[irPara] Inicializando ');
    try{preencherFidelidade();}catch(e){console.error('[Admin] preencherFidelidade',e);}
    try{if(typeof renderCódigos==='function')renderCódigos();}catch(e){console.error('[Admin] renderCódigos',e);}
    try{if(typeof fidRenderProgresso==='function')fidRenderProgresso();if(typeof fidRenderLoteAtual==='function')fidRenderLoteAtual();}catch(e){console.error('[Admin] fidRender',e);}
    try{if(typeof carregarConfigSorteio==='function')carregarConfigSorteio();}catch(e){console.error('[Admin] carregarConfigSorteio',e);}
    try{if(typeof carregarRegrasPontuacao==='function')carregarRegrasPontuacao();}catch(e){console.error('[Admin] carregarRegrasPontuacao',e);}
    try{if(typeof carregarFidelidadePagina==='function')carregarFidelidadePagina();}catch(e){console.error('[Admin] carregarFidelidadePagina',e);}
    const secFidelidade=document.getElementById('sec-fidelidade');
    if(seção==='fidelidade-admin'&&secFidelidade){
      secFidelidade.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
  if(ids.includes('clientes')||ids.includes('fidelidade')) { if(typeof fidApplyReadOnlyGuard==='function') fidApplyReadOnlyGuard(); }
  if(ids.includes('depoimentos')){
    console.log('[irPara] Inicializando DEPOIMENTOS');
    try{preencherDepoimentos();}catch(e){console.error('[Admin] preencherDepoimentos',e);}
  }
  if(ids.includes('sobre')){console.log('[irPara] Inicializando SOBRE');safeInit('SOBRE',()=>carregarSobre());}
  if(ids.includes('carrossel-config')){console.log('[irPara] Inicializando CARROSSEL');safeInit('CARROSSEL',()=>carregarCarrosselConfig());}
  if(ids.includes('galeria')){console.log('[irPara] Inicializando GALERIA');safeInit('GALERIA',()=>carregarGaleria());}
  if(ids.includes('encomendas-config')){console.log('[irPara] Inicializando ENCOMENDAS CONFIG');safeInit('ENCOMENDAS CONFIG',()=>carregarEncomendas());}
  if(ids.includes('qualidade')){console.log('[irPara] Inicializando QUALIDADE');safeInit('QUALIDADE',()=>{atualizarScoresQualidade();preencherNotasOperacionais();});}
  if(ids.includes('rastreio')){console.log('[irPara] Inicializando RASTREIO');safeInit('RASTREIO',()=>renderRastreioRecentes());}
  if(ids.includes('auditoria')){console.log('[irPara] Inicializando AUDITORIA');safeInit('AUDITORIA',()=>executarAuditoria());}
  if(ids.includes('rastreio')||ids.includes('auditoria'))safeInit('NOTAS OPERACIONAIS',()=>preencherNotasOperacionais());
  // Scroll para o topo ao trocar de aba — funciona para seções dentro e fora do .admin-content
  window.scrollTo({top:0,behavior:'auto'});
  const content=document.querySelector('.admin-content');
  if(content)content.scrollTop=0;
}

async function atualizarListaFidelidade(){
  const btn=document.getElementById('btn-refresh-fidelidade');
  if(btn){btn.disabled=true;btn.textContent='Atualizando...';}
  try{
    const[cl,fi]=await Promise.all([ghGet(PATHS.clientes),ghGet(PATHS.fidelidade)]);
    if(cl.content){STATE.clientes=cl.content;STATE.clientesSha=cl.sha;}
    if(fi.content){STATE.fidelidade=fi.content;STATE.fidelidadeSha=fi.sha;}
    try{renderClientes();renderDuplicidades();}catch(e){console.error('[Admin] atualizarListaFidelidade renderClientes',e);}
    try{preencherFidelidade();}catch(e){console.error('[Admin] atualizarListaFidelidade preencherFidelidade',e);}
    try{renderCódigos();}catch(e){console.error('[Admin] atualizarListaFidelidade renderCódigos',e);}
    try{fidRenderProgresso();fidRenderLoteAtual();}catch(e){console.error('[Admin] atualizarListaFidelidade fidRender',e);}
    fidApplyReadOnlyGuard();
    toast('✅ Lista de Fidelidade atualizada com sucesso!','sucesso');
  }catch(e){
    console.error('[Admin] atualizarListaFidelidade',e);
    toast('❌ Erro ao atualizar lista de Fidelidade.','erro');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='🔄 Atualizar Lista';}
  }
}
function atualizarScoresQualidade(){
  carregarMetricasQualidade();
}
function carregarMetricasQualidade(){
  const QG_KEY='itap_quality_guard';
  let dados={};
  try{ dados=JSON.parse(localStorage.getItem(QG_KEY)||'{}'); }catch(e){}

  // Timestamp
  const tsEl=document.getElementById('adm-qual-ts');
  if(tsEl) tsEl.textContent='Última leitura: '+(dados.ultima_atualizacao?new Date(dados.ultima_atualizacao).toLocaleString('pt-BR'):'Aguardando primeira visita ao site');

  // Scores Lighthouse (lê também da chave legada)
  try{
    const sc=JSON.parse(localStorage.getItem('qualidade_scores')||'{}');
    if(sc.performance){
      const v=sc.performance;
      const c=v>=90?'#4caf50':v>=50?'#ff9800':'#f44336';
      const el=document.getElementById('adm-score-perf');
      if(el){el.textContent=v;el.style.color=c;el.parentElement.style.borderColor=c;}
      const b=document.getElementById('adm-bar-perf');
      if(b){b.style.width=v+'%';b.style.background=c;}
    }
    if(sc.acessibilidade){
      const v=sc.acessibilidade;
      const c=v>=90?'#4caf50':v>=50?'#ff9800':'#f44336';
      const el=document.getElementById('adm-score-acess');
      if(el){el.textContent=v;el.style.color=c;el.parentElement.style.borderColor=c;}
      const b=document.getElementById('adm-bar-acess');
      if(b){b.style.width=v+'%';b.style.background=c;}
    }
    if(sc.boasPraticas){
      const v=sc.boasPraticas;
      const c=v>=90?'#4caf50':v>=50?'#ff9800':'#f44336';
      const el=document.getElementById('adm-score-bp');
      if(el){el.textContent=v;el.style.color=c;el.parentElement.style.borderColor=c;}
      const b=document.getElementById('adm-bar-bp');
      if(b){b.style.width=v+'%';b.style.background=c;}
    }
    if(sc.seo){
      const v=sc.seo;
      const c=v>=90?'#4caf50':v>=50?'#ff9800':'#f44336';
      const el=document.getElementById('adm-score-seo');
      if(el){el.textContent=v;el.style.color=c;el.parentElement.style.borderColor=c;}
      const b=document.getElementById('adm-bar-seo');
      if(b){b.style.width=v+'%';b.style.background=c;}
    }
  }catch(e){}

  // Core Web Vitals
  const v=dados.vitals||{};
  function setVitalCard(cardId,valId,statusId,val,unit,bom,ruim,label){
    const card=document.getElementById(cardId);
    const valEl=document.getElementById(valId);
    const stEl=document.getElementById(statusId);
    if(!card||!valEl||!stEl)return;
    if(val===undefined||val===null){return;}
    const isGood=val<=bom;
    const isBad=val>ruim;
    const color=isGood?'#4caf50':isBad?'#f44336':'#ff9800';
    const status=isGood?'✅ Bom':isBad?'❌ Ruim':'⚠️ Melhorar';
    card.style.borderLeftColor=color;
    valEl.style.color=color;
    valEl.textContent=label(val);
    stEl.textContent=status;
  }
  if(v.lcp) setVitalCard('adm-vital-lcp','adm-lcp-val','adm-lcp-status',v.lcp/1000,1,2.5,4,x=>x.toFixed(1)+'s');
  if(v.inp) setVitalCard('adm-vital-inp','adm-inp-val','adm-inp-status',v.inp,1,200,500,x=>x+'ms');
  if(v.cls!==undefined&&v.cls<=0.2) setVitalCard('adm-vital-cls','adm-cls-val','adm-cls-status',v.cls,1,0.1,0.25,x=>x.toFixed(3));

  // Service Worker
  const swBadge=document.getElementById('adm-sw-badge');
  const swDesc=document.getElementById('adm-sw-desc');
  if(swBadge&&swDesc){
    const sw=dados.sw_status||'desconhecido';
    if(sw==='ATIVO'){swBadge.textContent='✅ Service Worker Ativo — Site funciona offline';swBadge.style.background='#2e7d32';swDesc.textContent='Cache ativo. O site carrega instantaneamente na segunda visita.';}
    else if(sw==='ERRO'){swBadge.textContent='❌ Erro no Service Worker';swBadge.style.background='#c62828';swDesc.textContent=dados.sw_erro||'Verifique o arquivo sw.js';}
    else{swBadge.textContent='⚙️ Aguardando primeira visita ao site principal';swBadge.style.background='#3949ab';swDesc.textContent='Abra o site para ativar o monitoramento.';}
  }

  // Checklist
  const cl=dados.checklist||{};
  const checkEl=document.getElementById('adm-checklist');
  if(checkEl){
    const itens=[
      {key:'https',label:'HTTPS Ativo',desc:'Conexão segura e criptografada',critico:true},
      {key:'viewport',label:'Viewport Meta Tag',desc:'Responsivo para celular',critico:true},
      {key:'favicon',label:'Favicon',desc:'Ícone na aba do navegador',critico:false},
      {key:'manifest',label:'PWA Manifest',desc:'Instalável como app no celular',critico:false},
      {key:'open_graph',label:'Open Graph (WhatsApp/Facebook)',desc:'Preview bonito ao compartilhar',critico:false},
      {key:'schema',label:'Schema.org (SEO Estruturado)',desc:'Google entende o negócio',critico:false},
      {key:'canonical',label:'URL Canônica',desc:'Evita conteúdo duplicado no Google',critico:false},
      {key:'meta_description',label:'Meta Description',desc:'Descrição nos resultados do Google',critico:false},
      {key:'imagens_alt',label:'Imagens com Alt Text',desc:cl.imagens_sem_alt_count?cl.imagens_sem_alt_count+' imagem(ns) sem alt':'Acessibilidade e SEO',critico:false},
    ];
    if(Object.keys(cl).length===0){
      checkEl.innerHTML='<div style="background:#161b22;border-radius:10px;padding:12px 14px;color:#7986cb;font-size:13px">⚙️ Abra o site principal para carregar os dados do Quality Guard</div>';
    }else{
      checkEl.innerHTML=itens.map(item=>{
        const ok=cl[item.key];
        const border=ok?'#4caf50':item.critico?'#f44336':'#ff9800';
        const icon=ok?'✅':item.critico?'❌':'⚠️';
        const tag=ok?'<span style="background:#1b5e20;color:#69f0ae;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:auto">OK</span>':item.critico?'<span style="background:#b71c1c;color:#ef9a9a;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:auto">Crítico</span>':'<span style="background:#e65100;color:#ffcc80;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:auto">Atenção</span>';
        return `<div style="background:#161b22;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;border-left:4px solid ${border}">
          <span style="font-size:18px">${icon}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#e8eaf6">${item.label}</div>
            <div style="font-size:11px;color:#7986cb;margin-top:2px">${item.desc}</div>
          </div>${tag}</div>`;
      }).join('');
    }
  }

  // Erros JS
  const errosJS=dados.erros_js||[];
  const erros404=dados.recursos_404||[];
  const todos=[...errosJS,...erros404];
  const errosEl=document.getElementById('adm-erros');
  if(errosEl){
    if(todos.length===0){
      errosEl.innerHTML='<div style="background:#161b22;border-radius:10px;padding:12px 14px;color:#4caf50;font-size:13px">✅ Nenhum erro detectado nesta sessão</div>';
    }else{
      errosEl.innerHTML=todos.map(e=>{
        let tsStr='';
        try{tsStr=e.ts?new Date(e.ts).toLocaleTimeString('pt-BR'):'';}catch(ex){}
        return`<div style="background:#161b22;border-left:4px solid #f44336;border-radius:8px;padding:10px 14px;margin-bottom:6px;font-size:12px;color:#ef9a9a">${esc(e.tipo||'ERRO')}: ${esc(e.msg||e.url||'')} ${e.arquivo?'— '+esc(e.arquivo)+':'+(+e.linha||''):''}  <span style="color:#5c6bc0;font-size:10px">${tsStr}</span></div>`;
      }).join('');
    }
  }
}
function admQualSetInput(texto){
  const el=document.getElementById('adm-copiloto-input');
  if(el){el.value=texto;el.focus();}
}
function admQualEnviarCopiloto(){
  const el=document.getElementById('adm-copiloto-input');
  if(!el)return;
  const solicitacao=el.value.trim();
  if(!solicitacao){
    toast('⚠️ Por favor, descreva o que você quer melhorar ou corrigir.','erro');
    return;
  }

  // Coletar os 8 itens de dados estruturados
  const timestamp=new Date().toISOString();
  const url=window.location.href;
  const navegador=navigator.userAgent;
  const stateConfig=JSON.stringify(STATE.config||{},null,2);
  const errosConsole=window._errosConsole||[];
  const metricas=(()=>{
    try{
      return JSON.parse(localStorage.getItem('itap_quality_guard')||'{}');
    }catch(e){
      return {};
    }
  })();
  const githubWritePermitido=GH_WRITE_ALLOWED||false;

  // Formatar saída estruturada
  const dadosEstruturados=`
╔═══════════════════════════════════════════════════════════════╗
║  📊 SOLICITAÇÃO AO COPILOTO — FERRAMENTA QUALIDADE            ║
╚═══════════════════════════════════════════════════════════════╝

⏰ MARCA DE TEMPO
${timestamp}

📝 SOLICITAÇÃO DO USUÁRIO
${solicitacao}

🌐 URL ATUAL
${url}

🖥️ NAVEGADOR
${navegador}

⚙️ STATE.config (Configurações do Sistema)
${stateConfig}

❌ ERROS DO CONSOLE (Últimos capturados)
${errosConsole.length>0?JSON.stringify(errosConsole,null,2):'Nenhum erro capturado'}

📈 MÉTRICAS DE QUALIDADE (LocalStorage)
${JSON.stringify(metricas,null,2)}

🔐 GITHUB WRITE PERMITIDO
${githubWritePermitido?'✅ SIM':'❌ NÃO'}

╔═══════════════════════════════════════════════════════════════╗
║  FIM DOS DADOS ESTRUTURADOS                                   ║
╚═══════════════════════════════════════════════════════════════╝
`;

  // Exibir no console
  console.log('%c📊 DADOS ESTRUTURADOS PARA O COPILOTO','background:#3949ab;color:#fff;font-size:14px;font-weight:bold;padding:8px 16px;border-radius:4px');
  console.log(dadosEstruturados);

  copiarTextoSeguro(dadosEstruturados).then((ok)=>{
    if(ok){
      toast('✅ Solicitação enviada ao Copiloto com sucesso! Dados copiados para área de transferência.','sucesso');
      console.log('%c✅ Dados copiados para área de transferência!','background:#00c853;color:#fff;font-size:12px;padding:4px 8px;border-radius:3px');
      return;
    }
    toast('⚠️ Dados exibidos no console. Cole manualmente no Copiloto.','aviso');
  });

  // Limpar campo
  el.value='';
}

function renderDashboard(){
  const clientes=Object.values(STATE.clientes?.clientes||{});
  const ativos=clientes.filter(c=>!c.bloqueado).length;
  const bloqueados=clientes.filter(c=>c.bloqueado).length;
  const códigos=fidGetCodigos();
  const cupons=Object.keys(códigos).length;
  const encomendas=STATE.encomendas?.registros?.length||0;
  const promoAtiva=STATE.promo?.ativo?'SIM':'NÃO';
  const indicadores={
    'd-total':clientes.length,
    'd-ativos':ativos,
    'd-bloqueados':bloqueados,
    'd-cupons':cupons,
    'd-encomendas':encomendas,
    'd-promo':promoAtiva
  };
  Object.entries(indicadores).forEach(([id,value])=>{
    const el=document.getElementById(id);
    if(el)el.textContent=value;
  });
}
function preencherHome(){
  const cfg=STATE.config||{};
  document.getElementById('home-badge').value=cfg.heroBadge||'';
  document.getElementById('home-titulo').value=cfg.heroTitulo||'';
  document.getElementById('home-subtitulo').value=cfg.heroSubtitulo||'';
  document.getElementById('home-descricao').value=cfg.heroDescricao||'';
  document.getElementById('home-cta').value=cfg.heroCta||'Ver Cardápio Completo';
  document.getElementById('home-cta-whats').value=cfg.heroCtaWhats||'Pedir Agora pelo WhatsApp';
  document.getElementById('home-frases').value=(cfg.heroFrases||[]).join('\n');
  document.getElementById('home-strip').value=(cfg.stripSensorial||[]).join('\n');
  document.getElementById('home-cardápio-título').value=cfg.cardapioTitulo||'';
  document.getElementById('home-cardápio-sub').value=cfg.cardapioSubtitulo||'';
  document.getElementById('home-cardápio-badge').value=cfg.cardapioBadge||'';
  // Botões de navegação
  document.getElementById('home-nav-encomendas').value=cfg.navEncomendas||'ENCOMENDAS';
  document.getElementById('home-nav-promocao').value=cfg.navPromocao||'PROMOÇÃO';
  document.getElementById('home-nav-dicas').value=cfg.navDicas||'DICAS/DEPOIMENTOS';
  document.getElementById('home-nav-fidelidade').value=cfg.navFidelidade||'';
  // Campos Críticos da Página Inicial (Fase Final)
  const idxPag=cfg.indexPagina||{};
  document.getElementById('index-hero-h1-principal').value=idxPag.heroH1Principal||'';
  document.getElementById('index-hero-descricao-principal').value=idxPag.heroDescricaoPrincipal||'';
  document.getElementById('index-strip-sensorial-texto').value=idxPag.stripSensorialTexto||'';
  document.getElementById('index-cardapio-h2-titulo').value=idxPag.cardapioH2Titulo||'';
  document.getElementById('index-hero-badge-acai').value=idxPag.heroBadgeAcai||'';
  document.getElementById('index-horario-status-texto').value=idxPag.horarioStatusTexto||'';
  document.getElementById('index-quem-somos-titulo').value=idxPag.quemSomosTitulo||'';
  // Espelho dos quatro cards de encomendas
  document.getElementById('home-enc-titulo').value=idxPag.encomendasTitulo||'Encomendas & Complementos';
  document.getElementById('home-enc-subtitulo').value=idxPag.encomendasSubtitulo||'Peça com antecedência · Retirada na loja';
  const encCards = idxPag.encomendasCards || {};
  const defCards = {
    caixas: {titulo: 'Sorvete em Caixa', subtitulo: 'Veja tamanhos e escolha seu favorito', acao: 'Clique para abrir'},
    tortas: {titulo: 'Torta de Sorvete', subtitulo: 'Escolha a torta para o seu momento especial', acao: 'Clique para abrir'},
    picoles: {titulo: 'Picolés', subtitulo: 'Opções para festas, eventos e atacado', acao: 'Clique para abrir'},
    acrescimos: {titulo: 'Acréscimos', subtitulo: 'Monte sua combinação com coberturas e complementos', acao: 'Clique para abrir'}
  };
  ['caixas','tortas','picoles','acrescimos'].forEach(k => {
    const cData = encCards[k] || defCards[k];
    document.getElementById(`home-enc-${k}-titulo`).value = cData.titulo || '';
    document.getElementById(`home-enc-${k}-subtitulo`).value = cData.subtitulo || '';
    document.getElementById(`home-enc-${k}-acao`).value = cData.acao || '';
  });
  // Carrinho para Eventos (IDs: carrinho-label1, carrinho-label2)
  document.getElementById('home-carrinho-label1').value=cfg.carrinhoLabel1||'🛒 Carrinho para Eventos';
  document.getElementById('home-carrinho-label2').value=cfg.carrinhoLabel2||'Toque para consultar';
  document.getElementById('home-carrinho-whats').value=cfg.carrinhoWhatsMsg||'Olá! Gostaria de consultar a disponibilidade do carrinho para eventos.';
  renderListaBannersCarrossel();
}
async function salvarHome(){
  // Validação antes de salvar (padrão iFood/Shopify: guardar com feedback inline)
  const titulo=document.getElementById('home-titulo').value.trim();
  if(!titulo){toast('⚠️ O Título principal (H1) não pode estar vazio.','erro');document.getElementById('home-titulo').focus();return;}
  const cfg=STATE.config||{};
  cfg.heroBadge=document.getElementById('home-badge').value.trim();
  cfg.heroTitulo=document.getElementById('home-titulo').value.trim();
  cfg.heroSubtitulo=document.getElementById('home-subtitulo').value.trim();
  cfg.heroDescricao=document.getElementById('home-descricao').value.trim();
  cfg.heroCta=document.getElementById('home-cta').value.trim();
  cfg.heroCtaWhats=document.getElementById('home-cta-whats').value.trim();
  cfg.heroFrases=document.getElementById('home-frases').value.split('\n').map(l=>l.trim()).filter(Boolean);
  cfg.stripSensorial=document.getElementById('home-strip').value.split('\n').map(l=>l.trim()).filter(Boolean);
  cfg.cardapioTitulo=document.getElementById('home-cardápio-título').value.trim();
  cfg.cardapioSubtitulo=document.getElementById('home-cardápio-sub').value.trim();
  cfg.cardapioBadge=document.getElementById('home-cardápio-badge').value.trim();
  // Botões de navegação
  cfg.navEncomendas=document.getElementById('home-nav-encomendas').value.trim()||'ENCOMENDAS';
  cfg.navPromocao=document.getElementById('home-nav-promocao').value.trim()||'PROMOÇÃO';
  cfg.navDicas=document.getElementById('home-nav-dicas').value.trim()||'DICAS/DEPOIMENTOS';
  cfg.navFidelidade=document.getElementById('home-nav-fidelidade').value.trim()||'';
  // Campos Críticos da Página Inicial (Fase Final)
  if(!cfg.indexPagina)cfg.indexPagina={};
  cfg.indexPagina.heroH1Principal=document.getElementById('index-hero-h1-principal').value.trim();
  cfg.indexPagina.heroDescricaoPrincipal=document.getElementById('index-hero-descricao-principal').value.trim();
  cfg.indexPagina.stripSensorialTexto=document.getElementById('index-strip-sensorial-texto').value.trim();
  cfg.indexPagina.cardapioH2Titulo=document.getElementById('index-cardapio-h2-titulo').value.trim();
  cfg.indexPagina.heroBadgeAcai=document.getElementById('index-hero-badge-acai').value.trim();
  cfg.indexPagina.horarioStatusTexto=document.getElementById('index-horario-status-texto').value.trim();
  cfg.indexPagina.quemSomosTitulo=document.getElementById('index-quem-somos-titulo').value.trim();
  // Espelho dos quatro cards de encomendas
  cfg.indexPagina.encomendasTitulo=document.getElementById('home-enc-titulo').value.trim();
  cfg.indexPagina.encomendasSubtitulo=document.getElementById('home-enc-subtitulo').value.trim();
  cfg.indexPagina.encomendasCards = {
    caixas: {
      titulo: document.getElementById('home-enc-caixas-titulo').value.trim(),
      subtitulo: document.getElementById('home-enc-caixas-subtitulo').value.trim(),
      acao: document.getElementById('home-enc-caixas-acao').value.trim()
    },
    tortas: {
      titulo: document.getElementById('home-enc-tortas-titulo').value.trim(),
      subtitulo: document.getElementById('home-enc-tortas-subtitulo').value.trim(),
      acao: document.getElementById('home-enc-tortas-acao').value.trim()
    },
    picoles: {
      titulo: document.getElementById('home-enc-picoles-titulo').value.trim(),
      subtitulo: document.getElementById('home-enc-picoles-subtitulo').value.trim(),
      acao: document.getElementById('home-enc-picoles-acao').value.trim()
    },
    acrescimos: {
      titulo: document.getElementById('home-enc-acrescimos-titulo').value.trim(),
      subtitulo: document.getElementById('home-enc-acrescimos-subtitulo').value.trim(),
      acao: document.getElementById('home-enc-acrescimos-acao').value.trim()
    }
  };
  // Carrinho para Eventos (IDs: carrinho-label1, carrinho-label2)
  cfg.carrinhoLabel1=document.getElementById('home-carrinho-label1').value.trim()||'🛒 Carrinho para Eventos';
  cfg.carrinhoLabel2=document.getElementById('home-carrinho-label2').value.trim()||'Toque para consultar';
  cfg.carrinhoWhatsMsg=document.getElementById('home-carrinho-whats').value.trim();
  STATE.config=cfg;
  const ok = await salvarArquivo(PATHS.config,cfg,'configSha','Admin: atualizar textos da Home');
}
function renderPreços(){
  const p=STATE.produtos;
  if(!p){document.getElementById('preços-body').innerHTML='<p style="color:#c62828">Erro ao carregar preços.</p>';return;}
  let html='';

  // ---- INSTRUCAO GERAL ----
  html+='<div style="background:#e8f5e9;border-left:4px solid #2e7d32;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:.82rem">';
  html+='<strong>💰 Como preencher preços:</strong> Use ponto (.) como separador decimal. Ex: <code>12.50</code>. ';
  html+='Salvar atualiza o site imediatamente. Mínimo: R$ 0,00. Não use vírgula.';
  html+='</div>';

  // Normalizar chaves do JSON (inglês→português)
  const _sv_raw=p.sorvetes?.precos||p.sorvetes?.preços||{};
  if(!p.sorvetes)p.sorvetes={};
  p.sorvetes.preços={};
  const _svMap={casquinha_copo:'Casquinha / Copo',casquinha_copão:'Casquinha / Copo',copo_recheado:'Copo Recheado',copão_recheado:'Copo Recheado',cascão:'Cascão',cestinha:'Cestinha Recheada'};
  for(const[k,v]of Object.entries(_sv_raw)){p.sorvetes.preços[k]=v;}
  const _pic_raw=p['picoles']||p.picolés||{};
  p.picolés={};
  for(const[k,v]of Object.entries(_pic_raw)){p.picolés[k]={nome:v.nome||k,preço_varejo:v.preco_varejo??v.preço_varejo??0,preço_atacado:v.preco_atacado??v.preço_atacado??0,sabores:v.sabores||[],estoque:v.estoque??200};}
  const _ac_raw=p[String.fromCharCode(97,99,97,105)]||p.açaí||{}; // 'acai' em ASCII para evitar conversão
  p.açaí=_ac_raw.copos||_ac_raw;
  const _acp_raw=p[String.fromCharCode(97,99,97,105)+'_promocao']||p.açaí_promoção||[]; // 'acai_promocao'
  p.açaí_promoção=Array.isArray(_acp_raw)?_acp_raw:[];
  const sv=p.sorvetes?.preços||{};
  html+='<div class="seção-título">🍦 Sorvetes — Preço por Quantidade de Bolas</div>';
  html+='<div style="background:#fff3e0;border-left:3px solid #e65100;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:.78rem">';
  html+='⚠️ Preço varia por tipo (Casquinha/Copo, Copo Recheado, Cascão, Cestinha) e quantidade de bolas. Alterar aqui muda o cardápio do site imediatamente.';
  html+='</div>';
  html+='<div class="preço-grid">';
  for(const[tipo,bolas]of Object.entries(sv)){if(typeof bolas==='object'){for(const[bola,preço]of Object.entries(bolas)){if(typeof preço==='number'){const id=`preço_sorvete_${tipo}_${bola}`.replace(/[\s\W]/g,'_');const label=(_svMap[tipo]||tipo)+' — '+bola;html+=`<div class="preço-item"><label>${label}</label><div class="preço-inp"><span>R$</span><input type="number" id="${id}" value="${preço}" min="0" step="0.5" title="Preço do sorvete ${tipo} com ${bola}"/></div><div class="hint">Ex: 8.50 — use ponto, não vírgula</div></div>`;}}}}
  html+='</div>';

  const mk=p.milkshake||{};
  html+='<div class="seção-título">🥤 Milkshake — Preço por Categoria e Tamanho</div>';
  html+='<div style="background:#fff3e0;border-left:3px solid #e65100;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:.78rem">';
  html+='🥤 Cada categoria (Simples, Especial) tem tamanhos (P, M, G). Alterar aqui muda o cardápio imediatamente.';
  html+='</div>';
  html+='<div class="preço-grid">';
  for(const[cat,itens]of Object.entries(mk)){if(typeof itens==='object'&&!Array.isArray(itens)){for(const[tam,preço]of Object.entries(itens)){if(typeof preço==='number'){const id=`preço_milk_${cat}_${tam}`.replace(/[\s\W]/g,'_');html+=`<div class="preço-item"><label>${cat} — ${tam}</label><div class="preço-inp"><span>R$</span><input type="number" id="${id}" value="${preço}" min="0" step="0.5" title="Milkshake ${cat} tamanho ${tam}"/></div><div class="hint">Ex: 15.00</div></div>`;}}}else if(typeof itens==='number'){const id=`preço_milk_${cat}`.replace(/[\s\W]/g,'_');html+=`<div class="preço-item"><label>Milkshake — ${cat}</label><div class="preço-inp"><span>R$</span><input type="number" id="${id}" value="${itens}" min="0" step="0.5"/></div><div class="hint">Ex: 15.00</div></div>`;}}
  html+='</div>';

  const tc=p.tacas||{};
  html+='<div class="seção-título">🍨 Taças — Preço por Categoria e Tamanho</div>';
  html+='<div style="background:#fff3e0;border-left:3px solid #e65100;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:.78rem">';
  html+='🍨 Taças Tradicionais e Taças Sujas. Cada uma tem tamanhos com preços independentes.';
  html+='</div>';
  html+='<div class="preço-grid">';
  for(const[cat,itens]of Object.entries(tc)){if(typeof itens==='object'){for(const[nome,preço]of Object.entries(itens)){if(typeof preço==='number'){const id=`preço_taca_${cat}_${nome}`.replace(/[\s\W]/g,'_');html+=`<div class="preço-item"><label>${cat} — ${nome}</label><div class="preço-inp"><span>R$</span><input type="number" id="${id}" value="${preço}" min="0" step="0.5" title="Taça ${cat} tamanho ${nome}"/></div><div class="hint">Ex: 18.00</div></div>`;}}}  }
  html+='</div>';

  const ac=p.açaí||{};
  html+='<div class="seção-título">🫐 Açaí — Preço por Tamanho (Copos)</div>';
  html+='<div style="background:#fff3e0;border-left:3px solid #e65100;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:.78rem">';
  html+='🫐 Preços dos copos de açaí tipo artesanal. Alterar aqui muda o cardápio imediatamente.';
  html+='</div>';
  html+='<div class="preço-grid">';
  for(const[tam,preço]of Object.entries(ac)){if(typeof preço==='number'){const id=`preço_açaí_${tam}`.replace(/[\s\W]/g,'_');html+=`<div class="preço-item"><label>Açaí — ${tam}</label><div class="preço-inp"><span>R$</span><input type="number" id="${id}" value="${preço}" min="0" step="0.5" title="Açaí tamanho ${tam}"/></div><div class="hint">Ex: 15.00</div></div>`;}}
  const acp=p.açaí_promoção||[];
  if(Array.isArray(acp)&&acp.length>0){
    html+='<div class="seção-título">🔥 Açaí em Promoção — Preços</div>';
    html+='<div class="preço-grid">';
    acp.forEach((item,i)=>{
      const id=`preço_açaíp_${i}`;
      html+=`<div class="preço-item"><label>${item.nome||('Promoção '+(i+1))}</label><div class="preço-inp"><span>R$</span><input type="number" id="${id}" value="${item.preco||item.preço||0}" min="0" step="0.5"/></div><div class="hint">${item.desc||''}</div></div>`;
    });
    html+='</div>';
  }
  html+='</div>';
  const pic=p.picolés||{};
  html+='<div class="seção-título">🍭 Picolés — Varejo (Cardápio) e Atacado (Encomendas)</div>';
  html+='<div style="background:#fff3e0;border-left:4px solid #e65100;padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:.82rem">🍭 <strong>Varejo</strong> = preço unitário no cardápio da loja. <strong>Atacado</strong> = preço por unidade em encomendas (min. 100 un.). Os dois campos são independentes.</div>';
  html+='<div class="preço-grid">';
  for(const[cat,itens]of Object.entries(pic)){
    if(typeof itens==='object'){
      const nomecat=itens.nome||cat;
      const varejo=itens.preço_varejo!==undefined?itens.preço_varejo:(itens.preço||0);
      const atacado=itens.preço_atacado!==undefined?itens.preço_atacado:0;
      const idV=`preço_pic_${cat}_varejo`.replace(/[\s\W]/g,'_');
      const idA=`preço_pic_${cat}_atacado`.replace(/[\s\W]/g,'_');
      html+=`<div class="preço-item" style="grid-column:span 1"><label>${nomecat} — Varejo</label><div class="preço-inp"><span>R$</span><input type="number" id="${idV}" value="${varejo}" min="0" step="0.1"/></div><div class="hint">Preço no cardápio da loja</div></div>`;
      html+=`<div class="preço-item" style="grid-column:span 1"><label>${nomecat} — Atacado</label><div class="preço-inp"><span>R$</span><input type="number" id="${idA}" value="${atacado}" min="0" step="0.1"/></div><div class="hint">Preço em encomendas (min. 100)</div></div>`;
    }
  }
  html+='</div>';
  const cx=p.caixas_viagem||{};
  html+='<div class="seção-título">Caixas de Viagem</div><div class="preço-grid">';
  for(const[nome,preço]of Object.entries(cx)){if(typeof preço==='number'){const id=`preço_cx_${nome}`.replace(/[\s\W]/g,'_');html+=`<div class="preço-item"><label>${nome}</label><div class="preço-inp"><span>R$</span><input type="number" id="${id}" value="${preço}" min="0" step="0.5"/></div></div>`;}}
  html+='</div>';
  const iso=p.isopores_viagem||{};
  html+='<div class="seção-título">Isopores de Viagem</div><div class="preço-grid">';
  for(const[nome,preço]of Object.entries(iso)){if(typeof preço==='number'){const id=`preço_iso_${nome}`.replace(/[\s\W]/g,'_');html+=`<div class="preço-item"><label>${nome}</label><div class="preço-inp"><span>R$</span><input type="number" id="${id}" value="${preço}" min="0" step="0.5"/></div></div>`;}}
  html+='</div>';
  const sob=p.sobremesas||{};
  html+='<div class="seção-título">Sobremesas Geladas</div><div class="preço-grid">';
  for(const[nome,preço]of Object.entries(sob)){if(typeof preço==='number'){const id=`preço_sob_${nome}`.replace(/[\s\W]/g,'_');html+=`<div class="preço-item"><label>${nome}</label><div class="preço-inp"><span>R$</span><input type="number" id="${id}" value="${preço}" min="0" step="0.5"/></div></div>`;}}
  html+='</div>';
  document.getElementById('preços-body').innerHTML=html;
}
async function salvarPreços(){
  const p=STATE.produtos;
  if(!p){toast('Produtos não carregados.','erro');return;}
  const sv=p.sorvetes?.preços||{};
  for(const[tipo,bolas]of Object.entries(sv)){if(typeof bolas==='object'){for(const bola of Object.keys(bolas)){if(typeof bolas[bola]==='number'){const id=`preço_sorvete_${tipo}_${bola}`.replace(/[\s\W]/g,'_');const el=document.getElementById(id);if(el){p.sorvetes.preços[tipo][bola]=parseFloat(el.value)||0;if(!p.sorvetes.precos)p.sorvetes.precos={};if(!p.sorvetes.precos[tipo])p.sorvetes.precos[tipo]={};p.sorvetes.precos[tipo][bola]=parseFloat(el.value)||0;}}}}}
  const mk=p.milkshake||{};
  for(const[cat,itens]of Object.entries(mk)){if(typeof itens==='object'&&!Array.isArray(itens)){for(const tam of Object.keys(itens)){if(typeof itens[tam]==='number'){const id=`preço_milk_${cat}_${tam}`.replace(/[\s\W]/g,'_');const el=document.getElementById(id);if(el)p.milkshake[cat][tam]=parseFloat(el.value)||0;}}}else if(typeof itens==='number'){const id=`preço_milk_${cat}`.replace(/[\s\W]/g,'_');const el=document.getElementById(id);if(el)p.milkshake[cat]=parseFloat(el.value)||0;}}
  const tc=p.tacas||{};
  for(const[cat,itens]of Object.entries(tc)){if(typeof itens==='object'){for(const nome of Object.keys(itens)){if(typeof itens[nome]==='number'){const id=`preço_taca_${cat}_${nome}`.replace(/[\s\W]/g,'_');const el=document.getElementById(id);if(el)p.tacas[cat][nome]=parseFloat(el.value)||0;}}}}
  const ac=p.açaí||{};
  // Preservar complementos do açaí ao atualizar copos
  const _açaíExistente=p['açaí']||{};
  const _açaíCompsExist=_açaíExistente.complementos||{};
  const _acaiKey=String.fromCharCode(97,99,97,105); // 'acai'
  if(!p[_acaiKey])p[_acaiKey]={copos:{},complementos:{}};
  if(!p[_acaiKey].copos)p[_acaiKey].copos={};
  if(!p[_acaiKey].complementos)p[_acaiKey].complementos=_açaíCompsExist;
  for(const tam of Object.keys(ac)){if(typeof ac[tam]==='number'){const id=`preço_açaí_${tam}`.replace(/[\s\W]/g,'_');const el=document.getElementById(id);if(el){p[_acaiKey].copos[tam]=parseFloat(el.value)||0;}}}
  // Reconstruir açaí (com acento) como estrutura nested para o render do site
  p.açaí={copos:p[_acaiKey].copos,complementos:p[_acaiKey].complementos};
  const acp=p.açaí_promoção||[];
  if(Array.isArray(acp)){acp.forEach((item,i)=>{const id=`preço_açaíp_${i}`;const el=document.getElementById(id);if(el){const v=parseFloat(el.value)||0;acp[i].preco=v;acp[i].preço=v;}});p.açaí_promoção=acp;p[_acaiKey+'_promocao']=acp;}
  const pic=p.picolés||{};
  if(!p['picoles'])p['picoles']={};
  for(const[cat,itens]of Object.entries(pic)){
    if(typeof itens==='object'){
      const idV=`preço_pic_${cat}_varejo`.replace(/[\s\W]/g,'_');
      const idA=`preço_pic_${cat}_atacado`.replace(/[\s\W]/g,'_');
      const elV=document.getElementById(idV);
      const elA=document.getElementById(idA);
      const _picolesKey='picoles'; // chave do JSON em inglês
      if(elV){p.picolés[cat].preço_varejo=parseFloat(elV.value)||0;if(!p[_picolesKey][cat])p[_picolesKey][cat]={};p[_picolesKey][cat].preco_varejo=parseFloat(elV.value)||0;}
      if(elA){p.picolés[cat].preço_atacado=parseFloat(elA.value)||0;if(!p[_picolesKey][cat])p[_picolesKey][cat]={};p[_picolesKey][cat].preco_atacado=parseFloat(elA.value)||0;}
    }
  }
  const cx=p.caixas_viagem||{};
  for(const nome of Object.keys(cx)){if(typeof cx[nome]==='number'){const id=`preço_cx_${nome}`.replace(/[\s\W]/g,'_');const el=document.getElementById(id);if(el)p.caixas_viagem[nome]=parseFloat(el.value)||0;}}
  const iso=p.isopores_viagem||{};
  for(const nome of Object.keys(iso)){if(typeof iso[nome]==='number'){const id=`preço_iso_${nome}`.replace(/[\s\W]/g,'_');const el=document.getElementById(id);if(el)p.isopores_viagem[nome]=parseFloat(el.value)||0;}}
  const sob=p.sobremesas||{};
  for(const nome of Object.keys(sob)){if(typeof sob[nome]==='number'){const id=`preço_sob_${nome}`.replace(/[\s\W]/g,'_');const el=document.getElementById(id);if(el)p.sobremesas[nome]=parseFloat(el.value)||0;}}
  STATE.produtos=p;
  const ok = await salvarArquivo(PATHS.produtos,p,'produtosSha','Admin: atualizar preços do cardápio');
}
function preencherPromoção(){
  const pr=STATE.promo||{};
  const tituloPromo=pr.titulo??pr.título??'';
  const descricaoPromo=pr.descricao??pr.descrição??'';
  document.getElementById('promo-ativo').checked=!!pr.ativo;
  // Campos do header da página promoção.html
  const pht=document.getElementById('promo-header-titulo'); if(pht) pht.value=pr.headerTitulo||'';
  const pbf=document.getElementById('promo-banner-frase'); if(pbf) pbf.value=pr.bannerFrase||'';
  const pbg=document.getElementById('promo-badge'); if(pbg) pbg.value=pr.badge||'';
  // Campos do card principal
  document.getElementById('promo-título').value=tituloPromo;
  document.getElementById('promo-descrição').value=descricaoPromo;
  document.getElementById('promo-btn').value=pr.btnTexto||'';
  document.getElementById('promo-link').value=pr.link||'';
  document.getElementById('promo-datafim').value=pr.dataFim||'';
  document.getElementById('promo-fab').value=pr.fabLabel||'';

  // Novos campos Fase 3.2 - promocaoPagina
  const cfg=STATE.config||{};
  const pp=cfg.promocaoPagina||{};
  const promoBtnPart=document.getElementById('promocao-btn-participar');
  if(promoBtnPart) promoBtnPart.value=pp.btnParticipar||'🎁 Quero Participar do Sorteio';
  const promoBtnCard=document.getElementById('promocao-btn-cardapio');
  if(promoBtnCard) promoBtnCard.value=pp.btnCardapio||'🍦 Ver Cardápio';
  const promoBtnFid=document.getElementById('promocao-btn-fidelidade');
  if(promoBtnFid) promoBtnFid.value=pp.btnFidelidade||'⭐ Fidelidade';
  const promoBanner=document.getElementById('promocao-banner-texto');
  if(promoBanner) promoBanner.value=pp.bannerTexto||'🎉 Sorteios Mensais todo dia 01 🎉';

  // Novos campos Fase 3.2 - SEO
  const seoPg=cfg.seoPaginas||{};
  const promoSeoTit=document.getElementById('cfg-seo-promocao-titulo');
  if(promoSeoTit) promoSeoTit.value=seoPg.promocao?.titulo||'';
  const promoSeoDesc=document.getElementById('cfg-seo-promocao-descricao');
  if(promoSeoDesc) promoSeoDesc.value=seoPg.promocao?.descricao||'';
}
// Upload de imagem binária para o GitHub (converte Blob para base64)
async function ghPutImagem(path, blob, msg) {
  try {
    // Converter Blob para base64
    const arrayBuf = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const base64 = btoa(bin);
    // Buscar SHA atual do arquivo (se já existir)
    let sha = null;
    try {
      const r = await fetch(GH_API + path, { headers: getAuthHeaders() });
      if (r.ok) { const d = await r.json(); sha = d.sha; }
    } catch(e) {}
    const body = { message: msg, content: base64 };
    if (sha) body.sha = sha;
    const r = await fetch(GH_API + path, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
    const d = await r.json();
    return { ok: true, url: d.content.download_url };
  } catch(e) {
    return { ok: false, erro: e.message };
  }
}

// Variável global para guardar o blob da imagem da promoção
let _promoBlobPendente = null;
let _promoImgInfo = null;

function processarUploadPromo(file) {
  const erroEl = document.getElementById('promo-img-erro');
  const previewWrap = document.getElementById('promo-img-preview-wrap');
  const previewImg = document.getElementById('promo-img-preview');
  const infoEl = document.getElementById('promo-img-info');
  if (erroEl) erroEl.textContent = '';
  if (!file) return;
  processarImagem(file, 800, 600, 0.82, (info, erro) => {
    if (erro) {
      if (erroEl) { erroEl.textContent = '❌ ' + erro; erroEl.classList.add('ativo'); }
      return;
    }
    // Guardar blob para upload ao salvar
    _promoBlobPendente = info.blob;
    _promoImgInfo = info;
    // Mostrar preview
    const url = URL.createObjectURL(info.blob);
    if (previewImg) previewImg.src = url;
    if (previewWrap) previewWrap.classList.add('ativo');
    if (infoEl) infoEl.innerHTML = `<span style="color:#2e7d32">✅ WebP convertido</span> <span>${info.width}×${info.height}px</span> <span>${info.tamanhoKB}KB</span>`;
    if (erroEl) erroEl.classList.remove('ativo');
    toast('Imagem processada! Clique em Salvar Promoção para publicar.', 'info');
  });
}

// ── BANNER CARROSSEL ────────────────────────────────────────────────────────
let _bannerBlobPendente = null;
let _bannerInfoPendente = null;

function processarUploadBanner(file) {
  const erroEl = document.getElementById('home-banner-erro');
  const previewWrap = document.getElementById('home-banner-preview-wrap');
  const previewImg = document.getElementById('home-banner-preview');
  const infoEl = document.getElementById('home-banner-info');
  if (erroEl) erroEl.textContent = '';
  if (!file) return;
  processarImagem(file, 1536, 1024, 0.82, (info, erro) => {
    if (erro) {
      if (erroEl) { erroEl.textContent = '❌ ' + erro; erroEl.classList.add('ativo'); }
      return;
    }
    _bannerBlobPendente = info.blob;
    _bannerInfoPendente = info;
    const url = URL.createObjectURL(info.blob);
    if (previewImg) previewImg.src = url;
    if (previewWrap) previewWrap.classList.add('ativo');
    if (infoEl) infoEl.innerHTML = `<span style="color:#2e7d32">✅ WebP convertido</span> <span>${info.width}×${info.height}px</span> <span>${info.tamanhoKB}KB</span>`;
    if (erroEl) erroEl.classList.remove('ativo');
    toast('Imagem processada! Clique em Adicionar ao Carrossel para publicar.', 'info');
  });
}

async function adicionarBannerCarrossel() {
  if (!_bannerBlobPendente) {
    toast('Selecione uma imagem primeiro.', 'erro');
    return;
  }
  const altText = document.getElementById('home-banner-alt')?.value.trim() || 'Banner Sorveteria Itapolitana Cajuru';
  // Gerar nome sequencial baseado no timestamp
  const ts = Date.now();
  const nomeArq = `images/carrossel/banner-${ts}.webp`;
  mostrarLoading('Enviando banner para o carrossel...');
  try {
    const result = await ghPutImagem(nomeArq, _bannerBlobPendente, 'Admin: adicionar banner ao carrossel');
    ocultarLoading();
    if (result.ok) {
      // Adicionar ao carrossel.html via atualização do JSON de banners
      if (!STATE.config.banners) STATE.config.banners = [];
      STATE.config.banners.push({ src: nomeArq, alt: altText, ts });
      const ok = await salvarArquivo(PATHS.config, STATE.config, 'configSha', 'Admin: adicionar banner ao carrossel');
      if (ok) {
        renderListaBannersCarrossel();
        toast('✅ Banner adicionado ao carrossel!', 'ok');
      }
      _bannerBlobPendente = null;
      _bannerInfoPendente = null;
      const previewWrap = document.getElementById('home-banner-preview-wrap');
      if (previewWrap) previewWrap.classList.remove('ativo');
      const altInput = document.getElementById('home-banner-alt');
      if (altInput) altInput.value = '';
      const fileInput = document.getElementById('home-banner-input');
      if (fileInput) fileInput.value = '';
    } else {
      toast('❌ Erro ao enviar banner: ' + (result.erro || 'falha'), 'erro');
    }
  } catch(e) {
    ocultarLoading();
    toast('❌ Erro ao enviar banner: ' + e.message, 'erro');
  }
}

function obterBannersCarrossel(){
  const c = STATE.config || {};
  if (!Array.isArray(c.banners)) c.banners = [];
  c.banners = c.banners
    .filter(b => b && typeof b === 'object' && String(b.src || '').trim())
    .map((b, i) => ({
      src: String(b.src || '').trim(),
      alt: String(b.alt || `Banner ${i + 1} — Sorveteria Itapolitana Cajuru`).trim(),
      ts: b.ts || Date.now()
    }));
  return c.banners;
}

function renderListaBannersCarrossel(){
  const wrap = document.getElementById('home-banners-lista');
  if (!wrap) return;
  const banners = obterBannersCarrossel();
  if (!banners.length) {
    wrap.innerHTML = '<div style="padding:12px;border:1px dashed #cfd8dc;border-radius:10px;background:#fafafa;color:#546e7a;font-size:.82rem">Nenhum banner em <code>config.banners[]</code> ainda.</div>';
    return;
  }
  wrap.innerHTML = banners.map((b, i) => {
    const srcEsc = esc(b.src);
    const altEsc = esc(b.alt || '');
    const srcPreview = srcEsc.startsWith('http') ? srcEsc : ('https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/' + srcEsc);
    return `<div style="display:grid;grid-template-columns:86px 1fr auto;gap:10px;align-items:center;padding:10px;border:1px solid #eceff1;border-radius:10px;background:#fff">
      <img src="${srcPreview}" alt="${altEsc}" style="width:86px;height:58px;object-fit:cover;border-radius:8px;border:1px solid #e0e0e0" loading="lazy" decoding="async" onerror="this.style.opacity=.35"/>
      <div>
        <div style="font-size:.75rem;color:#546e7a;margin-bottom:4px">#${i + 1} · <code>${srcEsc}</code></div>
        <input type="text" value="${altEsc}" maxlength="120" onchange="atualizarAltBannerCarrossel(${i}, this.value)" style="width:100%;padding:8px 10px;border:1px solid #cfd8dc;border-radius:8px" placeholder="Texto alternativo (alt)"/>
      </div>
      <div style="display:grid;gap:6px">
        <button class="btn btn-cinza" style="padding:6px 10px" onclick="moverBannerCarrossel(${i},-1)" ${i===0?'disabled':''}>↑</button>
        <button class="btn btn-cinza" style="padding:6px 10px" onclick="moverBannerCarrossel(${i},1)" ${i===banners.length-1?'disabled':''}>↓</button>
        <button class="btn btn-excluir" style="padding:6px 10px" onclick="removerBannerCarrossel(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function atualizarAltBannerCarrossel(idx, valor){
  const banners = obterBannersCarrossel();
  if (!banners[idx]) return;
  banners[idx].alt = String(valor || '').trim();
}

function moverBannerCarrossel(idx, dir){
  const banners = obterBannersCarrossel();
  const novoIdx = idx + dir;
  if (!banners[idx] || !banners[novoIdx]) return;
  const tmp = banners[idx];
  banners[idx] = banners[novoIdx];
  banners[novoIdx] = tmp;
  renderListaBannersCarrossel();
}

function removerBannerCarrossel(idx){
  const banners = obterBannersCarrossel();
  if (!banners[idx]) return;
  banners.splice(idx, 1);
  renderListaBannersCarrossel();
}

async function salvarBannersCarrossel(){
  const c = STATE.config || {};
  c.banners = obterBannersCarrossel();
  STATE.config = c;
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar lista de banners do carrossel');
  if (ok) {
    renderListaBannersCarrossel();
    toast('✅ Lista de banners salva com sucesso!', 'ok');
  }
}

async function salvarPromoção(){
  // Validação: título obrigatório quando promoção ativa
  const ativo=document.getElementById('promo-ativo').checked;
  const titulo=document.getElementById('promo-título').value.trim();
  if(ativo&&!titulo){toast('⚠️ Preencha o Título da promoção antes de ativá-la no site.','erro');document.getElementById('promo-título').focus();return;}
  const pr=STATE.promo||{};
  pr.ativo=document.getElementById('promo-ativo').checked;
  // Campos do header da página promoção.html
  const pht=document.getElementById('promo-header-titulo'); if(pht) pr.headerTitulo=pht.value.trim();
  const pbf=document.getElementById('promo-banner-frase'); if(pbf) pr.bannerFrase=pbf.value.trim();
  const pbg=document.getElementById('promo-badge'); if(pbg) pr.badge=pbg.value.trim();
  // Campos do card principal
  const tituloPromo=document.getElementById('promo-título').value.trim();
  const descricaoPromo=document.getElementById('promo-descrição').value.trim();
  pr.titulo=tituloPromo;
  pr.descricao=descricaoPromo;
  delete pr.título;
  delete pr.descrição;
  pr.btnTexto=document.getElementById('promo-btn').value.trim();
  pr.link=document.getElementById('promo-link').value.trim();
  pr.dataFim=document.getElementById('promo-datafim').value;
  pr.fabLabel=document.getElementById('promo-fab').value.trim();
  STATE.promo=pr;
  // Upload de imagem se houver blob pendente
  if (_promoBlobPendente) {
    mostrarLoading('Enviando imagem...');
    const imgPath = 'images/banner-promo.webp';
    const imgResult = await ghPutImagem(imgPath, _promoBlobPendente, 'Admin: atualizar banner da promoção');
    ocultarLoading();
    if (imgResult.ok) {
      pr.fotoUrl = 'images/banner-promo.webp';
      STATE.promo = pr;
      _promoBlobPendente = null;
      _promoImgInfo = null;
      toast('Imagem enviada com sucesso!', 'sucesso');
    } else {
      toast('Erro ao enviar imagem: ' + imgResult.erro, 'erro');
      // Continua salvando o JSON mesmo sem a imagem
    }
  }
  const okPromo = await salvarArquivo(PATHS.promo,pr,'promoSha','Admin: atualizar promoção');
  if(!okPromo)return;
  const cfg=STATE.config||{};
  cfg.promocaoAtiva=Boolean(pr.ativo);
  cfg.promoH1=tituloPromo;
  cfg.promoTituloEl=tituloPromo;
  cfg.promoDescEl=descricaoPromo;
  cfg.promoBadge=pr.badge||'';
  cfg.promoFabLabel=pr.fabLabel||cfg.promoFabLabel||'';

  // Novos campos Fase 3.2 - promocaoPagina
  cfg.promocaoPagina = cfg.promocaoPagina || {};
  const promoBtnPart = document.getElementById('promocao-btn-participar');
  if (promoBtnPart) cfg.promocaoPagina.btnParticipar = promoBtnPart.value.trim();
  const promoBtnCard = document.getElementById('promocao-btn-cardapio');
  if (promoBtnCard) cfg.promocaoPagina.btnCardapio = promoBtnCard.value.trim();
  const promoBtnFid = document.getElementById('promocao-btn-fidelidade');
  if (promoBtnFid) cfg.promocaoPagina.btnFidelidade = promoBtnFid.value.trim();
  const promoBanner = document.getElementById('promocao-banner-texto');
  if (promoBanner) cfg.promocaoPagina.bannerTexto = promoBanner.value.trim();

  // Novos campos Fase 3.2 - SEO
  cfg.seoPaginas = cfg.seoPaginas || {};
  cfg.seoPaginas.promocao = cfg.seoPaginas.promocao || {};
  const promoSeoTit = document.getElementById('cfg-seo-promocao-titulo');
  if (promoSeoTit) cfg.seoPaginas.promocao.titulo = promoSeoTit.value.trim();
  const promoSeoDesc = document.getElementById('cfg-seo-promocao-descricao');
  if (promoSeoDesc) cfg.seoPaginas.promocao.descricao = promoSeoDesc.value.trim();

  STATE.config=cfg;
  await salvarArquivo(PATHS.config,cfg,'configSha','Admin: sincronizar promoção com config');
}
// ─── ENCOMENDAS — LABELS/CORES COMPLETOS ───────────────────
const ENC_STATUS_LABELS={
  novo:'Novo 🔴',pendente:'Pendente ⏳',confirmado:'Confirmado ✅',
  em_preparo:'Em preparo 🍦',pronto:'Pronto 📦',enviado:'Enviado 🚚',
  entregue:'Entregue 🎉',em_andamento:'Em andamento 🟡',
  concluído:'Concluído 🟢',cancelado:'Cancelado ⚫'
};
const ENC_STATUS_COR={
  novo:'#FFEBEE',pendente:'#FFF8E1',confirmado:'#E8F5E9',em_preparo:'#FFF3E0',
  pronto:'#E3F2FD',enviado:'#EDE7F6',entregue:'#E8F5E9',
  em_andamento:'#FFF8E1',concluído:'#E8F5E9',cancelado:'#FAFAFA'
};
const ENC_STATUS_BORDA={
  novo:'#D32F2F',pendente:'#F9A825',confirmado:'#2E7D32',em_preparo:'#E65100',
  pronto:'#1565C0',enviado:'#6A1B9A',entregue:'#1B5E20',
  em_andamento:'#F9A825',concluído:'#2E7D32',cancelado:'#9E9E9E'
};
// Sequência de status para a timeline
const TIMELINE_PASSOS=['novo','confirmado','em_preparo','pronto','enviado','entregue'];
const TIMELINE_LABELS=['Novo','Confirmado','Em preparo','Pronto','Enviado','Entregue'];
const TIMELINE_ICONES=['🔴','✅','🍦','📦','🚚','🎉'];

function renderEncomendas(){
  console.log('[renderEncomendas] Iniciando...');
  const registros=STATE.encomendas?.registros||[];
  console.log('[renderEncomendas] Registros encontrados:', registros.length);
  const workerAtivo=Boolean(getAdminToken());
  const semRegistrosOriginais=!registros.length;
  const filtroStatus=document.getElementById('enc-filtro-status')?.value||'';
  const filtroTipo=document.getElementById('enc-filtro-tipo')?.value||'';
  const busca=(document.getElementById('busca-encomenda')?.value||'').toLowerCase();
  let lista=registros.filter(e=>{
    if(filtroStatus&&e.status!==filtroStatus)return false;
    if(filtroTipo&&e.tipo!==filtroTipo)return false;
    if(busca){
      const haystack=[(e.num||''),(e.nome||''),(e.telefone||e.tel||'')].join(' ').toLowerCase();
      if(!haystack.includes(busca))return false;
    }
    return true;
  }).sort((a,b)=>new Date(b.data)-new Date(a.data));
  const container=document.getElementById('enc-lista');
  if(!lista.length){
    const msgSomenteLeitura=semRegistrosOriginais&&!workerAtivo
      ?'<div style="background:#e3f2fd;border:1px solid #bbdefb;color:#0d47a1;border-radius:10px;padding:14px;font-size:.84rem;line-height:1.45;margin-bottom:12px">ℹ️ Adicione um token GitHub para liberar edição e salvamento de encomendas.</div>'
      :'';
    container.innerHTML=msgSomenteLeitura+'<div style="text-align:center;padding:30px 10px"><div style="font-size:2.5rem;margin-bottom:10px">📦</div><p style="color:#888;margin-bottom:16px">Nenhuma encomenda cadastrada ainda.</p><button class="btn btn-laranja" onclick="abrirFormNovaEncomenda()" style="font-size:.95rem;padding:10px 24px">➕ Adicionar Encomenda</button></div>';
    return;
  }
  let html=lista.map(e=>{
    const cor=ENC_STATUS_COR[e.status]||'#fff';
    const borda=ENC_STATUS_BORDA[e.status]||'#e65100';
    const dataStr=e.dataFormatada||(e.data?new Date(e.data).toLocaleString('pt-BR'):'-');
    const totalStr=e.total?`R$ ${parseFloat(e.total).toFixed(2).replace('.',',')}`:'-';
    const label=ENC_STATUS_LABELS[e.status]||e.status||'—';
    const obsHtml=e.observacaoAdmin?`<div style="font-size:.78rem;color:#555;background:#fff9e6;border-radius:6px;padding:4px 8px;margin-top:6px">📝 ${esc(e.observacaoAdmin)}</div>`:'';
    return `<div style="background:${cor};border-left:5px solid ${borda};margin-bottom:14px;border-radius:10px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.07)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px">
        <div>
          <div style="font-weight:900;font-size:1rem;color:#1A0A00">${esc(e.nome)||'Sem nome'}</div>
          <div style="font-size:.8rem;color:#555">📱 ${esc(e.telefone||e.tel||'-')} &nbsp;|&nbsp;📅 ${dataStr}</div>
          ${e.endereço?`<div style="font-size:.8rem;color:#555">📍 ${esc(e.endereço)}</div>`:''}
          <div style="font-size:.78rem;color:#888;margin-top:2px">🔢 <strong>${esc(e.num||'-')}</strong> &nbsp;·&nbsp; <span style="background:${borda};color:#fff;padding:1px 8px;border-radius:8px;font-size:.7rem">${label}</span></div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.1rem;font-weight:900;color:#0D47A1">${totalStr}</div>
          <span style="background:#E3F2FD;color:#0D47A1;border-radius:20px;padding:2px 10px;font-size:.75rem;font-weight:700">${esc(e.tipo||'Geral')}</span>
        </div>
      </div>
      ${obsHtml}
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap">
        <button onclick="abrirModalEncomenda('${esc(e.num)}')" style="background:#1565c0;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:.82rem;cursor:pointer;font-weight:700;flex:1;min-width:120px">📋 Ver/Editar</button>
        <button onclick="copiarPedidoAdmin('${esc(e.num)}')" style="background:#25D366;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:.82rem;cursor:pointer;font-weight:700;white-space:nowrap">📲 WhatsApp</button>
        <button onclick="excluirEncomenda('${esc(e.num)}')" style="background:#c62828;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:.82rem;cursor:pointer;font-weight:700;white-space:nowrap">🗑️</button>
      </div>
    </div>`;
  }).join('');
  container.innerHTML=`<div style="font-size:.82rem;color:#666;margin-bottom:10px">${lista.length} encomenda(s)</div>`+html;
}

// ─── EXPORTAR CSV ENCOMENDAS ────────────────────────────────
function exportarEncomendasCSV(){
  const registros=STATE.encomendas?.registros||[];
  if(!registros.length){toast('Nenhuma encomenda para exportar.','aviso');return;}
  const BOM='\uFEFF';
  const hdr='Nº Pedido,Data,Nome,Telefone,Tipo,Status,Total,Endereço';
  const rows=registros.map(e=>{
    const data=e.dataFormatada||(e.data?new Date(e.data).toLocaleDateString('pt-BR'):'-');
    const total=e.total?parseFloat(e.total).toFixed(2):'-';
    return `"${e.num||''}","${data}","${(e.nome||'').replace(/"/g,'""')}","${e.telefone||e.tel||''}","${e.tipo||''}","${e.status||''}","${total}","${(e.endereço||'').replace(/"/g,'""')}"`;
  });
  const csv=BOM+[hdr,...rows].join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`encomendas_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();URL.revokeObjectURL(url);
  toast(`CSV com ${registros.length} encomendas exportado!`,'sucesso');
}

// ─── FORMULÁRIO NOVA / EDITAR ENCOMENDA ─────────────────────
function _gerarNumEncomenda(){
  const d=new Date();
  const base=`ENC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const registros=STATE.encomendas?.registros||[];
  const seq=registros.filter(r=>(r.num||'').startsWith(base)).length+1;
  return base+'-'+String(seq).padStart(3,'0');
}
function abrirFormNovaEncomenda(){
  if(!GH_WRITE_ALLOWED){toast('Modo somente leitura. Adicione um token GitHub para adicionar encomendas.','aviso');return;}
  const tit=document.getElementById('enc-form-titulo');
  if(tit)tit.textContent='➕ Nova Encomenda';
  document.getElementById('enc-f-nome').value='';
  document.getElementById('enc-f-tel').value='';
  document.getElementById('enc-f-tipo').value='caixa';
  document.getElementById('enc-f-status').value='novo';
  document.getElementById('enc-f-end').value='';
  document.getElementById('enc-f-itens').value='';
  document.getElementById('enc-f-total').value='';
  document.getElementById('enc-f-data-entrega').value='';
  document.getElementById('enc-f-obs').value='';
  document.getElementById('enc-f-num').value='';
  const panel=document.getElementById('enc-form-panel');
  if(panel){panel.style.display='block';panel.scrollIntoView({behavior:'smooth',block:'start'});}
}
function abrirFormEditarEncomenda(num){
  if(!GH_WRITE_ALLOWED){toast('Modo somente leitura. Adicione um token GitHub para editar encomendas.','aviso');return;}
  const registros=STATE.encomendas?.registros||[];
  const e=registros.find(r=>r.num===num);
  if(!e){toast('Pedido não encontrado.','erro');return;}
  const tit=document.getElementById('enc-form-titulo');
  if(tit)tit.textContent='✏️ Editar Encomenda — '+esc(num);
  document.getElementById('enc-f-nome').value=e.nome||'';
  document.getElementById('enc-f-tel').value=e.telefone||e.tel||'';
  document.getElementById('enc-f-tipo').value=e.tipo||'caixa';
  document.getElementById('enc-f-status').value=e.status||'novo';
  document.getElementById('enc-f-end').value=e.endereço||'';
  document.getElementById('enc-f-itens').value=Array.isArray(e.itens)?e.itens.map(it=>`${it.nome} x${it.qtd||1}`).join('\n'):(e.descricao||'');
  document.getElementById('enc-f-total').value=e.total||'';
  document.getElementById('enc-f-data-entrega').value=e.dataEntrega||'';
  document.getElementById('enc-f-obs').value=e.observacaoAdmin||'';
  document.getElementById('enc-f-num').value=num;
  const panel=document.getElementById('enc-form-panel');
  if(panel){panel.style.display='block';panel.scrollIntoView({behavior:'smooth',block:'start'});}
}
function fecharFormEncomenda(){
  const panel=document.getElementById('enc-form-panel');
  if(panel)panel.style.display='none';
}
async function salvarFormEncomenda(){
  if(!GH_WRITE_ALLOWED){toast('Modo somente leitura. Adicione um token GitHub para salvar.','aviso');return;}
  const nome=(document.getElementById('enc-f-nome').value||'').trim();
  if(!nome){toast('Informe o nome do cliente.','erro');document.getElementById('enc-f-nome').focus();return;}
  const tel=(document.getElementById('enc-f-tel').value||'').trim();
  if(!tel){toast('Informe o telefone.','erro');document.getElementById('enc-f-tel').focus();return;}
  const tipo=document.getElementById('enc-f-tipo').value;
  const status=document.getElementById('enc-f-status').value;
  const endereço=(document.getElementById('enc-f-end').value||'').trim();
  const descricao=(document.getElementById('enc-f-itens').value||'').trim();
  const totalRaw=parseFloat(document.getElementById('enc-f-total').value)||0;
  const dataEntrega=document.getElementById('enc-f-data-entrega').value||'';
  const obs=(document.getElementById('enc-f-obs').value||'').trim();
  const numExistente=document.getElementById('enc-f-num').value;

  if(!STATE.encomendas)STATE.encomendas={registros:[]};
  if(!Array.isArray(STATE.encomendas.registros))STATE.encomendas.registros=[];

  const agora=new Date();
  if(numExistente){
    // Edição
    const idx=STATE.encomendas.registros.findIndex(r=>r.num===numExistente);
    if(idx===-1){toast('Pedido não encontrado.','erro');return;}
    const prev=STATE.encomendas.registros[idx];
    if(prev.status!==status){
      if(!prev.historicoStatus)prev.historicoStatus=[];
      prev.historicoStatus.push({status,data:agora.toISOString(),origem:'admin'});
    }
    STATE.encomendas.registros[idx]={...prev,nome,telefone:tel,tipo,status,endereço,descricao,total:totalRaw,dataEntrega,observacaoAdmin:obs};
  }else{
    // Novo
    const num=_gerarNumEncomenda();
    STATE.encomendas.registros.unshift({
      num,nome,telefone:tel,tipo,status,endereço,descricao,
      total:totalRaw,dataEntrega,observacaoAdmin:obs,
      data:agora.toISOString(),
      dataFormatada:agora.toLocaleString('pt-BR'),
      historicoStatus:[{status,data:agora.toISOString(),origem:'admin'}],
      origem:'admin'
    });
  }
  const ok=await salvarArquivo(PATHS.encomendas,STATE.encomendas,'encomendasSha',numExistente?`Admin: editar pedido ${numExistente}`:`Admin: nova encomenda ${nome}`);
  if(ok){fecharFormEncomenda();renderEncomendas();toast(numExistente?`✅ Pedido ${numExistente} atualizado!`:`✅ Encomenda criada com sucesso!`,'sucesso');}
}

// ─── MODAL ENCOMENDA DETALHADA ──────────────────────────────
let _encModalNum=null;
function abrirModalEncomenda(num){
  const registros=STATE.encomendas?.registros||[];
  const e=registros.find(r=>r.num===num);
  if(!e){toast('Pedido não encontrado','erro');return;}
  _encModalNum=num;
  document.getElementById('me-num').textContent=num;
  document.getElementById('me-nome').value=e.nome||'-';
  document.getElementById('me-tel').value=e.telefone||e.tel||'-';
  document.getElementById('me-end').value=e.endereço||'-';
  const dataStr=e.dataFormatada||(e.data?new Date(e.data).toLocaleString('pt-BR'):'-');
  document.getElementById('me-data').value=dataStr;
  document.getElementById('me-status').value=e.status||'novo';
  document.getElementById('me-obs').value=e.observacaoAdmin||'';
  let itensHtml='';let totalCalc=0;
  (e.itens||[]).forEach(it=>{
    const sub=(it.preço||0)*(it.qtd||1);totalCalc+=sub;
    const sabores=it.sabores&&it.sabores.length?` <small style="color:#666">(${esc(it.sabores.join(', '))})</small>`:'';
    itensHtml+=`<div class="rastreio-item"><span><strong>${esc(it.nome)}</strong>${sabores} ×${it.qtd}</span><span>R$ ${sub.toFixed(2).replace('.',',')}</span></div>`;
  });
  document.getElementById('me-itens').innerHTML=itensHtml||'<p style="color:#888;font-size:.82rem">Sem itens.</p>';
  const total=e.total||totalCalc;
  document.getElementById('me-total').innerHTML=`<span style="font-weight:800">Total</span><span style="font-size:1.2rem;color:#1565c0">R$ ${parseFloat(total||0).toFixed(2).replace('.',',')}</span>`;
  const hist=e.historicoStatus||[];
  let histHtml=hist.length?hist.map(h=>`<div style="margin-bottom:6px">📌 <strong>${ENC_STATUS_LABELS[h.status]||h.status}</strong> — ${h.data?new Date(h.data).toLocaleString('pt-BR'):'-'} <span style="color:#888">${h.origem?'('+h.origem+')':''}</span></div>`).join(''):'<p style="color:#aaa">Nenhum histórico ainda.</p>';
  document.getElementById('me-historico').innerHTML=histHtml;
  atualizarTimelineModal();
  document.getElementById('modal-encomenda').classList.add('show');
}
function fecharModalEncomenda(){document.getElementById('modal-encomenda').classList.remove('show');_encModalNum=null;}
function atualizarTimelineModal(){
  const statusAtual=document.getElementById('me-status')?.value||'novo';
  const idxAtual=TIMELINE_PASSOS.indexOf(statusAtual);
  const tl=document.getElementById('me-timeline');if(!tl)return;
  tl.innerHTML=TIMELINE_PASSOS.map((s,i)=>{
    let cls='tl-step';
    if(i<idxAtual)cls+=' done';else if(i===idxAtual)cls+=' current';
    return `<div class="${cls}"><div class="tl-dot">${TIMELINE_ICONES[i]}</div><div class="tl-label">${TIMELINE_LABELS[i]}</div></div>`;
  }).join('');
}
async function salvarModalEncomenda(){
  if(!GH_WRITE_ALLOWED){toast('Modo somente leitura.','aviso');return;}
  const registros=STATE.encomendas?.registros||[];
  const idx=registros.findIndex(r=>r.num===_encModalNum);
  if(idx===-1){toast('Pedido não encontrado','erro');return;}
  const novoStatus=document.getElementById('me-status').value;
  const obs=document.getElementById('me-obs').value.trim();
  const statusAnterior=registros[idx].status;
  registros[idx].status=novoStatus;
  registros[idx].observacaoAdmin=obs;
  if(novoStatus!==statusAnterior){
    if(!registros[idx].historicoStatus)registros[idx].historicoStatus=[];
    registros[idx].historicoStatus.push({status:novoStatus,data:new Date().toISOString(),origem:'admin'});
  }
  STATE.encomendas.registros=registros;
  const ok=await salvarArquivo(PATHS.encomendas,STATE.encomendas,'encomendasSha',`Admin: pedido ${_encModalNum} → ${novoStatus}`);
  if(ok){fecharModalEncomenda();renderEncomendas();toast(`✅ Pedido ${_encModalNum} atualizado!`,'sucesso');}
}
async function notificarClienteStatus(){
  const registros=STATE.encomendas?.registros||[];
  const e=registros.find(r=>r.num===_encModalNum);if(!e)return;
  const status=document.getElementById('me-status').value;
  const label=ENC_STATUS_LABELS[status]||status;
  let msg=`🍦 *Sorveteria Itapolitana Cajuru*\n\nOlá, *${e.nome||'cliente'}*!\n\nSeu pedido *${e.num}* está com status:\n*${label}*\n`;
  if(status==='confirmado')msg+=`\n✅ Pagamento confirmado! Estamos preparando seu pedido.`;
  else if(status==='em_preparo')msg+=`\n🍦 Seu pedido está sendo produzido com muito carinho!`;
  else if(status==='pronto')msg+=`\n📦 Seu pedido está pronto!`;
  else if(status==='enviado')msg+=`\n🚚 Seu pedido saiu para entrega!`;
  else if(status==='entregue')msg+=`\n🎉 Pedido entregue! Obrigado pela preferência!`;
  if(e.observacaoAdmin)msg+=`\n\n📝 Obs.: ${e.observacaoAdmin}`;
  const tel=(e.telefone||e.tel||'').replace(/\D/g,'');
  if(tel){window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`,'_blank');}
  else{
    copiarTextoSeguro(msg).then((ok)=>{
      if(ok)toast('Mensagem copiada!','sucesso');
      else toast('Erro ao copiar mensagem.','erro');
    });
  }
}

function copiarPedidoAdmin(numPedido){
  const registros=STATE.encomendas?.registros||[];
  const e=registros.find(r=>r.num===numPedido);
  if(!e){toast('Pedido não encontrado','erro');return;}
  let txt=`🍦 PEDIDO - Sorveteria Itapolitana Cajuru\n\n`;
  txt+=`🔢 Pedido Nº: ${e.num}\n📅 Data: ${e.dataFormatada||e.data}\n\n`;
  txt+=`👤 Cliente: ${e.nome}\n📱 WhatsApp: ${e.telefone||e.tel}\n📍 Endereço: ${e.endereço||'-'}\n\n`;
  if(e.itens&&e.itens.length>0){
    txt+=`📦 ITENS:\n`;
    e.itens.forEach(it=>{
      const sub=(it.preço||0)*(it.qtd||1);
      txt+=`\n▶ ${it.nome} ×${it.qtd} — R$ ${sub.toFixed(2).replace('.',',')}\n`;
      if(it.sabores&&it.sabores.length>0)it.sabores.forEach(s=>txt+=`   • ${s}\n`);
    });
  }
  if(e.total)txt+=`\n💰 TOTAL: R$ ${parseFloat(e.total).toFixed(2).replace('.',',')}\n`;
  txt+=`\n⏰ Produzido em até 3 dias úteis após confirmação do pagamento.\n💳 Pagamento antecipado obrigatório.`;
  copiarTextoSeguro(txt).then((ok)=>toast(ok?'✅ Pedido copiado!':'Erro ao copiar',ok?'sucesso':'erro'));
}
async function alterarStatusEncomenda(idx,novoStatus){
  const registros=STATE.encomendas?.registros||[];
  if(!registros[idx])return;
  const statusAnterior=registros[idx].status;
  registros[idx].status=novoStatus;
  if(novoStatus!==statusAnterior){
    if(!registros[idx].historicoStatus)registros[idx].historicoStatus=[];
    registros[idx].historicoStatus.push({status:novoStatus,data:new Date().toISOString(),origem:'admin'});
  }
  STATE.encomendas.registros=registros;
  const ok=await salvarArquivo(PATHS.encomendas,STATE.encomendas,'encomendasSha','Admin: atualizar status encomenda');
  if(!ok)toast('Erro ao salvar status. Verifique o token.','erro');
  renderEncomendas();
}

function getClientes(){if(!STATE.clientes?.clientes){console.warn('[] STATE.clientes não carregado');return[];}return Object.values(STATE.clientes.clientes);}
/* Retorna a chave (USR-XXXX ou cel legado) de um objeto cliente no STATE */
function obterChaveCliente(c){
  const mapa=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const entrada=Object.entries(mapa).find(([,v])=>v===c);
  return entrada?entrada[0]:(c.id_permanente||c.id||c.cel||'');
}
// ═══════════════════════════════════════════════════════════
// PARTICIPANTES GERAL ( + Sorteios Mensais)
// ═══════════════════════════════════════════════════════════
const POR_PAG_PART = 50;
if (!STATE.pagPart) STATE.pagPart = 0;

function getParticipantesUnificados() {
  // Clientes do
  const cliFid = Object.values(STATE.clientes?.clientes || STATE.fidelidade?.clientes || {});
  // Inscritos nos Sorteios Mensais
  const insSorteio = STATE.fidelidade?.sorteioInscritos || [];

  // Mapa por celular para unificar
  const mapa = {};

  cliFid.forEach(c => {
    const cel = c.cel || '';
    if (!cel) return;
    mapa[cel] = {
      id: c.id || '-',
      nome: c.nome || '-',
      cel: cel,
      tipo: 'fidelidade',
      pontos: c.saldoPontos || 0,
      cadastro: c.cadastro || '',
      status: c.bloqueado ? 'Bloqueado' : c.fraude ? 'Fraude' : 'Ativo'
    };
  });

  insSorteio.forEach(c => {
    const cel = c.cel || '';
    if (!cel) return;
    if (mapa[cel]) {
      mapa[cel].tipo = 'ambos'; // já está nos dois
      if (c.id && mapa[cel].id === '-') mapa[cel].id = c.id;
    } else {
      mapa[cel] = {
        id: c.id || '-',
        nome: c.nome || '-',
        cel: cel,
        tipo: 'sorteio',
        pontos: 0,
        cadastro: c.data || '',
        status: 'Ativo'
      };
    }
  });

  return Object.values(mapa);
}

function renderParticipantes() {
  const todos = getParticipantesUnificados();
  const busca = (document.getElementById('busca-participante')?.value || '').toLowerCase();
  const filtroTipo = document.getElementById('filtro-tipo-part')?.value || '';

  const filtrados = todos.filter(p => {
    const matchBusca = !busca || (p.nome||'').toLowerCase().includes(busca) || (p.cel||'').includes(busca);
    const matchTipo  = !filtroTipo || p.tipo === filtroTipo;
    return matchBusca && matchTipo;
  }).sort((a,b) => (a.nome||'').localeCompare(b.nome||''));

  // Contadores
  const elTotal = document.getElementById('part-total');
  const elFid   = document.getElementById('part-fidelidade');
  const elSort  = document.getElementById('part-sorteio');
  const elAmbos = document.getElementById('part-ambos');
  if (elTotal) elTotal.textContent = todos.length;
  if (elFid)   elFid.textContent   = todos.filter(p => p.tipo === 'fidelidade').length;
  if (elSort)  elSort.textContent  = todos.filter(p => p.tipo === 'sorteio').length;
  if (elAmbos) elAmbos.textContent = todos.filter(p => p.tipo === 'ambos').length;

  const total   = filtrados.length;
  const paginas = Math.ceil(total / POR_PAG_PART) || 1;
  STATE.pagPart = Math.min(STATE.pagPart, paginas - 1);
  const slice   = filtrados.slice(STATE.pagPart * POR_PAG_PART, (STATE.pagPart + 1) * POR_PAG_PART);

  const tbody = document.getElementById('tabela-participantes');
  if (!tbody) return;

  const tipoLabel = { fidelidade: '🎟️ Fidelidade', sorteio: '🎁 Sorteio', ambos: '⭐ Ambos' };
  const tipoCor   = { fidelidade: '#e8650a', sorteio: '#2e7d32', ambos: '#7b1fa2' };

  if (!slice.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px">Nenhum participante encontrado.</td></tr>';
  } else {
    tbody.innerHTML = slice.map(p => `
      <tr>
        <td style="font-family:monospace;font-size:.75rem;font-weight:700;color:#666">${p.id || '-'}</td>
        <td>${esc(p.nome)}</td>
        <td><a href="https://wa.me/55${p.cel.replace(/\D/g,'')}" target="_blank" style="color:#e65100">${esc(p.cel)}</a></td>
        <td><span style="background:${tipoCor[p.tipo]};color:#fff;border-radius:12px;padding:3px 10px;font-size:.75rem;font-weight:700">${tipoLabel[p.tipo]}</span></td>
        <td style="font-weight:700;color:#e8650a">${p.pontos}</td>
        <td style="font-size:.78rem">${p.cadastro ? (p.cadastro.includes('T') ? new Date(p.cadastro).toLocaleDateString('pt-BR') : p.cadastro) : '-'}</td>
        <td style="color:${p.status==='Ativo'?'#2e7d32':p.status==='Bloqueado'?'#c62828':'#f57c00'};font-weight:700">${p.status}</td>
        <td><button onclick="excluirParticipante('${p.cel}','${p.tipo}')" style="background:#c62828;color:#fff;border:none;border-radius:8px;padding:5px 12px;font-size:.78rem;cursor:pointer;font-weight:700">🗑️ Excluir</button></td>
      </tr>`).join('');
  }

  // Paginação
  const pagDiv = document.getElementById('pag-participantes');
  if (pagDiv) {
    let html = '';
    for (let i = 0; i < paginas; i++) {
      html += `<button class="${i===STATE.pagPart?'ativo':''}" onclick="irPagPart(${i})">${i+1}</button>`;
    }
    pagDiv.innerHTML = html;
  }

  const info = document.getElementById('part-info-pag');
  if (info) info.textContent = `Exibindo ${slice.length} de ${total} participantes (pág. ${STATE.pagPart+1}/${paginas})`;
}

function irPagPart(p) { STATE.pagPart = p; renderParticipantes(); }

// ═══════════════════════════════════════════════════════════
// EXCLUIR PARTICIPANTE INDIVIDUAL
// ═══════════════════════════════════════════════════════════
function excluirParticipante(cel, tipo) {
  const celLimpo = cel.replace(/\D/g,'');
  let nome = cel;

  // Tentar encontrar o nome em qualquer lugar
  const ins = STATE.fidelidade?.sorteioInscritos?.find(c => (c.cel||'').replace(/\D/g,'') === celLimpo);
  const cli = STATE.clientes?.clientes?.[celLimpo] || STATE.fidelidade?.clientes?.[celLimpo];
  if (ins) nome = ins.nome;
  else if (cli) nome = cli.nome;

  confirmarAcao(
    'Excluir Participante',
    `Tem certeza que deseja excluir <strong>${nome}</strong> de TODOS os sistemas (Fidelidade e Sorteio)?<br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita.</span>`,
    'Sim, excluir de tudo',
    async () => {
      try {
        let salvouAlgo = false;
        mostrarLoading('Excluindo de todos os sistemas...');

        // 1. Remover do Sorteio (fidelidade.json)
        if (STATE.fidelidade?.sorteioInscritos) {
          const idx = STATE.fidelidade.sorteioInscritos.findIndex(c => (c.cel||'').replace(/\D/g,'') === celLimpo);
          if (idx > -1) {
            STATE.fidelidade.sorteioInscritos.splice(idx, 1);
            const ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: excluir participante ' + nome + ' do sorteio');
            if (ok) salvouAlgo = true;
          }
        }

        // 2. Remover do  (clientes.json ou fidelidade.json)
        // Busca por valor do campo cel (chaves são USR-XXXX, não o número do celular)
        const entradaCliente = Object.entries(STATE.clientes?.clientes || {}).find(([,v]) => String(v.cel||'').replace(/\D/g,'') === celLimpo);
        const entradaFid = !entradaCliente && Object.entries(STATE.fidelidade?.clientes || {}).find(([,v]) => String(v.cel||'').replace(/\D/g,'') === celLimpo);
        if (entradaCliente) {
          const [chaveCliente, cliObj] = entradaCliente;
          delete STATE.clientes.clientes[chaveCliente];
          if (STATE.clientes.indice_celular) delete STATE.clientes.indice_celular[celLimpo];
          const ok = await salvarArquivo(PATHS.clientes, STATE.clientes, 'clientesSha', 'Admin: excluir participante ' + nome + ' da fidelidade');
          if (ok) salvouAlgo = true;
        } else if (entradaFid) {
          const [chaveFid] = entradaFid;
          delete STATE.fidelidade.clientes[chaveFid];
          const ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: excluir participante ' + nome + ' da fidelidade');
          if (ok) salvouAlgo = true;
        }

        ocultarLoading();
        if (salvouAlgo) {
          toast('🗑️ ' + nome + ' removido(a) com sucesso!', 'ok');
          renderParticipantes();
        } else {
          toast('⚠️ Registro não encontrado ou já excluído.', 'aviso');
        }
      } catch (erro) {
        ocultarLoading();
        toast('❌ Erro ao excluir: ' + erro.message, 'erro');
      }
    }
  );
}

// ═══════════════════════════════════════════════════════════
// ADICIONAR PARTICIPANTE MANUALMENTE
// ═══════════════════════════════════════════════════════════
async function adicionarParticipanteManual() {
  const nome = (document.getElementById('add-part-nome')?.value || '').trim();
  const cel  = (document.getElementById('add-part-cel')?.value || '').trim();
  const tipo = document.getElementById('add-part-tipo')?.value || 'sorteio';
  if (!nome) { toast('Informe o nome do participante.', 'erro'); return; }
  if (cel.replace(/\D/g,'').length < 10) { toast('Informe um celular válido.', 'erro'); return; }
  const celLimpo = cel.replace(/\D/g,'');
  if (tipo === 'sorteio') {
    if (!STATE.fidelidade) STATE.fidelidade = {};
    if (!STATE.fidelidade.sorteioInscritos) STATE.fidelidade.sorteioInscritos = [];
    const jaExiste = STATE.fidelidade.sorteioInscritos.find(c => (c.cel||'').replace(/\D/g,'') === celLimpo);
    if (jaExiste) { toast('\u274c ' + jaExiste.nome + ' já está inscrito(a) no sorteio.', 'erro'); return; }
    const cadastroISO = new Date().toISOString();
    STATE.fidelidade.sorteioInscritos.push({
      nome, cel: celLimpo, dataNasc: '', cadastro: cadastroISO,
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})
    });
    const ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: adicionar participante manual ' + nome);
    if (ok) {
      document.getElementById('add-part-nome').value = '';
      document.getElementById('add-part-cel').value = '';
      toast('\u2705 ' + nome + ' adicionado(a) ao sorteio com sucesso!', 'sucesso');
      renderParticipantes();
      await carregarInscritosSorteio();
      return;
    }
  } else {
    if (!STATE.clientes) STATE.clientes = { clientes: {}, indice_celular: {} };
    if (!STATE.clientes.clientes) STATE.clientes.clientes = {};
    if (!STATE.clientes.indice_celular) STATE.clientes.indice_celular = {};
    // Verificar duplicata por valor do campo cel (chaves são USR-XXXX, não cel)
    const jaFid = Object.values(STATE.clientes.clientes).find(v => String(v.cel||'').replace(/\D/g,'') === celLimpo);
    if (jaFid) { toast('❌ ' + jaFid.nome + ' já está cadastrado(a) na fidelidade.', 'erro'); return; }
    // Gerar ID USR-XXXX para o novo participante
    let maxNum = 0;
    Object.values(STATE.clientes.clientes).forEach(v => { const m = (v.id_permanente||'').match(/USR-2026-(\d+)/); if(m) maxNum = Math.max(maxNum, parseInt(m[1],10)); });
    const novoId = 'USR-2026-' + String(maxNum+1).padStart(4,'0');
    STATE.clientes.clientes[novoId] = { id_permanente: novoId, nome, cel: celLimpo, dataNasc: '', cadastro: new Date().toISOString(), saldoPontos: 0, codigosUsados: [], resgates: [], totalPremios: 0, totalCodigos: 0, bloqueado: false, tentativas_fraude: 0 };
    STATE.clientes.indice_celular[celLimpo] = novoId;
    const ok = await salvarArquivo(PATHS.clientes, STATE.clientes, 'clientesSha', 'Admin: adicionar participante manual ' + nome);
  }
  document.getElementById('add-part-nome').value = '';
  document.getElementById('add-part-cel').value = '';
  toast('\u2705 ' + nome + ' adicionado(a) com sucesso!', 'sucesso');
  renderParticipantes();
}

// ═══════════════════════════════════════════════════════════
// LIMPAR LISTA DE PARTICIPANTES
// ═══════════════════════════════════════════════════════════
function limparListaParticipantes() {
  const filtroTipo = document.getElementById('filtro-tipo-part')?.value || '';
  const total = getParticipantesUnificados().length;
  if (total === 0) { toast('A lista já está vazia.', 'aviso'); return; }
  let descricao = 'todos os participantes';
  if (filtroTipo === 'sorteio') descricao = 'todos os inscritos no Sorteio';
  else if (filtroTipo === 'fidelidade') descricao = 'todos os clientes do Clube Fidelidade';
  confirmarAcao(
    '🧹 Limpar Lista de Participantes',
    `Tem certeza que deseja apagar <strong>${descricao}</strong>?<br><br>⚠️ Isso vai remover <strong>todos os cadastros</strong> da lista selecionada.<br><br><span style="color:#c62828;font-weight:700">Esta ação NÃO pode ser desfeita!</span>`,
    '🧹 Sim, limpar tudo',
    async () => {
      let ok = true;
      if (!filtroTipo || filtroTipo === 'sorteio' || filtroTipo === 'ambos') {
        if (STATE.fidelidade?.sorteioInscritos) {
          STATE.fidelidade.sorteioInscritos = [];
          ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: limpar lista sorteio') && ok;
        }
      }
      if (!filtroTipo || filtroTipo === 'fidelidade' || filtroTipo === 'ambos') {
        if (STATE.clientes?.clientes) {
          STATE.clientes.clientes = {};
          ok = await salvarArquivo(PATHS.clientes, STATE.clientes, 'clientesSha', 'Admin: limpar lista fidelidade') && ok;
        }
      }
      if (ok) { toast('🧹 Lista limpa com sucesso!', 'ok'); renderParticipantes(); }
    },
    'perigo'
  );
}

function exportarParticipantesCSV() {
  const todos = getParticipantesUnificados();
  if (!todos.length) { toast('Nenhum participante para exportar.', 'aviso'); return; }
  const tipoLabel = { fidelidade: 'Fidelidade', sorteio: 'Sorteio Mensal', ambos: 'Fidelidade + Sorteio' };
  const formatarData = (d) => {
    if (!d) return '-';
    if (d.includes('T')) return new Date(d).toLocaleDateString('pt-BR');
    return d;
  };
  // BOM para Excel reconhecer UTF-8
  const BOM = '\uFEFF';
  const header = 'N\u00ba,Nome,WhatsApp,Tipo,Pontos,Data de Cadastro,Status';
  const rows = todos.map((p, i) =>
    `${i+1},"${(p.nome||'-').replace(/"/g,'""')}","${p.cel||'-'}","${tipoLabel[p.tipo]||p.tipo}",${p.pontos||0},"${formatarData(p.cadastro)}","${p.status||'Ativo'}"`
  );
  const csv = BOM + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dataHoje = new Date().toISOString().slice(0,10);
  a.href = url; a.download = `participantes_itapolitana_${dataHoje}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast(`CSV com ${todos.length} participantes exportado!`, 'sucesso');
}

function copiarParticipantes() {
  const todos = getParticipantesUnificados();
  if (!todos.length) { toast('Nenhum participante para copiar.', 'aviso'); return; }
  const tipoLabel = { fidelidade: 'Fidelidade', sorteio: 'Sorteio', ambos: 'Ambos' };
  const lista = todos.map((p, i) => `${i+1}. ${p.nome} — ${p.cel} [${tipoLabel[p.tipo]}]`).join('\n');
  copiarTextoSeguro(lista).then((ok)=>toast(ok?`Lista de ${todos.length} participantes copiada!`:'Erro ao copiar lista de participantes.', ok?'sucesso':'erro'));
}

// ─── COPIAR TODOS OS DADOS (formato completo: nº, nome, WhatsApp, data, tipo, pontos, status) ───
function copiarTodosDados() {
  const todos = getParticipantesUnificados();
  if (!todos.length) { toast('Nenhum participante para copiar.', 'aviso'); return; }
  const tipoLabel = { fidelidade: 'Fidelidade', sorteio: 'Sorteio', ambos: 'Ambos' };
  const formatarData = (d) => {
    if (!d) return '-';
    if (d.includes('T')) return new Date(d).toLocaleDateString('pt-BR');
    return d;
  };
  const cabecalho = 'Nº | Nome | WhatsApp | Data de Cadastro | Tipo | Pontos | Status';
  const separador = '─'.repeat(70);
  const linhas = todos.map((p, i) =>
    `${String(i+1).padStart(3,'0')} | ${(p.nome||'-').padEnd(25)} | ${p.cel||'-'} | ${formatarData(p.cadastro)} | ${tipoLabel[p.tipo]||p.tipo} | ${p.pontos||0} pts | ${p.status||'Ativo'}`
  );
  const texto = [
    `LISTA DE PARTICIPANTES — Sorveteria Itapolitana Cajuru`,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    `Total: ${todos.length} participante(s)`,
    separador,
    cabecalho,
    separador,
    ...linhas,
    separador
  ].join('\n');
  copiarTextoSeguro(texto).then((ok)=>toast(ok?`Dados completos de ${todos.length} participantes copiados!`:'Erro ao copiar dados dos participantes.', ok?'sucesso':'erro'));
}

// ─── COPIAR SÓ SORTEIO (apenas inscritos no sorteio mensal, numerados para sorteio) ───
function copiarApenassorteio() {
  const todos = getParticipantesUnificados();
  const sorteio = todos.filter(p => p.tipo === 'sorteio' || p.tipo === 'ambos');
  if (!sorteio.length) { toast('Nenhum inscrito no sorteio para copiar.', 'aviso'); return; }
  const formatarData = (d) => {
    if (!d) return '-';
    if (d.includes('T')) return new Date(d).toLocaleDateString('pt-BR');
    return d;
  };
  const cabecalho = 'Nº SORTEIO | Nome | WhatsApp | Data de Inscrição';
  const separador = '─'.repeat(60);
  const linhas = sorteio.map((p, i) =>
    `${String(i+1).padStart(3,'0')} | ${(p.nome||'-').padEnd(25)} | ${p.cel||'-'} | ${formatarData(p.cadastro)}`
  );
  const texto = [
    `INSCRITOS NO SORTEIO MENSAL — Sorveteria Itapolitana Cajuru`,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    `Total de inscritos: ${sorteio.length}`,
    separador,
    cabecalho,
    separador,
    ...linhas,
    separador,
    ``,
    `Para sortear: escolha um número entre 001 e ${String(sorteio.length).padStart(3,'0')}`
  ].join('\n');
  copiarTextoSeguro(texto).then((ok)=>toast(ok?`Lista de ${sorteio.length} inscritos no sorteio copiada!`:'Erro ao copiar lista de sorteio.', ok?'sucesso':'erro'));
}

// ═══════════════════════════════════════════════════════════
function renderClientes(){
  const workerAtivo=Boolean(getAdminToken());
  const clientesCarregados=Boolean(STATE.clientes?.clientes);
  const tbodyAviso=document.getElementById('tabela-clientes');
  if(!workerAtivo&&!clientesCarregados){
    document.getElementById('sc-total').textContent='0';
    document.getElementById('sc-ativos').textContent='0';
    document.getElementById('sc-bloqueados').textContent='0';
    document.getElementById('sc-fraudes').textContent='0';
    if(tbodyAviso){
      const tr=document.createElement('tr');
      const td=document.createElement('td');
      td.colSpan=6;
      td.style.textAlign='left';
      td.style.color='#0d47a1';
      td.style.padding='14px';
      td.style.background='#e3f2fd';
      td.style.border='1px solid #bbdefb';
      td.style.borderRadius='8px';
      td.textContent='ℹ️ Modo somente leitura: a lista de clientes não pôde ser carregada. Adicione um token GitHub para liberar sincronização completa.';
      tr.appendChild(td);
      tbodyAviso.replaceChildren(tr);
    }
    const pagDiv=document.getElementById('pag-clientes');
    if(pagDiv)pagDiv.innerHTML='';
    fidApplyReadOnlyGuard();
    return;
  }
  const clientes=getClientes();
  const busca=(document.getElementById('busca-cliente').value||'').toLowerCase();
  const filtrados=clientes.filter(c=>{if(!busca)return true;return(c.nome||'').toLowerCase().includes(busca)||(c.cel||'').includes(busca);}).sort((a,b)=>(a.cadastro||'')<(b.cadastro||'')?-1:1);
  document.getElementById('sc-total').textContent=clientes.length;
  document.getElementById('sc-ativos').textContent=clientes.filter(c=>!c.bloqueado).length;
  document.getElementById('sc-bloqueados').textContent=clientes.filter(c=>c.bloqueado).length;
  document.getElementById('sc-fraudes').textContent=clientes.filter(c=>c.fraude).length;
  const total=filtrados.length;
  const paginas=Math.ceil(total/POR_PAGINA);
  const pag=Math.min(STATE.pagClientes,Math.max(0,paginas-1));
  STATE.pagClientes=pag;
  const slice=filtrados.slice(pag*POR_PAGINA,(pag+1)*POR_PAGINA);
  const tbody=document.getElementById('tabela-clientes');
  if(!slice.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:#888;padding:20px">Nenhum cliente encontrado.</td></tr>';}
  else{tbody.innerHTML=slice.map(c=>{
    const cKey=obterChaveCliente(c);
    return `<tr style="${c.bloqueado?'background:#fff3f3':c.fraude?'background:#fff8e1':''}">
    <td>${esc(c.nome)||'-'}</td>
    <td><a href="https://wa.me/55${(c.cel||'').replace(/\D/g,'')}" target="_blank" style="color:#e65100">${esc(c.cel)||'-'}</a></td>
    <td style="font-weight:700;color:#e65100">${c.saldoPontos||0}</td>
    <td style="font-size:.78rem">${c.cadastro?new Date(c.cadastro).toLocaleDateString('pt-BR'):'-'}</td>
    <td>${c.bloqueado?'<span style="color:#c62828;font-weight:700">Bloqueado</span>':c.fraude?'<span style="color:#f57c00;font-weight:700">Fraude</span>':'<span style="color:#2e7d32">Ativo</span>'}${(c.tentativas_fraude||0)>0?` <small style="color:#888">(${c.tentativas_fraude} tent.)</small>`:''}</td>
    <td style="display:flex;gap:5px;flex-wrap:wrap">
      ${c.bloqueado
        ?`<button class="btn btn-verde" data-fid-write style="padding:4px 9px;font-size:.76rem" onclick="toggleBloqueio('${cKey}',false)">🔓 Desbloquear</button>`
        :`<button class="btn btn-vermelho" data-fid-write style="padding:4px 9px;font-size:.76rem" onclick="toggleBloqueio('${cKey}',true)">🔒 Bloquear</button>`}
      ${(c.tentativas_fraude||0)>0?`<button class="btn" data-fid-write style="background:#7b1fa2;color:#fff;padding:4px 9px;font-size:.76rem" onclick="zerarTentativas('${cKey}')">🔄 Zerar tent.</button>`:''}
      <button class="btn" data-fid-write style="background:#1565c0;color:#fff;padding:4px 9px;font-size:.76rem" onclick="abrirModalPontos('${cKey}')">💰 Pontos</button>
      <button class="btn" data-fid-write style="background:#2e7d32;color:#fff;padding:4px 9px;font-size:.76rem" onclick="adminValidarCodigo('${cKey}')">✅ Código</button>
      <button class="btn btn-amarelo" data-fid-write style="padding:4px 9px;font-size:.76rem" onclick="abrirFormCliente('${cKey}')">✏️ Editar</button>
      <button class="btn" data-fid-write style="background:#c62828;color:#fff;padding:4px 9px;font-size:.76rem" onclick="excluirCliente('${cKey}')">🗑️ Excluir</button>
    </td>
  </tr>`;
  }).join('');}
  const pagDiv=document.getElementById('pag-clientes');
  let pagHtml='';
  for(let i=0;i<paginas;i++)pagHtml+=`<button class="${i===pag?'ativo':''}" onclick="irPagClientes(${i})">${i+1}</button>`;
  pagDiv.innerHTML=pagHtml;
  fidApplyReadOnlyGuard();
}
function irPagClientes(p){STATE.pagClientes=p;renderClientes();}

// ═══════════════════════════════════════════════════════════
// PAINEL DE POTENCIAL DUPLICIDADE
// ═══════════════════════════════════════════════════════════
function renderDuplicidades() {
  const clientes = STATE.clientes?.clientes || STATE.fidelidade?.clientes || {};
  const comDup = Object.values(clientes).filter(c => c.potencialDuplicidade && c.potencialDuplicidade.length > 0);
  const card = document.getElementById('card-duplicidades');
  const badge = document.getElementById('badge-duplicidades');
  const lista = document.getElementById('lista-duplicidades');
  if (!card || !lista) return;
  if (comDup.length === 0) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';
  if (badge) badge.textContent = comDup.length + ' caso' + (comDup.length > 1 ? 's' : '');
  lista.innerHTML = comDup.map(c => {
    const nascFmt = c.dataNasc ? c.dataNasc.split('-').reverse().join('/') : '-';
    const cadFmt  = c.cadastro ? new Date(c.cadastro).toLocaleDateString('pt-BR') : '-';
    const tentativas = c.potencialDuplicidade.map((t, i) => `
      <div style="background:#fff;border:1px solid #ffcdd2;border-radius:8px;padding:8px 12px;margin-top:6px;font-size:.82rem">
        <strong>Tentativa ${i+1}:</strong> Celular tentado: <code>${esc(t.celTentativa)}</code> &mdash; ${new Date(t.data).toLocaleDateString('pt-BR')} &mdash;
        <span style="color:${t.status==='Resolvido'?'#2e7d32':t.status==='Ignorado'?'#888':'#b71c1c'};font-weight:700">${esc(t.status)}</span>
        ${t.status==='Pendente revisao admin' ? `
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-verde" data-fid-write style="padding:5px 10px;font-size:.78rem" onclick="resolverDuplicidade('${c.cel}',${i},'atualizar','${t.celTentativa}')">Atualizar celular para ${t.celTentativa}</button>
            <button class="btn" data-fid-write style="background:#607d8b;color:#fff;padding:5px 10px;font-size:.78rem" onclick="resolverDuplicidade('${c.cel}',${i},'ignorar','')">Ignorar (manter celular atual)</button>
            <button class="btn btn-vermelho" data-fid-write style="padding:5px 10px;font-size:.78rem" onclick="resolverDuplicidade('${c.cel}',${i},'bloquear','')">Bloquear tentativa</button>
          </div>` : ''}
      </div>`).join('');
    return `<div style="background:#ffebee;border:1.5px solid #ef9a9a;border-radius:12px;padding:12px 14px;margin-bottom:12px">
      <div style="font-weight:900;font-size:.9rem;color:#b71c1c">&#9888;&#65039; ${esc(c.nome)}</div>
      <div style="font-size:.8rem;color:#555;margin-top:2px">Celular cadastrado: <strong>${esc(c.cel)}</strong> &mdash; Nasc.: ${nascFmt} &mdash; Cadastro: ${cadFmt}</div>
      ${tentativas}
    </div>`;
  }).join('');
  fidApplyReadOnlyGuard();
}

async function resolverDuplicidade(celOriginal, idxTentativa, acao, celNovo) {
  if(!fidRequireWrite())return;
  const clientes = STATE.clientes?.clientes || STATE.fidelidade?.clientes || {};
  const c = clientes[celOriginal];
  if (!c || !c.potencialDuplicidade) return;
  if (acao === 'atualizar' && celNovo) {
    // Move o registro para a nova chave de celular
    const novoReg = Object.assign({}, c, { cel: celNovo });
    novoReg.potencialDuplicidade[idxTentativa].status = 'Resolvido — celular atualizado para ' + celNovo;
    delete clientes[celOriginal];
    clientes[celNovo] = novoReg;
    toast('Celular atualizado: ' + celOriginal + ' → ' + celNovo, 'sucesso');
  } else if (acao === 'ignorar') {
    c.potencialDuplicidade[idxTentativa].status = 'Ignorado';
    toast('Tentativa marcada como ignorada.', 'ok');
  } else if (acao === 'bloquear') {
    c.potencialDuplicidade[idxTentativa].status = 'Bloqueado pelo admin';
    toast('Tentativa bloqueada.', 'ok');
  }
  if (STATE.clientes?.clientes) {
    STATE.clientes.clientes = clientes;
    const ok = await salvarArquivo(PATHS.clientes, STATE.clientes, 'clientesSha', 'Admin: resolver duplicidade ' + celOriginal);
  } else {
    STATE.fidelidade.clientes = clientes;
    const ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: resolver duplicidade ' + celOriginal);
  }
  renderClientes();
  renderDuplicidades();
}
async function toggleBloqueio(clienteId,bloquear){
  if(!fidRequireWrite())return;
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  if(!clientes[clienteId])return;
  const c=clientes[clienteId];
  if(bloquear){
    // Exigir confirmação antes de bloquear
    confirmarAcao(
      'Bloquear Cliente',
      `Tem certeza que deseja <strong>bloquear</strong> o cadastro de <strong>${c.nome||clienteId}</strong>?<br><small style="color:#888">Celular: ${c.cel||'-'}</small><br><br><span style="color:#c62828;font-weight:700">O cliente não conseguirá mais acessar o clube de fidelidade até ser desbloqueado.</span>`,
      'Sim, bloquear',
      async ()=>{
        clientes[clienteId].bloqueado=true;
        let ok=false;
        if(STATE.clientes?.clientes){STATE.clientes.clientes=clientes;ok=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha',`Admin: bloquear ${c.nome||clienteId}`);}
        else{STATE.fidelidade.clientes=clientes;ok=await salvarArquivo(PATHS.fidelidade,STATE.fidelidade,'fidelidadeSha',`Admin: bloquear ${c.nome||clienteId}`);}
        if(ok)renderClientes();
      }
    );
  }else{
    /* Desbloquear: também zera tentativas_fraude para o cliente poder tentar novamente */
    clientes[clienteId].bloqueado=false;
    clientes[clienteId].tentativas_fraude=0;
    clientes[clienteId].motivo_bloqueio=null;
    const agora=new Date().toISOString();
    if(!clientes[clienteId].historico_alteracoes)clientes[clienteId].historico_alteracoes=[];
    clientes[clienteId].historico_alteracoes.push({data:agora,tipo:'desbloqueio',descricao:'Conta desbloqueada e tentativas zeradas pelo admin',por:'admin'});
    let ok=false;
    if(STATE.clientes?.clientes){STATE.clientes.clientes=clientes;ok=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha',`Admin: desbloquear ${c.nome||clienteId}`);}
    else{STATE.fidelidade.clientes=clientes;ok=await salvarArquivo(PATHS.fidelidade,STATE.fidelidade,'fidelidadeSha',`Admin: desbloquear ${c.nome||clienteId}`);}
    if(ok){toast('✅ Conta desbloqueada e tentativas zeradas. Mudança salva no GitHub.','sucesso');renderClientes();}
  }
}
// ═══════════════════════════════════════════════════════════
// FUNÇÕES DE GESTÃO MANUAL DO CLUBE DE
// Todas as ações salvam no GitHub (dados/clientes.json / dados/fidelidade.json)
// para atualização imediata no site — sem cache de CDN.
// ═══════════════════════════════════════════════════════════

/* Adicionar ponto(s) manualmente para um cliente.
   Admin usa quando o cliente trouxe cupom físico ou houve erro no fluxo. */
async function adicionarPontoManual(clienteId){
  if(!fidRequireWrite())return;
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const c=clientes[clienteId];
  if(!c)return;
  const qtdStr=prompt(`➕ Adicionar pontos para ${c.nome}\nWhatsApp: ${c.cel||'-'}\nPontos atuais: ${c.saldoPontos||0}\n\nQuantidade a adicionar:`);
  if(qtdStr===null)return;
  const n=parseInt(qtdStr,10);
  if(isNaN(n)||n<=0){toast('Quantidade inválida.','erro');return;}
  const motivo=prompt('Motivo ou código do cupom (opcional):')||'Adicionado manualmente pelo admin';
  const agora=new Date().toISOString();
  clientes[clienteId].saldoPontos=(clientes[clienteId].saldoPontos||0)+n;
  if(!clientes[clienteId].historico_alteracoes)clientes[clienteId].historico_alteracoes=[];
  clientes[clienteId].historico_alteracoes.push({data:agora,tipo:'ponto_manual',descricao:motivo,por:'admin',pontos:n});
  let ok=false;
  if(STATE.clientes?.clientes){STATE.clientes.clientes=clientes;ok=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha',`Admin: +${n}pt para ${c.nome}`);}
  else{STATE.fidelidade.clientes=clientes;ok=await salvarArquivo(PATHS.fidelidade,STATE.fidelidade,'fidelidadeSha',`Admin: +${n}pt para ${c.nome}`);}
  if(ok){toast(`✅ +${n} ponto(s) para ${c.nome}. Novo saldo: ${clientes[clienteId].saldoPontos}. Salvo no GitHub.`,'sucesso');renderClientes();}
}

/* Zerar tentativas de código e desbloquear.
   Usar quando o cliente erroneamente foi bloqueado ou após confirmação pessoal. */
async function zerarTentativas(clienteId){
  if(!fidRequireWrite())return;
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const c=clientes[clienteId];
  if(!c)return;
  const agora=new Date().toISOString();
  clientes[clienteId].tentativas_fraude=0;
  clientes[clienteId].bloqueado=false;
  clientes[clienteId].motivo_bloqueio=null;
  if(!clientes[clienteId].historico_alteracoes)clientes[clienteId].historico_alteracoes=[];
  clientes[clienteId].historico_alteracoes.push({data:agora,tipo:'reset_tentativas',descricao:'Tentativas zeradas e conta desbloqueada pelo admin',por:'admin'});
  let ok=false;
  if(STATE.clientes?.clientes){STATE.clientes.clientes=clientes;ok=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha',`Admin: zerar tentativas ${c.nome||clienteId}`);}
  else{STATE.fidelidade.clientes=clientes;ok=await salvarArquivo(PATHS.fidelidade,STATE.fidelidade,'fidelidadeSha',`Admin: zerar tentativas ${c.nome||clienteId}`);}
  if(ok){toast('✅ Tentativas zeradas e conta desbloqueada. Salvo no GitHub.','sucesso');renderClientes();}
}

/* Validar código manualmente pelo admin.
   Marca o código como usado em fidelidade.json E adiciona 1 ponto ao cliente em clientes.json.
   Ambas as mudanças são persistidas no GitHub para atualização imediata no site. */
async function adminValidarCodigo(clienteId){
  if(!fidRequireWrite())return;
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const c=clientes[clienteId];
  if(!c)return;
  const codigo=(prompt(`✅ Validar código para ${c.nome}\nWhatsApp: ${c.cel||'-'}\nPontos atuais: ${c.saldoPontos||0}\n\nDigite o código do cupom:`)||'').trim().toUpperCase();
  if(!codigo)return;
  const codigos=STATE.fidelidade?.['códigos']||STATE.fidelidade?.codigos||{};
  const entrada=codigos[codigo];
  if(!entrada){toast(`Código "${codigo}" não encontrado em fidelidade.json.`,'erro');return;}
  if(entrada.status!=='disponível'&&entrada.status!=='disponivel'){toast(`Código "${codigo}" já foi utilizado (status: ${entrada.status}).`,'erro');return;}
  const usados=c.codigosUsados||[];
  if(usados.indexOf(codigo)!==-1){toast(`${c.nome} já usou este código anteriormente.`,'erro');return;}

  /* registrar: +1 ponto, marcar código como usado, zerar tentativas de fraude */
  const agora=new Date().toISOString();
  clientes[clienteId].saldoPontos=(clientes[clienteId].saldoPontos||0)+1;
  clientes[clienteId].codigosUsados=[...usados,codigo];
  clientes[clienteId].totalCodigos=(clientes[clienteId].totalCodigos||0)+1;
  clientes[clienteId].tentativas_fraude=0;
  if(!clientes[clienteId].historico_alteracoes)clientes[clienteId].historico_alteracoes=[];
  clientes[clienteId].historico_alteracoes.push({data:agora,tipo:'codigo_validado_admin',descricao:`Código ${codigo} validado manualmente pelo admin`,por:'admin',pontos:1});

  /* atualizar status do código em fidelidade.json */
  const chave=STATE.fidelidade?.['códigos']?'códigos':'codigos';
  STATE.fidelidade[chave][codigo]=Object.assign({},entrada,{status:'usado',usadoPor:c.cel||clienteId,usadoEm:agora});

  /* salvar clientes.json */
  let okC=false;
  if(STATE.clientes?.clientes){STATE.clientes.clientes=clientes;okC=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha',`Admin: código ${codigo} → ${c.nome}`);}

  /* salvar fidelidade.json */
  const okF=await salvarArquivo(PATHS.fidelidade,STATE.fidelidade,'fidelidadeSha',`Admin: código ${codigo} usado por ${c.nome}`);

  if(okC||okF){
    toast(`✅ Código ${codigo} validado! ${c.nome} agora tem ${clientes[clienteId].saldoPontos} ponto(s). Salvo no GitHub.`,'sucesso');
    renderClientes();
    if(typeof renderCódigos==='function')renderCódigos();
  }
}

/* Cadastrar cliente manualmente pelo admin (sem passar pelo formulário do site).
   Útil quando o cliente está presencialmente na loja. */
async function cadastrarClienteManual(){
  abrirFormCliente();
}

// ═══════════════════════════════════════════════════════════
// SORTEIOS MENSAIS — ADMIN (via Cloudflare Worker KV)
// ═══════════════════════════════════════════════════════════

// Cache local dos inscritos carregados da API
let _sortInscritos = [];

function _sortMsg(txt, tipo) {
  const el = document.getElementById('sort-inscritos-msg');
  if (!el) return;
  if (!txt) { el.style.display = 'none'; el.textContent = ''; return; }
  el.style.display = 'block';
  el.style.color = tipo === 'erro' ? '#c62828' : tipo === 'ok' ? '#2e7d32' : '#555';
  el.textContent = txt;
}

async function carregarInscritosSorteio() {
  const tbody = document.getElementById('sort-inscritos-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888">⏳ Carregando…</td></tr>';
  _sortMsg('');
  const sessionToken = getWorkerSessionToken();
  if (!sessionToken) {
    _sortMsg('Sessão administrativa expirada. Faça login novamente para carregar inscritos da fonte oficial.', 'erro');
    tbody.innerHTML = '<tr><td colspan="6" style="color:#c62828;text-align:center">Sessão expirada.</td></tr>';
    return;
  }
  try {
    const r = await fetchWithTimeout(ITAP_WORKER_API + '/api/admin/sorteio/inscritos', {
      headers: getWorkerAuthHeaders()
    }, 12000);
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('Resposta não-JSON (Worker indisponível)');
    const dados = await r.json();
    if (!dados.ok) { _sortMsg('Erro ao carregar: ' + (dados.error || r.status), 'erro'); tbody.innerHTML = '<tr><td colspan="6" style="color:#c62828;text-align:center">Falha ao carregar inscritos.</td></tr>'; return; }
    _sortInscritos = dados.inscritos || [];
    _renderTabelaInscritos(_sortInscritos);
  } catch (e) {
    _sortMsg('Erro ao carregar inscritos da fonte oficial: ' + (e && e.message ? e.message : 'falha de rede'), 'erro');
    tbody.innerHTML = '<tr><td colspan="6" style="color:#c62828;text-align:center">Falha ao carregar inscritos.</td></tr>';
  }
}

function _carregarInscritosLocal() {
  const tbody = document.getElementById('sort-inscritos-tbody');
  const lista = (STATE.fidelidade?.sorteioInscritos || []).map((ins, i) => {
    const id = ins.id || ('LOCAL-' + String(i + 1).padStart(4, '0'));
    return {
      id,
      nome: ins.nome || '—',
      birthdate: ins.dataNasc || '',
      phone: String(ins.cel || '').replace(/\D/g, ''),
      created_at: ins.cadastro || ins.data || ''
    };
  });
  _sortInscritos = lista;
  _renderTabelaInscritos(lista);
  if (lista.length === 0) {
    _sortMsg('ℹ️ Worker API offline — nenhum inscrito local encontrado. Adicione inscritos manualmente abaixo.', 'aviso');
  } else {
    _sortMsg('⚠️ Worker API offline — exibindo ' + lista.length + ' inscrito(s) adicionados manualmente.', 'aviso');
  }
}

function _fmtData(iso) {
  if (!iso) return '—';
  const d = iso.slice(0, 10).split('-');
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : iso.slice(0, 10);
}

function _fmtDataResumida(iso) {
  if (!iso) return '—';
  const d = iso.slice(0, 10).split('-');
  return d.length === 3 ? `${d[1]}/${d[0]}` : iso.slice(0, 7);
}

function _fmtTel(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,3)}****-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,3)}***-${d.slice(6)}`;
  return phone || '—';
}

function _renderTabelaInscritos(lista) {
  const tbody = document.getElementById('sort-inscritos-tbody');
  const badge = document.getElementById('sort-contador-badge');
  if (badge) badge.textContent = lista.length + ' inscrito' + (lista.length !== 1 ? 's' : '');
  if (!tbody) return;
  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;font-style:italic">Nenhum inscrito encontrado.</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map((ins, i) => {
    const idEsc = String(ins.id || '').replace(/&/g,'\x26amp;').replace(/"/g,'\x26quot;').replace(/</g,'\x26lt;').replace(/>/g,'\x26gt;');
    return `<tr>
      <td style="font-size:.78rem;color:#555">${ins.id || '—'}</td>
      <td><strong>${ins.nome || '—'}</strong></td>
      <td>${_fmtDataResumida(ins.birthdate)}</td>
      <td>${_fmtTel(ins.phone)}</td>
      <td style="font-size:.78rem;color:#777">${_fmtData(ins.created_at)} ${(ins.created_at||'').slice(11,16)}</td>
      <td style="white-space:nowrap">
        <button data-sort-edit="${idEsc}" style="background:#1565c0;color:#fff;border:none;border-radius:6px;padding:4px 9px;font-size:.75rem;cursor:pointer;margin-right:4px">✏️</button>
        <button data-sort-del="${idEsc}" style="background:#c62828;color:#fff;border:none;border-radius:6px;padding:4px 9px;font-size:.75rem;cursor:pointer">🗑️</button>
      </td>
    </tr>`;
  }).join('');
  // Attach event listeners (avoid inline onclick to prevent XSS)
  tbody.querySelectorAll('[data-sort-edit]').forEach(btn =>
    btn.addEventListener('click', () => editarInscritoSorteio(btn.getAttribute('data-sort-edit')))
  );
  tbody.querySelectorAll('[data-sort-del]').forEach(btn =>
    btn.addEventListener('click', () => deletarInscritoSorteio(btn.getAttribute('data-sort-del')))
  );
}

function filtrarInscritosSorteio() {
  const q = (document.getElementById('sort-busca')?.value || '').toLowerCase();
  if (!q) { _renderTabelaInscritos(_sortInscritos); return; }
  const filtrado = _sortInscritos.filter(ins =>
    (ins.nome || '').toLowerCase().includes(q) ||
    (ins.phone || '').includes(q) ||
    (ins.id || '').toLowerCase().includes(q)
  );
  _renderTabelaInscritos(filtrado);
}

function editarInscritoSorteio(id) {
  const ins = _sortInscritos.find(i => i.id === id);
  if (!ins) return;
  document.getElementById('sort-edit-id-hidden').value = id;
  document.getElementById('sort-edit-id-label').textContent = id;
  document.getElementById('sort-edit-nome').value = ins.nome || '';
  document.getElementById('sort-edit-nasc').value = ins.birthdate || '';
  document.getElementById('sort-edit-tel').value = String(ins.phone || '').replace(/\D/g,'');
  document.getElementById('sort-edit-box').style.display = 'block';
  document.getElementById('sort-edit-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function fecharEdicaoInscritoSorteio() {
  document.getElementById('sort-edit-box').style.display = 'none';
}

async function salvarEdicaoInscritoSorteio() {
  const id   = document.getElementById('sort-edit-id-hidden').value;
  const nome = document.getElementById('sort-edit-nome').value.trim();
  const nasc = document.getElementById('sort-edit-nasc').value.trim();
  const tel  = document.getElementById('sort-edit-tel').value.replace(/\D/g,'');
  if (!nome || nome.length < 3) { toast('Nome precisa ter pelo menos 3 caracteres.', 'erro'); return; }
  if (!nasc || !/^\d{4}-\d{2}-\d{2}$/.test(nasc) || isNaN(new Date(nasc).getTime())) { toast('Data de nascimento inválida (use AAAA-MM-DD).', 'erro'); return; }
  if (!tel || tel.length < 10) { toast('Telefone inválido.', 'erro'); return; }
  const sessionToken = getWorkerSessionToken();
  if (!sessionToken) { toast('Sessão administrativa expirada. Faça login novamente.', 'erro'); return; }

  // Modo local (Worker offline): atualiza em STATE.fidelidade.sorteioInscritos
  if (id.startsWith('LOCAL-')) {
    const idx = _sortInscritos.findIndex(i => i.id === id);
    if (idx > -1) {
      const localIdx = parseInt(id.replace('LOCAL-',''), 10) - 1;
      const arr = STATE.fidelidade?.sorteioInscritos;
      if (arr && arr[localIdx]) {
        arr[localIdx].nome = nome;
        arr[localIdx].dataNasc = nasc;
        arr[localIdx].cel = tel;
      }
      const ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: editar inscrito manual ' + nome);
      if (ok) { toast('✅ Inscrito atualizado!', 'sucesso'); fecharEdicaoInscritoSorteio(); await carregarInscritosSorteio(); }
      else { toast('❌ Erro ao salvar.', 'erro'); }
    }
    return;
  }

  mostrarLoading('Salvando alterações…');
  try {
    const r = await fetchWithTimeout(ITAP_WORKER_API + '/api/admin/sorteio/inscritos/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: getWorkerAuthHeaders(),
      body: JSON.stringify({ nome, birthdate: nasc, phone: tel })
    }, 10000);
    const dados = await r.json();
    if (dados.ok) {
      toast('✅ Inscrito atualizado com sucesso!', 'sucesso');
      fecharEdicaoInscritoSorteio();
      await carregarInscritosSorteio();
    } else {
      toast('❌ ' + (dados.error || 'Erro ao salvar.'), 'erro');
    }
  } catch (e) {
    toast('Erro de rede: ' + e.message, 'erro');
  } finally {
    ocultarLoading();
  }
}

async function deletarInscritoSorteio(id) {
  const ins = _sortInscritos.find(i => i.id === id);
  const nomeExib = ins ? ins.nome : id;
  if (!confirm(`Remover o inscrito "${nomeExib}" (${id})?\n\nEsta ação não pode ser desfeita.`)) return;
  const sessionToken = getWorkerSessionToken();
  if (!sessionToken) { toast('Sessão administrativa expirada. Faça login novamente.', 'erro'); return; }

  // Modo local (Worker offline): remove de STATE.fidelidade.sorteioInscritos
  if (id.startsWith('LOCAL-')) {
    const localIdx = parseInt(id.replace('LOCAL-',''), 10) - 1;
    const arr = STATE.fidelidade?.sorteioInscritos;
    if (arr && arr[localIdx] !== undefined) {
      arr.splice(localIdx, 1);
      const ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: remover inscrito manual ' + nomeExib);
      if (ok) { toast('✅ Inscrito removido.', 'sucesso'); await carregarInscritosSorteio(); }
      else { toast('❌ Erro ao remover.', 'erro'); }
    }
    return;
  }

  mostrarLoading('Removendo inscrito…');
  try {
    const r = await fetchWithTimeout(ITAP_WORKER_API + '/api/admin/sorteio/inscritos/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: getWorkerAuthHeaders()
    }, 10000);
    const dados = await r.json();
    if (dados.ok) {
      toast('✅ Inscrito removido.', 'sucesso');
      await carregarInscritosSorteio();
    } else {
      toast('❌ ' + (dados.error || 'Erro ao remover.'), 'erro');
    }
  } catch (e) {
    toast('Erro de rede: ' + e.message, 'erro');
  } finally {
    ocultarLoading();
  }
}

function copiarInscritosSorteio() {
  if (_sortInscritos.length === 0) { toast('Carregue a lista antes de copiar.', 'aviso'); return; }
  const lista = _sortInscritos.map((ins, i) =>
    `${i+1}. ${ins.id} — ${ins.nome} — Nasc: ${_fmtData(ins.birthdate)} — Tel: ${_fmtTel(ins.phone)}`
  ).join('\n');
  copiarTextoSeguro(lista).then((ok)=>toast(ok?`Lista de ${_sortInscritos.length} inscritos copiada!`:'Erro ao copiar inscritos.', ok?'sucesso':'erro'));
}

function exportarInscritosCSV() {
  if (_sortInscritos.length === 0) { toast('Carregue a lista antes de exportar.', 'aviso'); return; }
  const header = 'ID,Nome,Data Nasc.,Telefone,Cadastrado Em';
  const linhas = _sortInscritos.map(ins =>
    [ins.id, ins.nome, ins.birthdate, ins.phone, (ins.created_at||'').slice(0,16)].map(v => '"' + String(v||'').replace(/"/g,'""') + '"').join(',')
  );
  const csv = [header, ...linhas].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inscritos-sorteio-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function salvarSorteio() {
  const data    = document.getElementById('sort-data-prox').value;
  const premio  = document.getElementById('sort-premio').value.trim();
  const status  = document.getElementById('sort-status').value;
  const venc    = document.getElementById('sort-vencedor').value.trim();
  const obs     = document.getElementById('sort-obs').value.trim();
  const dataFim = document.getElementById('sort-datafim').value;
  if (!STATE.fidelidade) STATE.fidelidade = {};
  STATE.fidelidade.sorteio = { dataProx: data, dataFim, premio, status, vencedor: venc, obs, atualizado: new Date().toISOString() };
  const ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: atualizar configuração do sorteio mensal');
  if (ok) {
    const msg = document.getElementById('sort-msg');
    if (msg) { msg.textContent = '✅ Sorteio salvo!'; msg.style.color = '#2e7d32'; setTimeout(() => msg.textContent = '', 3000); }
  }
}

function preencherSorteio() {
  const s = STATE.fidelidade?.sorteio || {};
  const dp = document.getElementById('sort-data-prox'); if (dp) dp.value = s.dataProx || '';
  const sp = document.getElementById('sort-premio');    if (sp) sp.value = s.premio || '1 caixa de 5 litros de sorvete tipo artesanal';
  const ss = document.getElementById('sort-status');    if (ss) ss.value = s.status || 'ativo';
  const sv = document.getElementById('sort-vencedor');  if (sv) sv.value = s.vencedor || '';
  const so = document.getElementById('sort-obs');       if (so) so.value = s.obs || '';
  const sd = document.getElementById('sort-datafim');   if (sd) sd.value = s.dataFim || '';
  const se = document.getElementById('sort-datafim-exib');
  if (se && s.dataFim) {
    const [y, m, d] = s.dataFim.split('-');
    se.textContent = `${d}/${m}/${y}`;
  }
}

function mascaraTelAdmin(el) {
  let v = el.value.replace(/\D/g,'');
  if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3');
  else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3');
  el.value = v;
}

function copiarSorteio(){
  const clientes=getClientes().filter(c=>!c.bloqueado&&!c.fraude);
  const lista=clientes.map((c,i)=>`${i+1}. ${c.nome||'-'} - ${c.cel||'-'}`).join('\n');
  copiarTextoSeguro(lista).then((ok)=>toast(ok?`Lista de ${clientes.length} clientes copiada para sorteio!`:'Erro ao copiar lista para sorteio.',ok?'sucesso':'erro'));
}
function preencherFidelidade(){
  const cfg=STATE.config||{};
  document.getElementById('fid-prêmio-milk-nome').value=cfg.premioMilkshake||'Milkshake 300ml';
  document.getElementById('fid-pts-milk').value=cfg.pontosMilkshake||10;
  document.getElementById('fid-prêmio-caixa-nome').value=cfg.premioCaixa||'Caixa 7 Bolas';
  document.getElementById('fid-pts-caixa').value=cfg.pontosCaixa||30;
  document.getElementById('fid-título').value=cfg.fidelidadeTitulo||'Programa de Fidelidade';
  document.getElementById('fid-descrição').value=cfg.fidelidadeDescricao||'Acumule pontos e ganhe prêmios incriveis!';
  const fidComo=document.getElementById('fid-como-funciona-lista');
  if(fidComo) fidComo.value=Array.isArray(cfg.fidelidadeComoFunciona)?cfg.fidelidadeComoFunciona.join('\n'):'';
  const fidRegrasResumo=document.getElementById('fid-regras-resumo-lista');
  if(fidRegrasResumo) fidRegrasResumo.value=Array.isArray(cfg.fidelidadeRegrasResumo)?cfg.fidelidadeRegrasResumo.join('\n'):'';
  const fidRegrasUrl=document.getElementById('fid-regras-url');
  if(fidRegrasUrl) fidRegrasUrl.value=cfg.fidelidadeRegrasUrl||'';
  const fidResgateUrl=document.getElementById('fid-resgate-url');
  if(fidResgateUrl) fidResgateUrl.value=cfg.fidelidadeResgateWhatsappUrl||'';

  // Novos campos Fase 3.2
  const fp=cfg.fidelidadePagina||{};
  const fidComoTit=document.getElementById('fidelidade-como-funciona-titulo');
  if(fidComoTit) fidComoTit.value=fp.comoFuncionaTitulo||'Como funciona';
  const fidAcaoTit=document.getElementById('fidelidade-acao-titulo');
  if(fidAcaoTit) fidAcaoTit.value=fp.acaoTitulo||'Quero participar do ';
  const fidBtnCad=document.getElementById('fidelidade-btn-cadastro');
  if(fidBtnCad) fidBtnCad.value=fp.btnCadastro||'Quero participar do ';
  const fidBtnLog=document.getElementById('fidelidade-btn-login');
  if(fidBtnLog) fidBtnLog.value=fp.btnLogin||'Já sou cadastrado / Digitar código';
  const fidRegraTit=document.getElementById('fidelidade-regras-titulo');
  if(fidRegraTit) fidRegraTit.value=fp.regrasTitulo||'Regras do ';
  const fidBtnAceite=document.getElementById('fidelidade-btn-aceitar-regras');
  if(fidBtnAceite) fidBtnAceite.value=fp.btnAceitarRegras||'Li e aceito as regras do ';
  const fidRegTit=document.getElementById('fidelidade-regulamento-titulo');
  if(fidRegTit) fidRegTit.value=fp.regulamentoTitulo||'Regras completas do programa';
  const fidRegSum=document.getElementById('fidelidade-regulamento-summary');
  if(fidRegSum) fidRegSum.value=fp.regulamentoSummary||'📜 Ler regulamento completo do ';

  const seoPg=cfg.seoPaginas||{};
  const fidSeoTit=document.getElementById('cfg-seo-fidelidade-titulo');
  if(fidSeoTit) fidSeoTit.value=seoPg.fidelidade?.titulo||'';
  const fidSeoDesc=document.getElementById('cfg-seo-fidelidade-descricao');
  if(fidSeoDesc) fidSeoDesc.value=seoPg.fidelidade?.descricao||'';

  const fidSeoTitOld=document.getElementById('fid-seo-titulo');
  if(fidSeoTitOld) fidSeoTitOld.value=seoPg.fidelidade?.titulo||'';
  const fidSeoDescOld=document.getElementById('fid-seo-descricao');
  if(fidSeoDescOld) fidSeoDescOld.value=seoPg.fidelidade?.descricao||'';
  const fidSeoPal=document.getElementById('fid-seo-palavras');
  if(fidSeoPal) fidSeoPal.value=seoPg.fidelidade?.palavrasChave||'';
  atualizarStatsCódigos();

  // Carregar configurações de sorteios e pontuação
  try { carregarConfigSorteio(); } catch(e) { console.error('[Admin] Erro ao carregar sorteio', e); }
  try { carregarRegrasPontuacao(); } catch(e) { console.error('[Admin] Erro ao carregar regras pontuação', e); }
}


function atualizarStatsCódigos(){
  const códigos=fidGetCodigos();
  const total=Object.keys(códigos).length;
  const disponíveis=Object.values(códigos).filter(c=>c.status==='disponível').length;
  const usados=Object.values(códigos).filter(c=>c.status==='usado').length;
  const liberados=STATE.fidelidade?.liberados||0;
  document.getElementById('fid-total').textContent=total;
  document.getElementById('fid-disponíveis').textContent=disponíveis;
  document.getElementById('fid-usados').textContent=usados;
  document.getElementById('fid-liberados').textContent=liberados;
}
function renderCódigos(){
  const códigos=fidGetCodigos();
  const filtro=document.getElementById('fid-filtro-status').value;
  let lista=Object.entries(códigos);
  if(filtro)lista=lista.filter(([,v])=>v.status===filtro);
  lista.sort((a,b)=>(a[1].idx||0)-(b[1].idx||0));
  if(!lista.length){document.getElementById('códigos-lista').innerHTML='<p style="color:#999;text-align:center;padding:20px">Nenhum código encontrado.</p>';document.getElementById('fid-pag-info').textContent='';return;}
  const max=200;
  const exibir=lista.slice(0,max);
  let html=exibir.map(([cod,v])=>{const statusClass=v.status==='disponível'?'cod-status-ok':'cod-status-usado';const statusTxt=v.status==='disponível'?'Disponível':'Usado';const info=v.usadoPor?`por ${v.usadoPor}`:`lote ${v.lote||1}`;return`<div class="cod-item"><span class="cod-code">${cod}</span><span class="${statusClass}">${statusTxt}</span><span class="cod-info">${info}</span><button data-fid-write onclick="excluirCodigo('${cod}')" style="background:none;border:none;color:#c62828;font-size:.8rem;cursor:pointer;padding:2px 6px" title="Excluir código">🗑️</button></div>`;}).join('');
  document.getElementById('códigos-lista').innerHTML=html;
  document.getElementById('fid-pag-info').textContent=`Exibindo ${exibir.length} de ${lista.length} códigos`;
  atualizarStatsCódigos();
  fidApplyReadOnlyGuard();
}
// =====================================================
// GERADOR DE LOTES DETERMINÍSTICO (mesmo algoritmo do fidelidade-admin.html)
// =====================================================
// Capacidade histórica restaurada do banco de fidelidade: 1.000.000 códigos.
const FID_TOTAL_BANCO = 1000000;
const FID_LOTE_SIZE   = 100;
const FID_SALT        = 'ITAP0L1T4N4#S3CR3T@2024!';
// REGRA DOS CARACTERES PERMITIDOS NOS CUPONS (sem O,I,L,0,1 para evitar confusao visual):
// Formato fixo do cupom (10 caracteres): XXXXXXX#D& (ex.: 7ANXBZQ#6&)
// 7 chars base + '#' + 1 dígito + '&'
// Sem O,I,L,0,1 para evitar confusão visual com caracteres parecidos.
const FID_CODE_BASE_LENGTH = 7;
const FID_CHARS_BASE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const FID_CHARS_DIGITS = '23456789';
// Tamanho do código na versão fallback de impressão (+25% vs base original 31.8pt).
const FID_ETQ_CODE_FONT_PRINT_PT = 39.75;
// Tamanho base do código no jsPDF (+25% vs base original 31.5pt).
const FID_ETQ_CODE_FONT_BASE_PT = 39.375;
// Tamanho mínimo do código no jsPDF quando precisar reduzir para caber (+25% vs 19.5pt).
const FID_ETQ_CODE_FONT_MIN_PT = 24.375;
const FID_ETQ_URL_FONT_BASE_PT = 7.3;
const FID_ETQ_URL_FONT_MIN_PT = 6.4;
const FID_ETQ_URL_MIN_WIDTH_MM = 18;
const FID_ETQ_SEQ_FONT_PT = 9.4;
// Fração máxima segura da altura útil do campo do código para evitar que o texto encoste no cabeçalho/rodapé.
const FID_ETQ_CODE_MAX_HEIGHT_RATIO = 0.78;
const FID_WATERMARK_OPACITY = 0.08;
const FID_ETQ_WATERMARK_TOP_PADDING_MM = 3;
const FID_ETQ_WATERMARK_BOTTOM_PADDING_MM = 3;
const FID_ETQ_WATERMARK_POSITIONS = [
  { relX: 0.08, relY: 0.12, relSize: 0.22, rotation: -12 },
  { relX: 0.39, relY: 0.36, relSize: 0.2, rotation: -4 },
  { relX: 0.71, relY: 0.58, relSize: 0.18, rotation: 10 }
];
const FID_ETQ_CODE_SHIFT_UP_MM = 1.8;
const FID_ETQ_CROP_LEN_MM = 2.2;
const FID_ETQ_CROP_GAP_MM = 0.8;
function fidGerarCodigo(idx){
  const s=FID_SALT;
  let a=idx+1,b=0;
  for(let i=0;i<s.length;i++)b+=s.charCodeAt(i);
  let x=(a*1664525+1013904223)>>>0;
  x=(x^(x>>>11))>>>0;
  x=(x+(b*22695477+1))>>>0;
  x=(x^(x>>>16))>>>0;
  x=(x*2246822519)>>>0;
  x=(x^(x>>>13))>>>0;
  x=(x*3266489917)>>>0;
  x=(x^(x>>>16))>>>0;
  let parteBase='';
  for(let i=0;i<FID_CODE_BASE_LENGTH;i++){
    x=(x*1664525+1013904223+i*31+a*7)>>>0;
    x=(x^(x>>>15))>>>0;
    parteBase+=FID_CHARS_BASE[x%FID_CHARS_BASE.length];
  }
  x=(x*1664525+1013904223+FID_CODE_BASE_LENGTH*31+a*7)>>>0;
  x=(x^(x>>>15))>>>0;
  const digito=FID_CHARS_DIGITS[x%FID_CHARS_DIGITS.length];
  return `${parteBase}#${digito}&`;
}
function fidMostrarAlerta(msg,tipo){
  const el=document.getElementById('fid-alerta-lote');
  if(!el)return;
  el.textContent=msg;
  el.className='fid-alerta '+(tipo==='ok'?'ok':'erro');
  if(tipo==='ok')setTimeout(()=>{el.className='fid-alerta';},5000);
}
function fidRenderProgresso(){
  const n=STATE.fidelidade?.liberados||0;
  const pct=(n/FID_TOTAL_BANCO*100).toFixed(3);
  const barra=document.getElementById('fid-prog-barra');
  const texto=document.getElementById('fid-prog-texto');
  const btn=document.getElementById('btn-liberar-lote');
  if(barra)barra.style.width=pct+'%';
  if(texto)texto.textContent=`${n.toLocaleString('pt-BR')} / ${FID_TOTAL_BANCO.toLocaleString('pt-BR')} códigos liberados`;
  const restante=FID_TOTAL_BANCO-n;
  if(btn){
    if(restante>0){btn.textContent=`🎲 Liberar 100 Códigos (${restante.toLocaleString('pt-BR')} restantes)`;btn.disabled=false;}
    else{btn.textContent='✅ Banco Esgotado (1.000.000/1.000.000)';btn.disabled=true;}
  }
}
function fidRenderLoteAtual(){
  const lote=JSON.parse(localStorage.getItem('fid_lote_admin')||'null');
  if(!lote)return;
  const wrap=document.getElementById('fid-lote-wrap');
  const info=document.getElementById('fid-lote-info');
  const grid=document.getElementById('fid-codigos-grid');
  if(!wrap)return;
  wrap.style.display='block';
  if(info)info.textContent=`Lote ${lote.loteNum||'?'}: códigos ${lote.inicio} a ${lote.fim} de ${FID_TOTAL_BANCO.toLocaleString('pt-BR')}`;
  const codigos=fidGetCodigos();
  if(grid)grid.innerHTML=lote.codigos.map(c=>{const usado=codigos[c]&&codigos[c].status==='usado';return`<div class="fid-codigo-chip${usado?' usado':''}">${c}</div>`;}).join('');
}
async function liberarLoteFidelidade(){
  if(!fidRequireWrite())return;
  // Se STATE.fidelidade não carregou, evitar gerar lote sem a versão atual do arquivo
  if(!STATE.fidelidade){
    fidMostrarAlerta('⚠️ Dados de fidelidade não carregados. Verifique o token GitHub e recarregue o painel antes de liberar um novo lote.','erro');
    return;
  }
  const atual=STATE.fidelidade.liberados||0;
  if(atual>=FID_TOTAL_BANCO){fidMostrarAlerta('⚠️ Todos os 1.000.000 códigos já foram liberados!','erro');return;}
  const btn=document.getElementById('btn-liberar-lote');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="fid-spinner"></span> Gerando e salvando...';
  }
  const inicio=atual;
  const fim=Math.min(atual+FID_LOTE_SIZE,FID_TOTAL_BANCO);
  const loteNum=Math.ceil(fim/FID_LOTE_SIZE);
  const novos=[];
  for(let i=inicio;i<fim;i++)novos.push(fidGerarCodigo(i));
  const fidData=fidEnsureCodigos();
  novos.forEach((c,i)=>{fidData.codigos[c]={status:'disponível',idx:inicio+i,lote:loteNum};});
  STATE.fidelidade.liberados=fim;
  STATE.fidelidade.última_atualização=new Date().toISOString();
  localStorage.setItem('fid_lote_admin',JSON.stringify({inicio:inicio+1,fim,codigos:novos,loteNum}));
  const ok=await salvarArquivo(PATHS.fidelidade,STATE.fidelidade,'fidelidadeSha',`Fidelidade: Lote ${loteNum} liberado — ${fim.toLocaleString('pt-BR')}/${FID_TOTAL_BANCO.toLocaleString('pt-BR')} códigos`);
  if(btn)btn.disabled=false;
  fidRenderProgresso();
  fidRenderLoteAtual();
  atualizarStatsCódigos();
  renderCódigos();
  if(ok){fidMostrarAlerta(`✅ Lote ${loteNum} liberado e salvo! Contador: ${fim.toLocaleString('pt-BR')} / ${FID_TOTAL_BANCO.toLocaleString('pt-BR')} códigos.`,'ok');}
  else{fidMostrarAlerta('⚠️ Códigos gerados mas NÃO salvos no GitHub. Verifique a conexão.','erro');}
}
function apagarTodosCodigos(){
  if(!fidRequireWrite())return;
  confirmarAcao(
    'Apagar Todos os Códigos',
    'Tem certeza que deseja apagar <strong>TODOS</strong> os códigos liberados?<br><br><span style="color:#c62828;font-weight:700">Esta ação é irreversível!</span>',
    'Sim, apagar todos',
    async () => {
      if(!STATE.fidelidade)STATE.fidelidade={liberados:0,códigos:{},clientes:{},fraudes:{}};
      const fidData=fidEnsureCodigos();
      STATE.fidelidade[fidData.key]={};
      STATE.fidelidade.liberados=0;
      STATE.fidelidade.última_atualização=new Date().toISOString();
      localStorage.removeItem('fid_lote_admin');
      const wrap=document.getElementById('fid-lote-wrap');
      if(wrap)wrap.style.display='none';
      const ok=await salvarArquivo(PATHS.fidelidade,STATE.fidelidade,'fidelidadeSha','Fidelidade: todos os códigos apagados pelo admin');
      fidRenderProgresso();
      atualizarStatsCódigos();
      renderCódigos();
      if(ok)fidMostrarAlerta('🗑️ Todos os códigos apagados do GitHub.','ok');
    }
  );
}
async function fidEnsureJsPDF(){
  const existing = (window.jspdf && typeof window.jspdf.jsPDF === 'function')
    ? window.jspdf.jsPDF
    : (typeof window.jsPDF === 'function' ? window.jsPDF : null);
  if(existing) return existing;
  if(fidEnsureJsPDF._loading) return fidEnsureJsPDF._loading;
  fidEnsureJsPDF._loading = new Promise((resolve, reject) => {
    const urls = [
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js'
    ];
    const tryLoad = (idx) => {
      const src = urls[idx];
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      const cleanup = () => { try{ script.remove(); }catch(e){} };
      script.onload = () => {
        const jsPDF = (window.jspdf && typeof window.jspdf.jsPDF === 'function')
          ? window.jspdf.jsPDF
          : (typeof window.jsPDF === 'function' ? window.jsPDF : null);
        if(jsPDF){ cleanup(); resolve(jsPDF); return; }
        cleanup();
        if(idx + 1 < urls.length) tryLoad(idx + 1);
        else reject(new Error('jsPDF carregou, mas não expôs jsPDF no window.'));
      };
      script.onerror = () => {
        cleanup();
        if(idx + 1 < urls.length) tryLoad(idx + 1);
        else reject(new Error('Falha ao carregar jsPDF (CDNs indisponíveis).'));
      };
      document.head.appendChild(script);
    };
    tryLoad(0);
  });
  fidEnsureJsPDF._loading = fidEnsureJsPDF._loading.catch(err => {
    fidEnsureJsPDF._loading = null;
    throw err;
  });
  return fidEnsureJsPDF._loading;
}
function fidColetarCodigosParaEtiquetas(){
  const lote = JSON.parse(localStorage.getItem('fid_lote_admin') || 'null');
  if(lote && Array.isArray(lote.codigos) && lote.codigos.length){
    return { codigos: lote.codigos.slice(), origem: 'lote', lote };
  }
  const codigosConfig = STATE.config?.fidelidade?.codigos;
  if(Array.isArray(codigosConfig) && codigosConfig.length){
    return { codigos: codigosConfig.slice(), origem: 'config', lote: null };
  }
  const codigosObj = fidGetCodigos();
  const lista = Object.entries(codigosObj)
    .filter(([, v]) => v && (v.status === 'disponível' || v.status === 'disponivel'))
    .sort((a, b) => ((a[1].idx || 0) - (b[1].idx || 0)))
    .map(([cod]) => cod);
  if(lista.length){
    return { codigos: lista, origem: 'disponiveis', lote: null };
  }
  const placeholders = Array.from({ length: 100 }, (_, i) => `CÓDIGO ${String(i + 1).padStart(3, '0')}`);
  return { codigos: placeholders, origem: 'placeholder', lote: null };
}
 /**
  * Monta metadados laterais (lote e número sequencial) para cada etiqueta.
  * Prioriza dados persistidos em fidelidade.códigos (lote/idx) e usa fallback do lote atual quando disponível.
  * @param {string[]} codigos Lista de códigos na ordem de impressão.
  * @param {{loteNum?: number, inicio?: number}|null} lote Dados do último lote liberado (quando houver).
  * @returns {{loteTexto:string, sequenciaTexto:string}[]} Metadados alinhados por índice da lista de códigos.
  */
  function fidMontarMetadadosEtiquetas(codigos, lote){
  const codigosObj = fidGetCodigos();
  return codigos.map((codigo, i) => {
    const clean = String(codigo || '').trim();
    if(!clean) return { loteTexto: '', sequenciaTexto: '' };
    const meta = codigosObj[clean] || {};
    let loteNum = Number(meta.lote || lote?.loteNum || 0);
    let numeroSequencial = Number.isFinite(Number(meta.idx)) ? (Number(meta.idx) + 1) : NaN;
    if(!Number.isFinite(numeroSequencial) && lote && Number.isFinite(Number(lote.inicio))){
      numeroSequencial = Number(lote.inicio) + i;
    }
    if(!Number.isFinite(numeroSequencial) || numeroSequencial <= 0){
      numeroSequencial = i + 1;
    }
    if((!Number.isFinite(loteNum) || loteNum <= 0) && Number.isFinite(numeroSequencial) && numeroSequencial > 0){
      loteNum = Math.ceil(numeroSequencial / FID_LOTE_SIZE);
    }
    return {
      loteTexto: loteNum > 0 ? `LOTE ${String(loteNum).padStart(2, '0')}` : 'LOTE --',
      sequenciaTexto: Number.isFinite(numeroSequencial) && numeroSequencial > 0
        ? `Nº ${String(numeroSequencial).padStart(4, '0')}`
        : 'Nº ----'
    };
  });
 }
 /**
  * Ajusta o tamanho da fonte para caber na largura máxima informada (em mm).
  * @param {object} doc Instância jsPDF.
  * @param {string} text Texto a ser renderizado.
  * @param {number} maxWidthMm Largura máxima disponível em milímetros.
  * @param {number} baseSizePt Tamanho base da fonte em pt.
  * @param {number} minSizePt Menor tamanho permitido em pt.
  * @returns {number} Tamanho final da fonte em pt.
  */
 function fidFitTextSizeMm(doc, text, maxWidthMm, baseSizePt, minSizePt){
  doc.setFontSize(baseSizePt);
  const w = doc.getTextWidth(text);
  if(w <= maxWidthMm) return baseSizePt;
  const scaled = Math.floor(baseSizePt * (maxWidthMm / w));
  return Math.max(minSizePt, scaled);
  }
 function fidCalculateMaxFontSizeForHeight(heightMm, minSizePt, ratio = FID_ETQ_CODE_MAX_HEIGHT_RATIO){
  const mmPerPt = 0.352778;
  return Math.max(minSizePt, Math.floor((heightMm / mmPerPt) * ratio));
 }
 function fidDrawCropMarks(doc, x, y, w, h, lenMm, gapMm){
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.12);
  // canto superior esquerdo
  doc.line(x + gapMm, y + gapMm, x + gapMm + lenMm, y + gapMm);
  doc.line(x + gapMm, y + gapMm, x + gapMm, y + gapMm + lenMm);
  // canto superior direito
  doc.line(x + w - gapMm - lenMm, y + gapMm, x + w - gapMm, y + gapMm);
  doc.line(x + w - gapMm, y + gapMm, x + w - gapMm, y + gapMm + lenMm);
  // canto inferior esquerdo
  doc.line(x + gapMm, y + h - gapMm, x + gapMm + lenMm, y + h - gapMm);
  doc.line(x + gapMm, y + h - gapMm - lenMm, x + gapMm, y + h - gapMm);
  // canto inferior direito
  doc.line(x + w - gapMm - lenMm, y + h - gapMm, x + w - gapMm, y + h - gapMm);
  doc.line(x + w - gapMm, y + h - gapMm - lenMm, x + w - gapMm, y + h - gapMm);
 }
  const FID_LOGO_MARCA_DAGUA_SRC = 'images/logo.webp';
  const FID_TEXTO_SORTEIOS = '* SORTEIOS MENSAIS *';
 let fidLogoMarcaDaguaDataUrlCache;
  async function fidGetLogoMarcaDaguaDataUrl(){
    if(fidLogoMarcaDaguaDataUrlCache !== undefined) return fidLogoMarcaDaguaDataUrlCache;
    const data = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try{
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 512;
          canvas.height = img.naturalHeight || 512;
          const ctx = canvas.getContext('2d');
          if(!ctx){ resolve(null); return; }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        }catch(_e){
          resolve(null);
        }
      };
     img.onerror = () => resolve(null);
     img.src = FID_LOGO_MARCA_DAGUA_SRC;
   });
   fidLogoMarcaDaguaDataUrlCache = data;
   return data;
 }
 function fidCalcularLayoutEtiquetasA4({ etqW, etqH, cols, rows, gapCol, gapRow }){
   // A4 em mm (portrait): 210 × 297
   const A4_W = 210;
   const A4_H = 297;
   const totalW = (cols * etqW) + ((cols - 1) * gapCol);
   const totalH = (rows * etqH) + ((rows - 1) * gapRow);
   const marginX = (A4_W - totalW) / 2;
   const marginY = (A4_H - totalH) / 2;
   return { A4_W, A4_H, totalW, totalH, marginX, marginY };
 }
   async function gerarPdfEtiquetasFidelidadeViaPrint({ codigos, origem, lote, etqW, etqH, cols, rows, gapCol, gapRow, desenharBordas }){
    const ETQ_POR_PAGINA = cols * rows;
    const totalSlots = Math.max(ETQ_POR_PAGINA, Math.ceil(codigos.length / ETQ_POR_PAGINA) * ETQ_POR_PAGINA);
    const lista = Array.from({ length: totalSlots }, (_, i) => (codigos[i] == null ? '' : String(codigos[i]).trim()));
    const hoje = new Date().toISOString().slice(0, 10);
    const loteTag = lote?.loteNum ? `-lote-${lote.loteNum}` : '';
    const titulo = `Etiquetas Fidelidade (${etqW}×${etqH})${loteTag} — ${origem} — ${hoje}`;
    const logoWatermark = await fidGetLogoMarcaDaguaDataUrl();

    const layout = fidCalcularLayoutEtiquetasA4({ etqW, etqH, cols, rows, gapCol, gapRow });
    if(layout.marginX < 0 || layout.marginY < 0){
     toast('Layout inválido: as etiquetas não cabem em A4 com os gaps configurados.','erro');
     return;
   }

   const win = window.open('', '_blank');
   if(!win){ toast('Permita pop-ups para gerar o PDF.','erro'); return; }

   const metadados = fidMontarMetadadosEtiquetas(lista, lote);
   const pages = Math.ceil(lista.length / ETQ_POR_PAGINA);
   const folhasHtml = Array.from({ length: pages }, (_, p) => {
     const start = p * ETQ_POR_PAGINA;
     const slice = lista.slice(start, start + ETQ_POR_PAGINA);
     const etqs = slice.map((cod, j) => {
       const safe = esc(cod);
       const idx = start + j;
       const meta = metadados[idx] || {};
        const loteStr = meta.loteTexto ? esc(meta.loteTexto) : 'LOTE --';
        const seqStr  = meta.sequenciaTexto ? esc(meta.sequenciaTexto) : 'Nº ----';
        if(!safe) return '<div class="etq etq-vazia"></div>';
        return `<div class="etq">
          <span class="etq-crop etq-crop-tl" aria-hidden="true"></span>
         <span class="etq-crop etq-crop-tr" aria-hidden="true"></span>
         <span class="etq-crop etq-crop-bl" aria-hidden="true"></span>
         <span class="etq-crop etq-crop-br" aria-hidden="true"></span>
          <div class="etq-lateral-yhwh" aria-hidden="true"><span>Y</span><span>H</span><span>W</span><span>H</span></div>
           ${logoWatermark ? `<div class="etq-watermarks" aria-hidden="true">
            <img class="etq-watermark etq-watermark-a" src="${esc(logoWatermark)}" alt="">
            <img class="etq-watermark etq-watermark-b" src="${esc(logoWatermark)}" alt="">
            <img class="etq-watermark etq-watermark-c" src="${esc(logoWatermark)}" alt="">
          </div>` : ''}
          <div class="etq-conteudo">
             <div class="etq-header">CLUBE ITAPOLITANA</div>
             <div class="etq-lote-corpo">${loteStr}</div>
             <div class="etq-cod-wrap"><div class="etq-cod-central">${safe}</div></div>
             <div class="etq-footer-1">Cadastre no Nosso APP</div>
             <div class="etq-footer-row">
               <div class="etq-footer-2">ITAPOLITANACAJURU.COM.BR</div>
              <div class="etq-seq-corpo">${seqStr}</div>
            </div>
            <div class="etq-spacer"></div>
            <div class="etq-sorteios">${esc(FID_TEXTO_SORTEIOS)}</div>
          </div>
        </div>`;
      }).join('');
     return `<section class="folha"><div class="grid">${etqs}</div></section>`;
   }).join('');

   win.document.write(`<!doctype html>
<html lang="pt-BR"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(titulo)}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;background:#f5f5f5;font-family:"Segoe UI",Arial,Helvetica,sans-serif}
    .barra{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:12px 16px;background:#1565c0;color:#fff}
    .barra .meta{font-size:12px;opacity:.9}
    .btn{border:none;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}
    .btn-print{background:#fff;color:#1565c0}
    .btn-fechar{background:rgba(255,255,255,.18);color:#fff}
    .wrap{padding:16px}
    @media print{
      body{background:#fff}
      .barra,.wrap{display:none !important}
      .folha{
        margin:0 !important;
        page-break-after:always;
        break-after:page;
        break-inside:avoid;
      }
      .folha:last-child{
        page-break-after:auto;
        break-after:auto;
      }
    }
    @page{size:A4;margin:0}
    .folha{
      width:${layout.A4_W}mm;
      height:${layout.A4_H}mm;
      margin:0 auto 16px;
      background:#fff;
      page-break-after:always;
      padding:${layout.marginY}mm ${layout.marginX}mm;
    }
    .grid{
      display:grid;
      grid-template-columns:repeat(${cols}, ${etqW}mm);
      grid-template-rows:repeat(${rows}, ${etqH}mm);
      gap:${gapRow}mm ${gapCol}mm;
    }
  	    .etq{
  	      border:${desenharBordas ? '0.25mm solid #d0d0d0' : 'none'};
  	      border-radius:0;
  	      position:relative;
  	      overflow:hidden;
  	      color:#141414;
  	      padding:2mm;
          background:#fff;
  	    }
      .etq-crop{
        position:absolute;
        width:2.7mm;
        height:2.7mm;
        pointer-events:none;
        z-index:3;
      }
      .etq-crop-tl{
        left:0.65mm;
        top:0.65mm;
        border-left:0.25mm solid #9d9d9d;
        border-top:0.25mm solid #9d9d9d;
      }
      .etq-crop-tr{
        right:0.65mm;
        top:0.65mm;
        border-right:0.25mm solid #9d9d9d;
        border-top:0.25mm solid #9d9d9d;
      }
      .etq-crop-bl{
        left:0.65mm;
        bottom:0.65mm;
        border-left:0.25mm solid #9d9d9d;
        border-bottom:0.25mm solid #9d9d9d;
      }
      .etq-crop-br{
        right:0.65mm;
        bottom:0.65mm;
        border-right:0.25mm solid #9d9d9d;
        border-bottom:0.25mm solid #9d9d9d;
      }
      .etq-watermarks{
        position:absolute;
        inset:2.6mm 2.4mm 3.8mm 2.4mm;
        z-index:0;
        pointer-events:none;
        overflow:hidden;
      }
      .etq-watermark{
        position:absolute;
        width:18mm;
        height:18mm;
        opacity:${FID_WATERMARK_OPACITY};
        object-fit:contain;
      }
      .etq-watermark-a{
        left:5%;
        top:12%;
        transform:rotate(-12deg);
      }
      .etq-watermark-b{
        left:38%;
        top:36%;
        width:17mm;
        height:17mm;
        transform:rotate(-4deg);
      }
      .etq-watermark-c{
        right:4%;
        bottom:10%;
        width:16mm;
        height:16mm;
        transform:rotate(10deg);
      }
      .etq-conteudo{
        position:relative;
        z-index:1;
        height:100%;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:flex-start;
        overflow:hidden;
      }
      .etq-vazia{border:${desenharBordas ? '0.25mm dashed #e0e0e0' : 'none'};color:transparent}
        .etq-lateral-yhwh{
          position:absolute;
          left:1.1mm;
          top:50%;
          transform:translateY(-50%);
          z-index:2;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:0.45mm;
          font-family:"Arial Black","Segoe UI",Arial,sans-serif;
          font-weight:900;
          font-size:7.8pt;
          line-height:1;
          letter-spacing:0.15pt;
          color:#b71c1c;
          text-shadow:0 0 0.2mm rgba(255,140,0,.45);
          pointer-events:none;
          user-select:none;
          opacity:.92;
        }
        .etq-lateral-yhwh span{display:block}
    	    .etq-header{
    	      font-family:"Arial Black","Segoe UI",Arial,sans-serif;
    	      font-weight:900;
    	      font-size:13pt;
              line-height:1;
    	      color:#FF8C00;
    	      text-align:center;
              letter-spacing:0.4pt;
              -webkit-text-stroke:1.5px #C62828;
              paint-order:stroke fill;
      	      margin:0 0 0.5mm 0;
    	    }
      .etq-lote-corpo{
        width:100%;
        font-family:"Trebuchet MS","Segoe UI",Arial,sans-serif;
        font-weight:800;
        font-size:11.8pt;
        line-height:1;
        text-align:center;
        color:#222831;
        margin:0 0 0.55mm 0;
      }
        .etq-cod-wrap{
          width:100%;
          flex:0 0 auto;
          min-height:18mm;
          display:flex;
          align-items:center;
          justify-content:center;
          margin:-1mm 0 1mm 0;
        }
        .etq-spacer{flex:1 1 auto;min-height:0;}
     	    .etq-cod-central{
     	      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
     	      font-weight:900;
     	      font-size:${FID_ETQ_CODE_FONT_PRINT_PT}pt;
     	      letter-spacing:.15pt;
              line-height:.9;
     	      text-align:center;
              color:#151515;
     	      width:100%;
     	      overflow:hidden;
   	      white-space:nowrap;
        text-overflow:ellipsis;
        margin:0;
     }
     .etq-footer-1{
       font-family:"Segoe UI",Arial,Helvetica,sans-serif;
       font-weight:700;
       font-size:8.4pt;
       color:#353535;
       text-align:center;
       margin-top:0;
       margin-bottom:1.5mm;
     }
     .etq-footer-row{
       width:100%;
       min-height:4.1mm;
       position:relative;
       display:flex;
       align-items:center;
       justify-content:center;
       margin-bottom:1mm;
     }
     .etq-footer-2{
       font-family:"Arial Black","Segoe UI",Arial,Helvetica,sans-serif;
       font-weight:900;
       font-size:8.5pt;
       color:#252525;
       text-align:center;
       width:100%;
       letter-spacing:0.4pt;
       white-space:nowrap;
       overflow:hidden;
       text-overflow:ellipsis;
     }
     .etq-seq-corpo{
       font-family:"Trebuchet MS","Segoe UI",Arial,sans-serif;
       font-weight:800;
       font-size:9.4pt;
       line-height:1;
       color:#252525;
       position:absolute;
       right:0.8mm;
       top:50%;
       transform:translateY(-50%);
     }
     .etq-sorteios{
       width:100%;
       background:#e8470a;
       color:#fff;
       font-family:"Arial Black","Segoe UI",Arial,sans-serif;
       font-weight:800;
       font-size:9.5pt;
       letter-spacing:0.5pt;
       text-align:center;
       padding:1.5mm 0;
       line-height:1;
       margin-top:0;
     }
  </style>
</head><body>
  <div class="barra">
    <div>
      <div style="font-weight:900">${esc(titulo)}</div>
      <div class="meta">${lista.filter(Boolean).length} códigos · ${pages} folha${pages>1?'s':''} · ${cols}×${rows} etiquetas/folha · ${etqW}×${etqH} mm</div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
      <button class="btn btn-fechar" onclick="window.close()">✕ Fechar</button>
    </div>
  </div>
  <div class="wrap" style="font-size:12px;color:#555">Dica: no diálogo de impressão, selecione "Salvar como PDF".</div>
  ${folhasHtml}


</body></html>`);
   win.document.close();
   try{ win.focus(); }catch(e){}
 }
async function gerarPdfEtiquetasFidelidade(){
  let jsPDF;
  try{
    jsPDF = await fidEnsureJsPDF();
  }catch(err){
    console.error('[Fidelidade] Erro ao carregar jsPDF:', err);
    toast('Falha ao carregar jsPDF. Abrindo versão de impressão (Salvar como PDF).','aviso');
	    try{
	      const payload = fidColetarCodigosParaEtiquetas();
	      await gerarPdfEtiquetasFidelidadeViaPrint({
	        ...payload,
	        etqW: 92.5,
	        etqH: 51.4,
	        cols: 2,
	        rows: 5,
	        gapCol: 5,
	        gapRow: 5,
	        desenharBordas: true
	      });
	    }catch(e){
	      console.error('[Fidelidade] Falha ao abrir versão de impressão:', e);
	    }
    return;
  }

  const { codigos, origem, lote } = fidColetarCodigosParaEtiquetas();
  const metadados = fidMontarMetadadosEtiquetas(codigos, lote);
  if(!codigos.length){
    toast('Nenhum código encontrado para gerar etiquetas.','erro');
    return;
  }

  const ETQ_W = 92.5;
  const ETQ_H = 51.4;
  const COLS = 2;
  const ROWS = 5;
  const ETQ_POR_PAGINA = COLS * ROWS;
  const logoWatermark = await fidGetLogoMarcaDaguaDataUrl();

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  // Layout exato: 2 colunas × 5 linhas (10 etiquetas por A4)
  // Etiqueta: 92,5 × 51,4 mm
  // Espaçamento: 5 mm horizontal, 5 mm vertical
  const GAP_COL = 5;
  const GAP_ROW = 5;
  const layout = fidCalcularLayoutEtiquetasA4({ etqW: ETQ_W, etqH: ETQ_H, cols: COLS, rows: ROWS, gapCol: GAP_COL, gapRow: GAP_ROW });
  if(layout.marginX < 0 || layout.marginY < 0){
    toast('Layout inválido: as etiquetas não cabem em A4 com o espaçamento configurado.','erro');
    return;
  }

  const desenharBordas = true;
  const paddingX = 2;
  const totalSlots = Math.max(ETQ_POR_PAGINA, Math.ceil(codigos.length / ETQ_POR_PAGINA) * ETQ_POR_PAGINA);
  for(let i = 0; i < totalSlots; i++){
    if(i > 0 && i % ETQ_POR_PAGINA === 0) doc.addPage();

    const idx = i % ETQ_POR_PAGINA;
    const row = Math.floor(idx / COLS);
    const col = idx % COLS;
    const x = layout.marginX + col * (ETQ_W + GAP_COL);
    const y = layout.marginY + row * (ETQ_H + GAP_ROW);

    if(desenharBordas){
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.15);
      doc.rect(x, y, ETQ_W, ETQ_H);
    }
    fidDrawCropMarks(doc, x, y, ETQ_W, ETQ_H, FID_ETQ_CROP_LEN_MM, FID_ETQ_CROP_GAP_MM);

    const codigo = codigos[i] == null ? '' : String(codigos[i]).trim();
    if(!codigo) continue;
    const meta = metadados[i] || {};
    const centerX = x + (ETQ_W / 2);
    const innerX  = x + paddingX;
    const innerW  = ETQ_W - (paddingX * 2);
    const paddingY = 2;
    const yTop = y + paddingY;
    const yBot = y + ETQ_H - paddingY;
    const PT = 0.352778; // mm per pt

    if(logoWatermark){
      const labelHeight = ETQ_H;
      const watermarkUsableHeight = ETQ_H - FID_ETQ_WATERMARK_TOP_PADDING_MM - FID_ETQ_WATERMARK_BOTTOM_PADDING_MM;
      if(typeof doc.GState === 'function' && typeof doc.setGState === 'function'){
        doc.setGState(new doc.GState({ opacity: FID_WATERMARK_OPACITY }));
      }
      FID_ETQ_WATERMARK_POSITIONS.forEach(({ relX, relY, relSize, rotation }) => {
        const wmSize = Math.min(innerW, labelHeight) * relSize;
        const wmX = innerX + (innerW * relX);
        const wmY = y + FID_ETQ_WATERMARK_TOP_PADDING_MM + (watermarkUsableHeight * relY);
        doc.addImage(logoWatermark, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST', rotation);
      });
      if(typeof doc.GState === 'function' && typeof doc.setGState === 'function'){
        doc.setGState(new doc.GState({ opacity: 1 }));
      }
    }

    // — Lateral vertical "YHWH" —
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(183, 28, 28);
    const yhwhLetters = ['Y', 'H', 'W', 'H'];
    const yhwhStepMm = 3.6;
    const yhwhX = innerX + 1.2;
    const yhwhStartY = y + (ETQ_H / 2) - ((yhwhLetters.length - 1) * yhwhStepMm / 2);
    yhwhLetters.forEach((letter, idx) => {
      doc.text(letter, yhwhX, yhwhStartY + (idx * yhwhStepMm), { align: 'left', baseline: 'middle' });
    });

    // — Cabeçalho "CLUBE ITAPOLITANA" —
    const hdrFontPt = 13.0;
    const hdrFontMm = hdrFontPt * PT;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(hdrFontPt);
    doc.setTextColor(255, 140, 0);
    doc.setDrawColor(198, 40, 40);
    doc.setLineWidth(0.35);
    const yHdr = yTop + hdrFontMm;
    doc.text('CLUBE ITAPOLITANA', centerX, yHdr,
             { align: 'center', baseline: 'alphabetic', renderingMode: 'fillThenStroke' });
    doc.setLineWidth(0.2);

    // — Lote no topo (central) —
    const loteTexto = meta.loteTexto || 'LOTE --';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.8);
    doc.setTextColor(34, 40, 49);
    const yLote = yHdr + (11.8 * PT * 0.95) + 0.8;
    doc.text(loteTexto, centerX, yLote, { align: 'center', baseline: 'alphabetic' });

    // — Layout preciso do cupom (bottom-up, totalmente calculado) —
    // Etiqueta: 92,5 × 51,4 mm · padding 2 mm · área útil 47,4 mm altura
    const sorteioBarH  = 5.0;                          // barra laranja (fundo)
    const ySorteioTop  = yBot  - sorteioBarH;          // topo da barra laranja
    const yF2          = ySorteioTop - 1.5;            // baseline URL / Nº (1,5 mm acima da barra)
    const yCadastro    = yF2 - (8.8 * PT) - 3.0;      // baseline "Cadastre" (subido — mais espaço acima da URL)
    const codeAreaTop  = yLote + 0.65;                 // código começa após o lote
    const codeAreaBot  = yCadastro - (8.8 * PT) - 1.2; // código termina 1,2 mm acima de "Cadastre"
    const yCode        = ((codeAreaTop + codeAreaBot) / 2) - FID_ETQ_CODE_SHIFT_UP_MM;

    doc.setFont('courier', 'bold');
    doc.setTextColor(0, 0, 0);
    const maxTextW = innerW - 2;
    const fontSize = Math.min(
      fidFitTextSizeMm(doc, codigo, maxTextW, FID_ETQ_CODE_FONT_BASE_PT, FID_ETQ_CODE_FONT_MIN_PT),
      fidCalculateMaxFontSizeForHeight(codeAreaBot - codeAreaTop, FID_ETQ_CODE_FONT_MIN_PT)
    );
    doc.setFontSize(fontSize);
    doc.text(codigo, centerX, yCode, { align: 'center', baseline: 'middle' });

    // — Rodapé "Cadastre no Nosso APP" —
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(53, 53, 53);
    doc.text('Cadastre no Nosso APP', centerX, yCadastro,
             { align: 'center', baseline: 'alphabetic' });

    // — URL + Nº sequencial (mesma linha) —
    const seqTexto = meta.sequenciaTexto || 'Nº ----';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FID_ETQ_SEQ_FONT_PT);
    const seqRightX = x + ETQ_W - 2.2;
    const seqWidth = doc.getTextWidth(seqTexto);
    const urlText = 'ITAPOLITANACAJURU.COM.BR';
    const urlMaxWidth = innerW - seqWidth - 2;
    const urlFontSize = fidFitTextSizeMm(doc, urlText, urlMaxWidth, 8.8, FID_ETQ_URL_FONT_MIN_PT);
    doc.setFontSize(urlFontSize);
    doc.setTextColor(34, 40, 49);
    doc.text(urlText, centerX, yF2, { align: 'center', baseline: 'alphabetic' });
    doc.setFontSize(FID_ETQ_SEQ_FONT_PT);
    doc.setTextColor(37, 37, 37);
    doc.text(seqTexto, seqRightX, yF2, { align: 'right', baseline: 'alphabetic' });

    // — Barra laranja "SORTEIOS MENSAIS" —
    doc.setFillColor(232, 71, 10);
    doc.rect(innerX, ySorteioTop, innerW, sorteioBarH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text(FID_TEXTO_SORTEIOS, centerX, ySorteioTop + (sorteioBarH / 2),
             { align: 'center', baseline: 'middle' });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const loteTag = lote?.loteNum ? `-lote-${lote.loteNum}` : '';
  const filename = `etiquetas-fidelidade-92_5x51_4${loteTag}-${origem}-${hoje}.pdf`;
  doc.save(filename);
  toast('PDF de etiquetas (10/A4 · 92,5×51,4 mm) gerado com sucesso.','ok');
}
async function salvarConfigFidelidade() {
  if(!fidRequireWrite())return;
  if (!STATE.config) STATE.config = {};
  const c = STATE.config;

  // Capturar valores dos campos
  c.premioMilkshake = document.getElementById('fid-prêmio-milk-nome').value.trim();
  const ptsMilkInput = parseInt(document.getElementById('fid-pts-milk').value, 10);
  c.pontosMilkshake = Number.isFinite(ptsMilkInput) && ptsMilkInput > 0
    ? ptsMilkInput
    : (Number.isFinite(Number(c.pontosMilkshake)) ? Number(c.pontosMilkshake) : 10);
  c.premioCaixa = document.getElementById('fid-prêmio-caixa-nome').value.trim();
  const ptsCaixaInput = parseInt(document.getElementById('fid-pts-caixa').value, 10);
  c.pontosCaixa = Number.isFinite(ptsCaixaInput) && ptsCaixaInput > 0
    ? ptsCaixaInput
    : (Number.isFinite(Number(c.pontosCaixa)) ? Number(c.pontosCaixa) : 30);
  c.fidelidadeTitulo = document.getElementById('fid-título').value.trim();
  c.fidelidadeDescricao = document.getElementById('fid-descrição').value.trim();
  c.fidelidadeComoFunciona = lerLinhasTextarea('fid-como-funciona-lista');
  c.fidelidadeRegrasResumo = lerLinhasTextarea('fid-regras-resumo-lista');
  const fidRegrasUrlSafe = cmsLerUrlCampo('fid-regras-url', 'URL de regras da Fidelidade', {allowRelative:true});
  if (fidRegrasUrlSafe===null) return;
  const fidResgateUrlSafe = cmsLerUrlCampo('fid-resgate-url', 'URL de resgate via WhatsApp', {allowRelative:false});
  if (fidResgateUrlSafe===null) return;
  c.fidelidadeRegrasUrl = fidRegrasUrlSafe || '';
  c.fidelidadeResgateWhatsappUrl = fidResgateUrlSafe || '';

  // Novos campos Fase 3.2
  c.fidelidadePagina = c.fidelidadePagina || {};
  const fidComoTit=document.getElementById('fidelidade-como-funciona-titulo');
  if(fidComoTit) c.fidelidadePagina.comoFuncionaTitulo = fidComoTit.value.trim();
  const fidAcaoTit=document.getElementById('fidelidade-acao-titulo');
  if(fidAcaoTit) c.fidelidadePagina.acaoTitulo = fidAcaoTit.value.trim();
  const fidBtnCad=document.getElementById('fidelidade-btn-cadastro');
  if(fidBtnCad) c.fidelidadePagina.btnCadastro = fidBtnCad.value.trim();
  const fidBtnLog=document.getElementById('fidelidade-btn-login');
  if(fidBtnLog) c.fidelidadePagina.btnLogin = fidBtnLog.value.trim();
  const fidRegraTit=document.getElementById('fidelidade-regras-titulo');
  if(fidRegraTit) c.fidelidadePagina.regrasTitulo = fidRegraTit.value.trim();
  const fidBtnAceite=document.getElementById('fidelidade-btn-aceitar-regras');
  if(fidBtnAceite) c.fidelidadePagina.btnAceitarRegras = fidBtnAceite.value.trim();
  const fidRegTit=document.getElementById('fidelidade-regulamento-titulo');
  if(fidRegTit) c.fidelidadePagina.regulamentoTitulo = fidRegTit.value.trim();
  const fidRegSum=document.getElementById('fidelidade-regulamento-summary');
  if(fidRegSum) c.fidelidadePagina.regulamentoSummary = fidRegSum.value.trim();

  c.seoPaginas = c.seoPaginas || {};
  c.seoPaginas.fidelidade = c.seoPaginas.fidelidade || {};
  const fidSeoTit = document.getElementById('cfg-seo-fidelidade-titulo');
  if (fidSeoTit) c.seoPaginas.fidelidade.titulo = fidSeoTit.value.trim();
  const fidSeoDesc = document.getElementById('cfg-seo-fidelidade-descricao');
  if (fidSeoDesc) c.seoPaginas.fidelidade.descricao = fidSeoDesc.value.trim();

  const fidSeoTitOld = document.getElementById('fid-seo-titulo');
  if (fidSeoTitOld) c.seoPaginas.fidelidade.titulo = fidSeoTitOld.value.trim();
  const fidSeoDescOld = document.getElementById('fid-seo-descricao');
  if (fidSeoDescOld) c.seoPaginas.fidelidade.descricao = fidSeoDescOld.value.trim();
  const fidSeoPal = document.getElementById('fid-seo-palavras');
  if (fidSeoPal) c.seoPaginas.fidelidade.palavrasChave = fidSeoPal.value.trim();

  mostrarLoading('Salvando...');

  // Sincronizar com o STATE.fidelidade se necessário (para o site ler de um lugar só)
  let ok1 = true;
  if (STATE.fidelidade) {
    if (!STATE.fidelidade.config) STATE.fidelidade.config = {};
    STATE.fidelidade.config.premioMilkshake = c.premioMilkshake;
    STATE.fidelidade.config.pontosMilkshake = c.pontosMilkshake;
    STATE.fidelidade.config.premioCaixa = c.premioCaixa;
    STATE.fidelidade.config.pontosCaixa = c.pontosCaixa;
    STATE.fidelidade.config.titulo = c.fidelidadeTitulo;
    STATE.fidelidade.config.descricao = c.fidelidadeDescricao;

    ok1 = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: sincronizar textos da fidelidade');
  }

  // Salvar no config.json (fonte principal do admin)
  const ok2 = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar configuração de prêmios e textos da fidelidade');

  ocultarLoading();
  if (ok1 && ok2) {
    toast('Configurações de fidelidade salvas e sincronizadas!', 'sucesso');
  }
}
function copiarCódigosDisponíveis(){
  const códigos=fidGetCodigos();
  const disponíveis=Object.keys(códigos).filter(k=>códigos[k].status==='disponível');
  if(!disponíveis.length){toast('Nenhum código disponível.','');return;}
  copiarTextoSeguro(disponíveis.join('\n')).then((ok)=>toast(ok?`${disponíveis.length} códigos copiados!`:'Erro ao copiar códigos disponíveis.',ok?'sucesso':'erro'));
}
function atualizarAtalhosDashboard(cfg){
  const c=cfg||{};
  const normalizarTexto=(txt,padrao)=>esc(((txt||padrao||'').trim()||padrao||''));
  const normalizarLink=(url,padrao,permitidos)=>{
    const u=(url||'').trim();
    if(!u) return padrao;
    if(/^javascript:/i.test(u)||/^data:/i.test(u)||/^vbscript:/i.test(u)||/^\/\//.test(u)) return padrao;
    const alvos=(permitidos||[]).map(v=>String(v).toLowerCase());
    const limpo=u.toLowerCase();
    if(alvos.includes(limpo)) return u;
    if(/^https:\/\/itapolitanacajuru\.com\.br\//i.test(limpo)){
      const path=limpo.replace(/^https:\/\/itapolitanacajuru\.com\.br\//,'');
      if(alvos.includes(path)) return u;
    }
    return padrao;
  };
  const tRast=normalizarTexto(c.adminDashRastreioTexto,'Rastreio');
  const tAud=normalizarTexto(c.adminDashAuditoriaTexto,'Auditoria');
  const tSobre=normalizarTexto(c.adminDashLinkSobreTexto,'🏪 Sobre');
  const uSobre=normalizarLink(c.adminDashLinkSobreUrl,'sobre.html',['sobre.html']);
  const tGal=normalizarTexto(c.adminDashLinkGaleriaTexto,'🖼️ Galeria');
  const uGal=normalizarLink(c.adminDashLinkGaleriaUrl,'galeria.html',['galeria.html']);
  const tCar=normalizarTexto(c.adminDashLinkCarrosselTexto,'🎠 Carrossel');
  const uCar=normalizarLink(c.adminDashLinkCarrosselUrl,'carrossel.html',['carrossel.html']);
  const lbR=document.getElementById('dash-btn-rastreio-label'); if(lbR) lbR.innerHTML=tRast;
  const lbA=document.getElementById('dash-btn-auditoria-label'); if(lbA) lbA.innerHTML=tAud;
  const lkS=document.getElementById('dash-link-sobre'); if(lkS){lkS.innerHTML=tSobre; lkS.setAttribute('href',uSobre||'sobre.html');}
  const lkG=document.getElementById('dash-link-galeria'); if(lkG){lkG.innerHTML=tGal; lkG.setAttribute('href',uGal||'galeria.html');}
  const lkC=document.getElementById('dash-link-carrossel'); if(lkC){lkC.innerHTML=tCar; lkC.setAttribute('href',uCar||'carrossel.html');}
}
function lerLinhasTextarea(id){
  const el=document.getElementById(id);
  if(!el)return[];
  return (el.value||'').split('\n').map(s=>s.trim()).filter(Boolean);
}
function cmsValidarUrl(valor,opts={}){
  const op=Object.assign({allowRelative:true,allowEmpty:true},opts||{});
  const raw=(valor||'').trim();
  if(!raw)return op.allowEmpty?'':null;
  const blocked=/^\s*(javascript|data|vbscript)\s*:/i.test(raw)||/^\s*\/\//.test(raw);
  if(blocked)return null;
  if(!op.allowRelative&&/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)===false)return null;
  try{
    const url=new URL(raw,window.location.origin);
    if(url.protocol!=='http:'&&url.protocol!=='https:')return null;
    return raw;
  }catch(e){
    return null;
  }
}
function cmsLerUrlCampo(id,label,opts){
  const el=document.getElementById(id);
  if(!el)return'';
  const safe=cmsValidarUrl(el.value,opts||{});
  if(safe===null){
    toast(`⚠️ ${label} inválida. Use apenas links http/https.`, 'erro');
    el.focus();
    return null;
  }
  return safe;
}
function preencherConfig(){
  const cfg=STATE.config||{};
  document.getElementById('cfg-whatsapp').value=cfg.whatsapp||'5516996062046';
  document.getElementById('cfg-whats-fmt').value=cfg.whatsappFormatado||'(16) 99606-2046';
  document.getElementById('cfg-instagram').value=cfg.instagram||'@sorveteriaitapolitanacajuru';
  document.getElementById('cfg-instagram-url').value=cfg.instagramUrl||'';
  document.getElementById('cfg-endereco').value=cfg.endereco||'';
  document.getElementById('cfg-endereço-completo').value=cfg.enderecoCompleto||'';
  document.getElementById('cfg-maps').value=cfg.googleMaps||'';
  document.getElementById('cfg-hora-abre').value=cfg.horarioAbre??10;
  document.getElementById('cfg-hora-fecha').value=cfg.horarioFecha??22;
  document.getElementById('cfg-horario').value=cfg.horario||'';
  document.getElementById('cfg-horário-det').value=cfg.horarioDetalhado||'';
  document.getElementById('cfg-footer-horário').value=cfg.footerHorario||'';
  document.getElementById('cfg-nome-empresa').value=cfg.nomeEmpresa||'';
  document.getElementById('cfg-slogan').value=cfg.slogan||'';
  document.getElementById('cfg-fundação').value=cfg.fundacao||'2007';
  document.getElementById('cfg-num-sabores').value=cfg.numSabores||35;
  document.getElementById('cfg-CNPJ').value=cfg.cnpj||'';
  document.getElementById('cfg-footer-copy').value=cfg.footerCopy||'';
  document.getElementById('cfg-footer-dev').value=cfg.footerDev||'';
  // SEO
  const seoTit=document.getElementById('cfg-seo-titulo'); if(seoTit) seoTit.value=cfg.seoTitulo||'';
  const seoDes=document.getElementById('cfg-seo-descricao'); if(seoDes) seoDes.value=cfg.seoDescricao||'';
  const seoPal=document.getElementById('cfg-seo-palavras'); if(seoPal) seoPal.value=cfg.seoPalavrasChave||'';
  // Dashboard (atalhos editáveis)
  const dRt=document.getElementById('cfg-dash-rastreio-texto'); if(dRt) dRt.value=cfg.adminDashRastreioTexto||'Rastreio';
  const dAt=document.getElementById('cfg-dash-auditoria-texto'); if(dAt) dAt.value=cfg.adminDashAuditoriaTexto||'Auditoria';
  const dSt=document.getElementById('cfg-dash-sobre-texto'); if(dSt) dSt.value=cfg.adminDashLinkSobreTexto||'🏪 Sobre';
  const dSu=document.getElementById('cfg-dash-sobre-url'); if(dSu) dSu.value=cfg.adminDashLinkSobreUrl||'sobre.html';
  const dGt=document.getElementById('cfg-dash-galeria-texto'); if(dGt) dGt.value=cfg.adminDashLinkGaleriaTexto||'🖼️ Galeria';
  const dGu=document.getElementById('cfg-dash-galeria-url'); if(dGu) dGu.value=cfg.adminDashLinkGaleriaUrl||'galeria.html';
  const dCt=document.getElementById('cfg-dash-carrossel-texto'); if(dCt) dCt.value=cfg.adminDashLinkCarrosselTexto||'🎠 Carrossel';
  const dCu=document.getElementById('cfg-dash-carrossel-url'); if(dCu) dCu.value=cfg.adminDashLinkCarrosselUrl||'carrossel.html';
  atualizarAtalhosDashboard(cfg);
  // Fidelidade Hero (IDs: fid-hero-titulo, fid-hero-desc)
  const fidHT=document.getElementById('cfg-fid-hero-titulo'); if(fidHT) fidHT.value=cfg.fidHeroTitulo||'🎟️  Itapolitana';
  const fidHD=document.getElementById('cfg-fid-hero-desc'); if(fidHD) fidHD.value=cfg.fidHeroDesc||'Acumule pontos a cada compra e ganhe prêmios exclusivos na Sorveteria Itapolitana de Cajuru.';
  const encHeroTit=document.getElementById('enc-hero-titulo'); if(encHeroTit) encHeroTit.value=cfg.encomendasHeroTitulo||'';
  const encHeroDesc=document.getElementById('enc-hero-desc'); if(encHeroDesc) encHeroDesc.value=cfg.encomendasHeroDescricao||'';
  const encHeroBadges=document.getElementById('enc-hero-badges'); if(encHeroBadges) encHeroBadges.value=Array.isArray(cfg.encomendasHeroBadges)?cfg.encomendasHeroBadges.join('\n'):'';
  const fidRegrasUrl=document.getElementById('cfg-fid-regras-url'); if(fidRegrasUrl) fidRegrasUrl.value=cfg.fidelidadeRegrasUrl||'';
  const fidResgateUrl=document.getElementById('cfg-fid-resgate-url'); if(fidResgateUrl) fidResgateUrl.value=cfg.fidelidadeResgateWhatsappUrl||'';
  const seoPg=cfg.seoPaginas||{};
  const seoFidTit=document.getElementById('cfg-seo-fid-titulo'); if(seoFidTit) seoFidTit.value=seoPg.fidelidade?.titulo||'';
  const seoFidDes=document.getElementById('cfg-seo-fid-descricao'); if(seoFidDes) seoFidDes.value=seoPg.fidelidade?.descricao||'';
  const seoFidPal=document.getElementById('cfg-seo-fid-palavras'); if(seoFidPal) seoFidPal.value=seoPg.fidelidade?.palavrasChave||'';
  const seoEncTit=document.getElementById('cfg-seo-enc-titulo'); if(seoEncTit) seoEncTit.value=seoPg.encomendas?.titulo||'';
  const seoEncDes=document.getElementById('cfg-seo-enc-descricao'); if(seoEncDes) seoEncDes.value=seoPg.encomendas?.descricao||'';
  const seoEncPal=document.getElementById('cfg-seo-enc-palavras'); if(seoEncPal) seoEncPal.value=seoPg.encomendas?.palavrasChave||'';
  const seoProTit=document.getElementById('cfg-seo-promo-titulo'); if(seoProTit) seoProTit.value=seoPg.promocao?.titulo||'';
  const seoProDes=document.getElementById('cfg-seo-promo-descricao'); if(seoProDes) seoProDes.value=seoPg.promocao?.descricao||'';
  const seoProPal=document.getElementById('cfg-seo-promo-palavras'); if(seoProPal) seoProPal.value=seoPg.promocao?.palavrasChave||'';
  const seoSobTit=document.getElementById('cfg-seo-sobre-titulo'); if(seoSobTit) seoSobTit.value=seoPg.sobre?.titulo||'';
  const seoSobDes=document.getElementById('cfg-seo-sobre-descricao'); if(seoSobDes) seoSobDes.value=seoPg.sobre?.descricao||'';
  const seoSobPal=document.getElementById('cfg-seo-sobre-palavras'); if(seoSobPal) seoSobPal.value=seoPg.sobre?.palavrasChave||'';
  const seoGalTit=document.getElementById('cfg-seo-galeria-titulo'); if(seoGalTit) seoGalTit.value=seoPg.galeria?.titulo||'';
  const seoGalDes=document.getElementById('cfg-seo-galeria-descricao'); if(seoGalDes) seoGalDes.value=seoPg.galeria?.descricao||'';
  const seoGalPal=document.getElementById('cfg-seo-galeria-palavras'); if(seoGalPal) seoGalPal.value=seoPg.galeria?.palavrasChave||'';
  const seoCarTit=document.getElementById('cfg-seo-carrossel-titulo'); if(seoCarTit) seoCarTit.value=seoPg.carrossel?.titulo||'';
  const seoCarDes=document.getElementById('cfg-seo-carrossel-descricao'); if(seoCarDes) seoCarDes.value=seoPg.carrossel?.descricao||'';
  const seoCarPal=document.getElementById('cfg-seo-carrossel-palavras'); if(seoCarPal) seoCarPal.value=seoPg.carrossel?.palavrasChave||'';
  // Configurações de Encomendas (enc-aviso, enc-min-picolés)
  const encAv=document.getElementById('enc-aviso'); if(encAv) encAv.value=cfg.encomendaAviso||'';
  const encMin=document.getElementById('enc-min-picolés'); if(encMin) encMin.value=cfg.encomendaMinPicoles??100;
}
async function salvarConfig(){
  const novaSenha=document.getElementById('cfg-nova-senha').value;
  const confSenha=document.getElementById('cfg-conf-senha').value;
  if(novaSenha&&novaSenha!==confSenha){toast('⚠️ As senhas não coincidem. Verifique e tente novamente.','erro');return;}
  if(novaSenha&&novaSenha.length<6){toast('⚠️ A senha deve ter pelo menos 6 caracteres.','erro');return;}
  const whats=document.getElementById('cfg-whatsapp').value.trim().replace(/\D/g,'');
  if(whats&&(whats.length<10||whats.length>13)){toast('⚠️ Número de WhatsApp inválido. Use o formato com DDD: (16) 99999-9999.','erro');document.getElementById('cfg-whatsapp').focus();return;}
  const instagramSafe=cmsLerUrlCampo('cfg-instagram-url','URL do Instagram',{allowRelative:false});
  if(instagramSafe===null)return;
  const mapsSafe=cmsLerUrlCampo('cfg-maps','Link Google Maps',{allowRelative:false});
  if(mapsSafe===null)return;
  const fidRegrasUrlSafe=cmsLerUrlCampo('cfg-fid-regras-url','URL de regras da Fidelidade',{allowRelative:true});
  if(fidRegrasUrlSafe===null)return;
  const fidResgateUrlSafe=cmsLerUrlCampo('cfg-fid-resgate-url','URL de resgate via WhatsApp',{allowRelative:false});
  if(fidResgateUrlSafe===null)return;
  const cfg=STATE.config||{};
  cfg.whatsapp=document.getElementById('cfg-whatsapp').value.trim();
  cfg.whatsappFormatado=document.getElementById('cfg-whats-fmt').value.trim();
  cfg.instagram=document.getElementById('cfg-instagram').value.trim();
  cfg.instagramUrl=instagramSafe;
  cfg.endereco=document.getElementById('cfg-endereco').value.trim();
  cfg.enderecoCompleto=document.getElementById('cfg-endereço-completo').value.trim();
  cfg.googleMaps=mapsSafe;
  cfg.horarioAbre=parseInt(document.getElementById('cfg-hora-abre').value,10)||10;
  cfg.horarioFecha=parseInt(document.getElementById('cfg-hora-fecha').value,10)||22;
  cfg.horario=document.getElementById('cfg-horario').value.trim();
  cfg.horarioDetalhado=document.getElementById('cfg-horário-det').value.trim();
  cfg.footerHorario=document.getElementById('cfg-footer-horário').value.trim();
  cfg.nomeEmpresa=document.getElementById('cfg-nome-empresa').value.trim();
  cfg.slogan=document.getElementById('cfg-slogan').value.trim();
  cfg.fundacao=document.getElementById('cfg-fundação').value.trim();
  cfg.numSabores=parseInt(document.getElementById('cfg-num-sabores').value,10)||35;
  cfg.cnpj=document.getElementById('cfg-CNPJ').value.trim();
  cfg.footerCopy=document.getElementById('cfg-footer-copy').value.trim();
  cfg.footerDev=document.getElementById('cfg-footer-dev').value.trim();
  // SEO
  const seoTitEl=document.getElementById('cfg-seo-titulo'); if(seoTitEl) cfg.seoTitulo=seoTitEl.value.trim();
  const seoDesEl=document.getElementById('cfg-seo-descricao'); if(seoDesEl) cfg.seoDescricao=seoDesEl.value.trim();
  const seoPalEl=document.getElementById('cfg-seo-palavras'); if(seoPalEl) cfg.seoPalavrasChave=seoPalEl.value.trim();
  // Dashboard (atalhos editáveis)
  const dRtEl=document.getElementById('cfg-dash-rastreio-texto'); if(dRtEl) cfg.adminDashRastreioTexto=dRtEl.value.trim()||'Rastreio';
  const dAtEl=document.getElementById('cfg-dash-auditoria-texto'); if(dAtEl) cfg.adminDashAuditoriaTexto=dAtEl.value.trim()||'Auditoria';
  const dStEl=document.getElementById('cfg-dash-sobre-texto'); if(dStEl) cfg.adminDashLinkSobreTexto=dStEl.value.trim()||'🏪 Sobre';
  const dSuEl=document.getElementById('cfg-dash-sobre-url'); if(dSuEl) cfg.adminDashLinkSobreUrl=dSuEl.value.trim()||'sobre.html';
  const dGtEl=document.getElementById('cfg-dash-galeria-texto'); if(dGtEl) cfg.adminDashLinkGaleriaTexto=dGtEl.value.trim()||'🖼️ Galeria';
  const dGuEl=document.getElementById('cfg-dash-galeria-url'); if(dGuEl) cfg.adminDashLinkGaleriaUrl=dGuEl.value.trim()||'galeria.html';
  const dCtEl=document.getElementById('cfg-dash-carrossel-texto'); if(dCtEl) cfg.adminDashLinkCarrosselTexto=dCtEl.value.trim()||'🎠 Carrossel';
  const dCuEl=document.getElementById('cfg-dash-carrossel-url'); if(dCuEl) cfg.adminDashLinkCarrosselUrl=dCuEl.value.trim()||'carrossel.html';
  atualizarAtalhosDashboard(cfg);
  // Configurações de Encomendas
  const encAvEl=document.getElementById('enc-aviso'); if(encAvEl) cfg.encomendaAviso=encAvEl.value.trim();
  const encMinEl=document.getElementById('enc-min-picolés'); if(encMinEl) cfg.encomendaMinPicoles=parseInt(encMinEl.value,10)||100;
  const encHeroTitEl=document.getElementById('enc-hero-titulo'); if(encHeroTitEl) cfg.encomendasHeroTitulo=encHeroTitEl.value.trim();
  const encHeroDescEl=document.getElementById('enc-hero-desc'); if(encHeroDescEl) cfg.encomendasHeroDescricao=encHeroDescEl.value.trim();
  cfg.encomendasHeroBadges=lerLinhasTextarea('enc-hero-badges');
  cfg.fidelidadeRegrasUrl=fidRegrasUrlSafe||'';
  cfg.fidelidadeResgateWhatsappUrl=fidResgateUrlSafe||'';
  cfg.seoPaginas=cfg.seoPaginas||{};
  cfg.seoPaginas.fidelidade=cfg.seoPaginas.fidelidade||{};
  cfg.seoPaginas.encomendas=cfg.seoPaginas.encomendas||{};
  cfg.seoPaginas.promocao=cfg.seoPaginas.promocao||{};
  cfg.seoPaginas.sobre=cfg.seoPaginas.sobre||{};
  cfg.seoPaginas.galeria=cfg.seoPaginas.galeria||{};
  cfg.seoPaginas.carrossel=cfg.seoPaginas.carrossel||{};
  const seoFidTitEl=document.getElementById('cfg-seo-fid-titulo'); if(seoFidTitEl) cfg.seoPaginas.fidelidade.titulo=seoFidTitEl.value.trim();
  const seoFidDesEl=document.getElementById('cfg-seo-fid-descricao'); if(seoFidDesEl) cfg.seoPaginas.fidelidade.descricao=seoFidDesEl.value.trim();
  const seoFidPalEl=document.getElementById('cfg-seo-fid-palavras'); if(seoFidPalEl) cfg.seoPaginas.fidelidade.palavrasChave=seoFidPalEl.value.trim();
  const seoEncTitEl=document.getElementById('cfg-seo-enc-titulo'); if(seoEncTitEl) cfg.seoPaginas.encomendas.titulo=seoEncTitEl.value.trim();
  const seoEncDesEl=document.getElementById('cfg-seo-enc-descricao'); if(seoEncDesEl) cfg.seoPaginas.encomendas.descricao=seoEncDesEl.value.trim();
  const seoEncPalEl=document.getElementById('cfg-seo-enc-palavras'); if(seoEncPalEl) cfg.seoPaginas.encomendas.palavrasChave=seoEncPalEl.value.trim();
  const seoProTitEl=document.getElementById('cfg-seo-promo-titulo'); if(seoProTitEl) cfg.seoPaginas.promocao.titulo=seoProTitEl.value.trim();
  const seoProDesEl=document.getElementById('cfg-seo-promo-descricao'); if(seoProDesEl) cfg.seoPaginas.promocao.descricao=seoProDesEl.value.trim();
  const seoProPalEl=document.getElementById('cfg-seo-promo-palavras'); if(seoProPalEl) cfg.seoPaginas.promocao.palavrasChave=seoProPalEl.value.trim();
  const seoSobTitEl=document.getElementById('cfg-seo-sobre-titulo'); if(seoSobTitEl) cfg.seoPaginas.sobre.titulo=seoSobTitEl.value.trim();
  const seoSobDesEl=document.getElementById('cfg-seo-sobre-descricao'); if(seoSobDesEl) cfg.seoPaginas.sobre.descricao=seoSobDesEl.value.trim();
  const seoSobPalEl=document.getElementById('cfg-seo-sobre-palavras'); if(seoSobPalEl) cfg.seoPaginas.sobre.palavrasChave=seoSobPalEl.value.trim();
  const seoGalTitEl=document.getElementById('cfg-seo-galeria-titulo'); if(seoGalTitEl) cfg.seoPaginas.galeria.titulo=seoGalTitEl.value.trim();
  const seoGalDesEl=document.getElementById('cfg-seo-galeria-descricao'); if(seoGalDesEl) cfg.seoPaginas.galeria.descricao=seoGalDesEl.value.trim();
  const seoGalPalEl=document.getElementById('cfg-seo-galeria-palavras'); if(seoGalPalEl) cfg.seoPaginas.galeria.palavrasChave=seoGalPalEl.value.trim();
  const seoCarTitEl=document.getElementById('cfg-seo-carrossel-titulo'); if(seoCarTitEl) cfg.seoPaginas.carrossel.titulo=seoCarTitEl.value.trim();
  const seoCarDesEl=document.getElementById('cfg-seo-carrossel-descricao'); if(seoCarDesEl) cfg.seoPaginas.carrossel.descricao=seoCarDesEl.value.trim();
  const seoCarPalEl=document.getElementById('cfg-seo-carrossel-palavras'); if(seoCarPalEl) cfg.seoPaginas.carrossel.palavrasChave=seoCarPalEl.value.trim();
  delete cfg.senhaAdmin;
  if(novaSenha){
    const novaHash=await sha256(novaSenha);
    const authData={...(STATE.auth||{}),senhaAdmin:novaHash};
    const okAuth=await salvarArquivo(PATHS.auth,authData,'authSha','Admin: atualizar senha');
    if(okAuth)STATE.senhaAdmin=novaHash;
  }
  STATE.config=cfg;
  const ok=await salvarArquivo(PATHS.config,cfg,'configSha','Admin: atualizar configurações gerais');
  if(ok){document.getElementById('cfg-nova-senha').value='';document.getElementById('cfg-conf-senha').value='';}
}
async function salvarFidHero() {
  const cfg = STATE.config || {};
  cfg.fidHeroTitulo = document.getElementById('cfg-fid-hero-titulo').value.trim();
  cfg.fidHeroDesc = document.getElementById('cfg-fid-hero-desc').value.trim();
  STATE.config = cfg;
  const ok = await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar hero fidelidade');
}

// =====================================================================
// SOBRE — Carregar e salvar página sobre.html
// =====================================================================
function ensureConfigBeforeSection(sectionLabel, onReady){
  if(STATE.config) return true;
  toast(`⚠️ Config ainda não carregou para ${sectionLabel}. Tentando recarregar...`,'aviso');
  carregarConfigAdmin(true)
    .then(() => { try{ onReady(); }catch(e){} })
    .catch(e => console.warn(`[Admin] Falha ao recarregar config (${sectionLabel})`, e));
  return false;
}
function carregarSobre() {
  if(!ensureConfigBeforeSection('Sobre', carregarSobre)) return;
  const cfg = STATE.config || {};
  const sp = cfg.sobrePagina || {};
  prefillLog('[carregarSobre] cfg.sobrePagina', sp);
  setFieldValue('sobre-quem-somos-ano', sp.quemSomosAno || '2007', 'sobre.quemSomosAno');
  setFieldValue('sobre-quem-somos-endereco', sp.quemSomosEndereco || '', 'sobre.quemSomosEndereco');
  setFieldValue('sobre-quem-somos-cidade', sp.quemSomosCidade || 'Cajuru, SP', 'sobre.quemSomosCidade');
  setFieldValue('sobre-quem-somos-texto1', sp.quemSomosTexto1 || '', 'sobre.quemSomosTexto1');
  setFieldValue('sobre-quem-somos-texto2', sp.quemSomosTexto2 || '', 'sobre.quemSomosTexto2');
  setFieldValue('sobre-stat-anos-trad', sp.statAnosTrad || '19+', 'sobre.statAnosTrad');
  setFieldValue('sobre-stat-sabores', sp.statSabores || '35+', 'sobre.statSabores');
  setFieldValue('sobre-stat-nota-google', sp.statNotaGoogle || '4,8', 'sobre.statNotaGoogle');
  setFieldValue('sobre-stat-amor', sp.statAmor || '100%', 'sobre.statAmor');
  setFieldValue('sobre-historia-titulo', sp.historiaTitulo || '📖 Nossa História', 'sobre.historiaTitulo');
  setFieldValue('sobre-historia-texto1', sp.historiaTexto1 || '', 'sobre.historiaTexto1');
  setFieldValue('sobre-historia-texto2', sp.historiaTexto2 || '', 'sobre.historiaTexto2');
  setFieldValue('sobre-fazemos-titulo', sp.fazemosTitulo || '🍦 O que fazemos', 'sobre.fazemosTitulo');
  setFieldValue('sobre-fazemos-texto', sp.fazemosTexto || '', 'sobre.fazemosTexto');
  setFieldValue('sobre-cta-titulo', sp.ctaTitulo || '🍦 Vem Provar!', 'sobre.ctaTitulo');
  setFieldValue('sobre-cta-texto', sp.ctaTexto || '', 'sobre.ctaTexto');
}
async function salvarSobre() {
  const cfg = STATE.config || {};
  if (!cfg.sobrePagina) cfg.sobrePagina = {};
  cfg.sobrePagina.quemSomosAno = document.getElementById('sobre-quem-somos-ano').value.trim();
  cfg.sobrePagina.quemSomosEndereco = document.getElementById('sobre-quem-somos-endereco').value.trim();
  cfg.sobrePagina.quemSomosCidade = document.getElementById('sobre-quem-somos-cidade').value.trim();
  cfg.sobrePagina.quemSomosTexto1 = document.getElementById('sobre-quem-somos-texto1').value.trim();
  cfg.sobrePagina.quemSomosTexto2 = document.getElementById('sobre-quem-somos-texto2').value.trim();
  cfg.sobrePagina.statAnosTrad = document.getElementById('sobre-stat-anos-trad').value.trim();
  cfg.sobrePagina.statSabores = document.getElementById('sobre-stat-sabores').value.trim();
  cfg.sobrePagina.statNotaGoogle = document.getElementById('sobre-stat-nota-google').value.trim();
  cfg.sobrePagina.statAmor = document.getElementById('sobre-stat-amor').value.trim();
  cfg.sobrePagina.historiaTitulo = document.getElementById('sobre-historia-titulo').value.trim();
  cfg.sobrePagina.historiaTexto1 = document.getElementById('sobre-historia-texto1').value.trim();
  cfg.sobrePagina.historiaTexto2 = document.getElementById('sobre-historia-texto2').value.trim();
  cfg.sobrePagina.fazemosTitulo = document.getElementById('sobre-fazemos-titulo').value.trim();
  cfg.sobrePagina.fazemosTexto = document.getElementById('sobre-fazemos-texto').value.trim();
  cfg.sobrePagina.ctaTitulo = document.getElementById('sobre-cta-titulo').value.trim();
  cfg.sobrePagina.ctaTexto = document.getElementById('sobre-cta-texto').value.trim();
  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar página sobre');
}

// =====================================================================
// CARROSSEL — Carregar e salvar configurações de carrossel.html
// =====================================================================
function carregarCarrosselConfig() {
  const cfg = STATE.config || {};
  const cc = cfg.carrosselConfig || {};
  document.getElementById('carrossel-titulo').value = cc.titulo || 'Carrossel de Fotos – Sorveteria Itapolitana Cajuru';
  document.getElementById('carrossel-h1').value = cc.h1 || 'Carrossel de Fotos – Sorveteria Itapolitana Cajuru';
  document.getElementById('carrossel-autoplay-delay').value = cc.autoplayDelay || 3000;
  document.getElementById('carrossel-transition-speed').value = cc.transitionSpeed || 800;
}
async function salvarCarrosselConfig() {
  const cfg = STATE.config || {};
  if (!cfg.carrosselConfig) cfg.carrosselConfig = {};
  cfg.carrosselConfig.titulo = document.getElementById('carrossel-titulo').value.trim();
  cfg.carrosselConfig.h1 = document.getElementById('carrossel-h1').value.trim();
  cfg.carrosselConfig.autoplayDelay = parseInt(document.getElementById('carrossel-autoplay-delay').value) || 3000;
  cfg.carrosselConfig.transitionSpeed = parseInt(document.getElementById('carrossel-transition-speed').value) || 800;
  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar configurações do carrossel');
}

// =====================================================================
// GALERIA — Carregar e salvar configurações de galeria.html
// =====================================================================
function renderGaleriaImagensEditor(imagens) {
  const wrap = document.getElementById('galeria-imagens-lista');
  if (!wrap) return;
  const lista = Array.isArray(imagens) ? imagens : [];
  if (lista.length === 0) {
    wrap.innerHTML = '<div class="hint" style="margin:6px 0">Nenhuma imagem cadastrada. Clique em “Adicionar Imagem”.</div>';
    return;
  }
  wrap.innerHTML = lista.map((img, i) => {
    const url = esc((img && img.url) || '');
    const alt = esc((img && img.alt) || '');
    const titulo = esc((img && img.titulo) || '');
    const preview = url
      ? (url.startsWith('http') ? url : ('https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/' + url))
      : '';
    return `<div data-galeria-img-row="1" style="display:grid;grid-template-columns:86px 1fr auto;gap:10px;align-items:start;padding:10px;border:1px solid #eceff1;border-radius:12px;background:#fff;margin-bottom:10px">
      <div>
        ${preview ? `<img src="${preview}" alt="${alt}" style="width:86px;height:58px;object-fit:cover;border-radius:8px;border:1px solid #e0e0e0" loading="lazy" decoding="async" onerror="this.style.opacity=.35"/>` : `<div style="width:86px;height:58px;border-radius:8px;border:1px dashed #cfd8dc;display:flex;align-items:center;justify-content:center;color:#90a4ae;font-weight:800;font-size:.72rem">IMG</div>`}
      </div>
      <div>
        <div class="campo-edit" style="margin:0 0 8px">
          <label>URL</label>
          <input type="text" id="galeria-img-url-${i}" value="${url}" placeholder="images/..." style="width:100%"/>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="campo-edit" style="margin:0">
            <label>Alt (acessibilidade/SEO)</label>
            <input type="text" id="galeria-img-alt-${i}" value="${alt}" maxlength="160" placeholder="Texto alternativo"/>
          </div>
          <div class="campo-edit" style="margin:0">
            <label>Título (opcional)</label>
            <input type="text" id="galeria-img-titulo-${i}" value="${titulo}" maxlength="80" placeholder="Título curto"/>
          </div>
        </div>
      </div>
      <div style="display:grid;gap:6px">
        <button class="btn btn-excluir" type="button" style="padding:6px 10px" onclick="removerImagemGaleria(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function lerGaleriaImagensDoDom() {
  const wrap = document.getElementById('galeria-imagens-lista');
  if (!wrap) return null;
  const rows = wrap.querySelectorAll('[data-galeria-img-row="1"]');
  const out = [];
  rows.forEach((row, i) => {
    const url = (document.getElementById(`galeria-img-url-${i}`)?.value || '').trim();
    const alt = (document.getElementById(`galeria-img-alt-${i}`)?.value || '').trim();
    const titulo = (document.getElementById(`galeria-img-titulo-${i}`)?.value || '').trim();
    if (!url) return;
    out.push({ url, alt, titulo });
  });
  return out;
}

function adicionarImagemGaleria() {
  const cfg = STATE.config || {};
  if (!cfg.galeriaPagina) cfg.galeriaPagina = {};
  const imgs = Array.isArray(cfg.galeriaPagina.imagens) ? cfg.galeriaPagina.imagens : [];
  imgs.push({ url: '', alt: '', titulo: '' });
  cfg.galeriaPagina.imagens = imgs;
  STATE.config = cfg;
  renderGaleriaImagensEditor(imgs);
}

function removerImagemGaleria(idx) {
  const cfg = STATE.config || {};
  if (!cfg.galeriaPagina) cfg.galeriaPagina = {};
  const imgs = Array.isArray(cfg.galeriaPagina.imagens) ? cfg.galeriaPagina.imagens : [];
  if (!imgs[idx]) return;
  imgs.splice(idx, 1);
  cfg.galeriaPagina.imagens = imgs;
  STATE.config = cfg;
  renderGaleriaImagensEditor(imgs);
}

function carregarGaleria() {
  console.log('[carregarGaleria] Iniciando carregamento da seção Galeria');
  try {
    if(!ensureConfigBeforeSection('Galeria', carregarGaleria)) return;
    const cfg = STATE.config || {};
    const seo = (cfg.seoPaginas && cfg.seoPaginas.galeria) || {};
    const gp = cfg.galeriaPagina || {};
    prefillLog('[carregarGaleria] seoPaginas.galeria', seo);
    prefillLog('[carregarGaleria] galeriaPagina', gp);

    const tituloEl = document.getElementById('cfg-seo-galeria-titulo');
    if (tituloEl) tituloEl.value = seo.titulo || 'Galeria | Sorveteria Itapolitana Cajuru';

    const descEl = document.getElementById('cfg-seo-galeria-descricao');
    if (descEl) descEl.value = seo.descricao || 'Fotos dos produtos e da loja Itapolitana em Cajuru.';

    const palavrasEl = document.getElementById('cfg-seo-galeria-palavras');
    if (palavrasEl) palavrasEl.value = seo.palavrasChave || '';

    const h1El = document.getElementById('galeria-h1');
    if (h1El) h1El.value = gp.h1 || '📸 Galeria – Sorveteria Itapolitana Cajuru';

    const descPagEl = document.getElementById('galeria-descricao');
    if (descPagEl) descPagEl.value = gp.descricao || 'Sorvete tipo artesanal, açaí, picolés e muito mais desde 2007 em Cajuru/SP.';
    renderGaleriaImagensEditor(gp.imagens);
    console.log('[carregarGaleria] Seção Galeria carregada com sucesso');
  } catch (e) {
    console.error('[carregarGaleria] Falha ao carregar seção Galeria', e);
    throw e;
  }
}

async function salvarGaleria() {
  const cfg = STATE.config || {};

  // Garantir que seoPaginas.galeria existe
  if (!cfg.seoPaginas) cfg.seoPaginas = {};
  if (!cfg.seoPaginas.galeria) cfg.seoPaginas.galeria = {};

  const tituloEl = document.getElementById('cfg-seo-galeria-titulo');
  if (tituloEl) cfg.seoPaginas.galeria.titulo = tituloEl.value.trim();

  const descEl = document.getElementById('cfg-seo-galeria-descricao');
  if (descEl) cfg.seoPaginas.galeria.descricao = descEl.value.trim();

  const palavrasEl = document.getElementById('cfg-seo-galeria-palavras');
  if (palavrasEl) cfg.seoPaginas.galeria.palavrasChave = palavrasEl.value.trim();

  // Garantir que galeriaPagina existe
  if (!cfg.galeriaPagina) cfg.galeriaPagina = {};

  const h1El = document.getElementById('galeria-h1');
  if (h1El) cfg.galeriaPagina.h1 = h1El.value.trim();

  const descPagEl = document.getElementById('galeria-descricao');
  if (descPagEl) cfg.galeriaPagina.descricao = descPagEl.value.trim();

  const imagens = lerGaleriaImagensDoDom();
  if (imagens) cfg.galeriaPagina.imagens = imagens;

  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar galeria');
}

// =====================================================================
// ENCOMENDAS — Carregar e salvar configurações de encomendas.html
// =====================================================================
function carregarEncomendas() {
  try {
    if(!ensureConfigBeforeSection('Site Encomendas', carregarEncomendas)) return;
    const cfg = STATE.config || {};
    const seo = (cfg.seoPaginas && cfg.seoPaginas.encomendas) || {};
    const ep = cfg.encomendasPagina || {};
    prefillLog('[carregarEncomendas] seoPaginas.encomendas', seo);
    prefillLog('[carregarEncomendas] encomendasPagina', ep);

    setFieldValue('cfg-seo-encomendas-titulo', seo.titulo || 'Encomendas | Sorveteria Itapolitana Cajuru', 'encomendas.seo.titulo');
    setFieldValue('cfg-seo-encomendas-descricao', seo.descricao || 'Faça sua encomenda de sorvetes, tortas e picolés para festas e eventos em Cajuru/SP.', 'encomendas.seo.descricao');
    setFieldValue('encomendas-hero-titulo', ep.heroTitulo || '🛒 Cardápio e Encomendas <span class="destaque">Itapolitana Cajuru</span>', 'encomendas.hero.titulo');
    setFieldValue('encomendas-hero-descricao', ep.heroDescricao || 'Sorvete tipo artesanal em caixa, tortas geladas, picolés em atacado e acréscimos. Feito com carinho desde 2007, entregue com qualidade. Pedido fácil pelo WhatsApp!', 'encomendas.hero.descricao');
    setFieldValue('encomendas-hero-badges', Array.isArray(ep.heroBadges) ? ep.heroBadges.join('\n') : '', 'encomendas.hero.badges');
  } catch (e) {
    console.error('[carregarEncomendas] Falha ao carregar seção Encomendas', e);
    throw e;
  }
}

async function salvarEncomendas() {
  const cfg = STATE.config || {};

  // Garantir que seoPaginas.encomendas existe
  if (!cfg.seoPaginas) cfg.seoPaginas = {};
  if (!cfg.seoPaginas.encomendas) cfg.seoPaginas.encomendas = {};

  const tituloEl = document.getElementById('cfg-seo-encomendas-titulo');
  if (tituloEl) cfg.seoPaginas.encomendas.titulo = tituloEl.value.trim();

  const descEl = document.getElementById('cfg-seo-encomendas-descricao');
  if (descEl) cfg.seoPaginas.encomendas.descricao = descEl.value.trim();

  // Garantir que encomendasPagina existe
  if (!cfg.encomendasPagina) cfg.encomendasPagina = {};

  const heroTituloEl = document.getElementById('encomendas-hero-titulo');
  if (heroTituloEl) cfg.encomendasPagina.heroTitulo = heroTituloEl.value.trim();

  const heroDescEl = document.getElementById('encomendas-hero-descricao');
  if (heroDescEl) cfg.encomendasPagina.heroDescricao = heroDescEl.value.trim();

  const heroBadgesEl = document.getElementById('encomendas-hero-badges');
  if (heroBadgesEl) cfg.encomendasPagina.heroBadges = lerLinhasTextarea('encomendas-hero-badges');

  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar encomendas');
}

// =====================================================================
//  PÁGINA — Carregar e salvar textos de
// =====================================================================
function carregarFidelidadePagina() {
  const cfg = STATE.config || {};
  const seo = (cfg.seoPaginas && cfg.seoPaginas.fidelidade) || {};
  const fp = cfg.fidelidadePagina || {};

  const tituloEl = document.getElementById('cfg-seo-fidelidade-titulo');
  if (tituloEl) tituloEl.value = seo.titulo || ' | Sorveteria Itapolitana Cajuru';

  const descEl = document.getElementById('cfg-seo-fidelidade-descricao');
  if (descEl) descEl.value = seo.descricao || 'Acumule pontos por código nos cupons da Itapolitana Cajuru e troque por prêmios. Cadastre-se no .';

  const comoFuncTitEl = document.getElementById('fidelidade-como-funciona-titulo');
  if (comoFuncTitEl) comoFuncTitEl.value = fp.comoFuncionaTitulo || 'Como funciona';

  const acaoTitEl = document.getElementById('fidelidade-acao-titulo');
  if (acaoTitEl) acaoTitEl.value = fp.acaoTitulo || 'Quero participar do ';

  const btnCadEl = document.getElementById('fidelidade-btn-cadastro');
  if (btnCadEl) btnCadEl.value = fp.btnCadastro || 'Quero participar do ';

  const btnLogEl = document.getElementById('fidelidade-btn-login');
  if (btnLogEl) btnLogEl.value = fp.btnLogin || 'Já sou cadastrado / Digitar código';

  const regrasTitEl = document.getElementById('fidelidade-regras-titulo');
  if (regrasTitEl) regrasTitEl.value = fp.regrasTitulo || 'Regras do ';

  const btnAceitEl = document.getElementById('fidelidade-btn-aceitar-regras');
  if (btnAceitEl) btnAceitEl.value = fp.btnAceitarRegras || 'Li e aceito as regras do ';

  const regTitEl = document.getElementById('fidelidade-regulamento-titulo');
  if (regTitEl) regTitEl.value = fp.regulamentoTitulo || 'Regras completas do programa';

  const regSumEl = document.getElementById('fidelidade-regulamento-summary');
  if (regSumEl) regSumEl.value = fp.regulamentoSummary || '📜 Ler regulamento completo do ';
}

async function salvarFidelidadePagina() {
  const cfg = STATE.config || {};

  // Garantir que seoPaginas.fidelidade existe
  if (!cfg.seoPaginas) cfg.seoPaginas = {};
  if (!cfg.seoPaginas.fidelidade) cfg.seoPaginas.fidelidade = {};

  const tituloEl = document.getElementById('cfg-seo-fidelidade-titulo');
  if (tituloEl) cfg.seoPaginas.fidelidade.titulo = tituloEl.value.trim();

  const descEl = document.getElementById('cfg-seo-fidelidade-descricao');
  if (descEl) cfg.seoPaginas.fidelidade.descricao = descEl.value.trim();

  // Garantir que fidelidadePagina existe
  if (!cfg.fidelidadePagina) cfg.fidelidadePagina = {};

  const comoFuncTitEl = document.getElementById('fidelidade-como-funciona-titulo');
  if (comoFuncTitEl) cfg.fidelidadePagina.comoFuncionaTitulo = comoFuncTitEl.value.trim();

  const acaoTitEl = document.getElementById('fidelidade-acao-titulo');
  if (acaoTitEl) cfg.fidelidadePagina.acaoTitulo = acaoTitEl.value.trim();

  const btnCadEl = document.getElementById('fidelidade-btn-cadastro');
  if (btnCadEl) cfg.fidelidadePagina.btnCadastro = btnCadEl.value.trim();

  const btnLogEl = document.getElementById('fidelidade-btn-login');
  if (btnLogEl) cfg.fidelidadePagina.btnLogin = btnLogEl.value.trim();

  const regrasTitEl = document.getElementById('fidelidade-regras-titulo');
  if (regrasTitEl) cfg.fidelidadePagina.regrasTitulo = regrasTitEl.value.trim();

  const btnAceitEl = document.getElementById('fidelidade-btn-aceitar-regras');
  if (btnAceitEl) cfg.fidelidadePagina.btnAceitarRegras = btnAceitEl.value.trim();

  const regTitEl = document.getElementById('fidelidade-regulamento-titulo');
  if (regTitEl) cfg.fidelidadePagina.regulamentoTitulo = regTitEl.value.trim();

  const regSumEl = document.getElementById('fidelidade-regulamento-summary');
  if (regSumEl) cfg.fidelidadePagina.regulamentoSummary = regSumEl.value.trim();

  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar fidelidade página');
}

// =====================================================================
// SORTEIOS — Carregar e salvar configuração de sorteios
// =====================================================================
function carregarConfigSorteio() {
  const fid = STATE.fidelidade || {};
  const sorteio = fid.sorteio || {};

  const statusEl = document.getElementById('sorteio-status');
  if (statusEl) statusEl.value = sorteio.status || 'ativo';

  const dataProxEl = document.getElementById('sorteio-data-prox');
  if (dataProxEl) dataProxEl.value = sorteio.dataProx || '';

  const dataFimEl = document.getElementById('sorteio-data-fim');
  if (dataFimEl) dataFimEl.value = sorteio.dataFim || '';

  const premioEl = document.getElementById('sorteio-premio');
  if (premioEl) premioEl.value = sorteio.premio || '1 caixa de 5 litros de sorvete tipo artesanal';

  const vencedorEl = document.getElementById('sorteio-vencedor');
  if (vencedorEl) vencedorEl.value = sorteio.vencedor || '';

  const obsEl = document.getElementById('sorteio-obs');
  if (obsEl) obsEl.value = sorteio.obs || '';

  // Estatísticas
  const inscritos = (fid.sorteioInscritos || []).length;
  const inscritosEl = document.getElementById('sorteio-inscritos');
  if (inscritosEl) inscritosEl.textContent = inscritos;

  // Calcular dias restantes
  const diasEl = document.getElementById('sorteio-dias-restantes');
  if (diasEl && sorteio.dataProx) {
    const hoje = new Date();
    const dataProx = new Date(sorteio.dataProx);
    const diff = Math.ceil((dataProx - hoje) / (1000 * 60 * 60 * 24));
    diasEl.textContent = diff > 0 ? diff : '0';
  } else if (diasEl) {
    diasEl.textContent = '-';
  }
}

async function salvarConfigSorteio() {
  if (!fidRequireWrite()) return;

  const fid = STATE.fidelidade || {};
  if (!fid.sorteio) fid.sorteio = {};

  const statusEl = document.getElementById('sorteio-status');
  if (statusEl) fid.sorteio.status = statusEl.value;

  const dataProxEl = document.getElementById('sorteio-data-prox');
  if (dataProxEl) fid.sorteio.dataProx = dataProxEl.value;

  const dataFimEl = document.getElementById('sorteio-data-fim');
  if (dataFimEl) fid.sorteio.dataFim = dataFimEl.value;

  const premioEl = document.getElementById('sorteio-premio');
  if (premioEl) fid.sorteio.premio = premioEl.value.trim();

  const vencedorEl = document.getElementById('sorteio-vencedor');
  if (vencedorEl) fid.sorteio.vencedor = vencedorEl.value.trim();

  const obsEl = document.getElementById('sorteio-obs');
  if (obsEl) fid.sorteio.obs = obsEl.value.trim();

  fid.sorteio.atualizado = new Date().toISOString();

  STATE.fidelidade = fid;
  await salvarArquivo(PATHS.fidelidade, fid, 'fidelidadeSha', 'Admin: atualizar sorteio');
  toast('Configuração do sorteio salva com sucesso!', 'ok');
  carregarConfigSorteio();
}

// =====================================================================
// REGRAS DE PONTUAÇÃO — Carregar e salvar
// =====================================================================
function carregarRegrasPontuacao() {
  const fid = STATE.fidelidade || {};
  const config = fid.config || {};

  const ptsEl = document.getElementById('pontos-por-codigo');
  if (ptsEl) ptsEl.value = config.pontosPorCodigo || 0.5;

  const valorEl = document.getElementById('valor-por-codigo');
  if (valorEl) valorEl.value = config.valorMonetarioPorCodigo || 10;

  const descEl = document.getElementById('descricao-regra-pontos');
  if (descEl) descEl.value = config.descricaoRegra || 'Cada cupom representa R$10 em compras e confere 0,5 ponto ao cadastrar';
}

async function salvarRegrasPontuacao() {
  if (!fidRequireWrite()) return;

  const fid = STATE.fidelidade || {};
  if (!fid.config) fid.config = {};

  const ptsEl = document.getElementById('pontos-por-codigo');
  if (ptsEl) {
    const val = parseFloat(ptsEl.value);
    fid.config.pontosPorCodigo = Number.isFinite(val) && val > 0 ? val : 0.5;
  }

  const valorEl = document.getElementById('valor-por-codigo');
  if (valorEl) {
    const val = parseFloat(valorEl.value);
    fid.config.valorMonetarioPorCodigo = Number.isFinite(val) && val > 0 ? val : 10;
  }

  const descEl = document.getElementById('descricao-regra-pontos');
  if (descEl) fid.config.descricaoRegra = descEl.value.trim();

  STATE.fidelidade = fid;
  await salvarArquivo(PATHS.fidelidade, fid, 'fidelidadeSha', 'Admin: atualizar regras de pontuação');
  toast('Regras de pontuação salvas com sucesso!', 'ok');
  carregarRegrasPontuacao();

  // Também atualizar no config.json para sincronização com o site
  const cfg = STATE.config || {};
  cfg.fidelidadePontosPorCodigo = fid.config.pontosPorCodigo;
  cfg.fidelidadeValorPorCodigo = fid.config.valorMonetarioPorCodigo;
  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: sincronizar regras de pontuação');
}

// Salvar Textos da Promoção (IDs: promo-h1, promo-badge-el, promo-titulo-el, promo-desc-el)
function toast(msg,tipo=''){const el=document.getElementById('toast');el.textContent=msg;el.className='toast show '+tipo;setTimeout(()=>el.className='toast',3000);}
function mostrarLoading(txt='Salvando...'){document.getElementById('loading-txt').textContent=txt;document.getElementById('loading-overlay').style.display='flex';}
function ocultarLoading(){document.getElementById('loading-overlay').style.display='none';}

// =====================================================================
// SABORES — gestão de sabores de sorvete e picolés
// =====================================================================
const PICOLES_PADRAO = {"frutas_agua": {"id": "pic_frutas_agua", "nome": "Picolé de Fruta/Água", "preço_varejo": 2.5, "preço_atacado": 1.8, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Abacaxi", "esgotado": false}, {"nome": "Caju", "esgotado": false}, {"nome": "Goiaba", "esgotado": false}, {"nome": "Groselha", "esgotado": false}, {"nome": "Limão (base água)", "esgotado": false}, {"nome": "Melância", "esgotado": false}, {"nome": "Uva", "esgotado": false}, {"nome": "Tamarindo", "esgotado": false}]}, "leite_sem_recheio": {"id": "pic_leite_sem_recheio", "nome": "Picolé de Leite sem Recheio", "preço_varejo": 2.5, "preço_atacado": 2.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Coco Queimado", "esgotado": false}, {"nome": "Milho Verde", "esgotado": false}, {"nome": "Amendoim", "esgotado": false}, {"nome": "Pistache", "esgotado": false}]}, "leite_com_recheio": {"id": "pic_leite_com_recheio", "nome": "Picolé de Leite com Recheio", "preço_varejo": 3.0, "preço_atacado": 2.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Açaí", "esgotado": false}, {"nome": "Blue Ice", "esgotado": false}, {"nome": "Caraxi", "esgotado": false}, {"nome": "Coco Branco", "esgotado": false}, {"nome": "Chocolate", "esgotado": false}, {"nome": "Amarena (Cereja Italiana Azeda)", "esgotado": false}, {"nome": "Leite Condensado", "esgotado": false}, {"nome": "Mamão Papaia", "esgotado": false}, {"nome": "Maracujá", "esgotado": false}, {"nome": "Morango", "esgotado": false}, {"nome": "Menta com Chocolate", "esgotado": false}, {"nome": "Nata com Goiaba", "esgotado": false}]}, "leite_ninho": {"id": "pic_leite_ninho", "nome": "Picolé Leite Ninho", "preço_varejo": 4.0, "preço_atacado": 3.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Leite Ninho", "esgotado": false}]}, "ovomaltine": {"id": "pic_ovomaltine", "nome": "Picolé de Ovomaltine", "preço_varejo": 4.0, "preço_atacado": 3.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Ovomaltine", "esgotado": false}]}, "esquimós": {"id": "pic_esquimós", "nome": "Picolé Esquimó", "preço_varejo": 8.0, "preço_atacado": 6.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Bombom", "esgotado": false}, {"nome": "Nutella", "esgotado": false}, {"nome": "Ovomaltine", "esgotado": false}, {"nome": "Leite Ninho", "esgotado": false}, {"nome": "Nata", "esgotado": false}, {"nome": "Morango", "esgotado": false}, {"nome": "Brigadeiro", "esgotado": false}, {"nome": "Prestígio", "esgotado": false}]}};

// =====================================================================
// SABORES — renderização dinâmica a partir do produtos.json (Single Source of Truth)
// =====================================================================
function renderizarSaboresAdmin() {
  const prod = STATE.produtos;
  if (!prod) {
    adminMostrarErroCarregamento('sabores-sorvete-grid', 'dados/produtos.json');
    renderizarPicolésAdmin(); renderizarAcréscimosAdmin(); return;
  }

  // Sabores de sorvete — renderizar dinamicamente a partir do JSON
  const container = document.getElementById('sabores-sorvete-grid');
  if (container && prod.sorvetes && prod.sorvetes.sabores) {
    const saboresAtivos = new Set(prod.sorvetes.sabores);
    const todosOsSabores = prod.sorvetes.todos_sabores || prod.sorvetes.sabores;
    container.innerHTML = todosOsSabores.map(nome => {
      const sid = 'sab_' + nome.replace(/\s+/g,'_').replace(/[()]/g,'').replace(/\//g,'_').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      const ativo = saboresAtivos.has(nome);
      return `<div class="sabor-item${ativo ? '' : ' esgotado'}" id="wrap_${sid}">
        <div class="sabor-nome">${nome}</div>
        <label class="toggle" title="Desativar = esgotado no site">
          <input type="checkbox" id="${sid}" ${ativo ? 'checked' : ''} onchange="toggleSabor('${sid}', '${nome.replace(/'/g, "\\'")}')"/>
          <span class="toggle-slider"></span>
        </label>
        <span class="sabor-status${ativo ? '' : ' esgotado'}" id="status_${sid}">${ativo ? 'Disponível' : 'Esgotado'}</span>
        <button class="btn-remover-sabor" onclick="removerSaborSorvete('${nome.replace(/'/g, "\\'")}')"
          title="Remover sabor permanentemente">&#x1F5D1;</button>
      </div>`;
    }).join('');
  }

  renderizarPicolésAdmin();
  renderizarAcréscimosAdmin();
}

function toggleSaborSorvete(sid, nome) {
  const cb = document.getElementById(sid);
  const st = document.getElementById('status_' + sid);
  const wrap = document.getElementById('wrap_' + sid);
  const ativo = cb ? cb.checked : true;
  if (st) { st.textContent = ativo ? 'Disponível' : 'Esgotado'; st.className = 'sabor-status' + (ativo ? '' : ' esgotado'); }
  if (wrap) wrap.className = 'sabor-item' + (ativo ? '' : ' esgotado');
}

function removerSaborSorvete(nome) {
  confirmarAcao(
    'Remover Sabor',
    `Remover o sabor <strong>${nome}</strong> permanentemente?`,
    'Sim, remover sabor',
    () => _removerSaborSorveteConfirmado(nome),
    'aviso'
  );
}
function _removerSaborSorveteConfirmado(nome) {
  const prod = STATE.produtos;
  if (!prod || !prod.sorvetes) return;
  prod.sorvetes.sabores = (prod.sorvetes.sabores || []).filter(s => s !== nome);
  if (prod.sorvetes.todos_sabores) {
    prod.sorvetes.todos_sabores = prod.sorvetes.todos_sabores.filter(s => s !== nome);
  }
  STATE.produtos = prod;
  renderizarSaboresAdmin();
  toast(`Sabor "${nome}" removido. Salve para confirmar.`, 'aviso');
}

function toggleSabor(sid) {
  const cb = document.getElementById(sid);
  const st = document.getElementById('status_' + sid);
  const wrap = document.getElementById('wrap_' + sid);
  if (st) { st.textContent = cb.checked ? 'Disponível' : 'Esgotado'; st.className = 'sabor-status' + (cb.checked ? '' : ' esgotado'); }
  if (wrap) wrap.className = 'sabor-item' + (cb.checked ? '' : ' esgotado');
}

function toggleSaborPicolé(cat, sabor, ativo) {
  const norm = s => s.replace(/\s+/g,'_').replace(/[()]/g,'').replace(/\//g,'_').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const sid = 'pic_' + norm(cat) + '_' + norm(sabor);
  const st = document.getElementById('status_' + sid);
  if (st) { st.textContent = ativo ? 'Disponível' : 'Esgotado'; st.className = 'sabor-status' + (ativo ? '' : ' esgotado'); }
}

function adicionarSaborPicolé(cat) {
  const norm = s => s.replace(/\s+/g,'_').replace(/[()]/g,'').replace(/\//g,'_').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const inp = document.getElementById('novo_sab_' + cat);
  if (!inp) { toast('Campo de entrada não encontrado.', 'erro'); return; }
  const nome = inp.value.trim();
  if (!nome) { toast('Digite o nome do sabor.', 'erro'); return; }
  if (nome.length > 30) { toast('Máx. 30 caracteres.', 'erro'); return; }
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(nome)) { toast('Apenas letras, espaços e acentos.', 'erro'); return; }
  const prod = STATE.produtos;
  if (!prod) { toast('Dados não carregados. Aguarde.', 'erro'); return; }
  const picoles = prod.picoles || prod.picolés || {};
  const catData = picoles[cat];
  if (!catData) { toast('Categoria não encontrada.', 'erro'); return; }
  if (!Array.isArray(catData.sabores)) catData.sabores = [];
  const nomes = catData.sabores.map(s => typeof s === 'object' ? s.nome : s);
  if (nomes.some(s => s.toLowerCase() === nome.toLowerCase())) { toast('Este sabor já existe nesta categoria!', 'erro'); return; }
  catData.sabores.push(nome);
  const grid = inp.closest('.campo-edit') && inp.closest('.campo-edit').previousElementSibling;
  if (grid && grid.classList.contains('sabores-grid')) {
    const sid = 'pic_' + norm(cat) + '_' + norm(nome);
    const div = document.createElement('div');
    div.className = 'sabor-item';
    const spanNome = document.createElement('span');
    spanNome.className = 'sabor-nome';
    spanNome.textContent = nome;
    const label = document.createElement('label');
    label.className = 'toggle';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = sid;
    cb.checked = true;
    cb.addEventListener('change', function() { toggleSaborPicolé(cat, nome, this.checked); });
    const slider = document.createElement('span');
    slider.className = 'toggle-slider';
    label.appendChild(cb);
    label.appendChild(slider);
    const spanStatus = document.createElement('span');
    spanStatus.className = 'sabor-status';
    spanStatus.id = 'status_' + sid;
    spanStatus.textContent = 'Disponível';
    div.appendChild(spanNome);
    div.appendChild(label);
    div.appendChild(spanStatus);
    grid.appendChild(div);
  }
  inp.value = '';
  toast('Sabor "' + nome + '" adicionado! Salve para publicar no site.', 'sucesso');
}

function adicionarSaborSorvete() {
  const inp = document.getElementById('novo_sabor_sorvete');
  const nome = inp.value.trim();
  if (!nome) { toast('Digite o nome do sabor.', 'erro'); return; }
  if (nome.length > 40) { toast('Máx. 40 caracteres.', 'erro'); return; }
  const prod = STATE.produtos;
  if (!prod || !prod.sorvetes) { toast('Dados não carregados. Aguarde.', 'erro'); return; }
  // Verificar duplicata
  const todosOsSabores = prod.sorvetes.todos_sabores || prod.sorvetes.sabores || [];
  if (todosOsSabores.some(s => s.toLowerCase() === nome.toLowerCase())) {
    toast('Este sabor já existe!', 'erro'); return;
  }
  // Adicionar ao JSON em memória
  if (!prod.sorvetes.todos_sabores) prod.sorvetes.todos_sabores = [...prod.sorvetes.sabores];
  prod.sorvetes.todos_sabores.push(nome);
  prod.sorvetes.sabores.push(nome); // ativo por padrão
  STATE.produtos = prod;
  inp.value = '';
  renderizarSaboresAdmin();
  toast(`Sabor "${nome}" adicionado! Salve para publicar no site.`, 'sucesso');
}

function renderizarPicolésAdmin() {
  // Usar STATE.produtos como fonte de verdade (sincronizado com produtos.json)
  const prod = STATE.produtos;
  // Aceita 'picoles' (JSON sem acento) ou 'picolés' (JS com acento), normaliza campos
  const _raw = (prod && prod.picoles) ? prod.picoles : ((prod && prod.picolés) ? prod.picolés : PICOLES_PADRAO);
  const body = document.getElementById('estoque-picolés-body');
  if (!body) return;
  const norm = s => s.replace(/\s+/g,'_').replace(/[()]/g,'').replace(/\//g,'_').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let html = '';
  for (const [cat, pp] of Object.entries(_raw)) {
    // Normalizar chaves de preço com ou sem acento para não crashar
    const pVarejo  = pp.preço_varejo  ?? pp.preco_varejo  ?? 0;
    const pAtacado = pp.preço_atacado ?? pp.preco_atacado ?? 0;
    const estoque  = pp.estoque ?? 200;
    const esgotado = pp.esgotado ?? false;
    const nome     = pp.nome || cat;
    const sabores  = Array.isArray(pp.sabores) ? pp.sabores : [];
    const saboresHtml = sabores.map(s => {
      const snome = typeof s === 'string' ? s : (s && s.nome ? s.nome : '');
      const sesgotado = typeof s === 'object' && s ? (s.esgotado || false) : false;
      if (!snome) return '';
      const sid = 'pic_' + norm(cat) + '_' + norm(snome);
      return '<div class="sabor-item ' + (sesgotado ? 'esgotado' : '') + '"><span class="sabor-nome">' + snome + '</span><label class="toggle"><input type="checkbox" id="' + sid + '" ' + (sesgotado ? '' : 'checked') + ' onchange="toggleSaborPicolé(\'' + cat + '\',\'' + snome + '\',this.checked)"/><span class="toggle-slider"></span></label><span class="sabor-status ' + (sesgotado ? 'esgotado' : '') + '" id="status_' + sid + '">' + (sesgotado ? 'Esgotado' : 'Disponível') + '</span></div>';
    }).join('');
    html += '<div class="estoque-card ' + (esgotado ? 'esgotado' : '') + '"><div class="estoque-header"><span class="estoque-nome">🍭 ' + nome + '</span><span class="estoque-preço-badge">Varejo R$ ' + pVarejo.toFixed(2).replace('.',',') + ' | Atacado R$ ' + pAtacado.toFixed(2).replace('.',',') + '</span></div><div class="estoque-campos"><div class="campo-edit"><label>Preço Varejo (Cardápio)</label><div class="preço-inp"><span>R$</span><input type="number" id="pic_' + cat + '_varejo" value="' + pVarejo + '" min="0" step="0.1"/></div><div class="hint">Preço unitário no cardápio da loja.</div></div><div class="campo-edit"><label>Preço Atacado (Encomendas)</label><div class="preço-inp"><span>R$</span><input type="number" id="pic_' + cat + '_atacado" value="' + pAtacado + '" min="0" step="0.1"/></div><div class="hint">Preço por unidade em encomendas (mín. 100 un.).</div></div><div class="campo-edit"><label>Estoque total (0 a 200)</label><div style="display:flex;align-items:center;gap:10px"><button class="btn-qty-est" onclick="ajustarEstoquePicolé(\'' + cat + '\',-1)">-</button><input type="number" id="pic_' + cat + '_estoque" value="' + estoque + '" min="0" max="200" style="width:70px;text-align:center;font-size:1.2rem;font-weight:700;border:2px solid #e0e0e0;border-radius:8px;padding:6px"/><button class="btn-qty-est btn-add" onclick="ajustarEstoquePicolé(\'' + cat + '\',1)">+</button></div><div class="hint">0 = Esgotado. Max. 200.</div></div></div><div class="seção-título" style="font-size:.78rem;margin:12px 0 8px">Sabores desta categoria</div><div class="sabores-grid">' + saboresHtml + '</div></div>';
  }
  body.innerHTML = html;
}

function ajustarEstoquePicolé(cat, delta) {
  const inp = document.getElementById('pic_' + cat + '_estoque');
  if (!inp) return;
  let v = parseInt(inp.value) + delta;
  v = Math.max(0, Math.min(200, v));
  inp.value = v;
}

async function salvarSabores() {
  mostrarLoading('Salvando sabores...');
  try {
    const prod = STATE.produtos;
    if (!prod) { toast('Dados não carregados. Tente novamente.', 'erro'); ocultarLoading(); return; }

    // Coletar sabores de sorvete a partir do grid dinâmico
    const saboresEls = document.querySelectorAll('#sabores-sorvete-grid .sabor-item');
    const sabores = [];
    saboresEls.forEach(el => {
      const nome = el.querySelector('.sabor-nome') ? el.querySelector('.sabor-nome').textContent.trim() : '';
      const cb = el.querySelector('input[type=checkbox]');
      if (nome) sabores.push({ nome, esgotado: cb ? !cb.checked : false });
    });

    // Atualizar sorvetes no STATE.produtos (Single Source of Truth)
    prod.sorvetes.sabores = sabores.filter(s => !s.esgotado).map(s => s.nome);
    if (prod.sorvetes.todos_sabores) {
      prod.sorvetes.todos_sabores = sabores.map(s => s.nome);
    }

    // Coletar picolés diretamente do STATE.produtos
    const norm = s => s.replace(/\s+/g,'_').replace(/[()]/g,'').replace(/\//g,'_').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const picoles = prod.picoles || {};
    for (const cat of Object.keys(picoles)) {
      const varejo = parseFloat(document.getElementById('pic_' + cat + '_varejo')?.value) || picoles[cat].preco_varejo || picoles[cat].preço_varejo || 0;
      const atacado = parseFloat(document.getElementById('pic_' + cat + '_atacado')?.value) || picoles[cat].preco_atacado || picoles[cat].preço_atacado || 0;
      const estoque = parseInt(document.getElementById('pic_' + cat + '_estoque')?.value);
      if (!isNaN(varejo)) { picoles[cat].preco_varejo = varejo; picoles[cat].preço_varejo = varejo; }
      if (!isNaN(atacado)) { picoles[cat].preco_atacado = atacado; picoles[cat].preço_atacado = atacado; }
      if (!isNaN(estoque)) { picoles[cat].estoque = estoque; picoles[cat].esgotado = estoque === 0; }
      // Atualizar sabores de cada categoria de picolé
      const saboresCat = picoles[cat].sabores || [];
      if (Array.isArray(saboresCat) && saboresCat.length > 0 && typeof saboresCat[0] === 'object') {
        picoles[cat].sabores = saboresCat.map(s => {
          const sid = 'pic_' + norm(cat) + '_' + norm(s.nome);
          const cb = document.getElementById(sid);
          return { nome: s.nome, esgotado: cb ? !cb.checked : s.esgotado };
        });
      }
    }
    prod.picoles = picoles;
    STATE.produtos = prod;

    // Salvar no GitHub (produtos.json)
    const ok = await salvarArquivo(PATHS.produtos, prod, 'produtosSha', 'Admin: atualizar sabores e preços');
    toast('Sabores salvos e publicados no site!', 'sucesso');
  } catch(e) { toast('Erro: ' + e.message, 'erro'); }
  ocultarLoading();
}

// =====================================================================
// ESTOQUE — gestao de estoque de encomendas
// =====================================================================
// Helper: lê preço normalizando chaves 'preço' (com acento) e 'preco' (legado localStorage)
function _normPreço(obj, fallback) { return obj.preço || obj.preco || fallback; }
function renderizarEstoqueAdmin() {
  console.log('[renderizarEstoqueAdmin] Iniciando carregamento da seção Estoque');
  try {
    carregarEstoque();
    console.log('[renderizarEstoqueAdmin] Seção Estoque carregada com sucesso');
  } catch (e) {
    console.error('[renderizarEstoqueAdmin] Falha ao carregar seção Estoque', e);
    throw e;
  }
}

function carregarEstoque() {
  const prod = STATE.produtos;
  const CAIXAS_IDS = ['cx5l_2s','cx5l_3s','cx10l_2s','cx10l_3s'];
  const CAIXAS_PAD = [{preço:100,estoque:20},{preço:115,estoque:20},{preço:150,estoque:15},{preço:165,estoque:15}];
  // Priorizar dados do GitHub (STATE.produtos), fallback para localStorage
  const caixas = (prod && prod.caixas_enc && prod.caixas_enc.length > 0)
    ? prod.caixas_enc
    : JSON.parse(localStorage.getItem('itap_caixas_enc') || '[]');
  CAIXAS_IDS.forEach((id, i) => {
    const d = caixas[i] || CAIXAS_PAD[i];
    const pr = document.getElementById(id + '_preço'); if (pr) pr.value = _normPreço(d, CAIXAS_PAD[i].preço);
    const es = document.getElementById(id + '_estoque'); if (es) es.value = d.estoque != null ? d.estoque : CAIXAS_PAD[i].estoque;
    const eg = document.getElementById(id + '_esgotado'); if (eg) eg.checked = !!d.esgotado;
  });
  const tortas = (prod && prod.tortas_enc && prod.tortas_enc.length > 0)
    ? prod.tortas_enc
    : JSON.parse(localStorage.getItem('itap_tortas_enc') || '[]');
  const torta = tortas[0] || {preço:100,estoque:10,esgotado:false};
  const tp = document.getElementById('torta1_preço'); if (tp) tp.value = _normPreço(torta, 100);
  const te = document.getElementById('torta1_estoque'); if (te) te.value = torta.estoque != null ? torta.estoque : 10;
  const teg = document.getElementById('torta1_esgotado'); if (teg) teg.checked = !!torta.esgotado;
  renderizarPicolésAdmin();
  renderizarAcréscimosAdmin();
}

function ajustarEstoque(id, delta) {
  const inp = document.getElementById(id + '_estoque');
  if (!inp) return;
  let v = parseInt(inp.value) + delta;
  v = Math.max(0, Math.min(999, v));
  inp.value = v;
  if (v === 0) { const eg = document.getElementById(id + '_esgotado'); if (eg) eg.checked = true; }
}

function toggleEsgotado(id) {
  const eg = document.getElementById(id + '_esgotado');
  const es = document.getElementById(id + '_estoque');
  if (eg && eg.checked && es) es.value = 0;
}

function renderizarAcréscimosAdmin() {
  const PADRAO = [
    {id:'acr_canudinho',nome:'Canudinho Wafer',preço:0.25,estoque:100,esgotado:false},
    {id:'acr_casquinha',nome:'Casquinhas',preço:0.25,estoque:100,esgotado:false},
    {id:'acr_cascão',nome:'Cascão',preço:1.00,estoque:100,esgotado:false},
    {id:'acr_cestinha',nome:'Cestinha Recheada',preço:1.00,estoque:100,esgotado:false},
    {id:'acr_cobertura',nome:'Cobertura 1.3L',preço:40.00,estoque:100,esgotado:false}
  ];
  // Priorizar dados do GitHub (STATE.produtos.acrescimos), depois localStorage, depois padrão
  let dados;
  if (STATE.produtos && STATE.produtos.acrescimos && STATE.produtos.acrescimos.length > 0) {
    dados = STATE.produtos.acrescimos;
  } else {
    const salvo = localStorage.getItem('itap_acréscimos');
    dados = salvo ? JSON.parse(salvo) : PADRAO;
  }
  const body = document.getElementById('estoque-acréscimos-body');
  if (!body) return;
  let html = '';
  dados.forEach((a, i) => {
    html += '<div class="estoque-card ' + (a.esgotado ? 'esgotado' : '') + '"><div class="estoque-header"><span class="estoque-nome">🍪 ' + a.nome + '</span><span class="estoque-preço-badge">R$ ' + (a.preço||0).toFixed(2).replace('.',',') + '</span></div><div class="estoque-campos"><div class="campo-edit"><label>Nome do Acréscimo</label><input type="text" id="acr_' + i + '_nome" value="' + a.nome + '" maxlength="30"/><div class="hint">Max. 30 caracteres. Letras e espacos.</div></div><div class="campo-edit"><label>Preço (R$)</label><div class="preço-inp"><span>R$</span><input type="number" id="acr_' + i + '_preço" value="' + a.preço + '" min="0" step="0.05"/></div><div class="hint">Preço por unidade do acréscimo.</div></div><div class="campo-edit"><label>Estoque</label><div style="display:flex;align-items:center;gap:10px"><button class="btn-qty-est" onclick="ajustarEstoqueAcr(' + i + ',-1)">-</button><input type="number" id="acr_' + i + '_estoque" value="' + a.estoque + '" min="0" max="999" style="width:70px;text-align:center;font-size:1.2rem;font-weight:700;border:2px solid #e0e0e0;border-radius:8px;padding:6px"/><button class="btn-qty-est btn-add" onclick="ajustarEstoqueAcr(' + i + ',1)">+</button></div><div class="hint">0 = Esgotado no site.</div></div></div></div>';
  });
  body.innerHTML = html;
}

function ajustarEstoqueAcr(i, delta) {
  const inp = document.getElementById('acr_' + i + '_estoque');
  if (!inp) return;
  let v = parseInt(inp.value) + delta;
  v = Math.max(0, Math.min(999, v));
  inp.value = v;
}

async function salvarEstoque() {
  mostrarLoading('Salvando estoque...');
  try {
    const CAIXAS_IDS = ['cx5l_2s','cx5l_3s','cx10l_2s','cx10l_3s'];
    const CAIXAS_NOMES = ['Caixa 5 Litros - 2 Sabores','Caixa 5 Litros - 3 Sabores','Caixa 10 Litros - 2 Sabores','Caixa 10 Litros - 3 Sabores'];
    const CAIXAS_MAX = [2,3,2,3];
    // Preços das caixas: lê do STATE (fonte de verdade) pois não há campo de preço editável nesta seção
    const CAIXAS_PRECOS_PAD = [100, 115, 150, 165];
    const _caixasAtual = (STATE.produtos && STATE.produtos.caixas_enc) ? STATE.produtos.caixas_enc : [];
    const caixas = CAIXAS_IDS.map((id, i) => {
      const elPreço = document.getElementById(id + '_preço');
      const preçoFallback = _caixasAtual[i] ? (_caixasAtual[i].preço || _caixasAtual[i].preco || CAIXAS_PRECOS_PAD[i]) : CAIXAS_PRECOS_PAD[i];
      const preço = elPreço ? (parseFloat(elPreço.value) || preçoFallback) : preçoFallback;
      const estoque = parseInt(document.getElementById(id + '_estoque') ? document.getElementById(id + '_estoque').value : 20);
      const esgotado = (document.getElementById(id + '_esgotado') ? document.getElementById(id + '_esgotado').checked : false) || estoque === 0;
      return { id, nome: CAIXAS_NOMES[i], preço, maxSabores: CAIXAS_MAX[i], estoque: isNaN(estoque) ? 20 : estoque, esgotado };
    });
    localStorage.setItem('itap_caixas_enc', JSON.stringify(caixas));
    // Preço da torta: lê do STATE como fallback
    const _tortaAtual = (STATE.produtos && STATE.produtos.tortas_enc && STATE.produtos.tortas_enc[0]) ? STATE.produtos.tortas_enc[0] : null;
    const elTortaPreço = document.getElementById('torta1_preço');
    const tortaPreçoFallback = _tortaAtual ? (_tortaAtual.preço || _tortaAtual.preco || 100) : 100;
    const torta_preço = elTortaPreço ? (parseFloat(elTortaPreço.value) || tortaPreçoFallback) : tortaPreçoFallback;
    const torta_estoque = parseInt(document.getElementById('torta1_estoque') ? document.getElementById('torta1_estoque').value : 10);
    const torta_esgotado = (document.getElementById('torta1_esgotado') ? document.getElementById('torta1_esgotado').checked : false) || torta_estoque === 0;
    localStorage.setItem('itap_tortas_enc', JSON.stringify([{id:'torta1',nome:'Torta de Sorvete',preço:torta_preço,maxSabores:3,estoque:isNaN(torta_estoque)?10:torta_estoque,esgotado:torta_esgotado}]));
    // Picolés: usar STATE.produtos como fonte de verdade (não localStorage)
    const _picRaw = (STATE.produtos && (STATE.produtos.picolés || STATE.produtos.picoles)) || null;
    const picDados = _picRaw
      ? Object.fromEntries(Object.entries(_picRaw).map(([k, v]) => [k, {
          preço_varejo:  v.preço_varejo  ?? v.preco_varejo  ?? 0,
          preço_atacado: v.preço_atacado ?? v.preco_atacado ?? 0,
          estoque: v.estoque ?? 200,
          esgotado: v.esgotado ?? false
        }]))
      : JSON.parse(localStorage.getItem('itap_picolés_admin') || JSON.stringify(PICOLES_PADRAO));
    for (const cat of Object.keys(picDados)) {
      const varejo = parseFloat(document.getElementById('pic_' + cat + '_varejo') ? document.getElementById('pic_' + cat + '_varejo').value : picDados[cat].preço_varejo) || picDados[cat].preço_varejo;
      const atacado = parseFloat(document.getElementById('pic_' + cat + '_atacado') ? document.getElementById('pic_' + cat + '_atacado').value : picDados[cat].preço_atacado) || picDados[cat].preço_atacado;
      const estoque = parseInt(document.getElementById('pic_' + cat + '_estoque') ? document.getElementById('pic_' + cat + '_estoque').value : picDados[cat].estoque);
      picDados[cat].preço_varejo = varejo;
      picDados[cat].preço_atacado = atacado;
      picDados[cat].estoque = isNaN(estoque) ? picDados[cat].estoque : estoque;
      picDados[cat].esgotado = picDados[cat].estoque === 0;
    }
    localStorage.setItem('itap_picolés_admin', JSON.stringify(picDados));
    const acréscimos = [];
    let i = 0;
    while (document.getElementById('acr_' + i + '_nome')) {
      const nome = document.getElementById('acr_' + i + '_nome').value.trim();
      const preço = parseFloat(document.getElementById('acr_' + i + '_preço').value) || 0;
      const estoque = parseInt(document.getElementById('acr_' + i + '_estoque').value);
      const esgotado = isNaN(estoque) ? false : estoque === 0;
      if (nome) acréscimos.push({ id: 'acr_' + i, nome, preço, estoque: isNaN(estoque) ? 100 : estoque, esgotado });
      i++;
    }
    if (acréscimos.length) localStorage.setItem('itap_acréscimos', JSON.stringify(acréscimos));
    const prod = STATE.produtos;
    let ok = true;
    if (prod) {
      // Atualizar picolés
      for (const [cat, dados] of Object.entries(picDados)) {
        if (prod.picolés && prod.picolés[cat]) {
          prod.picolés[cat].preço_varejo = dados.preço_varejo;
          prod.picolés[cat].preço_atacado = dados.preço_atacado;
          prod.picolés[cat].estoque = dados.estoque;
        }
        // Aceita também a chave sem acento (picoles)
        if (prod.picoles && prod.picoles[cat]) {
          prod.picoles[cat].preco_varejo = dados.preço_varejo;
          prod.picoles[cat].preco_atacado = dados.preço_atacado;
          prod.picoles[cat].estoque = dados.estoque;
        }
      }
      // Atualizar caixas, tortas e acréscimos no JSON da nuvem
      prod.caixas_enc = caixas;
      prod.tortas_enc = [{id:'torta1',nome:'Torta de Sorvete',preço:torta_preço,maxSabores:3,estoque:isNaN(torta_estoque)?10:torta_estoque,esgotado:torta_esgotado}];
      if (acréscimos.length) prod.acrescimos = acréscimos;
      STATE.produtos = prod;
      ok = await salvarArquivo(PATHS.produtos, prod, 'produtosSha', 'Admin: atualizar estoque encomendas');
    }
    if (ok !== false) toast('Estoque salvo!', 'sucesso');
  } catch(e) { toast('Erro: ' + e.message, 'erro'); }
  ocultarLoading();
}

document.getElementById('inp-senha').addEventListener('keydown',e=>{if(e.key==='Enter')entrar();});



/* =====================================================
   VALIDAÇÃO PROFISSIONAL — JAVASCRIPT
   ===================================================== */

// Contador de caracteres em tempo real
function initContadores() {
  document.querySelectorAll('input[maxlength], textarea[maxlength]').forEach(el => {
    const max = parseInt(el.getAttribute('maxlength'));
    if (!max) return;

    // Criar contador
    const counter = document.createElement('span');
    counter.className = 'char-counter';
    counter.textContent = `0/${max}`;
    el.parentElement.style.position = 'relative';
    el.parentElement.appendChild(counter);

    // Atualizar contador ao digitar
    el.addEventListener('input', () => {
      const len = el.value.length;
      counter.textContent = `${len}/${max}`;
      counter.className = 'char-counter';
      if (len >= max) {
        counter.classList.add('limite');
        el.classList.add('campo-erro');
      } else if (len >= max * 0.85) {
        counter.classList.add('quase');
        el.classList.remove('campo-erro');
      } else {
        el.classList.remove('campo-erro');
        if (len > 0) el.classList.add('campo-ok');
        else el.classList.remove('campo-ok');
      }
    });

    // Inicializar com valor atual
    if (el.value.length > 0) {
      el.dispatchEvent(new Event('input'));
    }
  });
}

// Válidação de WhatsApp em tempo real
function initVálidacaoWhatsApp() {
  const el = document.getElementById('cfg-whatsapp');
  if (!el) return;

  el.addEventListener('input', () => {
    const val = el.value.replace(/\D/g, '');
    el.value = val; // Remover não-números automaticamente

    const erroEl = el.parentElement.querySelector('.erro-inline') || criarErroInline(el);

    if (val.length > 0 && (val.length < 12 || val.length > 13)) {
      el.classList.add('campo-erro');
      el.classList.remove('campo-ok');
      erroEl.textContent = `⚠️ WhatsApp deve ter 12-13 dígitos (ex: 5516996062046). Atual: ${val.length} dígitos`;
      erroEl.classList.add('ativo');
    } else if (val.length >= 12) {
      el.classList.remove('campo-erro');
      el.classList.add('campo-ok');
      erroEl.classList.remove('ativo');
    }
  });
}

// Válidação de preço em tempo real
function initVálidacaoPreços() {
  document.querySelectorAll('input[type="number"][id*="preço"], input[type="number"][id*="valor"]').forEach(el => {
    el.addEventListener('input', () => {
      const val = parseFloat(el.value);
      const erroEl = el.parentElement.querySelector('.erro-inline') || criarErroInline(el);

      if (isNaN(val) || val < 0) {
        el.classList.add('campo-erro');
        erroEl.textContent = '⚠️ Preço deve ser um número positivo (ex: 15.00)';
        erroEl.classList.add('ativo');
      } else if (val > 999) {
        el.classList.add('campo-erro');
        erroEl.textContent = '⚠️ Preço acima de R$999? Verifique se está correto.';
        erroEl.classList.add('ativo');
      } else {
        el.classList.remove('campo-erro');
        el.classList.add('campo-ok');
        erroEl.classList.remove('ativo');
      }
    });
  });
}

// Criar elemento de erro inline
function criarErroInline(el) {
  const div = document.createElement('div');
  div.className = 'erro-inline';
  el.parentElement.appendChild(div);
  return div;
}

// Conversão automática de imagem para WebP via Canvas API
function processarImagem(file, maxWidth, maxHeight, qualidade, callback) {
  if (!file || !file.type.startsWith('image/')) {
    callback(null, 'Arquivo não é uma imagem válida');
    return;
  }

  // Verificar tamanho máximo (5MB antes de processar)
  if (file.size > 5 * 1024 * 1024) {
    callback(null, 'Imagem muito grande (máx. 5MB). Escolha uma imagem menor.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Calcular dimensões mantendo proporção
      let w = img.width;
      let h = img.height;

      if (w > maxWidth) {
        h = Math.round(h * maxWidth / w);
        w = maxWidth;
      }
      if (h > maxHeight) {
        w = Math.round(w * maxHeight / h);
        h = maxHeight;
      }

      // Desenhar no canvas
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      // Exportar como WebP
      canvas.toBlob((blob) => {
        if (!blob) {
          callback(null, 'Erro ao processar imagem');
          return;
        }

        const tamanhoKB = Math.round(blob.size / 1024);
        // Converter blob para dataUrl para uso em preview e upload base64
        const reader2 = new FileReader();
        reader2.onload = (ev) => {
          const info = {
            blob,
            dataUrl: ev.target.result,   // data:image/webp;base64,...
            width: w,
            height: h,
            tamanhoKB,
            tamanho: blob.size,
            formato: 'WebP',
            reducao: Math.round((1 - blob.size / file.size) * 100)
          };
          callback(info, null);
        };
        reader2.readAsDataURL(blob);
      }, 'image/webp', qualidade);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Criar campo de upload de imagem profissional
function criarUploadImagem(containerId, opções) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const {
    label = 'Imagem',
    maxWidth = 1200,
    maxHeight = 630,
    maxKB = 300,
    qualidade = 0.82,
    hint = '',
    obrigatório = false,
    onProcessada = null
  } = opções;

  container.innerHTML = `
    <div class="campo-edit">
      <label class="${obrigatório ? 'label-obrigatório' : ''}">${label}</label>
      <div style="background:#fff3e0;border:1.5px solid #ffcc80;border-radius:10px;padding:10px 14px;margin-bottom:10px;font-size:.8rem;color:#bf360c;line-height:1.7">
        <strong>📋 Especificações da imagem:</strong><br>
        📐 <strong>Dimensões:</strong> até ${maxWidth} × ${maxHeight} px — redimensionado automaticamente se maior<br>
        💾 <strong>Tamanho máximo:</strong> ${maxKB} KB após conversão<br>
        🖼️ <strong>Formatos aceitos:</strong> JPG, JPEG, PNG, WebP, HEIC<br>
        ⚡ <strong>Conversão automática:</strong> toda imagem é salva como WebP no GitHub
      </div>
      <div class="upload-area" id="${containerId}-area">
        <input type="file" accept="image/*" id="${containerId}-input"/>
        <div class="upload-icon">📷</div>
        <div class="upload-texto">Clique ou arraste a imagem aqui</div>
        <div class="upload-regras">
          <span>📐 ${maxWidth}×${maxHeight}px</span>
          <span>💾 Máx. ${maxKB}KB</span>
          <span>🖼️ JPG · PNG · WebP</span>
          <span>⚡ → WebP automático</span>
        </div>
      </div>
      <div class="upload-progress"><div class="upload-progress-bar" id="${containerId}-prog"></div></div>
      <div class="img-preview-wrap" id="${containerId}-preview-wrap">
        <img class="img-preview" id="${containerId}-preview" src="" alt="Preview"/>
        <div class="img-preview-info" id="${containerId}-info"></div>
      </div>
      <div class="erro-inline" id="${containerId}-erro"></div>
      ${hint ? `<div class="hint">${hint}</div>` : ''}
    </div>
  `;

  const input = document.getElementById(`${containerId}-input`);
  const previewWrap = document.getElementById(`${containerId}-preview-wrap`);
  const previewImg = document.getElementById(`${containerId}-preview`);
  const infoEl = document.getElementById(`${containerId}-info`);
  const erroEl = document.getElementById(`${containerId}-erro`);
  const progBar = document.getElementById(`${containerId}-prog`);
  const area = document.getElementById(`${containerId}-area`);

  // Drag & Drop
  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processarUpload(file);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) processarUpload(input.files[0]);
  });

  function processarUpload(file) {
    erroEl.classList.remove('ativo');
    progBar.parentElement.style.display = 'block';
    progBar.style.width = '30%';

    processarImagem(file, maxWidth, maxHeight, qualidade, (info, erro) => {
      progBar.style.width = '100%';

      setTimeout(() => {
        progBar.parentElement.style.display = 'none';
        progBar.style.width = '0%';
      }, 500);

      if (erro) {
        erroEl.textContent = '❌ ' + erro;
        erroEl.classList.add('ativo');
        previewWrap.classList.remove('ativo');
        return;
      }

      // Mostrar preview
      const url = URL.createObjectURL(info.blob);
      previewImg.src = url;
      previewWrap.classList.add('ativo');

      // Mostrar informações
      const statusKB = info.tamanhoKB <= maxKB ? 'info-ok' : 'info-aviso';
      infoEl.innerHTML = `
        <span class="info-ok">✅ WebP convertido</span>
        <span>${info.width}×${info.height}px</span>
        <span class="${statusKB}">${info.tamanhoKB}KB ${info.reducao > 0 ? `(${info.reducao}% menor)` : ''}</span>
      `;

      if (info.tamanhoKB > maxKB) {
        erroEl.textContent = `⚠️ Imagem ainda grande (${info.tamanhoKB}KB). Recomendado: máx. ${maxKB}KB. Tente uma imagem menor.`;
        erroEl.classList.add('ativo');
      }

      // Callback com o blob processado
      if (onProcessada) onProcessada(info.blob, info);
    });
  }
}

// Inicializar tudo quando o admin carregar
// =====================================================
// DOMContentLoaded ÚNICO DO ADMIN — orquestra tudo
// Padrão profissional: um único ponto de entrada
// =====================================================
document.addEventListener('DOMContentLoaded', () => {

  // 0. Guard: remove qualquer texto "solto" no <body> (bug clássico quando algo fica fora de <script>/<style>)
  // Isso evita aparecer texto indesejado abaixo do painel admin em caso de regressões de marcação.
  try{
    const soltos = Array.from(document.body.childNodes)
      .filter(n => n && n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length);
    soltos.forEach(n => n.remove());
  }catch(e){}

  // 0. Carrega a sessão já ativa nesta aba e mostra o status ao usuário
  try { preencherTokenSalvoNoLogin(); } catch(e) { console.warn('[Admin] preencherTokenSalvoNoLogin', e); }
  try { carregarConfigAdmin(); } catch(e) { console.warn('[Admin] carregarConfigAdmin', e); }

  // 1. Spellcheck e autocorreção em todos os campos
  if (typeof aplicarSpellcheck === 'function') aplicarSpellcheck();
  if (typeof aplicarAutocorrecao === 'function') aplicarAutocorrecao();

  // 2. Dirty-check: qualquer digitação no admin-app marca como alterado
  const adminApp = document.getElementById('admin-app');
  if (adminApp) {
    adminApp.addEventListener('input', e => {
      // Ignora campos de busca/filtro (não são dados persistíveis)
      const ignorePatterns = ['busca','filtro','search','pesquisa'];
      const id = (e.target.id || '').toLowerCase();
      if (!ignorePatterns.some(p => id.includes(p))) markDirty();
    });
  }

  // 2. Aguardar login para inicializar contadores e validações
  const _adminObserver = new MutationObserver(() => {
    const adminAppLogin=document.getElementById('admin-app');
    if(adminAppLogin&&adminAppLogin.style.display!=='none'){
      setTimeout(() => {
        if (typeof initContadores === 'function') initContadores();
        if (typeof initVálidacaoWhatsApp === 'function') initVálidacaoWhatsApp();
        if (typeof initVálidacaoPrecos === 'function') initVálidacaoPrecos();
      }, 300);
      _adminObserver.disconnect();
    }
  });
  _adminObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });

});

// =====================================================================
// SISTEMA DE PORTUGUÊS PERFEITO — Padrão grandes sites (iFood, Nubank)
// Camada 1: spellcheck nativo do navegador em todos os campos de texto
// Camada 2: autocorreção automática de erros comuns
// Camada 3: validação antes de salvar que avisa sobre erros
// =====================================================================
(function ativarPortuguesPerfeito() {

  // --- CAMADA 1: spellcheck nativo em todos os campos ---
  function aplicarSpellcheck() {
    document.querySelectorAll('input[type="text"], input[type="search"], textarea').forEach(el => {
      el.setAttribute('spellcheck', 'true');
      el.setAttribute('lang', 'pt-BR');
      el.setAttribute('autocomplete', 'off');
    });
  }

  // --- CAMADA 2: dicionário de autocorreção automática ---
  const AUTOCORRECOES = {
    // Erros de acento comuns
    'voce': 'você', 'Voce': 'Você', 'VOCE': 'VOCÊ',
    'nao': 'não', 'Nao': 'Não',
    'sao': 'são', 'Sao': 'São',
    'tambem': 'também', 'Tambem': 'Também',
    'ate': 'até', 'Ate': 'Até',
    'so': 'só', 'So': 'Só',
    'la': 'lá', 'La': 'Lá',
    'ja': 'já', 'Ja': 'Já',
    'ola': 'olá', 'Ola': 'Olá',
    'obrigado': 'obrigado', // correto
    'pagina': 'página', 'Pagina': 'Página',
    'cardapio': 'cardápio', 'Cardapio': 'Cardápio',
    'promocao': 'promoção', 'Promocao': 'Promoção',
    'configuracao': 'configuração', 'Configuracao': 'Configuração',
    'configuracoes': 'configurações', 'Configuracoes': 'Configurações',
    'encomenda': 'encomenda', // correto
    'fidelidade': 'fidelidade', // correto
    'sorvete': 'sorvete', // correto
    'açaí': 'açaí', 'Açaí': 'Açaí',
    'picole': 'picolé', 'Picole': 'Picolé',
    'milkshake': 'milkshake', // correto
    'preco': 'preço', 'Preco': 'Preço',
    'precos': 'preços', 'Precos': 'Preços',
    'sabor': 'sabor', // correto
    'sabores': 'sabores', // correto
    'estoque': 'estoque', // correto
    'esgotado': 'esgotado', // correto
    'disponivel': 'disponível', 'Disponivel': 'Disponível',
    'disponiveis': 'disponíveis', 'Disponiveis': 'Disponíveis',
    'necessario': 'necessário', 'Necessario': 'Necessário',
    'necessarios': 'necessários', 'Necessarios': 'Necessários',
    'unitario': 'unitário', 'Unitario': 'Unitário',
    'localizacao': 'localização', 'Localizacao': 'Localização',
    'exibicao': 'exibição', 'Exibicao': 'Exibição',
    'endereco': 'endereço', 'Endereco': 'Endereço',
    'telefone': 'telefone', // correto
    'numero': 'número', 'Numero': 'Número',
    'numeros': 'números', 'Numeros': 'Números',
    'titulo': 'título', 'Titulo': 'Título',
    'subtitulo': 'subtítulo', 'Subtitulo': 'Subtítulo',
    'descricao': 'descrição', 'Descricao': 'Descrição',
    'horario': 'horário', 'Horario': 'Horário',
    'horarios': 'horários', 'Horarios': 'Horários',
    'categoria': 'categoria', // correto
    'categorias': 'categorias', // correto
    'adicionar': 'adicionar', // correto
    'remover': 'remover', // correto
    'salvar': 'salvar', // correto
    'cancelar': 'cancelar', // correto
    'confirmar': 'confirmar', // correto
    'atualizar': 'atualizar', // correto
    'excluir': 'excluir', // correto
    'editar': 'editar', // correto
    'visualizar': 'visualizar', // correto
    'imagem': 'imagem', // correto
    'imagens': 'imagens', // correto
    'produto': 'produto', // correto
    'produtos': 'produtos', // correto
    'pedido': 'pedido', // correto
    'pedidos': 'pedidos', // correto
    'cliente': 'cliente', // correto
    'clientes': 'clientes', // correto
    'premio': 'prêmio', 'Premio': 'Prêmio',
    'premios': 'prêmios', 'Premios': 'Prêmios',
    'codigo': 'código', 'Codigo': 'Código',
    'codigos': 'códigos', 'Codigos': 'Códigos',
    'pontos': 'pontos', // correto
    'sorteio': 'sorteio', // correto
    'sorteios': 'sorteios', // correto
    'participante': 'participante', // correto
    'participantes': 'participantes', // correto
    'inscricao': 'inscrição', 'Inscricao': 'Inscrição',
    'inscricoes': 'inscrições', 'Inscricoes': 'Inscrições',
    'whatsapp': 'WhatsApp',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
  };

  function autocorrigirTexto(texto) {
    // Corrigir palavra por palavra
    return texto.replace(/\b(\w+)\b/g, (palavra) => {
      return AUTOCORRECOES[palavra] || palavra;
    });
  }

  // Aplicar autocorreção ao sair do campo (blur)
  function aplicarAutocorrecao() {
    document.querySelectorAll('input[type="text"], textarea').forEach(el => {
      el.addEventListener('blur', function() {
        const corrigido = autocorrigirTexto(this.value);
        if (corrigido !== this.value) {
          this.value = corrigido;
          this.style.borderColor = '#2e7d32';
          setTimeout(() => { this.style.borderColor = ''; }, 1500);
        }
      });
    });
  }

  // --- CAMADA 3: validação antes de salvar ---
  const PALAVRAS_SUSPEITAS = [
    /\b[A-Z]{5,}\b/,  // palavras todas em maiúsculo (grito)
    /[a-z]{3,}ao\b/,  // palavras terminando em 'ao' sem til (ex: configuracao)
    /[a-z]{3,}oes\b/, // palavras terminando em 'oes' sem til (ex: configuracoes)
    /[a-z]{3,}e\b(?!s)/, // palavras terminando em 'e' que deveriam ter acento
  ];

  // Interceptar funções de salvar para validar português
  const fnsSalvar = ['salvarHome', 'salvarPreços', 'salvarPromoção', 'salvarConfig',
                     'salvarConfigFidelidade', 'salvarSabores', 'salvarEstoque'];

  fnsSalvar.forEach(nome => {
    const original = window[nome];
    if (typeof original === 'function') {
      window[nome] = async function(...args) {
        // Verificar todos os campos de texto visíveis
        const campos = document.querySelectorAll('.seção.ativo input[type="text"], .seção.ativo textarea');
        let avisos = [];
        campos.forEach(el => {
          const val = el.value.trim();
          if (!val) return;
          // Verificar erros comuns
          if (/[a-z]{4,}ao\b/.test(val) && !/[\u00e3\u00e2]/.test(val)) {
            const label = el.closest('.campo-edit')?.querySelector('label')?.textContent || el.id;
            avisos.push(`"${label}": verifique acentuação (ex: configuração, não, são)`);
          }
        });
        if (avisos.length > 0) {
          const ok = confirm(
            '⚠️ Possíveis erros de português detectados:\n\n' +
            avisos.slice(0, 3).join('\n') +
            '\n\nDeseja salvar mesmo assim?'
          );
          if (!ok) return;
        }
        return original.apply(this, args);
      };
    }
  });

  // [aplicarSpellcheck e aplicarAutocorrecao fundidas no DOMContentLoaded principal]

  // Reaplicar quando o usuário navegar entre seções
  const origIrPara = window.irPara;
  if (typeof origIrPara === 'function') {
    window.irPara = function(...args) {
      const r = origIrPara.apply(this, args);
      setTimeout(() => { aplicarSpellcheck(); aplicarAutocorrecao(); }, 300);
      return r;
    };
  }

  // --- CAMADA 4: Aviso de alterações não salvas (padrão Shopify/WordPress) ---
  let _temAlteracoesNaoSalvas = false;

  function marcarAlterado() { _temAlteracoesNaoSalvas = true; }
  function marcarSalvo()    { _temAlteracoesNaoSalvas = false; }

  // Detectar mudanças em qualquer campo do admin
  document.addEventListener('input', function(e) {
    if (e.target.matches('input, textarea, select')) marcarAlterado();
  });

  // Interceptar salvarArquivo para marcar como salvo após sucesso
  const _origSalvarArquivo = window.salvarArquivo;
  if (typeof _origSalvarArquivo === 'function') {
    window.salvarArquivo = async function(...args) {
      const resultado = await _origSalvarArquivo.apply(this, args);
      if (resultado) marcarSalvo();
      return resultado;
    };
  }

  // Aviso ao tentar sair da página com alterações não salvas
  window.addEventListener('beforeunload', function(e) {
    if (_temAlteracoesNaoSalvas) {
      e.preventDefault();
      e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
      return e.returnValue;
    }
  });

  // Expor funções para uso externo
  window._adminMarcarAlterado = marcarAlterado;
  window._adminMarcarSalvo    = marcarSalvo;

})();

// ── TÍTULOS DO CARDÁPIO (GitHub API) ─────────────────────────────────────────
function carregarTitulosCardapio() {
  // Preferência: dados do GitHub (STATE.config), fallback localStorage
  var titulos = (STATE.config && STATE.config.titulosCardapio)
    ? STATE.config.titulosCardapio
    : JSON.parse(localStorage.getItem('cfg_titulos_cardapio') || '{}');
  var campos = [
    ['acc-sorvetes-titulo','Sorvetes de Massa'],
    ['acc-sorvetes-sub','Cremoso, gelado, irresistível · 35 sabores pra você escolher'],
    ['acc-picoles-titulo','Picolés'],
    ['acc-picoles-sub','Refrescante e gostoso · Fruta, Leite, Recheado, Ninho, Esquimó'],
    ['acc-açaí-promo-titulo','🔥 Açaí em Promoção'],
    ['acc-açaí-promo-sub','Aproveite agora! 8 combos irresistíveis · 400ml a 700ml'],
    ['acc-açaí-titulo','Açaí Natureon'],
    ['acc-açaí-sub','O melhor açaí da região · Cremoso, gelado e com muitos complementos'],
    ['acc-milk-titulo','Milkshakes'],
    ['acc-milk-sub','Cremoso e gelado · Tradicional e Top · 35 sabores'],
    ['acc-tacas-titulo','Taças'],
    ['acc-tacas-sub','Uma experiência única · Colegial, Sundae, Banana Split e mais'],
    ['acc-tacas-p-titulo','Taças Premium (Taças Sujas)'],
    ['acc-tacas-p-sub','O melhor da sorveteria · Prestígio, Kit Kat, Unicórnio e mais'],
    ['acc-iso-titulo','Isopores de Viagem'],
    ['acc-iso-sub','Leve o prazer para casa · 4 tamanhos disponíveis'],
    ['acc-sobremesas-titulo','Sobremesas Geladas'],
    ['acc-sobremesas-sub','Momentos especiais merecem isso · Fondue, Petit Gâteau, Brownie e mais'],
    ['acc-caixas-titulo','Sorvetes em Caixa 5 e 10 Litros'],
    ['acc-caixas-sub','Ideal para festas e eventos · 2 ou 3 sabores à escolha'],
    ['acc-torta-titulo','Tortas de Sorvete'],
    ['acc-torta-sub','Faça a festa! 3 sabores · Encomende com 3 dias de antecedência'],
    ['acc-enc-picoles-titulo','Picolés para Encomenda'],
    ['acc-enc-picoles-sub','Preço especial de atacado · 5 tipos · Mín. 100 unidades'],
    ['acc-complementos-titulo','Complementos para Sorvetes'],
    ['acc-complementos-sub','Canudinho, Casquinha, Cascão, Cestinha, Cobertura']
  ];
  campos.forEach(function(c) {
    var el = document.getElementById(c[0]);
    if (el) el.value = titulos[c[0]] || c[1];
  });
}

async function salvarTitulosCardapio() {
  var campos = ['acc-sorvetes-titulo','acc-sorvetes-sub','acc-picoles-titulo','acc-picoles-sub',
    'acc-açaí-promo-titulo','acc-açaí-promo-sub','acc-açaí-titulo','acc-açaí-sub',
    'acc-milk-titulo','acc-milk-sub','acc-tacas-titulo','acc-tacas-sub',
    'acc-tacas-p-titulo','acc-tacas-p-sub','acc-iso-titulo','acc-iso-sub',
    'acc-sobremesas-titulo','acc-sobremesas-sub','acc-caixas-titulo','acc-caixas-sub',
    'acc-torta-titulo','acc-torta-sub','acc-enc-picoles-titulo','acc-enc-picoles-sub',
    'acc-complementos-titulo','acc-complementos-sub'];
  var titulos = {};
  campos.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) titulos[id] = el.value.trim();
  });
  const cfg = STATE.config || {};
  cfg.titulosCardapio = titulos;
  STATE.config = cfg;
  // Manter localStorage como fallback para browsers offline
  try { localStorage.setItem('cfg_titulos_cardapio', JSON.stringify(titulos)); } catch(e) {}
  const ok = await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar títulos do cardápio');
}

// ── CARDÁPIO COMPLETO ──────────────────────────────────────────────────────
// ── CARDÁPIO — TABELAS DE PREÇO (padrão iFood/Baskin-Robbins) ────────────────
function _precoRowHTML(nome, preco, placeholder) {
  const n = String(nome||'').replace(/"/g,'&quot;');
  const p = Number(preco||0).toFixed(2);
  return `<div class="preco-row" style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
    <input type="text" class="preco-nome" value="${n}" placeholder="${placeholder||'Nome do item'}" style="flex:2;padding:8px 10px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.9rem;background:#fafafa"/>
    <div style="display:flex;align-items:center;gap:4px;background:#fff8f0;border:1.5px solid #f0c070;border-radius:8px;padding:5px 10px">
      <span style="font-size:.78rem;color:#999;font-weight:700">R$</span>
      <input type="number" class="preco-valor" value="${p}" min="0" step="0.5" style="width:65px;border:none;outline:none;font-size:.95rem;font-weight:900;color:#e65100;background:transparent;text-align:right"/>
    </div>
    <button class="btn btn-erro btn-sm" onclick="this.closest('.preco-row').remove()" title="Remover item" style="padding:5px 9px">🗑️</button>
  </div>`;
}
function renderCardapioPrecoTabela(containerId, obj, placeholder) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const items = Object.entries(obj||{});
  el.innerHTML = items.length
    ? items.map(([nome,preco]) => _precoRowHTML(nome, preco, placeholder)).join('')
    : `<p style="color:#bbb;font-size:.82rem;padding:6px 2px">Nenhum item ainda — clique em ➕ Adicionar abaixo.</p>`;
}
function addCardapioPrecoRow(containerId, placeholder) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const p = el.querySelector('p');
  if (p) p.remove();
  el.insertAdjacentHTML('beforeend', _precoRowHTML('', 0, placeholder||'Nome'));
  el.querySelectorAll('.preco-nome').forEach((inp,_,arr)=>{ if(inp===arr[arr.length-1]) inp.focus(); });
}
function readCardapioPrecoTabela(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return {};
  const obj = {};
  el.querySelectorAll('.preco-row').forEach(row => {
    const nome = (row.querySelector('.preco-nome')?.value||'').trim();
    const preco = parseFloat(row.querySelector('.preco-valor')?.value||'0')||0;
    if (nome) obj[nome] = preco;
  });
  return obj;
}
// Açaí Promo — 3 colunas: Tamanho/Nome | Descrição | Preço
function _promoComboRowHTML(nome, desc, preco) {
  const n = String(nome||'').replace(/"/g,'&quot;');
  const d = String(desc||'').replace(/"/g,'&quot;');
  const p = Number(preco||0).toFixed(2);
  return `<div class="promo-combo-row" style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
    <input type="text" class="combo-nome" value="${n}" placeholder="Ex: 400ml" style="flex:1;min-width:80px;padding:7px 9px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.88rem;background:#fafafa"/>
    <input type="text" class="combo-desc" value="${d}" placeholder="Descrição curta (opcional)" style="flex:2;min-width:120px;padding:7px 9px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:.88rem;background:#fafafa"/>
    <div style="display:flex;align-items:center;gap:4px;background:#fff8f0;border:1.5px solid #f0c070;border-radius:8px;padding:5px 10px">
      <span style="font-size:.78rem;color:#999;font-weight:700">R$</span>
      <input type="number" class="combo-preco" value="${p}" min="0" step="0.5" style="width:60px;border:none;outline:none;font-size:.95rem;font-weight:900;color:#e65100;background:transparent;text-align:right"/>
    </div>
    <button class="btn btn-erro btn-sm" onclick="this.closest('.promo-combo-row').remove()" title="Remover" style="padding:5px 9px">🗑️</button>
  </div>`;
}
function renderCardapioPromoTabela(containerId, lista) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = (lista&&lista.length)
    ? lista.map(i => _promoComboRowHTML(i.nome, i.desc, i.preco)).join('')
    : `<p style="color:#bbb;font-size:.82rem;padding:6px 2px">Nenhum combo ainda — clique em ➕ Adicionar abaixo.</p>`;
}
function addCardapioPromoCombo() {
  const el = document.getElementById('card-açaí-promo-tabela');
  if (!el) return;
  const p = el.querySelector('p'); if (p) p.remove();
  el.insertAdjacentHTML('beforeend', _promoComboRowHTML('','',0));
  el.querySelectorAll('.combo-nome').forEach((inp,_,arr)=>{ if(inp===arr[arr.length-1]) inp.focus(); });
}
function readCardapioPromoTabela() {
  const el = document.getElementById('card-açaí-promo-tabela');
  if (!el) return [];
  const arr = [];
  el.querySelectorAll('.promo-combo-row').forEach(row => {
    const nome = (row.querySelector('.combo-nome')?.value||'').trim();
    const desc = (row.querySelector('.combo-desc')?.value||'').trim();
    const preco = parseFloat(row.querySelector('.combo-preco')?.value||'0')||0;
    if (nome) arr.push({nome, desc, preco});
  });
  return arr;
}

function preencherCardapio() {
  const p = STATE.produtos;
  if (!p) {
    adminMostrarErroCarregamento('card-sorvetes-sabores', 'dados/produtos.json');
    return;
  }

  // Sorvetes
  if (p.sorvetes && p.sorvetes.sabores) {
    document.getElementById('card-sorvetes-sabores').value = p.sorvetes.sabores.join('\n');
  }

  // Picolés
  if (p.picoles) {
    if (p.picoles.frutas_agua) document.getElementById('card-picoles-fruta').value = (p.picoles.frutas_agua.sabores || []).join('\n');
    if (p.picoles.leite_sem_recheio) document.getElementById('card-picoles-leite').value = (p.picoles.leite_sem_recheio.sabores || []).join('\n');
    if (p.picoles.leite_com_recheio) document.getElementById('card-picoles-recheado').value = (p.picoles.leite_com_recheio.sabores || []).join('\n');
    if (p.picoles.leite_ninho) document.getElementById('card-picoles-ninho').value = (p.picoles.leite_ninho.sabores || []).join('\n');
    if (p.picoles.ovomaltine) document.getElementById('card-picoles-ovomaltine').value = (p.picoles.ovomaltine.sabores || []).join('\n');
    if (p.picoles.esquimós) document.getElementById('card-picoles-esquimo').value = (p.picoles.esquimós.sabores || []).join('\n');
  }

  // Açaí Promoção — tabela 3 colunas
  renderCardapioPromoTabela('card-açaí-promo-tabela', p.acai_promocao || []);

  // Açaí Tipo Artesanal — tabela 2 colunas
  if (p.acai) {
    renderCardapioPrecoTabela('card-açaí-tamanhos-tabela', p.acai.copos || {}, 'Ex: 400ml');
    if (p.acai.complementos) {
      let comps = [];
      Object.entries(p.acai.complementos).forEach(([cat, dados]) => {
        comps.push(`--- ${cat.toUpperCase()} (R$ ${Number(dados.preco||0).toFixed(2).replace('.',',')}) ---`);
        comps = comps.concat(dados.itens||[]);
      });
      document.getElementById('card-açaí-complementos').value = comps.join('\n');
    }
  }

  // Milkshakes
  if (p.milkshake) {
    if (Array.isArray(p.milkshake.sabores)) document.getElementById('card-milk-sabores').value = p.milkshake.sabores.join('\n');
    renderCardapioPrecoTabela('card-milk-trad-tabela', p.milkshake.tradicional || {}, 'Ex: 400ml');
    renderCardapioPrecoTabela('card-milk-top-tabela', p.milkshake.top || {}, 'Ex: 600ml');
    const ov = document.getElementById('card-milk-adicional-ovomaltine');
    if (ov) ov.value = p.milkshake.adicional_ovomaltine || 3;
  }

  // Taças — tabelas 2 colunas
  if (p.tacas) {
    renderCardapioPrecoTabela('card-tacas-tabela', p.tacas.tradicionais || {}, 'Ex: Colegial');
    renderCardapioPrecoTabela('card-tacas-p-tabela', p.tacas.sujas || {}, 'Ex: Unicórnio');
  }

  // Isopores
  renderCardapioPrecoTabela('card-iso-tabela', p.isopores_viagem || {}, 'Ex: 4 Bolas');

  // Sobremesas
  renderCardapioPrecoTabela('card-sobremesas-tabela', p.sobremesas || {}, 'Ex: Fondue');

  // Botões e textos (config)
  const c = STATE.config || {};
  document.getElementById('card-sorvetes-btn').value = c.cardSorvetesBtn || '🍦 Ver 35 Sabores';
  document.getElementById('card-sorvetes-desc').value = c.cardSorvetesDesc || 'Cremoso, gelado, irresistível · 35 sabores pra você escolher';
  document.getElementById('card-picoles-btn').value = c.cardPicolesBtn || '🧊 Ver Sabores de Picolés';
  document.getElementById('card-açaí-promo-btn').value = c.cardAçaíPromoBtn || '🫐 Ver Combos em Promoção';
  document.getElementById('card-açaí-btn').value = c.cardAçaíBtn || '🍇 Montar Meu Açaí';
  document.getElementById('card-milk-btn').value = c.cardMilkBtn || '🥤 Ver Milkshakes';
  document.getElementById('card-tacas-btn').value = c.cardTacasBtn || '🍧 Ver Taças';
  document.getElementById('card-tacas-p-btn').value = c.cardTacasPBtn || '👑 Ver Taças Premium';
  document.getElementById('card-iso-btn').value = c.cardIsoBtn || '🧊 Ver Isopores';
  document.getElementById('card-sobremesas-btn').value = c.cardSobremesasBtn || '🍨 Ver Sobremesas';
}

async function salvarCardápio() {
  const p = STATE.produtos;
  const c = STATE.config;
  if (!p || !c) return;

  // Sorvetes
  if (p.sorvetes) p.sorvetes.sabores = document.getElementById('card-sorvetes-sabores').value.split('\n').map(s => s.trim()).filter(s => s);

  // Picolés
  if (p.picoles) {
    if (p.picoles.frutas_agua) p.picoles.frutas_agua.sabores = document.getElementById('card-picoles-fruta').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.leite_sem_recheio) p.picoles.leite_sem_recheio.sabores = document.getElementById('card-picoles-leite').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.leite_com_recheio) p.picoles.leite_com_recheio.sabores = document.getElementById('card-picoles-recheado').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.leite_ninho) p.picoles.leite_ninho.sabores = document.getElementById('card-picoles-ninho').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.ovomaltine) p.picoles.ovomaltine.sabores = document.getElementById('card-picoles-ovomaltine').value.split('\n').map(s => s.trim()).filter(s => s);
    if (p.picoles.esquimós) p.picoles.esquimós.sabores = document.getElementById('card-picoles-esquimo').value.split('\n').map(s => s.trim()).filter(s => s);
  }

  // Açaí Promoção — tabela 3 colunas
  p.acai_promocao = readCardapioPromoTabela();

  // Açaí Tamanhos — tabela 2 colunas
  if (!p.acai) p.acai = {};
  const coposAcai = readCardapioPrecoTabela('card-açaí-tamanhos-tabela');
  if (Object.keys(coposAcai).length) p.acai.copos = coposAcai;

  // Milkshake sabores + tamanhos — tabelas
  if (!p.milkshake) p.milkshake = {};
  p.milkshake.sabores = document.getElementById('card-milk-sabores').value.split('\n').map(s=>s.trim()).filter(s=>s);
  const milkTrad = readCardapioPrecoTabela('card-milk-trad-tabela');
  if (Object.keys(milkTrad).length) p.milkshake.tradicional = milkTrad;
  const milkTop = readCardapioPrecoTabela('card-milk-top-tabela');
  if (Object.keys(milkTop).length) p.milkshake.top = milkTop;
  const ovomaltineVal = parseFloat(document.getElementById('card-milk-adicional-ovomaltine')?.value||'3')||0;
  p.milkshake.adicional_ovomaltine = ovomaltineVal;

  // Taças — tabelas 2 colunas
  if (!p.tacas) p.tacas = {};
  const tacasTrad = readCardapioPrecoTabela('card-tacas-tabela');
  if (Object.keys(tacasTrad).length) p.tacas.tradicionais = tacasTrad;
  const tacasSujas = readCardapioPrecoTabela('card-tacas-p-tabela');
  if (Object.keys(tacasSujas).length) p.tacas.sujas = tacasSujas;

  // Isopores
  const iso = readCardapioPrecoTabela('card-iso-tabela');
  if (Object.keys(iso).length) p.isopores_viagem = iso;

  // Sobremesas
  const sob = readCardapioPrecoTabela('card-sobremesas-tabela');
  if (Object.keys(sob).length) p.sobremesas = sob;

  // Botões e textos (config)
  c.cardSorvetesBtn = document.getElementById('card-sorvetes-btn').value.trim();
  c.cardSorvetesDesc = document.getElementById('card-sorvetes-desc').value.trim();
  c.cardPicolesBtn = document.getElementById('card-picoles-btn').value.trim();
  c.cardAçaíPromoBtn = document.getElementById('card-açaí-promo-btn').value.trim();
  c.cardAçaíBtn = document.getElementById('card-açaí-btn').value.trim();
  c.cardMilkBtn = document.getElementById('card-milk-btn').value.trim();
  c.cardTacasBtn = document.getElementById('card-tacas-btn').value.trim();
  c.cardTacasPBtn = document.getElementById('card-tacas-p-btn').value.trim();
  c.cardIsoBtn = document.getElementById('card-iso-btn').value.trim();
  c.cardSobremesasBtn = document.getElementById('card-sobremesas-btn').value.trim();

  mostrarLoading('Salvando Cardápio...');
  const ok1 = await salvarArquivo(PATHS.produtos, p, 'produtosSha', 'Admin: atualizar cardápio completo');
  const ok2 = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar botões do cardápio');
  ocultarLoading();

  if (ok1 && ok2) toast('✅ Cardápio completo atualizado!', 'sucesso');
}

// ── DEPOIMENTOS ─────────────────────────────────────────────────────────────
function preencherDepoimentos() {
  console.log('[preencherDepoimentos] Iniciando...');
  const c = STATE.config || {};
  console.log('[preencherDepoimentos] STATE.config:', c);

  // Novos campos Fase 3.2 - dicasPagina
  const dp = c.dicasPagina || {};
  const dicasH1El = document.getElementById('dicas-h1');
  if (dicasH1El) dicasH1El.value = dp.h1 || 'Dicas Essenciais da Sorveteria Itapolitana Cajuru';
  const dicasIntroEl = document.getElementById('dicas-intro');
  if (dicasIntroEl) dicasIntroEl.value = dp.intro || '';

  document.getElementById('dep-titulo').value = c.depTitulo || 'O que nossos clientes dizem';
  document.getElementById('dep-subtitulo').value = c.depSubtitulo || 'Confira as avaliações de quem já provou e amou nossos sorvetes e açaís.';
  // Estratégia de migração: config.json antigos salvavam uma única string em "depDica".
  // O novo formato usa o array "depDicas". A leitura aceita os dois formatos para garantir
  // que configs salvos antes da migração continuem funcionando sem perda de dados.
  // Remoção segura: após confirmar via auditoria (scripts/tests-admin-sync) que todos os
  // ambientes de produção já salvaram pelo menos uma vez com o novo formato (depDicas array).
  const depDicas = Array.isArray(c.depDicas) ? c.depDicas : (c.depDica ? [c.depDica] : []);
  document.getElementById('dep-dicas').value = depDicas.join('\n');

  const lista = c.depoimentos || [];
  console.log('[preencherDepoimentos] Depoimentos encontrados:', lista.length);
  const container = document.getElementById('dep-lista');
  if (!container) {
    console.error('[preencherDepoimentos] Elemento #dep-lista NÃO encontrado!');
    return;
  }

  container.innerHTML = lista.length
    ? lista.map((d, i) => `
    <div class="dep-item card" style="margin-bottom:15px; padding:15px; border:1px solid #eee">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px">
        <strong>Depoimento #${i+1}</strong>
        <button class="btn btn-erro btn-sm" onclick="removerDepoimentoComConfirm(${i})">&#128465;&#65039; Remover</button>
      </div>
      <div class="campo-edit"><label>Nome do Cliente</label><input type="text" id="dep-nome-${i}" value="${d.nome}" placeholder="Ex: João Silva"/></div>
      <div class="campo-edit"><label>Texto do Depoimento</label><textarea id="dep-texto-${i}" rows="3">${d.texto}</textarea></div>
      <div class="campo-edit"><label>Estrelas (1-5)</label><input type="number" id="dep-estrelas-${i}" value="${d.estrelas}" min="1" max="5"/></div>
      <div class="campo-edit">
        <label>📸 Foto do Cliente (opcional)</label>
        <div style="background:#f3e5f5;border:1.5px solid #ce93d8;border-radius:10px;padding:10px 14px;margin-bottom:8px;font-size:.78rem;color:#6a1b9a;line-height:1.7">
          📐 <strong>Dimensões:</strong> 200 × 200 px (quadrado) — redimensionado automaticamente<br>
          💾 <strong>Tamanho máximo:</strong> 50 KB após conversão<br>
          🖼️ <strong>Formatos aceitos:</strong> JPG, PNG, WebP<br>
          ⚡ <strong>Conversão automática:</strong> salva como WebP no GitHub
        </div>
        <div class="upload-area" id="dep-foto-area-${i}" style="padding:12px">
          <input type="file" accept="image/*" id="dep-foto-input-${i}" onchange="processarFotoDepoimento(this.files[0], ${i})"/>
          <div class="upload-icon" style="font-size:1.4rem">👤</div>
          <div class="upload-texto" style="font-size:.82rem">Clique para adicionar foto do cliente</div>
          <div class="upload-regras">
            <span>📐 200×200px</span>
            <span>💾 Máx. 50KB</span>
            <span>⚡ → WebP</span>
          </div>
        </div>
        ${d.foto ? `<div class="img-preview-wrap" style="display:block"><img class="img-preview" src="${d.foto}" alt="Foto ${d.nome}" style="width:80px;height:80px;border-radius:50%;object-fit:cover"/><div class="img-preview-info">Foto atual</div></div>` : ''}
        <div class="img-preview-wrap" id="dep-foto-preview-wrap-${i}" style="display:none">
          <img class="img-preview" id="dep-foto-preview-${i}" src="" alt="Preview foto" style="width:80px;height:80px;border-radius:50%;object-fit:cover"/>
          <div class="img-preview-info" id="dep-foto-info-${i}"></div>
        </div>
        <div class="erro-inline" id="dep-foto-erro-${i}"></div>
        <div class="hint">✅ Foto circular exibida ao lado do nome no depoimento. Deixe em branco para usar avatar padrão.</div>
      </div>
    </div>
  `).join('')
    : '<div style="text-align:center;padding:24px 10px;background:#fff8f0;border-radius:10px;border:1.5px dashed #ffcc80"><div style="font-size:2rem;margin-bottom:8px">💬</div><p style="color:#888;margin-bottom:12px">Nenhum depoimento cadastrado ainda.</p><p style="font-size:.82rem;color:#aaa">Clique em <strong>➕ Adicionar Depoimento</strong> abaixo para criar o primeiro.</p></div>';
  console.log('[preencherDepoimentos] Conteúdo renderizado. Lista vazia?', lista.length === 0);
  preencherDicasItens();
  const seoPg = c.seoPaginas || {};
  const seoDicasTit = document.getElementById('cfg-seo-dicas-titulo');
  if (seoDicasTit) seoDicasTit.value = seoPg.dicas?.titulo || '';
  const seoDicasDesc = document.getElementById('cfg-seo-dicas-descricao');
  if (seoDicasDesc) seoDicasDesc.value = seoPg.dicas?.descricao || '';
  const seoDicasPal = document.getElementById('cfg-seo-dicas-palavras');
  if (seoDicasPal) seoDicasPal.value = seoPg.dicas?.palavrasChave || '';
  console.log('[preencherDepoimentos] Concluído com sucesso!');
}

function adicionarDepoimento() {
  if (!STATE.config.depoimentos) STATE.config.depoimentos = [];
  STATE.config.depoimentos.push({nome: '', texto: '', estrelas: 5});
  preencherDepoimentos();
}

function preencherDicasItens() {
  const c = STATE.config || {};
  const container = document.getElementById('dicas-lista');
  if (!container) return;
  const lista = Array.isArray(c.dicasItens) ? c.dicasItens : [];
  container.innerHTML = lista.length
    ? lista.map((d, i) => `
    <div class="card" style="margin-bottom:12px;padding:14px;border:1px solid #eee">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
        <strong>Dica #${i+1}</strong>
        <button class="btn btn-erro btn-sm" onclick="removerDicaItem(${i})">&#128465;&#65039; Remover</button>
      </div>
      <div class="campo-edit"><label>Título</label><input type="text" id="dica-titulo-${i}" value="${esc(d.titulo || '')}" maxlength="100" placeholder="Ex.: Como conservar melhor seu sorvete"/></div>
      <div class="campo-edit"><label>Descrição</label><textarea id="dica-desc-${i}" rows="3" maxlength="280" placeholder="Resumo da dica para aparecer no card.">${esc(d.descricao || '')}</textarea></div>
      <div class="campo-edit"><label>Imagem (URL)</label><input type="url" id="dica-img-${i}" value="${esc(d.imagem || '')}" placeholder="https://... ou images/arquivo.webp"/></div>
      <div class="campo-edit"><label>Link de destino</label><input type="url" id="dica-link-${i}" value="${esc(d.link || '')}" placeholder="https://..."/></div>
    </div>
  `).join('')
    : '<div style="text-align:center;padding:24px 10px;background:#fff8f0;border-radius:10px;border:1.5px dashed #ffcc80"><div style="font-size:2rem;margin-bottom:8px">💡</div><p style="color:#888;margin-bottom:12px">Nenhuma dica cadastrada ainda.</p><p style="font-size:.82rem;color:#aaa">Clique em <strong>➕ Adicionar Dica</strong> abaixo para criar a primeira.</p></div>';
}

function adicionarDicaItem() {
  if (!STATE.config) STATE.config = {};
  if (!Array.isArray(STATE.config.dicasItens)) STATE.config.dicasItens = [];
  STATE.config.dicasItens.push({ titulo: '', descricao: '', imagem: '', link: '' });
  preencherDicasItens();
}

function removerDicaItem(i) {
  if (!Array.isArray(STATE.config?.dicasItens)) return;
  STATE.config.dicasItens.splice(i, 1);
  preencherDicasItens();
}

// Armazena fotos de depoimentos pendentes de upload (base64 WebP)
const _depFotosPendentes = {};

function processarFotoDepoimento(file, idx) {
  if (!file) return;
  const erroEl = document.getElementById(`dep-foto-erro-${idx}`);
  const previewWrap = document.getElementById(`dep-foto-preview-wrap-${idx}`);
  const previewImg = document.getElementById(`dep-foto-preview-${idx}`);
  const infoEl = document.getElementById(`dep-foto-info-${idx}`);
  if (erroEl) { erroEl.textContent = ''; erroEl.classList.remove('ativo'); }

  processarImagem(file, 200, 200, 0.82, (info, erro) => {
    if (erro) {
      if (erroEl) { erroEl.textContent = erro; erroEl.classList.add('ativo'); }
      return;
    }
    _depFotosPendentes[idx] = info.dataUrl;
    if (previewImg) previewImg.src = info.dataUrl;
    if (previewWrap) previewWrap.style.display = 'block';
    if (infoEl) infoEl.textContent = `${info.width}×${info.height}px — ${info.tamanhoKB} KB`;
  });
}

async function salvarDepoimentos() {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para salvar depoimentos.', 'aviso');
    return;
  }
  const c = STATE.config;

  // Novos campos Fase 3.2 - dicasPagina
  c.dicasPagina = c.dicasPagina || {};
  const dicasH1El = document.getElementById('dicas-h1');
  if (dicasH1El) c.dicasPagina.h1 = dicasH1El.value.trim();
  const dicasIntroEl = document.getElementById('dicas-intro');
  if (dicasIntroEl) c.dicasPagina.intro = dicasIntroEl.value.trim();

  c.depTitulo = document.getElementById('dep-titulo').value.trim();
  c.depSubtitulo = document.getElementById('dep-subtitulo').value.trim();
  c.depDicas = document.getElementById('dep-dicas').value.split('\n').map(s => s.trim()).filter(s => s);
  // Campo legado "depDica" (singular) mantido para compatibilidade com consumidores externos.
  // Remoção prevista: após confirmar que TODOS os ambientes salvaram com "depDicas" (array)
  // e que nenhum script lê config.depDica — remover na próxima versão principal do admin (v9+).
  c.depDica = c.depDicas[0] || '';

  const lista = [];
  const container = document.getElementById('dep-lista');
  const itens = container.querySelectorAll('.dep-item');

  // Upload de fotos pendentes
  for (let i = 0; i < itens.length; i++) {
    const dep = c.depoimentos && c.depoimentos[i] ? { ...c.depoimentos[i] } : {};
    dep.nome = document.getElementById(`dep-nome-${i}`)?.value.trim() || '';
    dep.texto = document.getElementById(`dep-texto-${i}`)?.value.trim() || '';
    dep.estrelas = parseInt(document.getElementById(`dep-estrelas-${i}`)?.value) || 5;
    // Se há foto nova pendente, fazer upload
    if (_depFotosPendentes[i]) {
      try {
        const nomeArq = `images/depoimentos/dep-foto-${i}.webp`;
        const b64 = _depFotosPendentes[i].split(',')[1];
        await ghPutImagem(nomeArq, b64);
        dep.foto = nomeArq + '?v=' + Date.now();
        delete _depFotosPendentes[i];
      } catch(e) {
        console.warn('Erro ao fazer upload da foto do depoimento:', e);
      }
    }
    lista.push(dep);
  }
  c.depoimentos = lista;
  const dicasItens = [];
  const dicasSalvas = Array.isArray(c.dicasItens) ? c.dicasItens : [];
  for (let i = 0; i < dicasSalvas.length; i++) {
    const titulo = (document.getElementById(`dica-titulo-${i}`)?.value || '').trim();
    const descricao = (document.getElementById(`dica-desc-${i}`)?.value || '').trim();
    const imagemRaw = (document.getElementById(`dica-img-${i}`)?.value || '').trim();
    const linkRaw = (document.getElementById(`dica-link-${i}`)?.value || '').trim();
    // allowRelative=true permite imagens locais versionadas no próprio repositório (ex.: images/dicas/x.webp).
    const imagem = cmsValidarUrl(imagemRaw, {allowRelative:true, allowEmpty:true});
    const link = cmsValidarUrl(linkRaw, {allowRelative:true, allowEmpty:true});
    if (imagem===null || link===null) {
      toast(`⚠️ URL inválida na dica #${i+1}. Use apenas links http/https.`, 'erro');
      return;
    }
    if (!titulo && !descricao && !imagem && !link) continue;
    dicasItens.push({ titulo, descricao, imagem, link });
  }
  c.dicasItens = dicasItens;
  c.seoPaginas = c.seoPaginas || {};
  c.seoPaginas.dicas = c.seoPaginas.dicas || {};
  const seoDicasTit = document.getElementById('cfg-seo-dicas-titulo');
  if (seoDicasTit) c.seoPaginas.dicas.titulo = seoDicasTit.value.trim();
  const seoDicasDesc = document.getElementById('cfg-seo-dicas-descricao');
  if (seoDicasDesc) c.seoPaginas.dicas.descricao = seoDicasDesc.value.trim();
  const seoDicasPal = document.getElementById('cfg-seo-dicas-palavras');
  if (seoDicasPal) c.seoPaginas.dicas.palavrasChave = seoDicasPal.value.trim();

  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar depoimentos e dicas');
}

function preencherNotasOperacionais(){
  try{
    const cfg = STATE.config || {};
    const obs = cfg.adminConteudoPaginas || {};
    prefillLog('[preencherNotasOperacionais] adminConteudoPaginas', obs);
    setFieldValue('qualidade-observacoes', obs.qualidade || '', 'notas.qualidade');
    setFieldValue('rastreio-observacoes', obs.rastreio || '', 'notas.rastreio');
    setFieldValue('auditoria-observacoes', obs.auditoria || '', 'notas.auditoria');
  }catch(e){
    console.error('[Admin] preencherNotasOperacionais',e);
  }
}

async function salvarNotasOperacionais(){
  const cfg = STATE.config || {};
  cfg.adminConteudoPaginas = cfg.adminConteudoPaginas || {};
  const q = document.getElementById('qualidade-observacoes');
  if (q) cfg.adminConteudoPaginas.qualidade = q.value.trim();
  const r = document.getElementById('rastreio-observacoes');
  if (r) cfg.adminConteudoPaginas.rastreio = r.value.trim();
  const a = document.getElementById('auditoria-observacoes');
  if (a) cfg.adminConteudoPaginas.auditoria = a.value.trim();
  STATE.config = cfg;
  await salvarArquivo(PATHS.config, cfg, 'configSha', 'Admin: atualizar observacoes de qualidade/rastreio/auditoria');
}

// ── FALE CONOSCO ────────────────────────────────────────────────────────────
function preencherFaleConosco() {
  const c = STATE.config || {};
  // --- Contato geral ---
  document.getElementById('fc-titulo').value = c.fcTitulo || 'Fale com a Itapolitana';
  document.getElementById('fc-subtitulo').value = c.fcSubtitulo || 'Manda uma mensagem, a gente responde rapidinho!';
  document.getElementById('fc-msg-sucesso').value = c.fcMsgSucesso || 'Mensagem enviada! Retornaremos em breve.';
  document.getElementById('fc-email').value = c.fcEmail || '';
  document.getElementById('fc-endereco').value = c.fcEndereco || c.enderecoCompleto || '';
  document.getElementById('fc-horario').value = c.fcHorario || c.horario || '';
  // --- Modal Fale Conosco (IDs: fale-modal-titulo, fale-modal-sub, fale-label-nome, fale-label-msg, fale-btn-texto) ---
  document.getElementById('fc-modal-titulo').value = c.faleModalTitulo || '📩 Fale Conosco';
  document.getElementById('fc-modal-sub').value = c.faleModalSub || 'Envie sua mensagem via WhatsApp';
  document.getElementById('fc-label-nome').value = c.faleLabelNome || 'Seu nome';
  document.getElementById('fc-label-msg').value = c.faleLabelMsg || 'Sua mensagem';
  document.getElementById('fc-btn-texto').value = c.faleBtnTexto || '💬 Enviar via WhatsApp';
  // --- Chat FAB e Header (IDs: chat-fab-texto, chat-hdr-titulo, chat-hdr-sub, chat-msg-inicio) ---
  document.getElementById('fc-chat-fab').value = c.chatFabTexto || '💬 Fale Conosco';
  document.getElementById('fc-chat-hdr-titulo').value = c.chatHdrTitulo || '💬 Fale Conosco';
  document.getElementById('fc-chat-hdr-sub').value = c.chatHdrSub || 'Assistente Itapolitana · Responde na hora';
  document.getElementById('fc-chat-inicio').value = c.chatMsgInicio || c.fcChatInicio || 'Olá! 👋 Sou o assistente da Sorveteria Itapolitana. Como posso te ajudar?';
  // --- Chat Sugestões (IDs: chat-sug-1 a chat-sug-6) ---
  const sugs = c.chatSugestoes || c.fcChatOpcoes || ['Horário','Como encomendar','Sabores','Preços','Localização','Picolés'];
  document.getElementById('fc-chat-opcoes').value = sugs.join('\n');
  document.getElementById('fc-chat-fora').value = c.chatForaHorario || c.fcChatFora || 'Estamos fechados agora. Retornaremos em breve!';
  // --- Clube FAB (ID: clube-fab-texto) ---
  document.getElementById('fc-clube-fab').value = c.clubeFabTexto || '🍦 ';
  // --- Modais do Cardápio (IDs: ms-título, ms-sub, mp-título, modal-comp-titulo, modal-comp-sub) ---
  document.getElementById('fc-modal-sorvetes-titulo').value = c.modalSaboresTitulo || 'Sabores Disponíveis';
  document.getElementById('fc-modal-sorvetes-sub').value = c.modalSaboresSub || 'Informe o sabor desejado ao fazer seu pedido na loja';
  document.getElementById('fc-modal-picole-titulo').value = c.modalPicoleTitulo || 'Sabores do Picolé';
  document.getElementById('fc-modal-açaí-titulo').value = c.modalAçaíTitulo || '🫐 Complementos do Açaí';
  document.getElementById('fc-modal-açaí-sub').value = c.modalAçaíSub || 'Disponíveis para o Açaí Personalizado';
}

async function salvarFaleConosco() {
  const c = STATE.config;
  // --- Contato geral ---
  c.fcTitulo = document.getElementById('fc-titulo').value.trim();
  c.fcSubtitulo = document.getElementById('fc-subtitulo').value.trim();
  c.fcMsgSucesso = document.getElementById('fc-msg-sucesso').value.trim();
  c.fcEmail = document.getElementById('fc-email').value.trim();
  c.fcEndereco = document.getElementById('fc-endereco').value.trim();
  c.fcHorario = document.getElementById('fc-horario').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar fale conosco geral');
}

// Salvar Modal Fale Conosco (IDs: fale-modal-titulo, fale-modal-sub, fale-label-nome, fale-label-msg, fale-btn-texto)
async function salvarModalFaleConosco() {
  const c = STATE.config;
  c.faleModalTitulo = document.getElementById('fc-modal-titulo').value.trim();
  c.faleModalSub = document.getElementById('fc-modal-sub').value.trim();
  c.faleLabelNome = document.getElementById('fc-label-nome').value.trim();
  c.faleLabelMsg = document.getElementById('fc-label-msg').value.trim();
  c.faleBtnTexto = document.getElementById('fc-btn-texto').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar modal fale conosco');
}

// Salvar Chat (IDs: chat-fab-texto, chat-hdr-titulo, chat-hdr-sub, chat-msg-inicio, chat-sug-1..6)
async function salvarChat() {
  const c = STATE.config;
  const sugestoes = document.getElementById('fc-chat-opcoes').value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  if (sugestoes.length !== 6) {
    toast('⚠️ As sugestões rápidas devem ter exatamente 6 linhas preenchidas.', 'erro');
    return;
  }
  c.chatFabTexto = document.getElementById('fc-chat-fab').value.trim();
  c.chatHdrTitulo = document.getElementById('fc-chat-hdr-titulo').value.trim();
  c.chatHdrSub = document.getElementById('fc-chat-hdr-sub').value.trim();
  c.chatMsgInicio = document.getElementById('fc-chat-inicio').value.trim();
  c.chatSugestoes = sugestoes;
  c.fcChatOpcoes = c.chatSugestoes; // compatibilidade retroativa
  c.chatForaHorario = document.getElementById('fc-chat-fora').value.trim();
  c.fcChatFora = c.chatForaHorario; // compatibilidade retroativa
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar chat e sugestoes');
}

// Salvar Clube FAB (ID: clube-fab-texto)
async function salvarClubeFab() {
  const c = STATE.config;
  c.clubeFabTexto = document.getElementById('fc-clube-fab').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar clube fab');
}

// Salvar Modais do Cardápio (IDs: ms-título, ms-sub, mp-título, modal-comp-titulo, modal-comp-sub)
async function salvarModaisCardapio() {
  const c = STATE.config;
  c.modalSaboresTitulo = document.getElementById('fc-modal-sorvetes-titulo').value.trim();
  c.modalSaboresSub = document.getElementById('fc-modal-sorvetes-sub').value.trim();
  c.modalPicoleTitulo = document.getElementById('fc-modal-picole-titulo').value.trim();
  c.modalAçaíTitulo = document.getElementById('fc-modal-açaí-titulo').value.trim();
  c.modalAçaíSub = document.getElementById('fc-modal-açaí-sub').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar modais cardapio');
}

// Salvar Carrinho para Eventos (IDs: carrinho-label1, carrinho-label2)
async function salvarCarrinhoEvento() {
  const c = STATE.config;
  c.carrinhoLabel1 = document.getElementById('home-carrinho-label1').value.trim();
  c.carrinhoLabel2 = document.getElementById('home-carrinho-label2').value.trim();
  c.carrinhoWhatsMsg = document.getElementById('home-carrinho-whats').value.trim();
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar carrinho para eventos');
}


// ═══════════════════════════════════════════════════════════
// MODAL DE CONFIRMACAO CENTRALIZADO
// ═══════════════════════════════════════════════════════════
let _confirmarCallback = null;
function confirmarAcao(titulo, mensagem, labelConfirmar, callback, tipo) {
  tipo = tipo || 'perigo'; // 'perigo' = vermelho, 'aviso' = laranja
  const cor = tipo === 'aviso' ? '#E65100' : '#c62828';
  const corBtn = tipo === 'aviso' ? '#E65100' : '#c62828';
  document.getElementById('modal-confirmar-titulo').textContent = titulo;
  document.getElementById('modal-confirmar-msg').innerHTML = mensagem;
  document.getElementById('modal-confirmar-btn').textContent = labelConfirmar;
  document.getElementById('modal-confirmar-btn').style.background = corBtn;
  document.getElementById('modal-confirmar-icone').textContent = tipo === 'aviso' ? '⚠️' : '🗑️';
  _confirmarCallback = callback;
  document.getElementById('modal-confirmar').style.display = 'flex';
}
function _confirmarOk() {
  document.getElementById('modal-confirmar').style.display = 'none';
  if (typeof _confirmarCallback === 'function') _confirmarCallback();
  _confirmarCallback = null;
}
function _confirmarCancelar() {
  document.getElementById('modal-confirmar').style.display = 'none';
  _confirmarCallback = null;
}

// ═══════════════════════════════════════════════════════════
// EXCLUIR ENCOMENDA
// ═══════════════════════════════════════════════════════════
function excluirEncomenda(numPedido) {
  const registros = STATE.encomendas?.registros || [];
  const enc = registros.find(r => r.num === numPedido);
  if (!enc) return;
  confirmarAcao(
    'Excluir Pedido',
    `Tem certeza que deseja excluir o pedido <strong>${numPedido}</strong> de <strong>${enc.nome || 'cliente'}</strong>?<br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita.</span>`,
    'Sim, excluir pedido',
    async () => {
      const idx = STATE.encomendas.registros.findIndex(r => r.num === numPedido);
      if (idx > -1) STATE.encomendas.registros.splice(idx, 1);
      const ok = await salvarArquivo(PATHS.encomendas, STATE.encomendas, 'encomendasSha', 'Admin: excluir pedido ' + numPedido);
      if (ok) { toast('Pedido ' + numPedido + ' excluído.', 'ok'); renderEncomendas(); }
    }
  );
}

// ═══════════════════════════════════════════════════════════
// EXCLUIR CLIENTE
// ═══════════════════════════════════════════════════════════
function excluirCliente(clienteId) {
  if(!fidRequireWrite())return;
  const clientes = STATE.clientes?.clientes || STATE.fidelidade?.clientes || {};
  const c = clientes[clienteId];
  if (!c) return;
  confirmarAcao(
    'Excluir Cliente',
    `Tem certeza que deseja excluir o cadastro de <strong>${c.nome || clienteId}</strong>?<br><small style="color:#888">Celular: ${c.cel||'-'}</small><br><br><span style="color:#c62828;font-weight:700">Todos os pontos e histórico serão perdidos. Esta ação não pode ser desfeita.</span>`,
    'Sim, excluir cliente',
    async () => {
      let ok = false;
      if (STATE.clientes?.clientes) {
        delete STATE.clientes.clientes[clienteId];
        // Remover do índice de celular também
        if (STATE.clientes.indice_celular && c.cel) delete STATE.clientes.indice_celular[c.cel];
        ok = await salvarArquivo(PATHS.clientes, STATE.clientes, 'clientesSha', 'Admin: excluir cliente ' + (c.nome||clienteId));
      } else {
        delete STATE.fidelidade.clientes[clienteId];
        ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: excluir cliente ' + (c.nome||clienteId));
      }
      if (ok) { toast('Cliente ' + (c.nome || clienteId) + ' excluído.', 'ok'); renderClientes(); renderDuplicidades(); }
    }
  );
}

// Substituir confirm() nativo por confirmarAcao() em todas as exclusoes existentes
// Inscrito do sorteio
function removerInscritoSorteioComConfirm(idx) {
  const ins = STATE.fidelidade?.sorteioInscritos?.[idx];
  if (!ins) return;
  confirmarAcao(
    'Remover Inscrito',
    `Remover <strong>${ins.nome || 'inscrito'}</strong> do sorteio?`,
    'Sim, remover',
    () => {
      STATE.fidelidade.sorteioInscritos.splice(idx, 1);
      salvarSorteio();
    },
    'aviso'
  );
}
// Remover depoimento
function removerDepoimentoComConfirm(i) {
  const dep = STATE.config?.depoimentos?.[i];
  confirmarAcao(
    'Remover Depoimento',
    `Remover o depoimento de <strong>${dep?.nome || 'cliente'}</strong>?`,
    'Sim, remover',
    () => {
      STATE.config.depoimentos.splice(i, 1);
      salvarArquivo(PATHS.config, STATE.config, 'configSha', 'Admin: remover depoimento');
      preencherDepoimentos();
    },
    'aviso'
  );
}
// Remover sabor
function removerSaborComConfirm(nome, tipo) {
  confirmarAcao(
    'Remover Sabor',
    `Remover o sabor <strong>${nome}</strong> permanentemente?`,
    'Sim, remover sabor',
    () => {
      const idx = STATE.produtos?.[tipo]?.findIndex(s => s.nome === nome);
      if (idx > -1) {
        STATE.produtos[tipo].splice(idx, 1);
        salvarArquivo(PATHS.produtos, STATE.produtos, 'produtosSha', 'Admin: remover sabor ' + nome);
        renderizarSaboresAdmin();
      }
    },
    'aviso'
  );
}
// ═══════════════════════════════════════════════════════════
// PRODUTOS / COMBOS — ADMIN CRUD
// ═══════════════════════════════════════════════════════════
const PROD_CAT_LABELS = {caixas_enc:'Caixa de Sorvete',tortas_enc:'Torta de Sorvete',acrescimos:'Acréscimo'};

function getProdutosList() {
  const p = STATE.produtos || {};
  const filtro = document.getElementById('prod-filtro-cat')?.value || '';
  const cats = filtro ? [filtro] : ['caixas_enc','tortas_enc','acrescimos'];
  let lista = [];
  cats.forEach(cat => {
    if(Array.isArray(p[cat])) p[cat].forEach(item => lista.push({...item, _cat: cat}));
  });
  return lista;
}

function renderProdutosAdmin() {
  const lista = getProdutosList();
  const tbody = document.getElementById('tabela-produtos');
  if (!tbody) return;
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px">Nenhum produto cadastrado.</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(item => {
    const esg = item.esgotado || false;
    const statusHtml = esg
      ? '<span style="color:#c62828;font-weight:700">❌ Inativo</span>'
      : '<span style="color:#2e7d32;font-weight:700">✅ Ativo</span>';
    const preco = item['preço'] !== undefined ? item['preço'] : (item.preco || 0);
    return `<tr>
      <td style="font-weight:600">${item.nome}</td>
      <td><span style="background:#fce4d6;color:#e65100;border-radius:10px;padding:2px 8px;font-size:.75rem;font-weight:700">${PROD_CAT_LABELS[item._cat]||item._cat}</span></td>
      <td style="font-weight:700;color:#e65100">R$ ${Number(preco).toFixed(2)}</td>
      <td>${item.estoque ?? '-'}</td>
      <td>${statusHtml}</td>
      <td style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn btn-amarelo" style="padding:4px 9px;font-size:.76rem" onclick="abrirFormProduto('${item._cat}','${item.id}')">✏️ Editar</button>
        <button class="btn btn-vermelho" style="padding:4px 9px;font-size:.76rem" onclick="excluirProduto('${item._cat}','${item.id}')">🗑️ Excluir</button>
      </td>
    </tr>`;
  }).join('');
}

function abrirFormProduto(cat, id) {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para editar produtos.', 'aviso');
    return;
  }
  const panel = document.getElementById('prod-form-panel');
  const tit = document.getElementById('prod-form-titulo');
  if (!panel) return;
  if (cat && id) {
    const arr = STATE.produtos?.[cat] || [];
    const item = arr.find(x => x.id === id);
    if (!item) return;
    tit.textContent = '✏️ Editar Produto';
    document.getElementById('prod-f-nome').value = item.nome || '';
    document.getElementById('prod-f-cat').value = cat;
    const preco = item['preço'] !== undefined ? item['preço'] : (item.preco || 0);
    document.getElementById('prod-f-preco').value = preco;
    document.getElementById('prod-f-maxsab').value = item.maxSabores || '';
    document.getElementById('prod-f-estoque').value = item.estoque ?? '';
    document.getElementById('prod-f-status').value = String(item.esgotado || false);
    document.getElementById('prod-f-id').value = id;
    document.getElementById('prod-f-cat-orig').value = cat;
  } else {
    tit.textContent = '➕ Adicionar Produto';
    document.getElementById('prod-f-nome').value = '';
    document.getElementById('prod-f-cat').value = 'caixas_enc';
    document.getElementById('prod-f-preco').value = '';
    document.getElementById('prod-f-maxsab').value = '';
    document.getElementById('prod-f-estoque').value = '';
    document.getElementById('prod-f-status').value = 'false';
    document.getElementById('prod-f-id').value = '';
    document.getElementById('prod-f-cat-orig').value = '';
  }
  panel.style.display = 'block';
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}

function fecharFormProduto() {
  const panel = document.getElementById('prod-form-panel');
  if (panel) panel.style.display = 'none';
}

async function salvarProduto() {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para salvar produtos.', 'aviso');
    return;
  }
  const nome = (document.getElementById('prod-f-nome').value || '').trim();
  if (!nome) { toast('Informe o nome do produto.','erro'); return; }
  const cat = document.getElementById('prod-f-cat').value;
  const preco = parseFloat(document.getElementById('prod-f-preco').value) || 0;
  const maxSaboresVal = parseInt(document.getElementById('prod-f-maxsab').value);
  const maxSabores = isNaN(maxSaboresVal) ? undefined : maxSaboresVal;
  const estoqueVal = parseInt(document.getElementById('prod-f-estoque').value);
  const esgotado = document.getElementById('prod-f-status').value === 'true';
  const editId = document.getElementById('prod-f-id').value;
  const catOrig = document.getElementById('prod-f-cat-orig').value;

  if (!STATE.produtos) STATE.produtos = {};
  ['caixas_enc','tortas_enc','acrescimos'].forEach(c => { if(!Array.isArray(STATE.produtos[c])) STATE.produtos[c] = []; });

  if (editId && catOrig) {
    const origArr = STATE.produtos[catOrig];
    const idx = origArr.findIndex(x => x.id === editId);
    if (idx > -1) origArr.splice(idx, 1);
    const updated = {id: editId, nome, 'preço': preco, esgotado};
    if (maxSabores) updated.maxSabores = maxSabores;
    if (!isNaN(estoqueVal)) updated.estoque = estoqueVal;
    if (!Array.isArray(STATE.produtos[cat])) STATE.produtos[cat] = [];
    STATE.produtos[cat].push(updated);
  } else {
    const catArr = STATE.produtos[cat];
    let maxId = 0;
    catArr.forEach(x => { const n = parseInt((x.id||'').replace(/\D/g,'')); if(n > maxId) maxId = n; });
    const prefix = cat === 'acrescimos' ? 'acr' : cat.replace('_enc','');
    const newId = prefix + '_' + String(maxId+1).padStart(3,'0');
    const novo = {id: newId, nome, 'preço': preco, esgotado};
    if (maxSabores) novo.maxSabores = maxSabores;
    if (!isNaN(estoqueVal)) novo.estoque = estoqueVal;
    catArr.push(novo);
  }

  const ok = await salvarArquivo(PATHS.produtos, STATE.produtos, 'produtosSha', 'Admin: ' + (editId ? 'editar' : 'adicionar') + ' produto ' + nome);
  if (ok) { fecharFormProduto(); renderProdutosAdmin(); }
}

function excluirProduto(cat, id) {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para excluir produtos.', 'aviso');
    return;
  }
  const arr = STATE.produtos?.[cat] || [];
  const item = arr.find(x => x.id === id);
  if (!item) return;
  confirmarAcao(
    'Excluir Produto',
    `Tem certeza que deseja excluir <strong>${item.nome}</strong>?<br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita. O produto deixará de aparecer nas encomendas.</span>`,
    'Sim, excluir produto',
    async () => {
      const idx = STATE.produtos[cat].findIndex(x => x.id === id);
      if (idx > -1) STATE.produtos[cat].splice(idx, 1);
      const ok = await salvarArquivo(PATHS.produtos, STATE.produtos, 'produtosSha', 'Admin: excluir produto ' + item.nome);
      if (ok) { toast('🗑️ Produto excluído.','ok'); renderProdutosAdmin(); }
    }
  );
}

function copiarListaProdutos() {
  const lista = getProdutosList();
  if (!lista.length) { toast('Nenhum produto para copiar.','aviso'); return; }
  const header = 'Nome;Categoria;Preço;Estoque;Status';
  const rows = lista.map(x => {
    const preco = x['preço'] !== undefined ? x['preço'] : (x.preco || 0);
    return `${x.nome};${PROD_CAT_LABELS[x._cat]||x._cat};R$ ${Number(preco).toFixed(2)};${x.estoque??'-'};${x.esgotado?'Inativo':'Ativo'}`;
  });
  copiarTextoSeguro([header,...rows].join('\n')).then((ok)=>toast(ok?`${lista.length} produtos copiados!`:'Erro ao copiar produtos.',ok?'sucesso':'erro'));
}

function exportarProdutosCSV() {
  const lista = getProdutosList();
  if (!lista.length) { toast('Nenhum produto para exportar.','aviso'); return; }
  const BOM = '\uFEFF';
  const header = 'Nome,Categoria,Preço,Estoque,Status';
  const rows = lista.map(x => {
    const preco = x['preço'] !== undefined ? x['preço'] : (x.preco || 0);
    return `"${(x.nome||'').replace(/"/g,'""')}","${PROD_CAT_LABELS[x._cat]||x._cat}",${Number(preco).toFixed(2)},${x.estoque??''},${x.esgotado?'Inativo':'Ativo'}`;
  });
  const csv = BOM + [header,...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `produtos_itapolitana_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast(`CSV com ${lista.length} produtos exportado!`,'sucesso');
}

// ═══════════════════════════════════════════════════════════
// PROMOÇÕES — ADMIN CRUD
// ═══════════════════════════════════════════════════════════
function renderPromocoesTable() {
  const lista = STATE.promocoes?.promocoes || [];
  const tbody = document.getElementById('tabela-promocoes');
  if (!tbody) return;
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:20px">Nenhuma promoção cadastrada. Clique em "Adicionar promoção" para começar.</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map((p, i) => {
    const statusHtml = p.status === 'ativa'
      ? '<span style="color:#2e7d32;font-weight:700">✅ Ativa</span>'
      : '<span style="color:#999;font-weight:700">❌ Inativa</span>';
    const periodoExib = p.periodo || ((p.dataInicio || p.dataFim) ? getPromoPeriodo(p.dataInicio, p.dataFim) : '-');
    return `<tr style="${p.status==='ativa'?'':'opacity:.6'}">
      <td style="font-weight:600">${p.nome}</td>
      <td style="font-size:.82rem;color:#666">${periodoExib}</td>
      <td>${statusHtml}</td>
      <td style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn btn-amarelo" style="padding:4px 9px;font-size:.76rem" onclick="abrirFormPromocao(${i})">✏️ Editar</button>
        <button class="btn btn-vermelho" style="padding:4px 9px;font-size:.76rem" onclick="excluirPromocaoItem(${i})">🗑️ Excluir</button>
      </td>
    </tr>`;
  }).join('');
}

let _promoFormListenersBound = false;

function normalizePromoDate(value) {
  const raw = String(value || '').trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const ano = parseInt(m[1], 10);
  const mes = parseInt(m[2], 10);
  const dia = parseInt(m[3], 10);
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== (mes - 1) || d.getDate() !== dia) return null;
  return raw;
}

function getPromoPeriodo(dataInicio, dataFim) {
  return `${dataInicio || '-'} até ${dataFim || '-'}`;
}

function _promoNomeValido() {
  return ((document.getElementById('promo-nome')?.value || '').trim().length >= 3);
}
function _promoDescricaoValida() {
  return ((document.getElementById('promo-descricao')?.value || '').trim().length >= 10);
}
function _promoDataInicioValida() {
  return !!normalizePromoDate(document.getElementById('promo-data-inicio')?.value || '');
}
function _promoDataFimValida() {
  const ini = normalizePromoDate(document.getElementById('promo-data-inicio')?.value || '');
  const fim = normalizePromoDate(document.getElementById('promo-data-fim')?.value || '');
  return !!(ini && fim && fim >= ini);
}
function _promoProdutosValidos() {
  return ((document.getElementById('promo-produtos-afetados')?.value || '').trim().length >= 1);
}
function _promoRegrasValidas() {
  return ((document.getElementById('promo-regras')?.value || '').trim().length >= 5);
}
function _promoStatusValido() {
  return !!(document.getElementById('promo-status')?.value || '').trim();
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
  const elNome = document.getElementById('promo-nome');
  const elDesc = document.getElementById('promo-descricao');
  const elInicio = document.getElementById('promo-data-inicio');
  const elFim = document.getElementById('promo-data-fim');
  const elProdutos = document.getElementById('promo-produtos-afetados');
  const elRegras = document.getElementById('promo-regras');
  const elStatus = document.getElementById('promo-status');
  const elSalvar = document.getElementById('promo-salvar');

  if (!elNome || !elDesc || !elInicio || !elFim || !elProdutos || !elRegras || !elStatus || !elSalvar) return;

  const nomeOk = _promoNomeValido();
  const descOk = _promoDescricaoValida();
  const inicioOk = _promoDataInicioValida();
  const fimOk = _promoDataFimValida();
  const produtosOk = _promoProdutosValidos();
  const regrasOk = _promoRegrasValidas();
  const statusOk = _promoStatusValido();
  const nomeHasValue = (elNome.value || '').trim() !== '';
  const descHasValue = (elDesc.value || '').trim() !== '';
  const inicioHasValue = (elInicio.value || '').trim() !== '';
  const fimHasValue = (elFim.value || '').trim() !== '';
  const produtosHasValue = (elProdutos.value || '').trim() !== '';
  const regrasHasValue = (elRegras.value || '').trim() !== '';
  const statusHasValue = (elStatus.value || '').trim() !== '';

  const descEnabled = nomeOk;
  const inicioEnabled = nomeOk && descOk;
  const fimEnabled = inicioEnabled && inicioOk;
  const produtosEnabled = fimEnabled && fimOk;
  const regrasEnabled = produtosEnabled && produtosOk;
  const statusEnabled = regrasEnabled && regrasOk;

  setPromoFieldState(elNome, true, nomeHasValue ? nomeOk : null);
  setPromoFieldState(elDesc, descEnabled, descEnabled ? (descHasValue ? descOk : null) : null);
  setPromoFieldState(elInicio, inicioEnabled, inicioEnabled ? (inicioHasValue ? inicioOk : null) : null);
  setPromoFieldState(elFim, fimEnabled, fimEnabled ? (fimHasValue ? fimOk : null) : null);
  setPromoFieldState(elProdutos, produtosEnabled, produtosEnabled ? (produtosHasValue ? produtosOk : null) : null);
  setPromoFieldState(elRegras, regrasEnabled, regrasEnabled ? (regrasHasValue ? regrasOk : null) : null);
  setPromoFieldState(elStatus, statusEnabled, statusEnabled ? (statusHasValue ? statusOk : null) : null);

  elSalvar.disabled = !(nomeOk && descOk && inicioOk && fimOk && produtosOk && regrasOk && statusOk);
}

function bindPromocaoFormEvents() {
  if (_promoFormListenersBound) return;
  ['promo-nome', 'promo-descricao', 'promo-data-inicio', 'promo-data-fim', 'promo-produtos-afetados', 'promo-regras', 'promo-status']
    .forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', validatePromocaoForm);
      el.addEventListener('change', validatePromocaoForm);
    });
  _promoFormListenersBound = true;
}

function abrirFormPromocao(idx) {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para editar promoções.', 'aviso');
    return;
  }
  const panel = document.getElementById('promos-form-panel');
  const tit = document.getElementById('promos-form-titulo');
  if (!panel) return;
  bindPromocaoFormEvents();
  if (idx !== undefined) {
    const p = STATE.promocoes?.promocoes?.[idx];
    if (!p) return;
    tit.textContent = '✏️ Editar Promoção';
    document.getElementById('promo-nome').value = p.nome || '';
    document.getElementById('promo-descricao').value = p.descricao || '';
    document.getElementById('promo-data-inicio').value = p.dataInicio || '';
    document.getElementById('promo-data-fim').value = p.dataFim || '';
    document.getElementById('promo-produtos-afetados').value = p.produtosAfetados || '';
    document.getElementById('promo-regras').value = p.regras || '';
    document.getElementById('promo-status').value = p.status || '';
    document.getElementById('promo-idx').value = idx;
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
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}

function fecharFormPromocao() {
  const panel = document.getElementById('promos-form-panel');
  if (panel) panel.style.display = 'none';
}

async function salvarPromocaoItem() {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para salvar promoções.', 'aviso');
    return;
  }
  const nome = (document.getElementById('promo-nome').value || '').trim();
  const descricao = (document.getElementById('promo-descricao').value || '').trim();
  const dataInicio = (document.getElementById('promo-data-inicio').value || '').trim();
  const dataFim = (document.getElementById('promo-data-fim').value || '').trim();
  const produtosAfetados = (document.getElementById('promo-produtos-afetados').value || '').trim();
  const regras = (document.getElementById('promo-regras').value || '').trim();
  const status = document.getElementById('promo-status').value;
  const idxRaw = document.getElementById('promo-idx').value;

  if (!_promoNomeValido()) { toast('Informe o nome da promoção com pelo menos 3 caracteres.','erro'); return; }
  if (!_promoDescricaoValida()) { toast('Descrição muito curta. Use no mínimo 10 caracteres.','erro'); return; }
  if (!_promoDataInicioValida()) { toast('Informe uma data de início válida.','erro'); return; }
  if (!_promoDataFimValida()) { toast('A data de fim deve ser igual ou posterior à data de início.','erro'); return; }
  if (!_promoProdutosValidos()) { toast('Informe ao menos um produto afetado.','erro'); return; }
  if (!_promoRegrasValidas()) { toast('Informe regras com no mínimo 5 caracteres.','erro'); return; }
  if (!_promoStatusValido()) { toast('Selecione o status da promoção.','erro'); return; }

  const periodo = getPromoPeriodo(dataInicio, dataFim);

  if (!STATE.promocoes) STATE.promocoes = {promocoes: []};
  if (!Array.isArray(STATE.promocoes.promocoes)) STATE.promocoes.promocoes = [];

  if (idxRaw !== '') {
    const idx = parseInt(idxRaw);
    STATE.promocoes.promocoes[idx] = {nome, periodo, descricao, dataInicio, dataFim, produtosAfetados, regras, status};
  } else {
    STATE.promocoes.promocoes.push({nome, periodo, descricao, dataInicio, dataFim, produtosAfetados, regras, status});
  }
  const ok = await salvarArquivo(PATHS.promocoes, STATE.promocoes, 'promocoesSha', 'Admin: ' + (idxRaw !== '' ? 'editar' : 'adicionar') + ' promoção ' + nome);
  if (ok) { fecharFormPromocao(); renderPromocoesTable(); }
}

function excluirPromocaoItem(idx) {
  if (!GH_WRITE_ALLOWED) {
    toast('⚠️ Modo somente leitura. Adicione um token GitHub para excluir promoções.', 'aviso');
    return;
  }
  const p = STATE.promocoes?.promocoes?.[idx];
  if (!p) return;
  confirmarAcao(
    'Excluir Promoção',
    `Tem certeza que deseja excluir a promoção <strong>${p.nome}</strong>?<br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita.</span>`,
    'Sim, excluir promoção',
    async () => {
      STATE.promocoes.promocoes.splice(idx, 1);
      const ok = await salvarArquivo(PATHS.promocoes, STATE.promocoes, 'promocoesSha', 'Admin: excluir promoção ' + p.nome);
      if (ok) { toast('🗑️ Promoção excluída.','ok'); renderPromocoesTable(); }
    }
  );
}

function copiarListaPromocoes() {
  const lista = STATE.promocoes?.promocoes || [];
  if (!lista.length) { toast('Nenhuma promoção para copiar.','aviso'); return; }
  const header = 'Nome;Período;Status';
  const rows = lista.map(p => `${p.nome};${p.periodo||'-'};${p.status}`);
  copiarTextoSeguro([header,...rows].join('\n')).then((ok)=>toast(ok?`${lista.length} promoções copiadas!`:'Erro ao copiar promoções.',ok?'sucesso':'erro'));
}

function exportarPromocoesCSV() {
  const lista = STATE.promocoes?.promocoes || [];
  if (!lista.length) { toast('Nenhuma promoção para exportar.','aviso'); return; }
  const BOM = '\uFEFF';
  const header = 'Nome,Período,Descrição,Status';
  const rows = lista.map(p => `"${(p.nome||'').replace(/"/g,'""')}","${(p.periodo||'').replace(/"/g,'""')}","${(p.descricao||'').replace(/"/g,'""')}",${p.status}`);
  const csv = BOM + [header,...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `promocoes_itapolitana_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast(`CSV com ${lista.length} promoções exportado!`,'sucesso');
}

// ═══════════════════════════════════════════════════════════
// CLIENTES — FORM INLINE (substituição de prompt())
// ═══════════════════════════════════════════════════════════
function abrirFormCliente(clienteId) {
  if(!fidRequireWrite())return;
  const panel = document.getElementById('cliente-form-panel');
  const tit = document.getElementById('cliente-form-titulo');
  if (!panel) return;
  if (clienteId) {
    const clientes = STATE.clientes?.clientes || {};
    const c = clientes[clienteId];
    if (!c) return;
    tit.textContent = '✏️ Editar Cliente';
    document.getElementById('cli-f-nome').value = c.nome || '';
    document.getElementById('cli-f-cel').value = c.cel || '';
    document.getElementById('cli-f-nasc').value = c.dataNasc || '';
    document.getElementById('cli-f-pontos').value = c.saldoPontos || 0;
    document.getElementById('cli-f-cel-orig').value = clienteId; // armazena chave USR-XXXX
  } else {
    tit.textContent = '➕ Adicionar Cliente';
    document.getElementById('cli-f-nome').value = '';
    document.getElementById('cli-f-cel').value = '';
    document.getElementById('cli-f-nasc').value = '';
    document.getElementById('cli-f-pontos').value = '0';
    document.getElementById('cli-f-cel-orig').value = '';
  }
  panel.style.display = 'block';
  panel.scrollIntoView({behavior:'smooth',block:'start'});
}

function fecharFormCliente() {
  const panel = document.getElementById('cliente-form-panel');
  if (panel) panel.style.display = 'none';
}

async function salvarClienteForm() {
  if(!fidRequireWrite())return;
  const nome = (document.getElementById('cli-f-nome').value || '').trim();
  if (nome.length < 3) { toast('Nome muito curto.','erro'); return; }
  const celRaw = (document.getElementById('cli-f-cel').value || '').replace(/\D/g,'');
  if (celRaw.length < 10) { toast('WhatsApp inválido.','erro'); return; }
  const nasc = document.getElementById('cli-f-nasc').value || '';
  const pontos = parseInt(document.getElementById('cli-f-pontos').value) || 0;
  const clienteIdOrig = document.getElementById('cli-f-cel-orig').value; // USR-XXXX key (vazio = novo cliente)

  if (!STATE.clientes) STATE.clientes = {clientes:{},indice_celular:{}};
  if (!STATE.clientes.clientes) STATE.clientes.clientes = {};
  if (!STATE.clientes.indice_celular) STATE.clientes.indice_celular = {};

  const clientes = STATE.clientes.clientes;
  const agora = new Date().toISOString();

  if (clienteIdOrig) {
    // EDIÇÃO: clienteIdOrig é a chave USR-XXXX
    const c = clientes[clienteIdOrig];
    if (!c) { toast('Cliente não encontrado.','erro'); return; }
    const celAntigo = c.cel || '';
    if (celRaw !== celAntigo) {
      // Celular mudou: verificar duplicata por valor (não por chave)
      const celDuplo = Object.entries(clientes).find(([k,v]) => k !== clienteIdOrig && String(v.cel||'').replace(/\D/g,'') === celRaw);
      if (celDuplo) { toast('Novo WhatsApp já está em uso.','erro'); return; }
      clientes[clienteIdOrig] = {...c, nome, cel: celRaw, dataNasc: nasc, saldoPontos: pontos,
        cel_anterior: [...(Array.isArray(c.cel_anterior) ? c.cel_anterior : []), celAntigo],
        historico_alteracoes: [...(c.historico_alteracoes||[]), {data:agora,tipo:'edicao_admin',descricao:'Edição manual pelo admin — celular alterado de ' + celAntigo + ' para ' + celRaw,por:'admin'}]
      };
      // Atualizar índice de celular
      if (celAntigo) delete STATE.clientes.indice_celular[celAntigo];
      STATE.clientes.indice_celular[celRaw] = clienteIdOrig;
    } else {
      clientes[clienteIdOrig].nome = nome;
      clientes[clienteIdOrig].dataNasc = nasc;
      clientes[clienteIdOrig].saldoPontos = pontos;
      clientes[clienteIdOrig].historico_alteracoes = [...(clientes[clienteIdOrig].historico_alteracoes||[]), {data:agora,tipo:'edicao_admin',descricao:'Edição manual pelo admin',por:'admin'}];
    }
  } else {
    // NOVO CLIENTE: verificar duplicata por valor do campo cel
    const celDuplo = Object.values(clientes).find(v => String(v.cel||'').replace(/\D/g,'') === celRaw);
    if (celDuplo) { toast('WhatsApp já está cadastrado.','aviso'); return; }
    let maxNum = 0;
    Object.values(clientes).forEach(v => { const m = (v.id_permanente||'').match(/USR-2026-(\d+)/); if(m) maxNum = Math.max(maxNum, parseInt(m[1],10)); });
    const novoId = 'USR-2026-' + String(maxNum+1).padStart(4,'0');
    clientes[novoId] = {  // chave USR-XXXX (não o celular)
      id_permanente: novoId, nome, cel: celRaw, dataNasc: nasc,
      cadastro: agora, saldoPontos: pontos, codigosUsados: [], resgates: [],
      totalPremios: 0, totalCodigos: 0, bloqueado: false, motivo_bloqueio: null,
      tentativas_fraude: 0, ultimo_acesso: agora,
      historico_alteracoes: [{data:agora,tipo:'cadastro_manual',descricao:'Cadastro manual pelo admin',por:'admin'}]
    };
    STATE.clientes.indice_celular[celRaw] = novoId;
  }

  const ok = await salvarArquivo(PATHS.clientes, STATE.clientes, 'clientesSha', 'Admin: ' + (clienteIdOrig ? 'editar' : 'cadastrar') + ' cliente ' + nome);
  if (ok) { fecharFormCliente(); renderClientes(); toast('✅ ' + nome + ' salvo com sucesso!','sucesso'); }
}

function copiarListaClientes() {
  const clientes = Object.values(STATE.clientes?.clientes || {});
  if (!clientes.length) { toast('Nenhum cliente para copiar.','aviso'); return; }
  const header = 'Nome;WhatsApp;Pontos;Cadastro;Status';
  const rows = clientes.map(c => {
    const cad = c.cadastro ? new Date(c.cadastro).toLocaleDateString('pt-BR') : '-';
    const status = c.bloqueado ? 'Bloqueado' : c.fraude ? 'Fraude' : 'Ativo';
    return `${c.nome};${c.cel};${c.saldoPontos||0};${cad};${status}`;
  });
  copiarTextoSeguro([header,...rows].join('\n')).then((ok)=>toast(ok?`${clientes.length} clientes copiados!`:'Erro ao copiar clientes.',ok?'sucesso':'erro'));
}

function exportarClientesCSV() {
  const clientes = Object.values(STATE.clientes?.clientes || {});
  if (!clientes.length) { toast('Nenhum cliente para exportar.','aviso'); return; }
  const BOM = '\uFEFF';
  const header = 'ID,Nome,WhatsApp,Data Nasc.,Pontos,Cadastro,Status';
  const rows = clientes.map(c => {
    const cad = c.cadastro ? new Date(c.cadastro).toLocaleDateString('pt-BR') : '-';
    const status = c.bloqueado ? 'Bloqueado' : c.fraude ? 'Fraude' : 'Ativo';
    const nasc = c.dataNasc ? c.dataNasc.split('-').reverse().join('/') : '-';
    return `"${c.id_permanente||'-'}","${(c.nome||'').replace(/"/g,'""')}","${c.cel||''}","${nasc}",${c.saldoPontos||0},"${cad}","${status}"`;
  });
  const csv = BOM + [header,...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `clientes_itapolitana_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast(`CSV com ${clientes.length} clientes exportado!`,'sucesso');
}

// ═══════════════════════════════════════════════════════════
//  — EXCLUIR CÓDIGO INDIVIDUAL
// ═══════════════════════════════════════════════════════════
function excluirCodigo(cod) {
  if(!fidRequireWrite())return;
  const codigos=fidGetCodigos();
  const v = codigos[cod];
  if (!v) return;
  confirmarAcao(
    'Excluir Código',
    `Tem certeza que deseja excluir o código <strong>${cod}</strong>?<br><span style="font-size:.82rem;color:#666">Status: ${v.status} ${v.usadoPor?'· Usado por: '+v.usadoPor:''}</span><br><br><span style="color:#c62828;font-weight:700">Esta ação não pode ser desfeita.</span>`,
    'Sim, excluir código',
    async () => {
      const fidData=fidEnsureCodigos();
      delete fidData.codigos[cod];
      STATE.fidelidade.liberados = Object.keys(fidData.codigos).length;
      const ok = await salvarArquivo(PATHS.fidelidade, STATE.fidelidade, 'fidelidadeSha', 'Admin: excluir código ' + cod);
      if (ok) { toast('Código excluído.','ok'); renderCódigos(); atualizarStatsCódigos(); fidRenderProgresso(); }
    }
  );
}


// ═══════════════════════════════════════════════════════════
// MODAL AJUSTE DE PONTOS (Fidelidade – cliente)
// ═══════════════════════════════════════════════════════════
let _pontosClienteId = null;
function abrirModalPontos(clienteId){
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const c=clientes[clienteId];
  if(!c){toast('Cliente não encontrado','erro');return;}
  _pontosClienteId=clienteId;
  document.getElementById('mp-nome').textContent=c.nome||clienteId;
  const saldo=c.saldoPontos||0;
  document.getElementById('mp-saldo').textContent=saldo;
  document.getElementById('mp-saldo-novo').textContent=saldo;
  document.getElementById('mp-qtd').value='';
  document.getElementById('mp-tipo').value='manual';
  document.getElementById('mp-motivo').value='';
  // Histórico
  const hist=c.historico_alteracoes||[];
  const filtrados=hist.filter(h=>h.pontos!==undefined||['ponto_manual','codigo_validado_admin','bonus','correcao','resgate','expiracao','manual'].includes(h.tipo));
  const ultimos=filtrados.slice(-20).reverse();
  let histHtml=ultimos.length?ultimos.map(h=>{
    const tipo=h.tipo||'manual';
    const pts=h.pontos!==undefined?(h.pontos>0?'+'+h.pontos:h.pontos):'';
    const data=h.data?new Date(h.data).toLocaleString('pt-BR'):'-';
    return `<div class="hist-item"><span class="hist-tipo ${tipo.includes('resgate')?'resgate':tipo.includes('expi')?'expiracao':tipo.includes('corr')?'correcao':tipo.includes('bonus')?'bonus':'manual'}">${tipo}</span><div style="flex:1"><div style="font-weight:600">${h.descricao||'—'}</div><div style="color:#888;font-size:.75rem">${data}</div></div>${pts?`<span style="font-weight:800;color:${pts.startsWith('+')?'#2e7d32':'#c62828'}">${pts} pts</span>`:''}</div>`;
  }).join(''):'<p style="color:#aaa;font-size:.82rem;text-align:center;padding:10px">Nenhuma transação registrada.</p>';
  document.getElementById('mp-historico').innerHTML=histHtml;
  document.getElementById('modal-pontos').classList.add('show');
}
function fecharModalPontos(){document.getElementById('modal-pontos').classList.remove('show');_pontosClienteId=null;}
function previewNovoPontos(){
  const qtd=parseInt(document.getElementById('mp-qtd').value)||0;
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const c=clientes[_pontosClienteId];
  const saldo=c?c.saldoPontos||0:0;
  const novo=Math.max(0,saldo+qtd);
  document.getElementById('mp-saldo-novo').textContent=novo;
  document.getElementById('mp-saldo-novo').style.color=qtd>=0?'#2e7d32':'#c62828';
}
async function salvarModalPontos(){
  if(!GH_WRITE_ALLOWED){toast('Modo somente leitura.','aviso');return;}
  const qtd=parseInt(document.getElementById('mp-qtd').value)||0;
  if(qtd===0){toast('Informe uma quantidade diferente de 0.','aviso');return;}
  const tipo=document.getElementById('mp-tipo').value;
  const motivo=document.getElementById('mp-motivo').value.trim()||'Ajuste manual pelo admin';
  const clientes=STATE.clientes?.clientes||STATE.fidelidade?.clientes||{};
  const c=clientes[_pontosClienteId];
  if(!c){toast('Cliente não encontrado','erro');return;}
  const saldoAnterior=c.saldoPontos||0;
  c.saldoPontos=Math.max(0,saldoAnterior+qtd);
  const agora=new Date().toISOString();
  if(!c.historico_alteracoes)c.historico_alteracoes=[];
  c.historico_alteracoes.push({data:agora,tipo,descricao:motivo,por:'admin',pontos:qtd});
  const ok=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha',`Admin: ajuste de pontos ${_pontosClienteId} (${qtd>0?'+':''}${qtd})`);
  if(ok){fecharModalPontos();renderClientes();toast(`✅ Pontos ajustados! Novo saldo: ${c.saldoPontos}`,'sucesso');}
}

// ═══════════════════════════════════════════════════════════
// RASTREIO — Minha Encomenda (como o cliente vê)
// ═══════════════════════════════════════════════════════════
function buscarRastreio(){
  const busca=(document.getElementById('rastreio-busca')?.value||'').trim().toLowerCase();
  const container=document.getElementById('rastreio-resultado');
  if(!busca){container.innerHTML='<p style="color:#aaa;text-align:center;padding:30px">Digite o nº do pedido ou telefone.</p>';return;}
  const registros=STATE.encomendas?.registros||[];
  const e=registros.find(r=>{
    const num=(r.num||'').toLowerCase();
    const tel=(r.telefone||r.tel||'').replace(/\D/g,'');
    return num===busca||num.includes(busca)||tel.endsWith(busca.replace(/\D/g,''));
  });
  if(!e){container.innerHTML='<div style="background:#ffebee;border-radius:12px;padding:20px;text-align:center;color:#c62828;font-weight:700">❌ Pedido não encontrado. Verifique o número ou telefone.</div>';return;}
  container.innerHTML=renderRastreioCard(e);
}
function renderRastreioCard(e){
  const statusAtual=e.status||'novo';
  const idxAtual=TIMELINE_PASSOS.indexOf(statusAtual);
  const tlHtml=TIMELINE_PASSOS.map((s,i)=>{
    let cls='tl-step';
    if(i<idxAtual)cls+=' done';else if(i===idxAtual)cls+=' current';
    return `<div class="${cls}"><div class="tl-dot">${TIMELINE_ICONES[i]}</div><div class="tl-label">${TIMELINE_LABELS[i]}</div></div>`;
  }).join('');
  let itensHtml='';let totalCalc=0;
  (e.itens||[]).forEach(it=>{
    const sub=(it.preço||0)*(it.qtd||1);totalCalc+=sub;
    const sabores=it.sabores&&it.sabores.length?`<br><small style="color:#888">${esc(it.sabores.join(', '))}</small>`:'';
    itensHtml+=`<div class="rastreio-item"><span><strong>${esc(it.nome)}</strong>${sabores} ×${it.qtd}</span><span>R$ ${sub.toFixed(2).replace('.',',')}</span></div>`;
  });
  const total=e.total||totalCalc;
  const dataStr=e.dataFormatada||(e.data?new Date(e.data).toLocaleString('pt-BR'):'-');
  const label=ENC_STATUS_LABELS[statusAtual]||statusAtual;
  const cor=ENC_STATUS_BORDA[statusAtual]||'#e65100';
  return `<div class="rastreio-card">
    <div class="rastreio-num">${esc(e.num||'-')}</div>
    <div class="rastreio-nome">👤 ${esc(e.nome||'-')}</div>
    <div class="rastreio-data">📅 ${dataStr} &nbsp;·&nbsp; 📱 ${esc(e.telefone||e.tel||'-')}</div>
    ${e.endereço?`<div class="rastreio-data" style="margin-top:2px">📍 ${esc(e.endereço)}</div>`:''}
    <div style="margin:14px 0;padding:10px 14px;background:${ENC_STATUS_COR[statusAtual]||'#f8f9fa'};border-left:4px solid ${cor};border-radius:8px">
      <strong>Status atual:</strong> <span style="color:${cor};font-weight:800">${label}</span>
    </div>
    <div class="timeline" style="margin:16px 0">${tlHtml}</div>
    <div class="rastreio-itens-wrap">${itensHtml||'<p style="color:#aaa">Sem itens.</p>'}</div>
    <div class="rastreio-total"><span>Total do Pedido</span><span>R$ ${parseFloat(total||0).toFixed(2).replace('.',',')}</span></div>
    <div style="margin-top:16px;text-align:center">
      <button onclick="abrirModalEncomenda('${esc(e.num)}')" class="btn btn-laranja" style="width:100%">📋 Abrir no Admin</button>
    </div>
  </div>`;
}
function renderRastreioRecentes(){
  const registros=(STATE.encomendas?.registros||[]).slice(0,10);
  const isReadOnly=!GH_WRITE_ALLOWED;
  const container=document.getElementById('rastreio-recentes');
  if(!container)return;
  if(!registros.length){
    container.innerHTML=
      '<p style="color:#aaa;font-size:.85rem;margin:0">Nenhuma encomenda ainda.</p>'+
      (isReadOnly?'<div style="margin-top:10px;background:#e3f2fd;border:1px solid #bbdefb;color:#0d47a1;border-radius:10px;padding:12px;font-size:.82rem;line-height:1.45">ℹ️ Você está em modo somente leitura (sem token GitHub). A listagem funciona, mas você não conseguirá salvar alterações.</div>':'');
    return;
  }
  container.innerHTML=registros.map(e=>{
    const cor=ENC_STATUS_BORDA[e.status]||'#888';
    const label=ENC_STATUS_LABELS[e.status]||e.status||'—';
    const dataStr=e.dataFormatada||(e.data?new Date(e.data).toLocaleDateString('pt-BR'):'-');
    const totalStr=e.total?`R$ ${parseFloat(e.total).toFixed(2).replace('.',',')}`:'-';
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f2f5;cursor:pointer" onclick="document.getElementById('rastreio-busca').value='${esc(e.num)}';buscarRastreio()">
      <div>
        <div style="font-weight:700;color:#333;font-size:.88rem">${esc(e.num||'-')} — ${esc(e.nome||'-')}</div>
        <div style="font-size:.75rem;color:#888">📅 ${dataStr} · ${esc(e.tipo||'geral')}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:#1565c0;font-size:.9rem">${totalStr}</div>
        <span style="background:${cor};color:#fff;padding:1px 8px;border-radius:8px;font-size:.7rem">${label}</span>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// AUDITORIA — Detector de inconsistências
// ═══════════════════════════════════════════════════════════
let _auditoriaResultados = [];
function executarAuditoria(){
  _auditoriaResultados=[];
  const filtroMod=document.getElementById('audit-filtro-mod')?.value||'';
  const clientesCarregados=Boolean(STATE.clientes?.clientes&&typeof STATE.clientes.clientes==='object');
  const clientes=clientesCarregados?STATE.clientes.clientes:{};
  const fidelidade=STATE.fidelidade||{};
  const encomendas=STATE.encomendas?.registros||[];
  // ── 1. Clientes com pontos negativos (não deveria ser possível)
  if(!filtroMod||filtroMod==='clientes'){
    Object.entries(clientes).forEach(([id,c])=>{
      if((c.saldoPontos||0)<0){
        _auditoriaResultados.push({modulo:'clientes',severidade:'alta',tipo:'pontos_negativos',titulo:`Pontos negativos: ${c.nome}`,descricao:`Cliente ${id} tem saldo de pontos negativo: ${c.saldoPontos}`,admin:c.saldoPontos,site:0,id,acao:'zerar_pontos',clienteId:id});
      }
    });
    // ── 2. Clientes com muitas tentativas de fraude sem bloqueio
    Object.entries(clientes).forEach(([id,c])=>{
      if((c.tentativas_fraude||0)>=3&&!c.bloqueado){
        _auditoriaResultados.push({modulo:'clientes',severidade:'critica',tipo:'fraude_sem_bloqueio',titulo:`Fraude não bloqueada: ${c.nome}`,descricao:`${c.tentativas_fraude} tentativas de fraude registradas mas conta não está bloqueada.`,admin:'não bloqueado',site:c.tentativas_fraude+' tentativas',id,clienteId:id});
      }
    });
    // ── 3. Clientes duplicados por nome+nasc
    const vistos={};
    Object.entries(clientes).forEach(([id,c])=>{
      const chave=`${(c.nome||'').trim().toLowerCase()}|${c.dataNasc||''}`;
      if(chave.length>2){
        if(vistos[chave]){
          _auditoriaResultados.push({modulo:'clientes',severidade:'media',tipo:'duplicata_possivel',titulo:`Possível duplicata: ${c.nome}`,descricao:`IDs ${vistos[chave]} e ${id} têm mesmo nome e data de nascimento.`,admin:id,site:vistos[chave],id});
        }else{vistos[chave]=id;}
      }
    });
  }
  // ── 4. Encomendas travadas em "novo" por mais de 3 dias
  if(!filtroMod||filtroMod==='encomendas'){
    const TRES_DIAS_MS=3*24*60*60*1000;
    const tresDiasAtras=Date.now()-TRES_DIAS_MS;
    encomendas.forEach(e=>{
      if(e.status==='novo'&&e.data&&new Date(e.data).getTime()<tresDiasAtras){
        _auditoriaResultados.push({modulo:'encomendas',severidade:'alta',tipo:'enc_travada',titulo:`Encomenda parada: ${e.num}`,descricao:`Pedido de ${e.nome} está com status "novo" há mais de 3 dias (${e.dataFormatada||e.data}).`,admin:'novo',site:'—',id:e.num});
      }
    });
    // ── 5. Encomendas sem total registrado
    encomendas.forEach(e=>{
      if(!e.total&&e.total!==0){
        _auditoriaResultados.push({modulo:'encomendas',severidade:'baixa',tipo:'enc_sem_total',titulo:`Encomenda sem total: ${e.num}`,descricao:`Pedido ${e.num} de ${e.nome} não tem valor total registrado.`,admin:'sem total',site:'—',id:e.num});
      }
    });
  }
  // ── 6. Fidelidade — códigos usados em clientes inexistentes
  if((!filtroMod||filtroMod==='fidelidade')&&clientesCarregados){
    const codigos=fidelidade.códigos||fidelidade.codigos||{};
    Object.entries(codigos).forEach(([cod,v])=>{
      if(v.status==='usado'&&v.usadoPor){
        const cel=(v.usadoPor||'').replace(/\D/g,'');
        const achouCliente=Object.values(clientes).some(c=>(c.cel||'').replace(/\D/g,'')===cel);
        if(!achouCliente&&cel){
          _auditoriaResultados.push({modulo:'fidelidade',severidade:'media',tipo:'codigo_sem_cliente',titulo:`Código usado por cliente inexistente`,descricao:`Código ${cod} foi usado por ${v.usadoPor} mas esse telefone não existe nos clientes cadastrados.`,admin:v.usadoPor,site:'não cadastrado',id:cod});
        }
      }
    });
  }
  renderAuditoria();
}
function renderAuditoria(){
  const filtroMod=document.getElementById('audit-filtro-mod')?.value||'';
  const filtroSev=document.getElementById('audit-filtro-sev')?.value||'';
  const workerAtivo=Boolean(getAdminToken());
  const clientesCarregados=Boolean(STATE.clientes?.clientes&&typeof STATE.clientes.clientes==='object');
  const encomendasCarregadas=Array.isArray(STATE.encomendas?.registros);
  let lista=_auditoriaResultados.filter(r=>{
    if(filtroMod&&r.modulo!==filtroMod)return false;
    if(filtroSev&&r.severidade!==filtroSev)return false;
    return true;
  });
  // Ordenar por severidade
  const sevOrd={critica:0,alta:1,media:2,baixa:3};
  lista.sort((a,b)=>(sevOrd[a.severidade]||4)-(sevOrd[b.severidade]||4));
  // Stats
  const cnt={critica:0,alta:0,media:0,baixa:0};
  _auditoriaResultados.forEach(r=>cnt[r.severidade]=(cnt[r.severidade]||0)+1);
  document.getElementById('audit-cnt-critica').textContent=cnt.critica||0;
  document.getElementById('audit-cnt-alta').textContent=cnt.alta||0;
  document.getElementById('audit-cnt-media').textContent=cnt.media||0;
  document.getElementById('audit-cnt-baixa').textContent=cnt.baixa||0;
  document.getElementById('audit-cnt-total').textContent=_auditoriaResultados.length;
  // Atualizar badge da nav
  const badgeNav=document.getElementById('badge-audit-nav');
  if(badgeNav){
    const total=_auditoriaResultados.length;
    badgeNav.textContent=total;
    badgeNav.style.display=total>0?'inline-block':'none';
  }
  const container=document.getElementById('audit-lista');
  if(!container)return;
  if(!lista.length){
    if(!workerAtivo&&(!clientesCarregados||!encomendasCarregadas)){
      container.innerHTML=`<div style="background:#e3f2fd;border:1px solid #bbdefb;border-radius:12px;padding:20px;color:#0d47a1;font-size:.84rem;line-height:1.5">
        ℹ️ <strong>Modo somente leitura.</strong> A Auditoria está com escopo reduzido porque os dados de Clientes/Encomendas não foram carregados nesta sessão.<br>
        Adicione um token GitHub para auditoria completa.
      </div>`;
      return;
    }
    container.innerHTML=`<div style="background:#e8f5e9;border-radius:12px;padding:24px;text-align:center;color:#2e7d32;font-weight:700">✅ Nenhuma inconsistência encontrada nos filtros selecionados!</div>`;
    return;
  }
  container.innerHTML=lista.map(r=>{
    const acaoBtns=r.tipo==='fraude_sem_bloqueio'?`<button class="btn btn-vermelho" style="padding:5px 12px;font-size:.78rem" onclick="toggleBloqueio('${r.clienteId}',true)">🔒 Bloquear Agora</button>`
      :r.tipo==='pontos_negativos'?`<button class="btn btn-laranja" style="padding:5px 12px;font-size:.78rem" onclick="zerarPontosNegativos('${r.clienteId}')">🔧 Zerar Pontos</button>`
      :r.tipo==='enc_travada'?`<button class="btn" style="background:#1565c0;color:#fff;padding:5px 12px;font-size:.78rem" onclick="abrirModalEncomenda('${r.id}')">📋 Ver Encomenda</button>`
      :'';
    return `<div class="audit-card ${r.severidade}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
        <div>
          <span class="audit-badge ${r.severidade}">${r.severidade}</span>
          <span style="margin-left:8px;font-size:.75rem;color:#888;text-transform:uppercase">${r.modulo}</span>
          <div style="font-weight:800;font-size:.92rem;color:#333;margin-top:4px">${esc(r.titulo)}</div>
          <div style="font-size:.82rem;color:#555;margin-top:3px">${esc(r.descricao)}</div>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start;margin-top:4px">
          ${acaoBtns}
        </div>
      </div>
      <div class="audit-vals">
        <span><strong>Admin:</strong> <span class="audit-val-admin">${esc(String(r.admin))}</span></span>
        <span><strong>Site/Esperado:</strong> <span class="audit-val-site">${esc(String(r.site))}</span></span>
      </div>
    </div>`;
  }).join('');
}
function exportarRelatorioAuditoria(){
  if(!_auditoriaResultados.length){toast('Nenhuma inconsistência para exportar.','aviso');return;}
  const data={geradoEm:new Date().toISOString(),totalInconsistencias:_auditoriaResultados.length,resultados:_auditoriaResultados};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`auditoria_${new Date().toISOString().slice(0,10)}.json`;
  a.click();URL.revokeObjectURL(url);
  toast('Relatório exportado!','sucesso');
}
async function zerarPontosNegativos(clienteId){
  if(!GH_WRITE_ALLOWED){toast('Modo somente leitura.','aviso');return;}
  const clientes=STATE.clientes?.clientes||{};
  const c=clientes[clienteId];
  if(!c)return;
  c.saldoPontos=0;
  if(!c.historico_alteracoes)c.historico_alteracoes=[];
  c.historico_alteracoes.push({data:new Date().toISOString(),tipo:'correcao',descricao:'Pontos negativos zerados via auditoria',por:'admin',pontos:0});
  const ok=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha','Admin: zerar pontos negativos '+clienteId);
  if(ok){executarAuditoria();toast('Pontos zerados!','sucesso');}
}








/* Controles de acesso resilientes: independentes de onclick inline e seguros contra submit acidental. */
(function () {
  function configurarAcesso() {
    const senha = document.getElementById('inp-senha');
    const token = document.getElementById('inp-github-token');
    const olhoSenha = document.getElementById('eye-btn');
    const olhoToken = document.getElementById('eye-btn-token');
    const entrarBtn = document.getElementById('btn-entrar-admin');
    if (!senha || !token || !olhoSenha || !olhoToken || !entrarBtn) return;

    const alternar = (campo, botao, nome) => {
      const visivel = campo.type === 'password';
      campo.type = visivel ? 'text' : 'password';
      botao.setAttribute('aria-pressed', String(visivel));
      botao.setAttribute('aria-label', `${visivel ? 'Ocultar' : 'Mostrar'} ${nome}`);
      campo.focus({ preventScroll: true });
    };

    olhoSenha.addEventListener('click', (event) => {
      event.preventDefault();
      alternar(senha, olhoSenha, 'senha');
    });
    olhoToken.addEventListener('click', (event) => {
      event.preventDefault();
      alternar(token, olhoToken, 'token GitHub');
    });
    const submeter = (event) => {
      event.preventDefault();
      if (typeof window.entrar === 'function') window.entrar();
    };
    entrarBtn.addEventListener('click', submeter);
    senha.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submeter(event);
    });
    token.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') submeter(event);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarAcesso, { once: true });
  } else {
    configurarAcesso();
  }
})();



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
    if(path.endsWith('produtos.json')){const picoles=data.picolés||data.picoles||{};const atacados=Object.values(picoles).map(item=>Number(item?.preço_atacado??item?.preco_atacado)).filter(Number.isFinite);checks++;if(atacados.some(n=>n>0&&n<1.8))add('ERR-PRC-002','critica',path,'Preço de atacado abaixo de R$ 1,80','Há preço_atacado de picolé menor que o mínimo oficial. Acréscimos e complementos têm regra própria.','Corrigir somente o preço de atacado do picolé no Admin.');}
  }
  window.executarAuditoriaCompleta=async function(){
    issues=[];checks=0;const status=document.getElementById('quality-status');if(status)status.textContent='Executando auditoria completa...';
    const button=document.querySelector('#sec-qualidade .btn-salvar');if(button){button.disabled=true;button.textContent='⏳ Auditando...';}
    try{await Promise.all(pages.map(p=>pageCheck(p[0],p[1])));await Promise.all(dataFiles.map(dataCheck));}catch(e){add('ERR-AUDIT-001','critica','Painel de Qualidade','Falha inesperada',e.message,'Copiar o relatório e enviar para correção.');}
    render();if(button){button.disabled=false;button.textContent='▶️ Executar auditoria';}if(typeof toast==='function')toast(issues.length?'Auditoria concluída com '+issues.length+' ocorrência(s).':'Auditoria concluída sem erros.','sucesso');
  };
  window.copiarRelatorioQualidade=async function(){const report=document.getElementById('quality-report');const value=report?.textContent||'';if(!value){if(typeof toast==='function')toast('Execute a auditoria antes de copiar.','aviso');return;}let ok=false;try{ok=typeof copiarTextoSeguro==='function'?await copiarTextoSeguro(value):false;}catch(e){}if(typeof toast==='function')toast(ok?'Relatório copiado. Cole aqui para correção.':'Selecione o relatório e copie manualmente.',ok?'sucesso':'aviso');};
})();
