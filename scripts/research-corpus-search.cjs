#!/usr/bin/env node
/**
 * Read-only search helper for the Behavior School Convex research corpus.
 *
 * Usage:
 *   node scripts/research-corpus-search.cjs "school BCBA collaboration teacher BIP" --limit=12
 *
 * Optional env:
 *   CONVEX_RESEARCH_URL=https://your-deployment.convex.cloud
 */

const DEFAULT_CONVEX_URL = 'https://striped-elephant-46.convex.cloud';
const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'are', 'because', 'but', 'can',
  'for', 'from', 'has', 'have', 'how', 'into', 'not', 'our', 'that', 'the',
  'their', 'then', 'this', 'with', 'what', 'when', 'where', 'which', 'who',
  'why', 'you', 'your',
]);

function parseArgs(argv) {
  const positional = [];
  const flags = {};

  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, value = 'true'] = arg.slice(2).split('=');
      flags[key] = value;
    } else {
      positional.push(arg);
    }
  }

  return {
    query: positional.join(' ').trim(),
    fetchLimit: Number(flags['fetch-limit'] || 500),
    limit: Number(flags.limit || 15),
    json: flags.json === 'true',
  };
}

function termsFor(query) {
  return [...new Set(String(query || '')
    .toLowerCase()
    .match(/[a-z][a-z0-9-]{2,}/g) || [])]
    .filter((term) => !STOP_WORDS.has(term));
}

function scorePaper(paper, terms) {
  const text = [
    paper.title,
    paper.abstract,
    paper.fullText,
    ...(paper.settingTags || []),
    ...(paper.populationTags || []),
    ...(paper.taskListDomains || []),
  ].filter(Boolean).join(' ').toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (text.includes(term)) score += term.length > 7 ? 3 : 1;
  }

  if (/school|classroom|teacher|student|district/.test(text)) score += 8;
  if (/functional behavior|functional behavioral|\bfba\b|behavior intervention plan|\bbip\b/.test(text)) score += 12;
  if (/implementation|treatment integrity|procedural fidelity|fidelity|coaching|staff training/.test(text)) score += 7;
  if (/burnout|workload|job satisfaction|collaboration/.test(text)) score += 6;
  if (paper.doi || paper.doiUrl) score += 2;
  if (paper.abstract) score += 1;

  return score;
}

function summarize(paper, score) {
  return {
    score,
    id: paper._id,
    title: paper.title,
    year: paper.year,
    venue: paper.venue,
    authors: paper.authors || [],
    doi: paper.doi,
    doiUrl: paper.doiUrl,
    settingTags: paper.settingTags || [],
    populationTags: paper.populationTags || [],
    abstract: String(paper.abstract || '').replace(/\s+/g, ' ').trim().slice(0, 850),
  };
}

async function callConvex(path, args) {
  const baseUrl = (process.env.CONVEX_RESEARCH_URL || DEFAULT_CONVEX_URL).replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args, format: 'json' }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status !== 'success') {
    throw new Error(data.errorMessage || `Convex query failed with HTTP ${response.status}`);
  }
  return data.value;
}

async function main() {
  const options = parseArgs(process.argv);
  if (!options.query) {
    console.error('Usage: node scripts/research-corpus-search.cjs "search terms" --limit=12');
    process.exit(1);
  }

  const terms = termsFor(options.query);
  const papers = await callConvex('researchPapers:getRecentPapers', { limit: options.fetchLimit });
  const ranked = papers
    .map((paper) => ({ paper, score: scorePaper(paper, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit)
    .map(({ paper, score }) => summarize(paper, score));

  if (options.json) {
    console.log(JSON.stringify(ranked, null, 2));
    return;
  }

  for (const [index, paper] of ranked.entries()) {
    console.log(`\n${index + 1}. ${paper.title} (${paper.year || 'n.d.'})`);
    console.log(`   Score: ${paper.score}`);
    console.log(`   Venue: ${paper.venue || 'unknown'}`);
    console.log(`   Authors: ${paper.authors.join(', ') || 'unknown'}`);
    if (paper.doi) console.log(`   DOI: ${paper.doi}`);
    console.log(`   ID: ${paper.id}`);
    if (paper.abstract) console.log(`   Abstract: ${paper.abstract}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
