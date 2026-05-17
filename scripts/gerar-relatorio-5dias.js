/* eslint-env node */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'relatorios', 'admin-espelho-ultimos-5-dias.md');
const DAYS = 5;

function exec(cmd) {
  return cp.execSync(cmd, { encoding: 'utf8', cwd: ROOT }).trim();
}

function getCommits() {
  const raw = exec(`git --no-pager log --since="${DAYS} days ago" --pretty=format:"%h|%ad|%an|%s" --date=iso-strict`);
  if (!raw) return [];
  return raw.split('\n').map((line) => {
    const [sha, date, author, subject] = line.split('|');
    return { sha, date, author, subject };
  });
}

async function getWorkflowRuns() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || 'missias123/itapolitanacajuru';
  const [owner, name] = repo.split('/');
  if (!token || !owner || !name) return [];
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
  const url = `https://api.github.com/repos/${owner}/${name}/actions/runs?per_page=100&created=>=${since}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json'
    }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.workflow_runs) ? data.workflow_runs : [];
}

function statusFromRuns(runs) {
  const alvo = runs.filter((r) =>
    ['quality-check.yml', 'auto-repair.yml', 'e2e-tests.yml', 'lighthouse-audit.yml'].includes(
      String(r.path || '').replace('.github/workflows/', '')
    )
  );
  if (alvo.some((r) => r.conclusion && r.conclusion !== 'success' && r.conclusion !== 'skipped')) return 'não resolvido';
  if (alvo.some((r) => r.conclusion === 'success')) return 'resolvido parcialmente';
  return 'sem dados';
}

async function main() {
  const commits = getCommits();
  const runs = await getWorkflowRuns();
  const stamp = new Date().toISOString();
  const incidentStatus = statusFromRuns(runs);

  const lines = [];
  lines.push('# Relatório Operacional — Últimos 5 dias (Admin ↔ Site)');
  lines.push('');
  lines.push(`Gerado em: ${stamp}`);
  lines.push('');
  lines.push(`Status do incidente "Admin não editável / Espelho quebrado": **${incidentStatus}**`);
  lines.push('');
  lines.push('## Commits (últimos 5 dias)');
  lines.push('');
  if (!commits.length) lines.push('- Nenhum commit no período.');
  commits.slice(0, 80).forEach((c) => lines.push(`- \`${c.sha}\` | ${c.date} | ${c.author} | ${c.subject}`));
  lines.push('');
  lines.push('## Workflow runs (últimos 5 dias)');
  lines.push('');
  if (!runs.length) lines.push('- Sem dados de workflow (token/repositório indisponível).');
  runs
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 60)
    .forEach((r) => {
      lines.push(
        `- ${r.created_at} | ${r.name} | \`${r.path}\` | ${r.status}/${r.conclusion} | run ${r.id} | ${r.html_url}`
      );
    });
  lines.push('');
  lines.push('## Critério de aceite funcional final');
  lines.push('');
  lines.push('- [ ] Acesso: entrar no admin com senha válida');
  lines.push('- [ ] Salvamento: salvar alteração real em campo editável');
  lines.push('- [ ] Reflexo: conferir alteração refletida no site público');
  lines.push('');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
  console.log(`✅ Relatório atualizado: ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error('❌ Falha ao gerar relatório de 5 dias:', err.message);
  process.exit(1);
});
