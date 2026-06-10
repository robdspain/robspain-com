/**
 * Video Funnel Data Pipeline
 * Reads all 10 video script markdown files and returns structured data
 * for the free-training page to inject into window.videoFunnelData.
 */
const fs = require('fs');
const path = require('path');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const data = {};
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["'](.*)["']$/, '$1');
    if (key) data[key] = value;
  });

  return { data, body: match[2].trim() };
}

function markdownToHtml(md) {
  return md
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^([^<].+)$/gm, (line) => {
      if (line.startsWith('<')) return line;
      return line;
    })
    .split('\n\n')
    .map(block => block.startsWith('<h') || block.startsWith('<p') ? block : `<p>${block}</p>`)
    .join('\n');
}

module.exports = function () {
  const scriptsDir = path.join(__dirname, '..', 'video-funnel-scripts');

  let files;
  try {
    files = fs.readdirSync(scriptsDir)
      .filter(f => f.endsWith('.md'))
      .sort();
  } catch (e) {
    console.warn('videoFunnel: could not read scripts dir', e.message);
    return [];
  }

  return files.map((file, idx) => {
    const raw = fs.readFileSync(path.join(scriptsDir, file), 'utf-8');
    const { data, body } = parseFrontmatter(raw);

    return {
      id: parseInt(data.step, 10) || idx + 1,
      title: data.title || `Video ${idx + 1}`,
      videoUrl: data.videoUrl || '',
      published: data.published !== 'false',
      content: markdownToHtml(body),
    };
  }).filter(v => v.published);
};
