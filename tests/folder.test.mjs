import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const { collectVideoPaths, folderGroupName } = createRequire(import.meta.url)('../electron/folder.cjs');

test('folder scan finds nested music and skips notes, hidden files, and links', async () => {
  const root = await mkdtemp(join(tmpdir(), 'videe-folder-'));
  try {
    await mkdir(join(root, 'nested', 'deeper'), { recursive: true });
    await mkdir(join(root, '.hidden'), { recursive: true });
    await writeFile(join(root, 'Show.mp3'), 'x');
    await writeFile(join(root, 'nested', 'Inside.flac'), 'x');
    await writeFile(join(root, 'nested', 'deeper', 'Clip.mka'), 'x');
    await writeFile(join(root, 'note.txt'), 'no');
    await writeFile(join(root, '.hidden', 'Secret.mp3'), 'x');
    await symlink(join(root, 'Show.mp3'), join(root, 'alias.mp3'));
    const found = await collectVideoPaths(root);
    assert.deepEqual(found.map(path => path.slice(root.length + 1)).sort(), ['Show.mp3', join('nested', 'Inside.flac'), join('nested', 'deeper', 'Clip.mka')].sort());
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('folder scan respects file and depth limits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'videe-folder-limit-'));
  try {
    await mkdir(join(root, 'a', 'b', 'c'), { recursive: true });
    await writeFile(join(root, 'One.mp3'), 'x');
    await writeFile(join(root, 'Two.mp3'), 'x');
    await writeFile(join(root, 'a', 'b', 'c', 'Deep.mp3'), 'x');
    assert.equal((await collectVideoPaths(root, { maxFiles: 1 })).length, 1);
    assert.equal((await collectVideoPaths(root, { maxDepth: 1 })).includes(join(root, 'a', 'b', 'c', 'Deep.mp3')), false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('folder group names use the import root and first subdirectory', () => {
  assert.equal(folderGroupName('/Music', join('/Music', 'Show.mp3')), 'Music');
  assert.equal(folderGroupName('/Music', join('/Music', 'Action', 'Clip.flac')), 'Action');
  assert.equal(folderGroupName('/Music', join('/Music', 'Action', '2024', 'Clip.mka')), 'Action');
});
