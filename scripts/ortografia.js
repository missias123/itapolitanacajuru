/**
 * ortografia.js — Correção ortográfica automática (Português Brasileiro Oficial)
 * Sorveteria Itapolitana Cajuru/SP
 * 
 * Funciona em tempo real: corrige ao digitar (blur) e ao salvar qualquer campo de texto.
 * Inclui dicionário completo de termos do cardápio e erros comuns.
 */

// ============================================================
// DICIONÁRIO DE CORREÇÕES ORTOGRÁFICAS
// Ordem: mais específico primeiro (frases antes de palavras)
// ============================================================
const DICIONARIO_ORTOGRAFIA = [
  // --- Nomes compostos (mais específicos primeiro) ---
  ['Leite Ninho Folheado',          'Leite Ninho Folheado'],  // correto
  ['Leite Ninho Folheado',          'Leite Ninho Folheado'],
  ['Leite Ninho Folheado',          'Leite Ninho Folheado'],
  ['Petit Gateau',                 'Petit Gâteau'],
  ['petit gateau',                 'Petit Gâteau'],
  ['Petit gateau',                 'Petit Gâteau'],
  ['Sorvete de Massa',             'Sorvete de Massa'],     // correto
  ['Mousse de Maracuja',           'Mousse de Maracujá'],
  ['mousse de maracuja',           'Mousse de Maracujá'],
  ['Mousse de Uva',                'Mousse de Uva'],        // correto
  ['Banana com Nutella',           'Banana com Nutella'],   // correto
  ['Menta com Chocolate',          'Menta com Chocolate'],  // correto
  ['Nata com Goiaba',              'Nata com Goiaba'],      // correto
  ['Mamao Papaia',                 'Mamão Papaia'],
  ['mamao papaia',                 'Mamão Papaia'],
  ['Coco Queimado',                'Coco Queimado'],        // correto
  ['Milho Verde',                  'Milho Verde'],          // correto
  ['Leite Condensado',             'Leite Condensado'],     // correto
  ['Leite em Po',                  'Leite em Pó'],
  ['leite em po',                  'Leite em Pó'],
  ['Creme de Amendoim',            'Creme de Amendoim'],    // correto
  ['Creme de Pistache',            'Creme de Pistache'],    // correto
  ['Geleia de Morango',            'Geleia de Morango'],    // correto
  ['Creme de Ninho',               'Creme de Ninho'],       // correto
  ['Sonho de Valsa/Ouro Branco',   'Sonho de Valsa/Ouro Branco'], // marcas
  ['Morango Trufado',              'Morango Trufado'],      // correto
  ['Cereja Trufada',               'Cereja Trufada'],       // correto
  ['Chocolate com Cafe',           'Chocolate com Café'],
  ['chocolate com cafe',           'Chocolate com Café'],
  ['Banana Split',                 'Banana Split'],         // correto
  ['Vaca Preta',                   'Vaca Preta'],           // correto
  ['Caixa 5 Litros',               'Caixa 5 Litros'],       // correto
  ['Caixa 10 Litros',              'Caixa 10 Litros'],      // correto
  ['Torta de Sorvete',             'Torta de Sorvete'],     // correto
  ['Torta de Chocolate',           'Torta de Chocolate'],   // correto
  ['Sorvete com Bolo no Pote',     'Sorvete com Bolo no Pote'], // correto
  ['Cobertura 1.3L',               'Cobertura 1,3L'],       // vírgula decimal BR
  ['Canudinho Wafer',              'Canudinho Wafer'],      // correto
  ['Acai Promocional',             'Açaí Promocional'],
  ['acai promocional',             'Açaí Promocional'],
  ['Sorvete Diet',                 'Sorvete Diet'],         // correto

  // --- Palavras simples ---
  ['Fundue',      'Fondue'],
  ['fundue',      'Fondue'],
  ['Folheado',     'Folheado'],  // correto
  ['Folheado',     'Folheado'],
  ['Eskimo',      'Esquimó'],
  ['eskimo',      'Esquimó'],
  ['Picole',      'Picolé'],
  ['picole',      'Picolé'],
  ['Acai',        'Açaí'],
  ['acai',        'Açaí'],
  ['Milkshake',   'Milk-shake'],
  ['milkshake',   'Milk-shake'],
  ['Cascao',      'Cascão'],
  ['cascao',      'Cascão'],
  ['Maracuja',    'Maracujá'],
  ['maracuja',    'Maracujá'],
  ['Mamao',       'Mamão'],
  ['mamao',       'Mamão'],
  ['Melancia',    'Melância'],
  ['melancia',    'Melância'],
  ['Tamarindo',   'Tamarindo'],   // correto
  ['Goiabada',    'Goiabada'],    // correto
  ['Pistache',    'Pistache'],    // correto
  ['Amendoim',    'Amendoim'],    // correto
  ['Groselha',    'Groselha'],    // correto
  ['Abacaxi',     'Abacaxi'],     // correto
  ['Paçoca',      'Paçoca'],      // correto
  ['Granola',     'Granola'],     // correto
  ['Chantilly',   'Chantilly'],   // correto
  ['Granulado',   'Granulado'],   // correto
  ['Brigadeiro',  'Brigadeiro'],  // correto
  ['Unicornio',   'Unicórnio'],
  ['unicornio',   'Unicórnio'],
  ['Universitario','Universitário'],
  ['universitario','Universitário'],
  ['Fondue',      'Fondue'],      // já correto
  ['Oreo',        'Oreo'],        // marca sem acento
  ['Óreo',        'Oreo'],        // corrigir acento incorreto na marca
  ['Negresco',    'Negresco'],    // marca
  ['Prestígio',   'Prestígio'],   // correto
  ['Prestigio',   'Prestígio'],
  ['prestigio',   'Prestígio'],
  ['Brigadeiro',  'Brigadeiro'],  // correto
  ['Chocoball',   'Chocoball'],   // correto
  ['Confete',     'Confete'],     // correto
  ['Ovomaltine',  'Ovomaltine'],  // marca
  ['Chantilly',   'Chantilly'],   // correto
  ['Sundae',      'Sundae'],      // correto (inglês aceito)
  ['Colegial',    'Colegial'],    // correto
  ['Fondue',      'Fondue'],      // correto
  ['Cestinha',    'Cestinha'],    // correto
  ['Casquinha',   'Casquinha'],   // correto
  ['Cascão',      'Cascão'],      // correto
  ['Canudinho',   'Canudinho'],   // correto
  ['Cobertura',   'Cobertura'],   // correto
];

