#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.AUDIT_PORT || 8165);
const BASE = process.env.AUDIT_BASE || `http://127.0.0.1:${PORT}`;
const STRICT = process.env.AUDIT_STRICT_CRITICAL || '1';

function waitForServer(child, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Servidor local não iniciou em ${timeoutMs}ms. Saída: ${output}`)), timeoutMs);
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      process.stdout.write(chunk);
      if (output.includes('STATIC_SERVER_READY')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
      process.stderr.write(chunk);
    });
    child.once('exit', (code) => {
      if (!output.includes('STATIC_SERVER_READY')) {
        clearTimeout(timer);
        reject(new Error(`Servidor encerrou antes de iniciar (code=${code}). Saída: ${output}`));
      }
    });
  });
}

function waitExit(child) {
  return new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })));
}

(async () => {
  const server = spawn(process.execPath, ['tests/local-static-server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServer(server);
    const audit = spawn(process.execPath, ['tests/site-wide-button-hit-audit.mjs'], {
      cwd: ROOT,
      env: { ...process.env, AUDIT_BASE: BASE, AUDIT_STRICT_CRITICAL: STRICT },
      stdio: 'inherit',
    });
    const { code, signal } = await waitExit(audit);
    if (signal) {
      console.error(`Audit terminated by signal ${signal}`);
      process.exit(1);
    }
    process.exit(code ?? 1);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  } finally {
    if (server.exitCode === null && !server.killed) server.kill('SIGTERM');
  }
})();
