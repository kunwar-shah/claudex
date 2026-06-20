// Standalone test for incremental indexing + archive-on-shrink preservation.
// Run: node server/test/incremental.test.mjs
//
// Uses a temp projects root and a temp SQLite DB so it never touches real data.
// No test framework dependency — plain assertions, non-zero exit on failure.
//
// NOTE: session_title is indexed on every row of a session and is derived from
// the FIRST message, so a token appearing in the first message matches every
// row in that session. Search tokens below are kept disjoint from the first
// ("header") line so per-message counts are unambiguous.

import fs from 'fs'
import os from 'os'
import path from 'path'
import { SearchIndexer } from '../src/services/searchIndexer.js'
import { SearchDatabase } from '../src/services/searchDatabase.js'

let passed = 0
function check(label, cond) {
  if (!cond) throw new Error(`FAIL: ${label}`)
  passed++
  console.log(`  ✓ ${label}`)
}

// All lines are user messages with string content (cleanly extracted). The
// sessionId+uuid+type+timestamp shape makes TemplateDetector recognize a real
// Claude Code format instead of falling back to the generic parser.
function line(uuid, text, ts = '2026-01-01T00:00:00.000Z') {
  return JSON.stringify({
    type: 'user',
    uuid,
    sessionId: 's1',
    timestamp: ts,
    message: { role: 'user', content: text }
  }) + '\n'
}

async function total(idx, query) {
  return (await idx.search({ query, limit: 50, offset: 0 })).total
}
async function hits(idx, query) {
  return (await idx.search({ query, limit: 50, offset: 0 })).hits
}

async function main() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'claudex-inc-'))
  const projectsRoot = path.join(tmpRoot, 'projects')
  const projectDir = path.join(projectsRoot, '-test-proj')
  fs.mkdirSync(projectDir, { recursive: true })
  const sessionFile = path.join(projectDir, 's1.jsonl')
  const dbPath = path.join(tmpRoot, 'search.db')

  const idx = new SearchIndexer(projectsRoot)
  idx.searchDb = new SearchDatabase(dbPath)
  await idx.init()

  try {
    // --- 1. New session: full index ---
    fs.writeFileSync(sessionFile,
      line('u1', 'header opening line') +     // first line -> becomes the title
      line('u2', 'second message alpha') +
      line('u3', 'third message charlie'))

    let r = await idx.buildIncrementalIndex()
    check('new session indexed as new', r.stats.newSessions === 1)
    check('3 messages added', r.stats.messagesAdded === 3)
    check('search alpha -> 1', (await total(idx, 'alpha')) === 1)
    check('search charlie -> 1', (await total(idx, 'charlie')) === 1)

    // --- 2. No-op: unchanged file is skipped ---
    r = await idx.buildIncrementalIndex()
    check('unchanged session skipped', r.stats.skipped === 1)
    check('no messages added on no-op', r.stats.messagesAdded === 0)
    check('no duplicate for alpha after no-op', (await total(idx, 'alpha')) === 1)

    // --- 3. Append: only new lines indexed, no dupes ---
    fs.appendFileSync(sessionFile,
      line('u4', 'fourth message delta') +
      line('u5', 'fifth message echo'))

    r = await idx.buildIncrementalIndex()
    check('append indexed 2 new lines', r.stats.appended === 2)
    check('append added 2 messages', r.stats.messagesAdded === 2)
    check('search delta -> 1', (await total(idx, 'delta')) === 1)
    check('alpha still 1 (no re-index dupes)', (await total(idx, 'alpha')) === 1)

    // --- 4. Archive-on-shrink: rewrite file smaller, preserve old content ---
    fs.writeFileSync(sessionFile, line('u9', 'rewritten foxtrot'))

    r = await idx.buildIncrementalIndex()
    check('shrink/rewrite triggers archive', r.stats.archived === 1)
    check('live content foxtrot searchable', (await total(idx, 'foxtrot')) === 1)
    const alphaHits = await hits(idx, 'alpha')
    check('archived alpha preserved', alphaHits.length === 1)
    check('archived alpha re-keyed to #archived session', alphaHits[0].sessionId.includes('#archived'))
    check('delta preserved after compaction', (await total(idx, 'delta')) === 1)

    // --- 5. Orphan: delete file, content preserved via archive ---
    fs.rmSync(sessionFile)
    r = await idx.buildIncrementalIndex()
    check('deleted file counted as orphan', r.stats.orphaned === 1)
    check('orphaned content still searchable (foxtrot)', (await total(idx, 'foxtrot')) >= 1)
    check('watermark removed for deleted session',
      (await idx.searchDb.getIndexedFile('-test-proj', 's1')) === undefined)

    // --- 6. Full rebuild then incremental no-op (no double index) ---
    fs.writeFileSync(sessionFile,
      line('u1', 'header again') +
      line('u2', 'body golf'))
    await idx.buildFullIndex()
    check('full build indexes golf', (await total(idx, 'golf')) === 1)
    r = await idx.buildIncrementalIndex()
    check('incremental after full is a no-op', r.stats.skipped === 1 && r.stats.appended === 0)
    check('golf not duplicated after incremental', (await total(idx, 'golf')) === 1)

    console.log(`\n✅ All ${passed} checks passed`)
  } finally {
    await idx.close()
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  }
}

main().catch(err => {
  console.error('\n❌', err.message)
  console.error(err.stack)
  process.exit(1)
})
