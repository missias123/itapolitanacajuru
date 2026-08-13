const fs = require('fs');
const path = require('path');

const rootDir = '/home/ubuntu/itapolitanacajuru';
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

const foundLinks = new Set();
const internalLinks = new Set();

htmlFiles.forEach(file => {
    const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
    const links = content.match(/href="([^"]+)"/g);
    if (links) {
        links.forEach(l => {
            const href = l.match(/href="([^"]+)"/)[1];
            if (!href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                internalLinks.add(href.split('#')[0]);
            }
        });
    }
});

console.log('--- Verificando links internos ---');
internalLinks.forEach(link => {
    const filePath = path.join(rootDir, link);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Link quebrado: ${link}`);
    } else {
        // console.log(`✅ Link OK: ${link}`);
    }
});
console.log('--- Verificação concluída ---');
