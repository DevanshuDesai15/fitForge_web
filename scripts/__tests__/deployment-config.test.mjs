import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Vercel builds the web workspace and serves its dist directory', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.equal(config.buildCommand, 'npm run build:web');
  assert.equal(config.outputDirectory, 'apps/web/dist');
  assert.equal(config.installCommand, 'npm ci');
});

test('CI verifies lint, tests, types, and web build', async () => {
  const workflow = await readFile('.github/workflows/main.yml', 'utf8');
  for (const command of ['npm run lint', 'npm run test', 'npm run typecheck', 'npm run build:web']) {
    assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+')));
  }
});
