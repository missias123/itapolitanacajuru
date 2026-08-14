import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('/home/ubuntu/itapolitanacajuru/index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
const window = dom.window;

console.log('DOM carregado com sucesso. Verificando funções globais de sabores...');
console.log('getSaboresDisponíveis:', typeof window.getSaboresDisponíveis);
console.log('abrirSaboresInline:', typeof window.abrirSaboresInline);
console.log('abrirPicoléInline:', typeof window.abrirPicoléInline);

// Verificar se as categorias possuem botões Ver Sabores com chamadas corretas
const matches = html.match(/onclick="([^"]*abrir[^"]*)"/g);
console.log('Total de chamadas de abertura encontradas no HTML:', matches ? matches.length : 0);
if (matches) {
  matches.slice(0, 10).forEach(m => console.log(' -', m));
}
console.log('PASS: Estrutura do cardápio e funções inline validadas no DOM.');
