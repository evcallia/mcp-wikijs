// Ad-hoc unit tests for section-aware update helpers. Run with: npx tsx src/wikijs-client.test.ts
// Stubs network — no Wiki.js required.

import { WikiJsClient, WikiPage, parseAdditionalHeaders } from './wikijs-client.js';

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

console.log('parseAdditionalHeaders');
{
  const empty = parseAdditionalHeaders(undefined);
  check('undefined -> empty object', Object.keys(empty).length === 0);

  const csv = parseAdditionalHeaders('CF-Access-Client-Id: abc.access, CF-Access-Client-Secret: def, Authorization: Basic Zm9vOmJhcg==');
  check('csv parses 3 headers', Object.keys(csv).length === 3, JSON.stringify(csv));
  check('csv keeps client id', csv['CF-Access-Client-Id'] === 'abc.access', csv['CF-Access-Client-Id']);
  check('csv keeps basic auth value with = intact', csv['Authorization'] === 'Basic Zm9vOmJhcg==', csv['Authorization']);

  const json = parseAdditionalHeaders('{"CF-Access-Client-Id":"abc","Authorization":"Basic xyz"}');
  check('json parses 2 headers', Object.keys(json).length === 2, JSON.stringify(json));
  check('json keeps authorization', json['Authorization'] === 'Basic xyz', json['Authorization']);

  const multiline = parseAdditionalHeaders('CF-Access-Client-Id: abc\nAuthorization: Basic xyz');
  check('newline-separated parses 2 headers', Object.keys(multiline).length === 2, JSON.stringify(multiline));
}

console.log('auth header routing');
{
  const prev = process.env.ADDITIONAL_HEADERS;

  const prevHeader = process.env.WIKIJS_TOKEN_HEADER;
  delete process.env.WIKIJS_TOKEN_HEADER;

  // No Authorization in additional headers -> token goes to Authorization: Bearer.
  delete process.env.ADDITIONAL_HEADERS;
  const bearerClient = new WikiJsClient({ baseUrl: 'http://localhost', apiToken: 'tok123' }) as Any;
  const bearerCommon = bearerClient.client.defaults.headers.common;
  check('default: token sent as Authorization Bearer', bearerCommon['Authorization'] === 'Bearer tok123', bearerCommon['Authorization']);
  check('default: no X-Api-Key set', bearerCommon['X-Api-Key'] === undefined, bearerCommon['X-Api-Key']);

  // Authorization claimed by additional headers -> token moves to X-Api-Key (default) with Bearer scheme.
  process.env.ADDITIONAL_HEADERS = 'Authorization: Basic Zm9vOmJhcg==';
  const tokenClient = new WikiJsClient({ baseUrl: 'http://localhost', apiToken: 'tok123' }) as Any;
  const tokenCommon = tokenClient.client.defaults.headers.common;
  const tokenBase = tokenClient.client.defaults.headers;
  check('bypass: token sent as X-Api-Key with Bearer scheme', tokenCommon['X-Api-Key'] === 'Bearer tok123', tokenCommon['X-Api-Key']);
  check('bypass: Authorization NOT overwritten with Bearer', tokenCommon['Authorization'] === undefined, tokenCommon['Authorization']);
  check('bypass: Authorization basic auth preserved on instance', tokenBase['Authorization'] === 'Basic Zm9vOmJhcg==', tokenBase['Authorization']);

  // WIKIJS_TOKEN_HEADER overrides the side-header name.
  process.env.WIKIJS_TOKEN_HEADER = 'X-Custom-Token';
  const customClient = new WikiJsClient({ baseUrl: 'http://localhost', apiToken: 'tok123' }) as Any;
  const customCommon = customClient.client.defaults.headers.common;
  check('bypass: custom header name honored', customCommon['X-Custom-Token'] === 'Bearer tok123', customCommon['X-Custom-Token']);
  check('bypass: default X-Api-Key not set when overridden', customCommon['X-Api-Key'] === undefined, customCommon['X-Api-Key']);

  if (prev === undefined) delete process.env.ADDITIONAL_HEADERS;
  else process.env.ADDITIONAL_HEADERS = prev;
  if (prevHeader === undefined) delete process.env.WIKIJS_TOKEN_HEADER;
  else process.env.WIKIJS_TOKEN_HEADER = prevHeader;
}

console.log('listPages — limit and offset');
{
  const c = makeClient() as Any;
  const all = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, path: `p${i + 1}` }));
  let calls = 0;
  // Wiki.js ignores/miscounts `limit`, so the stub always returns everything.
  c.executeGraphQL = async () => { calls++; return { pages: { list: all } }; };

  const page2 = await c.listPages(3, 3);
  check('paginates locally, not via a server limit', calls === 1, `graphql calls: ${calls}`);
  check('returns exactly `limit` rows', page2.length === 3, `got ${page2.length}`);
  check('skips `offset` rows', page2[0]?.id === 4 && page2[2]?.id === 6, `first=${page2[0]?.id} last=${page2[2]?.id}`);

  const capped = await c.listPages(2, 0);
  check('limit alone truncates', capped.length === 2 && capped[0]?.id === 1, `got ${capped.length}, first=${capped[0]?.id}`);
}

console.log('executeGraphQL — surfaces upstream failures');
{
  async function errFor(responseData: Any, headers: Any = {}): Promise<string> {
    const c = makeClient() as Any;
    c.client = { post: async () => ({ data: responseData, headers }) };
    try { await c.executeGraphQL('{ pages { list { id } } }'); return '<no throw>'; }
    catch (e: Any) { return String(e?.message ?? e); }
  }

  const html = await errFor('<!DOCTYPE html><html><head><title>Authelia</title></head><body>Sign in</body></html>',
                            { 'content-type': 'text/html; charset=utf-8' });
  check('HTML body does not throw a TypeError', !/Cannot read propert/.test(html), html.slice(0, 90));
  check('HTML body names a non-GraphQL response', /non-GraphQL/i.test(html), html.slice(0, 120));
  check('HTML body includes a body snippet', /Authelia|Sign in|DOCTYPE/i.test(html), html.slice(0, 120));

  const gql = await errFor({ errors: [{ message: 'Forbidden' }], data: null });
  check('GraphQL errors are surfaced verbatim', /Forbidden/.test(gql), gql.slice(0, 120));

  const empty = await errFor({});
  check('envelope with neither data nor errors is explained',
        !/Cannot read propert/.test(empty) && /no data/i.test(empty), empty.slice(0, 120));

  const ok = makeClient() as Any;
  ok.client = { post: async () => ({ data: { data: { pages: { list: [{ id: 1 }] } } }, headers: {} }) };
  const good = await ok.executeGraphQL('{ pages { list { id } } }');
  check('valid response still returns data', good?.pages?.list?.[0]?.id === 1, JSON.stringify(good));
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