// ============================================================
// FUNÇÃO PRINCIPAL DE CORREÇÃO
// ============================================================
function corrigirOrtografia(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  let resultado = texto;
  for (const [errado, correto] of DICIONARIO_ORTOGRAFIA) {
    if (resultado.includes(errado)) {
      resultado = resultado.split(errado).join(correto);
    }
  }
  return resultado;
}

// ============================================================
// APLICAR CORREÇÃO EM TEMPO REAL NOS CAMPOS DE TEXTO
// Dispara ao sair do campo (blur) e ao colar texto (paste)
// ============================================================
function ativarCorrecaoAutomatica() {
  // Selecionar todos os inputs de texto e textareas
  const seletores = 'input[type="text"], input[type="search"], textarea, input:not([type])';
  
  function aplicarCorrecaoNoCampo(campo) {
    const valorOriginal = campo.value;
    const valorCorrigido = corrigirOrtografia(valorOriginal);
    if (valorCorrigido !== valorOriginal) {
      campo.value = valorCorrigido;
      // Disparar evento de change para que o código do admin detecte a mudança
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      campo.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`[Ortografia] Corrigido: "${valorOriginal}" → "${valorCorrigido}"`);
    }
  }

  // Aplicar em campos já existentes
  document.querySelectorAll(seletores).forEach(campo => {
    campo.addEventListener('blur', () => aplicarCorrecaoNoCampo(campo));
    campo.addEventListener('paste', () => {
      setTimeout(() => aplicarCorrecaoNoCampo(campo), 100);
    });
  });

  // Observar novos campos adicionados dinamicamente (MutationObserver)
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          const campos = node.matches && node.matches(seletores)
            ? [node]
            : Array.from(node.querySelectorAll ? node.querySelectorAll(seletores) : []);
          campos.forEach(campo => {
            campo.addEventListener('blur', () => aplicarCorrecaoNoCampo(campo));
            campo.addEventListener('paste', () => {
              setTimeout(() => aplicarCorrecaoNoCampo(campo), 100);
            });
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log('[Ortografia] Correção automática ativada ✅');
}

// ============================================================
// INICIALIZAR QUANDO O DOM ESTIVER PRONTO
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ativarCorrecaoAutomatica);
} else {
  ativarCorrecaoAutomatica();
}

// Exportar para uso em outros scripts
if (typeof window !== 'undefined') {
  window.corrigirOrtografia = corrigirOrtografia;
  window.DICIONARIO_ORTOGRAFIA = DICIONARIO_ORTOGRAFIA;
}
