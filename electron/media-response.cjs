const { stat } = require('node:fs/promises');
const { createReadStream } = require('node:fs');
const { Readable } = require('node:stream');
const { extname } = require('node:path');

// Advertise and serve byte ranges so seeking works before the whole file is buffered.
async function mediaResponse(request, filePath) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });
  const info = await stat(filePath);
  if (!info.isFile()) return new Response(null, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
  const size = info.size;
  const types = { '.mp1': 'audio/mpeg', '.mp2': 'audio/mpeg', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.m4b': 'audio/mp4', '.mp4': 'audio/mp4', '.aac': 'audio/aac', '.alac': 'audio/mp4', '.wav': 'audio/wav', '.wave': 'audio/wav', '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/ogg', '.aiff': 'audio/aiff', '.aif': 'audio/aiff', '.au': 'audio/basic', '.snd': 'audio/basic', '.wma': 'audio/x-ms-wma', '.ac3': 'audio/ac3', '.dts': 'audio/vnd.dts', '.webm': 'audio/webm', '.mka': 'audio/x-matroska', '.mkv': 'audio/x-matroska', '.ts': 'video/mp2t' };
  const headers = { 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*', 'Content-Type': types[extname(filePath).toLowerCase()] || 'application/octet-stream', 'Content-Length': String(size) };
  let start = 0, end = size - 1, status = 200;
  const range = request.headers.get('Range');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const invalid = () => new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes', 'Access-Control-Allow-Origin': '*' } });
    if (!match || (!match[1] && !match[2]) || !size) return invalid();
    if (!match[1]) {
      const suffix = Number(match[2]);
      if (!Number.isSafeInteger(suffix) || suffix <= 0) return invalid();
      start = Math.max(0, size - suffix);
    } else {
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : size - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end) return invalid();
      end = Math.min(end, size - 1);
    }
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    headers['Content-Length'] = String(end - start + 1);
    status = 206;
  }
  if (request.method === 'HEAD' || !size) return new Response(null, { status, headers });
  const stream = createReadStream(filePath, { start, end });
  const abort = () => stream.destroy();
  request.signal.addEventListener('abort', abort, { once: true });
  stream.on('close', () => request.signal.removeEventListener('abort', abort));
  if (request.signal.aborted) abort();
  return new Response(Readable.toWeb(stream), { status, headers });
}
module.exports = { mediaResponse };
