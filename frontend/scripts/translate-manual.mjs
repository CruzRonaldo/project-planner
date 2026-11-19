#!/usr/bin/env node
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const srcDir = path.resolve(projectRoot, 'docs/manual-usuario/es');
const outDir = path.resolve(projectRoot, 'docs/manual-usuario/en');
const cacheFile = path.resolve(projectRoot, 'docs/manual-usuario/.translation-cache.json');

const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || 'projectplanner.docs@gmail.com';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const memoryCache = new Map();

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/<g id="[^"]+">(.*?)<\/g>/gi, '$1')
    .replace(/<\/?g[^>]*>/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

async function callMyMemoryApi(query, maxRetries = 5) {
  if (!query || !query.trim()) return query;
  const trimmed = query.trim();

  if (memoryCache.has(trimmed)) {
    return memoryCache.get(trimmed);
  }

  // Rate limiting delay
  await delay(200);

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const emailParam = MYMEMORY_EMAIL ? `&de=${encodeURIComponent(MYMEMORY_EMAIL)}` : '';
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=es|en${emailParam}`;
      const res = await fetch(url);

      if (res.status === 429) {
        attempt++;
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.warn(`  [WARN] HTTP 429 rate limit. Reintentando en ${waitTime}ms (intento ${attempt}/${maxRetries})...`);
        await delay(waitTime);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.responseStatus === 429) {
        attempt++;
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.warn(`  [WARN] MyMemory 429 quota. Reintentando en ${waitTime}ms (intento ${attempt}/${maxRetries})...`);
        await delay(waitTime);
        continue;
      }

      const translated = data?.responseData?.translatedText;
      if (typeof translated === 'string') {
        const decoded = decodeHtmlEntities(translated);
        memoryCache.set(trimmed, decoded);
        return decoded;
      }

      return trimmed;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) {
        console.error(`  [ERROR] Error persistente al traducir segmento: "${trimmed.slice(0, 40)}...":`, err.message);
        return trimmed;
      }
      const waitTime = 1000 * attempt;
      await delay(waitTime);
    }
  }

  return trimmed;
}

function chunkText(text, maxLen = 420) {
  if (text.length <= maxLen) return [text];

  const sentences = text.match(/[^.!?]+(?:[.!?]+|$)/g) || [text];
  const chunks = [];
  let current = '';

  for (const s of sentences) {
    if ((current + s).length <= maxLen) {
      current += s;
    } else {
      if (current.trim()) chunks.push(current.trim());
      if (s.length > maxLen) {
        const words = s.split(' ');
        let subCurrent = '';
        for (const w of words) {
          if ((subCurrent + ' ' + w).length <= maxLen) {
            subCurrent = subCurrent ? `${subCurrent} ${w}` : w;
          } else {
            if (subCurrent) chunks.push(subCurrent);
            subCurrent = w;
          }
        }
        current = subCurrent;
      } else {
        current = s;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function translateChunkedText(text) {
  if (!text || !text.trim()) return text;
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(text)) return text;

  const chunks = chunkText(text, 420);
  const translated = [];
  for (const chunk of chunks) {
    const res = await callMyMemoryApi(chunk);
    translated.push(res);
  }
  return translated.join(' ');
}

async function translateSegmentWithTokens(rawText) {
  if (!rawText || !rawText.trim()) return rawText;
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(rawText)) return rawText;

  const codes = [];
  const urls = [];

  let text = rawText;

  // Protect display/inline math: $$...$$ or $...$ -> protect using [[CODE_idx]]
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => {
    const idx = codes.length;
    codes.push(`$$${m}$$`);
    return `[[CODE_${idx}]]`;
  });
  text = text.replace(/\$([^$\n]+)\$/g, (_, m) => {
    const idx = codes.length;
    codes.push(`$${m}$`);
    return `[[CODE_${idx}]]`;
  });

  // Protect inline code: `...`
  text = text.replace(/`([^`]+)`/g, (_, c) => {
    const idx = codes.length;
    codes.push(`\`${c}\``);
    return `[[CODE_${idx}]]`;
  });

  // Protect markdown images: ![alt](url) -> ![alt]([[URL_idx]])
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const idx = urls.length;
    urls.push(url);
    return `![${alt}]([[URL_${idx}]])`;
  });

  // Protect markdown links: [text](url) -> [text]([[URL_idx]])
  text = text.replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const idx = urls.length;
    urls.push(url);
    return `[${label}]([[URL_${idx}]])`;
  });

  // Translate prepared text
  let translated = await translateChunkedText(text);

  // Restore URLs
  urls.forEach((url, idx) => {
    translated = translated.replace(new RegExp(`\\[\\[\\s*URL_${idx}\\s*\\]\\]`, 'gi'), url);
  });

  // Restore Codes and Math
  codes.forEach((code, idx) => {
    translated = translated.replace(new RegExp(`\\[\\[\\s*CODE_${idx}\\s*\\]\\]`, 'gi'), code);
  });

  return translated;
}

