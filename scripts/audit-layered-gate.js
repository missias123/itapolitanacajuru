#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function reservePort(preferred) {
  return new Promise((resolve, reject) => {
    const attempt = (port) => {
      const server = net.createServer();
      server.unref();
      server.once('error', (error) => {
        if (error && error.code === 'EADDRINUSE' && port !== 0) return attempt(0);
        reject(error);
      });
      server.listen(port, '127.0.0.1', () => {
        const selected = server.address().port;
        server.close(() => resolve(selected));
      });
    };
    attempt(preferred || 0);
  });
}

function runCommand(command, args, extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: { ...process.env, ...extraEnv },
      stdio: 'inherit',
    });
    child.once('exit', (code, signal) => resolve({ code: code ?? 1, signal: signal || null }));
  });
}

async function executeCheck(check) {
  let attempts = 0;
  const maxAttempts = Math.max(1, check.retries || 1);
  let last = { code: 1, signal: null };
  while (attempts < maxAttempts) {
    attempts += 1;
    const env = { ...(check.env || {}) };
    if (check.portEnv) env[check.portEnv] = String(await reservePort(check.preferredPort || 0));
    last = await runCommand(check.command, check.args, env);
    if (last.code === 0 && !last.signal) break;
  }
  return {
    id: check.id,
    layer: check.layer,
    severity: check.severity,
    attempts,
    maxAttempts,
    ok: last.code === 0 && !last.signal,
    exitCode: last.code,
    signal: last.signal,
  };
}

const checks = [
  { id: 'catalog-contract', layer: 'camada-1-estatico-contrato', severity: 'high', command: 'npm', args: ['run', 'audit:catalog'] },
  { id: 'admin-site-sync', layer: 'camada-1-estatico-contrato', severity: 'high', command: 'npm', args: ['run', 'audit:admin-sync'] },
  { id: 'security-regression', layer: 'camada-1-estatico-contrato', severity: 'critical', command: 'npm', args: ['run', 'audit:security-regression'] },
  { id: 'button-hit', layer: 'camada-2-fluxos-criticos', severity: 'critical', command: 'npm', args: ['run', 'audit:button-hit-gate'], portEnv: 'AUDIT_PORT', preferredPort: 8165, retries: 2 },
  { id: 'click-speed', layer: 'camada-2-fluxos-criticos', severity: 'critical', command: 'npm', args: ['run', 'audit:click-speed'], portEnv: 'AUDIT_PORT', preferredPort: 8161, env: { CLICK_AUDIT_RETRIES: '3' }, retries: 2 },
  { id: 'sold-out-sync', layer: 'camada-2-fluxos-criticos', severity: 'critical', command: 'npm', args: ['run', 'audit:sold-out-sync'], portEnv: 'AUDIT_PORT', preferredPort: 8166, retries: 2 },
];

(async () => {
  const startedAt = new Date().toISOString();
  const results = [];
  for (const check of checks) results.push(await executeCheck(check));
  const failed = results.filter((entry) => !entry.ok);
  const hasCriticalFailure = failed.some((entry) => entry.severity === 'critical');
  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    failedCritical: failed.filter((entry) => entry.severity === 'critical').length,
    failedHigh: failed.filter((entry) => entry.severity === 'high').length,
  };
  console.log(JSON.stringify({ summary, results }, null, 2));
  process.exit(hasCriticalFailure ? 1 : 0);
})();
