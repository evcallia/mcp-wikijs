// Ad-hoc unit tests for section-aware update helpers. Run with: npx tsx src/wikijs-client.test.ts
// Stubs network — no Wiki.js required.

import { WikiJsClient, WikiPage } from './wikijs-client.js';

type Any = any;

const failures: string[] = [];
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures.push(`${name}${detail ? ' — ' + detail : ''}`);
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`);
  }
}

const SAMPLE = [
  '# Top',
  '',
  'intro',
  '',
  '## Foo',
  '',
  'foo body',
  '',
  '## Foo bar',
  '',
  'foo bar body',
  '',
  '## Adding a new service to the backup pipeline',
  '',
  'backup body',
  '',
].join('\n');

function makeClient(): WikiJsClient {
  return new WikiJsClient({ baseUrl: 'http://localhost' });
}

console.log('parseMarkdownSections');
{
  const c = makeClient() as Any;
  const sections = c.parseMarkdownSections(SAMPLE);
  const titles = sections.map((s: Any) => s.title);
  check('finds all headings', JSON.stringify(titles) === JSON.stringify([
    'Top', 'Foo', 'Foo bar', 'Adding a new service to the backup pipeline',
  ]), `got ${JSON.stringify(titles)}`);
}

console.log('findSectionByTitle');
{
  const c = makeClient() as Any;
  const sections = c.parseMarkdownSections(SAMPLE);

  const exact = c.findSectionByTitle(sections, 'Foo');
  check('exact "Foo" returns the Foo section, not Foo bar', exact?.title === 'Foo', `got ${exact?.title}`);

  const exactLong = c.findSectionByTitle(sections, 'Adding a new service to the backup pipeline');
  check('exact long title matches', exactLong?.title === 'Adding a new service to the backup pipeline', `got ${exactLong?.title}`);

  const missing = c.findSectionByTitle(sections, 'Nonexistent heading xyz');
  check('unmatched returns null', missing === null, `got ${missing && missing.title}`);

  // Note: prior fuzzy bi-directional substring caused "Foo" to match "Foo bar" too — strict match should
  // pick the exact one.
  const tricky = c.findSectionByTitle(sections, 'Foo bar');
  check('exact "Foo bar" matches Foo bar', tricky?.title === 'Foo bar', `got ${tricky?.title}`);
}

console.log('applySectionUpdate — insert_before without targetLine');
{
  const c = makeClient() as Any;
  const sections = c.parseMarkdownSections(SAMPLE);
  const target = c.findSectionByTitle(sections, 'Adding a new service to the backup pipeline');
  const updated = c.applySectionUpdate(SAMPLE, target, '## Host migration\n\nhost body\n', 'insert_before');
  check('insert_before inserts at section.startLine when targetLine missing', updated.includes('## Host migration') && updated.indexOf('## Host migration') < updated.indexOf('## Adding a new service'), `content:\n${updated}`);
}

console.log('applySectionUpdate — insert_after without targetLine');
{
  const c = makeClient() as Any;
  const sections = c.parseMarkdownSections(SAMPLE);
  const target = c.findSectionByTitle(sections, 'Foo');
  const updated = c.applySectionUpdate(SAMPLE, target, '## Inserted After Foo\n\nx\n', 'insert_after');
  const fooIdx = updated.indexOf('## Foo\n');
  const insertedIdx = updated.indexOf('## Inserted After Foo');
  const fooBarIdx = updated.indexOf('## Foo bar');
  check('insert_after places content between Foo body and Foo bar', fooIdx >= 0 && insertedIdx > fooIdx && insertedIdx < fooBarIdx, `content:\n${updated}`);
}

console.log('updatePageIntelligent — preserves tags when no globalUpdates');
{
  const c = makeClient() as Any;
  const fakePage: WikiPage = {
    id: 29,
    path: 'self-hosted/backups',
    title: 'Backups',
    description: 'd',
    content: SAMPLE,
    createdAt: '',
    updatedAt: '',
    isPublished: true,
    isPrivate: false,
    locale: 'en',
    tags: ['existing-tag-1', 'existing-tag-2'],
  };
  c.getPage = async () => fakePage;
  let sentPayload: Any = null;
  c.updatePage = async (data: Any) => {
    sentPayload = data;
    return { responseResult: { succeeded: true, errorCode: 0, message: 'ok' } };
  };

  await c.updatePageIntelligent({
    id: 29,
    sectionUpdates: [
      { sectionTitle: 'Foo', operation: 'append', newContent: 'extra\n' },
    ],
  });

  check('tags forwarded from current page', Array.isArray(sentPayload?.tags) && sentPayload.tags.length === 2, `payload tags: ${JSON.stringify(sentPayload?.tags)}`);
  check('title forwarded from current page', sentPayload?.title === 'Backups', `payload title: ${sentPayload?.title}`);
  check('isPublished forwarded from current page', sentPayload?.isPublished === true, `payload isPublished: ${sentPayload?.isPublished}`);
}

console.log('updatePageIntelligent — reports failure when section not found');
{
  const c = makeClient() as Any;
  c.getPage = async () => ({
    id: 1, path: 'p', title: 't', content: SAMPLE, createdAt: '', updatedAt: '',
    isPublished: true, isPrivate: false, locale: 'en', tags: [],
  });
  let sentPayload: Any = null;
  c.updatePage = async (data: Any) => { sentPayload = data; return { responseResult: { succeeded: true, errorCode: 0, message: 'ok' } }; };

  const result = await c.updatePageIntelligent({
    id: 1,
    sectionUpdates: [
      { sectionTitle: 'Nonexistent heading xyz', operation: 'replace', newContent: 'x' },
    ],
  });

  check('result.succeeded is false when section missing', result?.responseResult?.succeeded === false, `got succeeded: ${result?.responseResult?.succeeded}`);
  check('updatePage NOT called when no sections matched', sentPayload === null, 'updatePage was called despite missing sections');
}

console.log('updatePageIntelligent — insert_before via sectionTitle (Mode C repro)');
{
  const c = makeClient() as Any;
  c.getPage = async () => ({
    id: 29, path: 'p', title: 't', content: SAMPLE, createdAt: '', updatedAt: '',
    isPublished: true, isPrivate: false, locale: 'en', tags: ['t1'],
  });
  let sentContent: Any = null;
  c.updatePage = async (data: Any) => { sentContent = data.content; return { responseResult: { succeeded: true, errorCode: 0, message: 'ok' } }; };

  await c.updatePageIntelligent({
    id: 29,
    globalUpdates: { isPublished: true, tags: ['t1'] },
    sectionUpdates: [
      { sectionTitle: 'Adding a new service to the backup pipeline', operation: 'insert_before', newContent: '## Host migration\n\nhost\n' },
    ],
  });

  check('insert_before applied via sectionTitle without targetLine', sentContent !== null && sentContent.includes('## Host migration'), `sent content (first 200 chars): ${sentContent?.slice(0, 200)}`);
}

console.log('');
if (failures.length === 0) {
  console.log('All checks passed.');
  process.exit(0);
} else {
  console.log(`${failures.length} failure(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