async function translateMarkdown(content) {
  const lines = content.split('\n');
  const translatedLines = [];
  let inCodeBlock = false;
  let inMathBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code blocks
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      translatedLines.push(line);
      continue;
    }
    if (inCodeBlock) {
      translatedLines.push(line);
      continue;
    }

    // Display math lines or blocks ($$)
    if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 2) {
      translatedLines.push(line);
      continue;
    }
    if (line.trim() === '$$') {
      inMathBlock = !inMathBlock;
      translatedLines.push(line);
      continue;
    }
    if (inMathBlock) {
      translatedLines.push(line);
      continue;
    }

    // Empty or whitespace lines
    if (!line.trim()) {
      translatedLines.push(line);
      continue;
    }

    // Horizontal rules (---, ***, ___)
    if (/^\s*[-*_]{3,}\s*$/.test(line)) {
      translatedLines.push(line);
      continue;
    }

    // Extract prefixes: Blockquote (> ), Heading (# ), List (- , 1. , etc.)
    let prefix = '';
    let contentPart = line;

    const bqMatch = contentPart.match(/^(\s*(?:>\s*)+)/);
    if (bqMatch) {
      prefix += bqMatch[1];
      contentPart = contentPart.slice(bqMatch[1].length);
    }

    const headingMatch = contentPart.match(/^(#{1,6}\s+)/);
    if (headingMatch) {
      prefix += headingMatch[1];
      contentPart = contentPart.slice(headingMatch[1].length);
    } else {
      const listMatch = contentPart.match(/^(\s*(?:[-*+]|\d+\.)\s+)/);
      if (listMatch) {
        prefix += listMatch[1];
        contentPart = contentPart.slice(listMatch[1].length);
      }
    }

    if (!contentPart.trim() || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(contentPart)) {
      translatedLines.push(line);
      continue;
    }

    // Table rows
    if (contentPart.trim().startsWith('|') && contentPart.trim().endsWith('|')) {
      const cells = contentPart.split('|');
      const innerCells = cells.slice(1, -1);
      const isSeparator = innerCells.every((c) => /^[\s:-]+$/.test(c));
      if (isSeparator) {
        translatedLines.push(prefix + contentPart);
        continue;
      }

      // Try translating the full row
      const transRow = await translateSegmentWithTokens(contentPart);
      if (transRow && transRow.split('|').length === cells.length) {
        translatedLines.push(prefix + transRow);
        continue;
      }

      // Fallback: cell-by-cell
      const translatedCells = [];
      for (const cell of innerCells) {
        const trimmed = cell.trim();
        if (!trimmed || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmed)) {
          translatedCells.push(cell);
        } else {
          const trans = await translateSegmentWithTokens(trimmed);
          translatedCells.push(` ${trans} `);
        }
      }
      translatedLines.push(prefix + `|${translatedCells.join('|')}|`);
      continue;
    }

    // Normal or prefixed content
    const translatedText = await translateSegmentWithTokens(contentPart);
    translatedLines.push(prefix + translatedText);
  }

  return translatedLines.join('\n');
}

async function main() {
  console.log('=== Docs-as-Code Multilingual Manual Translation (MyMemory) ===');
  console.log(`Source directory: ${srcDir}`);
  console.log(`Output directory: ${outDir}`);

  await fs.mkdir(outDir, { recursive: true });

  let cache = {};
  if (fsSync.existsSync(cacheFile)) {
    try {
      cache = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
    } catch {
      cache = {};
    }
  }

  if (!fsSync.existsSync(srcDir)) {
    console.error(`[ERROR] Directory "${srcDir}" not found.`);
    process.exit(1);
  }

  const entries = await fs.readdir(srcDir);
  const mdFiles = entries.filter((f) => f.endsWith('.md')).sort();

  console.log(`Found ${mdFiles.length} markdown file(s) in ${srcDir}\n`);

  let translatedCount = 0;
  let skippedCount = 0;

  for (const filename of mdFiles) {
    const srcPath = path.join(srcDir, filename);
    const outPath = path.join(outDir, filename);

    const spanishContent = await fs.readFile(srcPath, 'utf8');
    const hash = crypto.createHash('sha256').update(spanishContent).digest('hex');

    const outExists = fsSync.existsSync(outPath);
    if (cache[filename]?.hash === hash && outExists) {
      console.log(`[SKIP] ${filename} (unchanged, cached)`);
      skippedCount++;
      continue;
    }

    console.log(`[TRANSLATING] ${filename}...`);
    const startTime = Date.now();
    const translatedMarkdown = await translateMarkdown(spanishContent);
    await fs.writeFile(outPath, translatedMarkdown, 'utf8');

    cache[filename] = {
      hash,
      translatedAt: new Date().toISOString(),
    };

    // Save cache after each file to maintain progress
    await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[DONE] ${filename} -> written in ${elapsedSec}s`);
    translatedCount++;
  }

  console.log('\n=== Summary ===');
  console.log(`Translated: ${translatedCount}`);
  console.log(`Skipped:    ${skippedCount}`);
  console.log(`Total:      ${mdFiles.length}`);
  console.log('All files synchronized successfully.');
}

main().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
