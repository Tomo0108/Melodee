const { readdir } = require('node:fs/promises');
const { basename, extname, join, relative } = require('node:path');

const AUDIO_EXT = new Set(['mp1','mp2','mp3','m4a','m4b','mp4','aac','alac','ogg','oga','opus','flac','wv','wav','wave','w64','rf64','aiff','aif','au','snd','wma','ac3','dts','mpc','mpp','mp+','spx','ape','tak','mka','mkv','webm','ts']);

async function collectAudioPaths(root, { maxFiles = 1000, maxDepth = 8 } = {}) {
  const acc = [];
  async function walk(dir, depth) {
    if (acc.length >= maxFiles || depth > maxDepth) return;
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (acc.length >= maxFiles) return;
      if (entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await walk(full, depth + 1);
      else if (entry.isFile() && AUDIO_EXT.has(extname(entry.name).slice(1).toLowerCase())) acc.push(full);
    }
  }
  await walk(root, 0);
  return acc;
}

function folderGroupName(root, filePath) {
  const parts = relative(root, filePath).split(/[/\\]/).filter(Boolean);
  if (parts.length <= 1) return basename(root);
  return parts[0];
}

module.exports = { collectAudioPaths, AUDIO_EXT, folderGroupName };
