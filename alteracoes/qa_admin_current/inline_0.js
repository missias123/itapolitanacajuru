
// ────────────────────────────────────────────────────────────
// Utilitário: escape HTML — evita XSS ao renderizar dados de usuário via innerHTML
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
	const PATHS={produtos:'dados/produtos.json',promo:'dados/promo.json',clientes:'dados/clientes.json',encomendas:'dados/encomendas.json',config:'dados/config.json',promocoes:'dados/promocoes.json',auth:'dados/auth.json'};
	const STATE={produtos:null,produtosSha:null,promo:null,promoSha:null,clientes:null,clientesSha:null,encomendas:null,encomendasSha:null,config:null,configSha:null,promocoes:null,promocoesSha:null,auth:null,authSha:null,pagClientes:0,senhaAdmin:null};
	window.STATE=STATE;
	let GH_WRITE_ALLOWED=false;
let GH_TOKEN_CAN_WRITE=null;
let GITHUB_PAT=ssGet('itap_github_token')||'';
const PATH_SHA_KEYS={
  [PATHS.produtos]:'produtosSha',
  [PATHS.promo]:'promoSha',
  [PATHS.clientes]:'clientesSha',
  
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
const WORKER_GH_PATHS=new Set([PATHS.config,PATHS.produtos,PATHS.promo,PATHS.promocoes]);

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
    return{ok:true, hasGithubToken: !!dados.hasGithubToken};
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

function ensureSafeState(){
  if(!STATE.clientes||typeof STATE.clientes!=='object')STATE.clientes={clientes:{},indice_celular:{}};
  else if(!STATE.clientes.clientes||typeof STATE.clientes.clientes!=='object')STATE.clientes.clientes={};
  if(!STATE.encomendas||typeof STATE.encomendas!=='object')STATE.encomendas={registros:[]};
  else if(!Array.isArray(STATE.encomendas.registros))STATE.encomendas.registros=[];

  if(!STATE.promocoes||typeof STATE.promocoes!=='object')STATE.promocoes={promocoes:[]};
  else if(!Array.isArray(STATE.promocoes.promocoes))STATE.promocoes.promocoes=[];
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
  // Se não temos PAT mas temos sessão Worker, tentamos via Worker Proxy
  if(!GITHUB_PAT && getWorkerSessionToken()) {
    try {
      const rWorker = await fetchWithTimeout(ITAP_WORKER_API + '/api/admin/github-file', {
        method: 'PUT',
        headers: getWorkerAuthHeaders(),
        body: JSON.stringify({ path, data, sha, message: msg })
      }, 15000);
      const d = await rWorker.json();
      if(rWorker.ok && d.ok) return { ok: true, sha: d.sha };
      throw new Error(d.error || 'Erro no Worker Proxy');
    } catch (e) {
      console.error('[Admin] Falha no salvamento via Worker Proxy:', e);
      toast('❌ Erro ao salvar via Worker: ' + (e.message || e), 'erro');
      return { ok: false, erro: e.message };
    }
  }

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
  if(!GH_WRITE_ALLOWED || (!getToken() && !getWorkerSessionToken())){
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
function toggleSenhaAdmin(){
  const i = document.getElementById('inp-senha');
  const b = document.getElementById('eye-btn');
  if(i.type === 'password') {
    i.type = 'text';
    b.innerHTML = '&#x1F441;'; // Olho aberto
  } else {
    i.type = 'password';
    b.innerHTML = '&#x1F441;&#xFE0F;'; // Olho com variante (padrão)
  }
}
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
  // Tenta autenticação local se o hash estiver disponível
  let senhaOk = false;
  if (STATE.senhaAdmin) {
    senhaOk = (senhaHash === STATE.senhaAdmin || senha === STATE.senhaAdmin);
  }

  // Se a senha local falhar e não houver Worker configurado, barramos aqui.
  // Caso contrário, deixamos o Worker tentar validar a senha.
  if (STATE.senhaAdmin && !senhaOk) {
    ocultarLoading();
    loginErro.innerHTML = '&#x274C; Senha incorreta.';
    loginErro.style.display = 'block';
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
  } else if (workerAuth.hasGithubToken && !GITHUB_PAT) {
    // Se o Worker tem token e o usuário não informou um, usamos o Worker
    GH_WRITE_ALLOWED = true;
    GH_TOKEN_CAN_WRITE = true;
    console.log('[Admin] Usando GITHUB_TOKEN via Worker Proxy.');
    atualizarStatusGitHubToken('✅ Conectado via Worker Proxy. Edição liberada.','success');
  }

  ocultarLoading();
  loginErro.style.display='none';
  document.getElementById('login-screen').style.display='none';
  document.getElementById('admin-app').style.display='block';
  atualizarBannerGitHubToken(GH_WRITE_ALLOWED);
  
  if(!GH_WRITE_ALLOWED) {
    toast('ℹ️ Você entrou em modo somente leitura. Informe um token GitHub válido para salvar alterações.','aviso');
  } else {
    toast('✅ Bem-vindo! Acesso administrativo liberado.','sucesso');
  }
  
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
  let pr={content:null,sha:null},cl={content:null,sha:null},en={content:null,sha:null},prod={content:null,sha:null},promos={content:null,sha:null},cfg={content:null,sha:null};
  try{
    const fontes=['promo','clientes','encomendas','produtos','promocoes','config'];
    const resultados=await Promise.allSettled([ghGet(PATHS.promo),ghGet(PATHS.clientes),ghGet(PATHS.encomendas),ghGet(PATHS.produtos),ghGet(PATHS.promocoes),ghGet(PATHS.config)]);
    resultados.forEach((r,idx)=>{if(r.status==='rejected')console.warn('[BOOT] Fonte',fontes[idx],'falhou:',r.reason);});
    [pr,cl,en,prod,promos,cfg]=resultados.map(r=>r.status==='fulfilled'?r.value:{content:null,sha:null});
    if(pr.content){STATE.promo=pr.content;STATE.promoSha=pr.sha;}
    if(cl.content){STATE.clientes=cl.content;STATE.clientesSha=cl.sha;}else{console.error('[BOOT] Falha ao carregar clientes');}

    if(en.content){STATE.encomendas=en.content;STATE.encomendasSha=en.sha;}
    if(prod.content){STATE.produtos=prod.content;STATE.produtosSha=prod.sha;}
    if(promos.content){STATE.promocoes=promos.content;STATE.promocoesSha=promos.sha;}else{STATE.promocoes={promocoes:[]};}
    if(cfg.content){STATE.config=cfg.content;STATE.configSha=cfg.sha;if(!STATE.senhaAdmin&&cfg.content.senhaAdmin)STATE.senhaAdmin=cfg.content.senhaAdmin;}else{console.error('[BOOT] Falha ao carregar config');}
    const falhasCarregamento=[
      [PATHS.promo,pr],
      [PATHS.clientes,cl],

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

      {arquivo:PATHS.encomendas,sha:Boolean(STATE.encomendasSha),readonly:Boolean(en?.readonly),carregado:Boolean(en?.content)},
      {arquivo:PATHS.produtos,sha:Boolean(STATE.produtosSha),readonly:Boolean(prod?.readonly),carregado:Boolean(prod?.content)},
      {arquivo:PATHS.promocoes,sha:Boolean(STATE.promocoesSha),readonly:Boolean(promos?.readonly),carregado:Boolean(promos?.content)},
      {arquivo:PATHS.config,sha:Boolean(STATE.configSha),readonly:Boolean(cfg?.readonly),carregado:Boolean(cfg?.content)}
    ]);
    // Banner de escrita: exibe quando algum arquivo do admin caiu em leitura, falhou no carregamento ou o token não está válido
    const semToken=[pr,cl,en,prod,promos,cfg].some(r=>r.content&&r.readonly)||!GH_WRITE_ALLOWED;
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
    'dashboard':      ['dashboard'],
    'pagina-inicial': ['home','preços','cardapio-titulos','cardápio','fale-conosco','config'],
    'encomendas-admin':['encomendas','sabores','estoque'],
    'produtos-admin': ['produtos'],
    'promocao-admin': ['promoção','participantes'],
    'dicas-admin':    ['depoimentos'],
    'sobre-admin':    ['sobre','carrossel-config'],
    'galeria-admin':  ['galeria'],
    'carrossel-admin': ['carrossel-admin'],
    'encomendas-config-admin': ['encomendas-config'],
    'qualidade':      ['qualidade'],
    'rastreio-admin': ['rastreio'],
    'auditoria-admin':['auditoria']
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
  if(ids.includes('clientes')) { if(typeof fidApplyReadOnlyGuard==='function') fidApplyReadOnlyGuard(); }
  if(ids.includes('depoimentos')){
    console.log('[irPara] Inicializando DEPOIMENTOS');
    try{preencherDepoimentos();}catch(e){console.error('[Admin] preencherDepoimentos',e);}
  }
  if(ids.includes('sobre')){console.log('[irPara] Inicializando SOBRE');safeInit('SOBRE',()=>carregarSobre());}
  if(ids.includes('carrossel-config')){console.log('[irPara] Inicializando CARROSSEL');safeInit('CARROSSEL',()=>carregarCarrosselConfig());}
  if(ids.includes('galeria')){console.log('[irPara] Inicializando GALERIA');safeInit('GALERIA',()=>carregarGaleria());}
  if(ids.includes('carrossel-admin')){console.log('[irPara] Inicializando CARROSSEL-ADMIN');safeInit('CARROSSEL-ADMIN',()=>renderListaBannersCarrosselDedicado());}
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
  document.getElementById('d-total').textContent=clientes.length;
  document.getElementById('d-ativos').textContent=ativos;
  document.getElementById('d-bloqueados').textContent=bloqueados;
  document.getElementById('d-cupons').textContent=cupons;
  document.getElementById('d-encomendas').textContent=encomendas;
  document.getElementById('d-promo').textContent=promoAtiva;
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
  // Campos Críticos da Página Inicial (Fase Final)
  const idxPag=cfg.indexPagina||{};
  document.getElementById('index-hero-h1-principal').value=idxPag.heroH1Principal||'';
  document.getElementById('index-hero-descricao-principal').value=idxPag.heroDescricaoPrincipal||'';
  document.getElementById('index-strip-sensorial-texto').value=idxPag.stripSensorialTexto||'';
  document.getElementById('index-cardapio-h2-titulo').value=idxPag.cardapioH2Titulo||'';
  document.getElementById('index-hero-badge-acai').value=idxPag.heroBadgeAcai||'';
  document.getElementById('index-horario-status-texto').value=idxPag.horarioStatusTexto||'';
  document.getElementById('index-quem-somos-titulo').value=idxPag.quemSomosTitulo||'';
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
  // Campos Críticos da Página Inicial (Fase Final)
  if(!cfg.indexPagina)cfg.indexPagina={};
  cfg.indexPagina.heroH1Principal=document.getElementById('index-hero-h1-principal').value.trim();
  cfg.indexPagina.heroDescricaoPrincipal=document.getElementById('index-hero-descricao-principal').value.trim();
  cfg.indexPagina.stripSensorialTexto=document.getElementById('index-strip-sensorial-texto').value.trim();
  cfg.indexPagina.cardapioH2Titulo=document.getElementById('index-cardapio-h2-titulo').value.trim();
  cfg.indexPagina.heroBadgeAcai=document.getElementById('index-hero-badge-acai').value.trim();
  cfg.indexPagina.horarioStatusTexto=document.getElementById('index-horario-status-texto').value.trim();
  cfg.indexPagina.quemSomosTitulo=document.getElementById('index-quem-somos-titulo').value.trim();
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
  html+='🫐 Preços dos copos de açaí Tipo Artesanal. Alterar aqui muda o cardápio imediatamente.';
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
    const safeSrc = /^[a-zA-Z0-9_\-./]+$/.test(b.src) && !b.src.includes('..') ? b.src : '';
    const srcPreview = srcEsc.startsWith('https://') ? srcEsc : (safeSrc ? 'https://raw.githubusercontent.com/missias123/itapolitanacajuru/main/' + safeSrc : '');
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
  banners[idx].alt = String(valor || '').trim().replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
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

// ─── CARROSSEL DEDICADO — funções para a aba exclusiva ────────────────────────
var _crsBannerBlob = null;

function processarUploadCarrosselDedicado(file) {
  const erroEl = document.getElementById('crs-banner-erro');
  const previewWrap = document.getElementById('crs-banner-preview-wrap');
  const previewImg = document.getElementById('crs-banner-preview');
  const infoEl = document.getElementById('crs-banner-info');
  if (erroEl) erroEl.textContent = '';
  if (!file) return;
  processarImagem(file, 1536, 1024, 0.82, (info, erro) => {
    if (erro) {
      if (erroEl) { erroEl.textContent = '❌ ' + erro; erroEl.classList.add('ativo'); }
      return;
    }
    _crsBannerBlob = info.blob;
    if (previewImg) previewImg.src = URL.createObjectURL(info.blob);
    if (previewWrap) previewWrap.classList.add('ativo');
    if (infoEl) infoEl.innerHTML = `<span style="color:#2e7d32">✅ WebP convertido</span> <span>${info.width}×${info.height}px</span> <span>${info.tamanhoKB}KB</span>`;
    if (erroEl) erroEl.classList.remove('ativo');
    toast('Imagem processada! Clique em Adicionar ao Carrossel.', 'info');
  });
}

async function adicionarBannerCarrosselDedicado() {
  if (!_crsBannerBlob) { toast('Selecione uma imagem primeiro.', 'erro'); return; }
  const altText = (document.getElementById('crs-banner-alt')?.value.trim()) || 'Banner Sorveteria Itapolitana Cajuru';
  const nomeArq = `images/carrossel/banner-${Date.now()}.webp`;
  mostrarLoading('Enviando banner para o carrossel...');
  try {
    const result = await ghPutImagem(nomeArq, _crsBannerBlob, 'Admin: adicionar banner ao carrossel');
    ocultarLoading();
    if (result && result.ok) {
      if (!STATE.config) STATE.config = {};
      if (!Array.isArray(STATE.config.banners)) STATE.config.banners = [];
      STATE.config.banners.push({ src: nomeArq, alt: altText, ts: Date.now() });
      const ok = await salvarArquivo(PATHS.config, STATE.config, 'configSha', 'Admin: adicionar banner ao carrossel');
      if (ok) {
        renderListaBannersCarrosselDedicado();
        renderListaBannersCarrossel(); // sincroniza lista na aba pagina-inicial
        toast('✅ Banner adicionado ao carrossel!', 'ok');
        _crsBannerBlob = null;
        const pw = document.getElementById('crs-banner-preview-wrap');
        if (pw) pw.classList.remove('ativo');
        const ai = document.getElementById('crs-banner-alt');
        if (ai) ai.value = '';
        const fi = document.getElementById('crs-banner-input');
        if (fi) fi.value = '';
      }
    } else {
      toast('❌ Erro ao enviar banner: ' + ((result && result.erro) || 'falha'), 'erro');
    }
  } catch(e) {
    ocultarLoading();
    toast('❌ Erro ao enviar: ' + e.message, 'erro');
  }
}

function renderListaBannersCarrosselDedicado() {
  const wrap = document.getElementById('crs-banners-lista');
  if (!wrap) return;
  const banners = obterBannersCarrossel();
  if (!banners.length) {
    wrap.innerHTML = '<div style="padding:12px;border:1px dashed #cfd8dc;border-radius:10px;background:#fafafa;color:#546e7a;font-size:.82rem">Nenhum banner em config.banners[] ainda. Adicione a primeira imagem acima!</div>';
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
        <button class="btn btn-cinza" style="padding:6px 10px" onclick="moverBannerCarrossel(${i},-1);renderListaBannersCarrosselDedicado()" ${i===0?'disabled':''}>↑</button>
        <button class="btn btn-cinza" style="padding:6px 10px" onclick="moverBannerCarrossel(${i},1);renderListaBannersCarrosselDedicado()" ${i===banners.length-1?'disabled':''}>↓</button>
        <button class="btn btn-excluir" style="padding:6px 10px" onclick="removerBannerCarrossel(${i});renderListaBannersCarrosselDedicado()">✕</button>
      </div>
    </div>`;
  }).join('');
}

async function salvarBannersCarrosselDedicado() {
  const c = STATE.config || {};
  c.banners = obterBannersCarrossel();
  STATE.config = c;
  const ok = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar lista de banners do carrossel');
  if (ok) {
    renderListaBannersCarrosselDedicado();
    renderListaBannersCarrossel(); // sincroniza lista na aba pagina-inicial
    toast('✅ Lista de banners salva!', 'ok');
  }
}
// ─────────────────────────────────────────────────────────────────────────────


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

async function sincronizarEncomendasNuvem() {
  const btn = document.getElementById('btn-sync-encomendas');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Sincronizando...';
  
  try {
    console.log('[Sync] Buscando encomendas na nuvem (Worker)...');
    const resp = await fetch(ITAP_WORKER_API + '/api/encomendas', {
      headers: getWorkerAuthHeaders()
    });
    if (!resp.ok) {
      if (resp.status === 401) throw new Error('Sessão expirada ou não autorizado. Tente fazer login novamente.');
      throw new Error('Falha ao buscar dados na nuvem: ' + resp.status);
    }
    
    const data = await resp.json();
    if (!data.ok || !data.encomendas) throw new Error('Dados da nuvem inválidos');
    
    console.log(`[Sync] ${data.encomendas.length} encomendas encontradas na nuvem.`);
    
    // Garantir que STATE.encomendas existe
    if (!STATE.encomendas) STATE.encomendas = { registros: [] };
    if (!STATE.encomendas.registros) STATE.encomendas.registros = [];
    
    let novosCount = 0;
    data.encomendas.forEach(encNuvem => {
      // Verifica se já existe pelo número do pedido (num)
      const existe = STATE.encomendas.registros.find(e => e.num === encNuvem.num);
      if (!existe) {
        STATE.encomendas.registros.push(encNuvem);
        novosCount++;
      }
    });
    
    if (novosCount > 0) {
      toast(`✅ ${novosCount} novas encomendas importadas da nuvem!`, 'sucesso');
      // Salva no GitHub para persistir o sincronismo
      await salvarArquivo(PATHS.encomendas, STATE.encomendas, 'encomendasSha', `Admin: sincronizar ${novosCount} encomendas da nuvem`);
      renderEncomendas();
    } else {
      toast('ℹ️ Nenhuma encomenda nova na nuvem.', 'info');
    }
  } catch (e) {
    console.error('[Sync] Erro:', e.message);
    toast('❌ Erro ao sincronizar: ' + e.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

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
  const entrada=Object.entries(mapa).find(([,v])=>v===c);
  return entrada?entrada[0]:(c.id_permanente||c.id||c.cel||'');
}
// ═══════════════════════════════════════════════════════════
// PARTICIPANTES GERAL ( + Sorteios Mensais)
// ═══════════════════════════════════════════════════════════
const POR_PAG_PART = 50;
if (!STATE.pagPart) STATE.pagPart = 0;

function getParticipantesUnificados() {
  return (_sortInscritos || []).map((ins) => ({
    id: ins.id || '-',
    nome: ins.nome || '-',
    cel: String(ins.phone || '').replace(/\D/g,''),
    tipo: 'sorteio',
    pontos: 0,
    cadastro: ins.created_at || '',
    status: 'Ativo'
  }));
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
  const elSort  = document.getElementById('part-sorteio');
  if (elTotal) elTotal.textContent = todos.length;
  if (elSort)  elSort.textContent  = todos.length;

  const total   = filtrados.length;
  const paginas = Math.ceil(total / POR_PAG_PART) || 1;
  STATE.pagPart = Math.min(STATE.pagPart, paginas - 1);
  const slice   = filtrados.slice(STATE.pagPart * POR_PAG_PART, (STATE.pagPart + 1) * POR_PAG_PART);

  const tbody = document.getElementById('tabela-participantes');
  if (!tbody) return;

  const tipoLabel = { sorteio: '🎁 Sorteio' };
  const tipoCor   = { sorteio: '#2e7d32' };

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
  const ins = (_sortInscritos || []).find(c => String(c.phone || '').replace(/\D/g,'') === celLimpo);
  if (!ins || !ins.id) { toast('Registro não encontrado.', 'aviso'); return; }
  deletarInscritoSorteio(ins.id);
}

// ═══════════════════════════════════════════════════════════
// ADICIONAR PARTICIPANTE MANUALMENTE
// ═══════════════════════════════════════════════════════════
async function adicionarParticipanteManual() {
  const nome = (document.getElementById('add-part-nome')?.value || '').trim();
  const cel  = (document.getElementById('add-part-cel')?.value || '').trim();
  const nasc = (document.getElementById('add-part-nasc')?.value || '').trim();
  if (!nome) { toast('Informe o nome do participante.', 'erro'); return; }
  if (cel.replace(/\D/g,'').length < 10) { toast('Informe um celular válido.', 'erro'); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nasc)) { toast('Informe a data de nascimento.', 'erro'); return; }
  const celLimpo = cel.replace(/\D/g,'');
  const jaExiste = (_sortInscritos || []).find(c => String(c.phone || '').replace(/\D/g,'') === celLimpo);
  if (jaExiste) { toast('\u274c ' + jaExiste.nome + ' já está inscrito(a) no sorteio.', 'erro'); return; }

  const sessionToken = getWorkerSessionToken();
  if (!sessionToken) { toast('Sessão administrativa expirada. Faça login novamente.', 'erro'); return; }

  mostrarLoading('Adicionando participante no sorteio…');
  try {
    const r = await fetchWithTimeout(ITAP_WORKER_API + '/api/promocao/cadastro', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, getWorkerAuthHeaders()),
      body: JSON.stringify({
        nome,
        phone: celLimpo,
        birthdate: nasc,
        regulation_accept: true
      })
    }, 12000);
    const dados = await r.json();
    if (!dados.success) {
      toast('❌ ' + (dados.error || 'Erro ao adicionar participante.'), 'erro');
      return;
    }
    document.getElementById('add-part-nome').value = '';
    document.getElementById('add-part-cel').value = '';
    document.getElementById('add-part-nasc').value = '';
    toast('\u2705 ' + nome + ' adicionado(a) ao sorteio com sucesso!', 'sucesso');
    await carregarInscritosSorteio();
    renderParticipantes();
  } catch (erro) {
    toast('❌ Erro ao adicionar: ' + erro.message, 'erro');
  } finally {
    ocultarLoading();
  }
}

// ═══════════════════════════════════════════════════════════
// LIMPAR LISTA DE PARTICIPANTES
// ═══════════════════════════════════════════════════════════
function limparListaParticipantes() {
  const total = getParticipantesUnificados().length;
  if (total === 0) { toast('A lista já está vazia.', 'aviso'); return; }
  confirmarAcao(
    '🧹 Limpar Lista de Participantes',
    `Tem certeza que deseja apagar <strong>todos os inscritos no sorteio mensal</strong>?<br><br>⚠️ Isso vai remover <strong>todos os cadastros</strong> de todos os lotes mensais.<br><br><span style="color:#c62828;font-weight:700">Esta ação NÃO pode ser desfeita!</span>`,
    '🧹 Sim, limpar tudo',
    async () => {
      const sessionToken = getWorkerSessionToken();
      if (!sessionToken) { toast('Sessão administrativa expirada. Faça login novamente.', 'erro'); return; }
      const lotes = Array.from(new Set((_sortInscritos || []).map(_sortLoteMes).filter(Boolean)));
      let removidos = 0;
      let ok = true;
      for (const loteMes of lotes) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const r = await fetchWithTimeout(ITAP_WORKER_API + '/api/admin/sorteio/inscritos/lote/' + encodeURIComponent(loteMes), {
            method: 'DELETE',
            headers: getWorkerAuthHeaders()
          }, 15000);
          // eslint-disable-next-line no-await-in-loop
          const dados = await r.json();
          if (!dados.ok) ok = false;
          removidos += Number(dados.removidos || 0);
        } catch (_) {
          ok = false;
        }
      }
      if (ok) {
        toast(`🧹 Lista limpa com sucesso! (${removidos} removidos)`, 'ok');
      } else {
        toast('⚠️ Parte dos lotes não pôde ser removida.', 'aviso');
      }
      await carregarInscritosSorteio();
      renderParticipantes();
    },
    'perigo'
  );
}

function exportarParticipantesCSV() {
  const todos = getParticipantesUnificados();
  if (!todos.length) { toast('Nenhum participante para exportar.', 'aviso'); return; }
  const tipoLabel = { sorteio: 'Sorteio Mensal' };
  const formatarData = (d) => {
    if (!d) return '-';
    if (d.includes('T')) return new Date(d).toLocaleDateString('pt-BR');
    return d;
  };
  // BOM para Excel reconhecer UTF-8
  const BOM = '\uFEFF';
  const header = 'N\u00ba,Nome,WhatsApp,Tipo,Data de Cadastro,Status';
  const rows = todos.map((p, i) =>
    `${i+1},"${(p.nome||'-').replace(/"/g,'""')}","${p.cel||'-'}","${tipoLabel[p.tipo]||p.tipo}","${formatarData(p.cadastro)}","${p.status||'Ativo'}"`
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
  const tipoLabel = { sorteio: 'Sorteio' };
  const lista = todos.map((p, i) => `${i+1}. ${p.nome} — ${p.cel} [${tipoLabel[p.tipo]}]`).join('\n');
  copiarTextoSeguro(lista).then((ok)=>toast(ok?`Lista de ${todos.length} participantes copiada!`:'Erro ao copiar lista de participantes.', ok?'sucesso':'erro'));
}

// ─── COPIAR TODOS OS DADOS (formato completo: nº, nome, WhatsApp, data, tipo, pontos, status) ───
function copiarTodosDados() {
  const todos = getParticipantesUnificados();
  if (!todos.length) { toast('Nenhum participante para copiar.', 'aviso'); return; }
  const tipoLabel = { sorteio: 'Sorteio' };
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
  const sorteio = todos.filter(p => p.tipo === 'sorteio');
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
  }
  renderClientes();
  renderDuplicidades();
}
async function toggleBloqueio(clienteId,bloquear){
  if(!fidRequireWrite())return;
  if(!clientes[clienteId])return;
  const c=clientes[clienteId];
  if(bloquear){
    // Exigir confirmação antes de bloquear
    confirmarAcao(
      'Bloquear Cliente',
      'Sim, bloquear',
      async ()=>{
        clientes[clienteId].bloqueado=true;
        let ok=false;
        if(STATE.clientes?.clientes){STATE.clientes.clientes=clientes;ok=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha',`Admin: bloquear ${c.nome||clienteId}`);}
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
    if(ok){toast('✅ Conta desbloqueada e tentativas zeradas. Mudança salva no GitHub.','sucesso');renderClientes();}
  }
}
// ═══════════════════════════════════════════════════════════
// FUNÇÕES DE GESTÃO MANUAL DO CLUBE DE 
// para atualização imediata no site — sem cache de CDN.
// ═══════════════════════════════════════════════════════════

/* Adicionar ponto(s) manualmente para um cliente.
   Admin usa quando o cliente trouxe cupom físico ou houve erro no fluxo. */
async function adicionarPontoManual(clienteId){
  if(!fidRequireWrite())return;
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
  if(ok){toast(`✅ +${n} ponto(s) para ${c.nome}. Novo saldo: ${clientes[clienteId].saldoPontos}. Salvo no GitHub.`,'sucesso');renderClientes();}
}

/* Zerar tentativas de código e desbloquear.
   Usar quando o cliente erroneamente foi bloqueado ou após confirmação pessoal. */
async function zerarTentativas(clienteId){
  if(!fidRequireWrite())return;
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
  if(ok){toast('✅ Tentativas zeradas e conta desbloqueada. Salvo no GitHub.','sucesso');renderClientes();}
}

/* Validar código manualmente pelo admin.
   Ambas as mudanças são persistidas no GitHub para atualização imediata no site. */
async function adminValidarCodigo(clienteId){
  if(!fidRequireWrite())return;
  const c=clientes[clienteId];
  if(!c)return;
  const codigo=(prompt(`✅ Validar código para ${c.nome}\nWhatsApp: ${c.cel||'-'}\nPontos atuais: ${c.saldoPontos||0}\n\nDigite o código do cupom:`)||'').trim().toUpperCase();
  if(!codigo)return;
  const entrada=codigos[codigo];
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


  /* salvar clientes.json */
  let okC=false;
  if(STATE.clientes?.clientes){STATE.clientes.clientes=clientes;okC=await salvarArquivo(PATHS.clientes,STATE.clientes,'clientesSha',`Admin: código ${codigo} → ${c.nome}`);}


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
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888">⏳ Carregando…</td></tr>';
  _sortMsg('');
  const sessionToken = getWorkerSessionToken();
  if (!sessionToken) {
    _sortMsg('Sessão administrativa expirada. Faça login novamente para carregar inscritos da fonte oficial.', 'erro');
    tbody.innerHTML = '<tr><td colspan="7" style="color:#c62828;text-align:center">Sessão expirada.</td></tr>';
    return;
  }
  try {
    const r = await fetchWithTimeout(ITAP_WORKER_API + '/api/admin/sorteio/inscritos', {
      headers: getWorkerAuthHeaders()
    }, 12000);
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('Resposta não-JSON (Worker indisponível)');
    const dados = await r.json();
    if (!dados.ok) { _sortMsg('Erro ao carregar: ' + (dados.error || r.status), 'erro'); tbody.innerHTML = '<tr><td colspan="7" style="color:#c62828;text-align:center">Falha ao carregar inscritos.</td></tr>'; return; }
    _sortInscritos = dados.inscritos || [];
    _renderTabelaInscritos(_sortInscritos);
    try { renderParticipantes(); } catch (_) {}
  } catch (e) {
    _sortMsg('Erro ao carregar inscritos da fonte oficial: ' + (e && e.message ? e.message : 'falha de rede'), 'erro');
    tbody.innerHTML = '<tr><td colspan="7" style="color:#c62828;text-align:center">Falha ao carregar inscritos.</td></tr>';
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
  try { renderParticipantes(); } catch (_) {}
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

function _fmtDataMesAno(iso) {
  if (!iso) return '—';
  const d = iso.slice(0, 10).split('-');
  return d.length === 3 ? `${d[1]}/${d[0]}` : iso.slice(0, 7);
}

function _fmtTel(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return phone || '—';
}

function _sortLoteMes(ins) {
  const mes = String(ins?.lote_mes || (ins?.created_at || '').slice(0, 7) || '');
  return /^\d{4}-\d{2}$/.test(mes) ? mes : '';
}

function _sortLoteLabel(ins) {
  const mes = _sortLoteMes(ins);
  if (!mes) return '—';
  const [ano, m] = mes.split('-');
  const num = Number(ins?.lote_numero || 0);
  const numTxt = Number.isFinite(num) && num > 0 ? ` #${String(num).padStart(4, '0')}` : '';
  return `LOTE ${m}/${ano}${numTxt}`;
}

function _atualizarSelectLotesMensais(lista) {
  const sel = document.getElementById('sort-lote-mes-select');
  if (!sel) return;
  const atual = sel.value || '';
  const meses = Array.from(new Set((lista || []).map(_sortLoteMes).filter(Boolean))).sort().reverse();
  sel.innerHTML = '<option value="">Selecione um lote mensal…</option>' + meses.map(m => {
    const [ano, mm] = m.split('-');
    return `<option value="${m}">${mm}/${ano}</option>`;
  }).join('');
  if (atual && meses.includes(atual)) sel.value = atual;
}

function _renderTabelaInscritos(lista) {
  const tbody = document.getElementById('sort-inscritos-tbody');
  const badge = document.getElementById('sort-contador-badge');
  if (badge) badge.textContent = lista.length + ' inscrito' + (lista.length !== 1 ? 's' : '');
  _atualizarSelectLotesMensais(lista);
  if (!tbody) return;
  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;font-style:italic">Nenhum inscrito encontrado.</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map((ins, i) => {
    const idEsc = String(ins.id || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<tr>
      <td style="font-size:.78rem;color:#555">${ins.id || '—'}</td>
      <td><strong>${ins.nome || '—'}</strong></td>
      <td>${_fmtData(ins.birthdate)}</td>
      <td>${_fmtTel(ins.phone)}</td>
      <td style="font-size:.74rem;color:#0d47a1;font-weight:700">${_sortLoteLabel(ins)}</td>
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

async function deletarLoteMensalSorteio() {
  const loteMes = (document.getElementById('sort-lote-mes-select')?.value || '').trim();
  if (!/^\d{4}-\d{2}$/.test(loteMes)) { toast('Selecione um lote mensal válido (AAAA-MM).', 'aviso'); return; }
  const [ano, mes] = loteMes.split('-');
  if (!confirm(`Excluir todos os cadastros do lote ${mes}/${ano}?\n\nEsta ação não pode ser desfeita.`)) return;

  const sessionToken = getWorkerSessionToken();
  if (!sessionToken) { toast('Sessão administrativa expirada. Faça login novamente.', 'erro'); return; }

  mostrarLoading('Excluindo lote mensal…');
  try {
    const r = await fetchWithTimeout(ITAP_WORKER_API + '/api/admin/sorteio/inscritos/lote/' + encodeURIComponent(loteMes), {
      method: 'DELETE',
      headers: getWorkerAuthHeaders()
    }, 15000);
    const dados = await r.json();
    if (!dados.ok) {
      toast('❌ ' + (dados.error || 'Erro ao excluir lote.'), 'erro');
      return;
    }
    const removidos = Number(dados.removidos || 0);
    toast(`✅ Lote ${mes}/${ano} excluído (${removidos} cadastro(s)).`, 'sucesso');
    await carregarInscritosSorteio();
  } catch (e) {
    toast('Erro de rede: ' + e.message, 'erro');
  } finally {
    ocultarLoading();
  }
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

  if (id.startsWith('LOCAL-')) {
    const idx = _sortInscritos.findIndex(i => i.id === id);
    if (idx > -1) {
      const localIdx = parseInt(id.replace('LOCAL-',''), 10) - 1;
      if (arr && arr[localIdx]) {
        arr[localIdx].nome = nome;
        arr[localIdx].dataNasc = nasc;
        arr[localIdx].cel = tel;
      }
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

  if (id.startsWith('LOCAL-')) {
    const localIdx = parseInt(id.replace('LOCAL-',''), 10) - 1;
    if (arr && arr[localIdx] !== undefined) {
      arr.splice(localIdx, 1);
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
  if (ok) {
    const msg = document.getElementById('sort-msg');
    if (msg) { msg.textContent = '✅ Sorteio salvo!'; msg.style.color = '#2e7d32'; setTimeout(() => msg.textContent = '', 3000); }
  }
}

function preencherSorteio() {
  const dp = document.getElementById('sort-data-prox'); if (dp) dp.value = s.dataProx || '';
  const sp = document.getElementById('sort-premio');    if (sp) sp.value = s.premio || '1 caixa de 5 litros de sorvete Tipo Artesanal';
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
// =====================================================
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
  if(!STATE.fidelidade){
    fidMostrarAlerta('⚠️ Dados de fidelidade não carregados. Verifique o token GitHub e recarregue o painel antes de liberar um novo lote.','erro');
    return;
  }
  const atual=STATE.fidelidade.liberados||0;
  if(atual>=FID_TOTAL_BANCO){fidMostrarAlerta('⚠️ Todos os 1.000.000 códigos já foram liberados!','erro');return;}
  const btn=document.getElementById('btn-liberar-lote');
  if(btn){btn.disabled=true;btn.innerHTML='<span class="fid-spinner"></span> Gerando e salvando...';}
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
      console.error('[Fidelidade] Fallback de impressão falhou:', e);
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
  doc.save(filename);
  toast('PDF de etiquetas (10/A4 · 92,5×51,4 mm) gerado com sucesso.','ok');
}
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
  if (fidRegrasUrlSafe===null) return;
  const fidResgateUrlSafe = cmsLerUrlCampo('fid-resgate-url', 'URL de resgate via WhatsApp', {allowRelative:false});
  if (fidResgateUrlSafe===null) return;

  // Novos campos Fase 3.2

  c.seoPaginas = c.seoPaginas || {};

  const fidSeoTitOld = document.getElementById('fid-seo-titulo');
  const fidSeoDescOld = document.getElementById('fid-seo-descricao');
  const fidSeoPal = document.getElementById('fid-seo-palavras');

  mostrarLoading('Salvando...');

  let ok1 = true;
  
  
  // Salvar no config.json (fonte principal do admin)
  const ok2 = await salvarArquivo(PATHS.config, c, 'configSha', 'Admin: atualizar configuração de prêmios');
  
  ocultarLoading();
  if (ok1 && ok2) {
    toast('Configurações salvas e sincronizadas!', 'sucesso');
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

  const fidHT=document.getElementById('cfg-fid-hero-titulo'); if(fidHT) fidHT.value=cfg.fidHeroTitulo||'🎟️  Itapolitana';
  const fidHD=document.getElementById('cfg-fid-hero-desc'); if(fidHD) fidHD.value=cfg.fidHeroDesc||'Acumule pontos a cada compra e ganhe prêmios exclusivos na Sorveteria Itapolitana de Cajuru.';
  const encHeroTit=document.getElementById('enc-hero-titulo'); if(encHeroTit) encHeroTit.value=cfg.encomendasHeroTitulo||'';
  const encHeroDesc=document.getElementById('enc-hero-desc'); if(encHeroDesc) encHeroDesc.value=cfg.encomendasHeroDescricao||'';
  const encHeroBadges=document.getElementById('enc-hero-badges'); if(encHeroBadges) encHeroBadges.value=Array.isArray(cfg.encomendasHeroBadges)?cfg.encomendasHeroBadges.join('\n'):'';
  const seoPg=cfg.seoPaginas||{};
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
  cfg.seoPaginas=cfg.seoPaginas||{};
  cfg.seoPaginas.encomendas=cfg.seoPaginas.encomendas||{};
  cfg.seoPaginas.promocao=cfg.seoPaginas.promocao||{};
  cfg.seoPaginas.sobre=cfg.seoPaginas.sobre||{};
  cfg.seoPaginas.galeria=cfg.seoPaginas.galeria||{};
  cfg.seoPaginas.carrossel=cfg.seoPaginas.carrossel||{};
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
    if (descPagEl) descPagEl.value = gp.descricao || 'Sorvete Tipo Artesanal, açaí, picolés e muito mais desde 2007 em Cajuru/SP.';
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
    setFieldValue('encomendas-hero-descricao', ep.heroDescricao || 'Sorvete Tipo Artesanal em caixa, tortas geladas, picolés em atacado e acréscimos. Feito com carinho desde 2007, entregue com qualidade. Pedido fácil pelo WhatsApp!', 'encomendas.hero.descricao');
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

  const cfg = STATE.config || {};

  if (tituloEl) tituloEl.value = seo.titulo || ' | Sorveteria Itapolitana Cajuru';

  if (descEl) descEl.value = seo.descricao || 'Acumule pontos por código nos cupons da Itapolitana Cajuru e troque por prêmios. Cadastre-se no .';

  if (comoFuncTitEl) comoFuncTitEl.value = fp.comoFuncionaTitulo || 'Como funciona';

  if (acaoTitEl) acaoTitEl.value = fp.acaoTitulo || 'Quero participar do ';

  if (btnCadEl) btnCadEl.value = fp.btnCadastro || 'Quero participar do ';

  if (btnLogEl) btnLogEl.value = fp.btnLogin || 'Já sou cadastrado / Digitar código';

  if (regrasTitEl) regrasTitEl.value = fp.regrasTitulo || 'Regras do ';

  if (btnAceitEl) btnAceitEl.value = fp.btnAceitarRegras || 'Li e aceito as regras do ';

  if (regTitEl) regTitEl.value = fp.regulamentoTitulo || 'Regras completas do programa';

  if (regSumEl) regSumEl.value = fp.regulamentoSummary || '📜 Ler regulamento completo do ';
}


// =====================================================================
// SORTEIOS — Carregar e salvar configuração de sorteios
// =====================================================================
function carregarConfigSorteio() {
  const sorteio = fid.sorteio || {};

  const statusEl = document.getElementById('sorteio-status');
  if (statusEl) statusEl.value = sorteio.status || 'ativo';

  const dataProxEl = document.getElementById('sorteio-data-prox');
  if (dataProxEl) dataProxEl.value = sorteio.dataProx || '';

  const dataFimEl = document.getElementById('sorteio-data-fim');
  if (dataFimEl) dataFimEl.value = sorteio.dataFim || '';

  const premioEl = document.getElementById('sorteio-premio');
  if (premioEl) premioEl.value = sorteio.premio || '1 caixa de 5 litros de sorvete Tipo Artesanal';

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


  toast('Configuração do sorteio salva com sucesso!', 'ok');
  carregarConfigSorteio();
}

// =====================================================================
// REGRAS DE PONTUAÇÃO — Carregar e salvar
// =====================================================================
function carregarRegrasPontuacao() {
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


  toast('Regras de pontuação salvas com sucesso!', 'ok');
  carregarRegrasPontuacao();

  // Também atualizar no config.json para sincronização com o site
  const cfg = STATE.config || {};
  
  
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
const PICOLES_PADRAO = {"frutas_agua": {"id": "pic_frutas_agua", "nome": "Picolé de Fruta/Água", "preço_varejo": 2.5, "preço_atacado": 1.8, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Abacaxi", "esgotado": false}, {"nome": "Caju", "esgotado": false}, {"nome": "Goiaba", "esgotado": false}, {"nome": "Groselha", "esgotado": false}, {"nome": "Limão", "esgotado": false}, {"nome": "Melância", "esgotado": false}, {"nome": "Uva", "esgotado": false}, {"nome": "Tamarindo", "esgotado": false}]}, "leite_sem_recheio": {"id": "pic_leite_sem_recheio", "nome": "Picolé de Leite sem Recheio", "preço_varejo": 2.5, "preço_atacado": 2.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Coco Queimado", "esgotado": false}, {"nome": "Milho Verde", "esgotado": false}, {"nome": "Amendoim", "esgotado": false}, {"nome": "Pistache", "esgotado": false}]}, "leite_com_recheio": {"id": "pic_leite_com_recheio", "nome": "Picolé de Leite com Recheio", "preço_varejo": 3.0, "preço_atacado": 2.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Açaí", "esgotado": false}, {"nome": "Blue Ice", "esgotado": false}, {"nome": "Caraxi", "esgotado": false}, {"nome": "Coco Branco", "esgotado": false}, {"nome": "Chocolate", "esgotado": false}, {"nome": "Amarena (Cereja Italiana)", "esgotado": false}, {"nome": "Leite Condensado", "esgotado": false}, {"nome": "Mamão Papaia", "esgotado": false}, {"nome": "Maracujá", "esgotado": false}, {"nome": "Morango", "esgotado": false}, {"nome": "Menta com Chocolate", "esgotado": false}, {"nome": "Nata com Goiaba", "esgotado": false}]}, "leite_ninho": {"id": "pic_leite_ninho", "nome": "Picolé Leite Ninho", "preço_varejo": 4.0, "preço_atacado": 3.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Leite Ninho", "esgotado": false}]}, "ovomaltine": {"id": "pic_ovomaltine", "nome": "Picolé de Ovomaltine", "preço_varejo": 4.0, "preço_atacado": 3.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Ovomaltine", "esgotado": false}]}, "esquimós": {"id": "pic_esquimós", "nome": "Picolé Esquimó", "preço_varejo": 8.0, "preço_atacado": 6.0, "estoque": 200, "esgotado": false, "sabores": [{"nome": "Bombom", "esgotado": false}, {"nome": "Nutella", "esgotado": false}, {"nome": "Ovomaltine", "esgotado": false}, {"nome": "Leite Ninho", "esgotado": false}, {"nome": "Nata", "esgotado": false}, {"nome": "Morango", "esgotado": false}, {"nome": "Brigadeiro", "esgotado": false}, {"nome": "Prestígio", "esgotado": false}]}};

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
