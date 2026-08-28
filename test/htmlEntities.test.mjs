import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeHtmlEntities } from '../scripts/lib/htmlEntities.mjs';

test('decodeHtmlEntities: non-string input passes through unchanged', () => {
  assert.equal(decodeHtmlEntities(null), null);
  assert.equal(decodeHtmlEntities(undefined), undefined);
  assert.equal(decodeHtmlEntities(42), 42);
});

test('decodeHtmlEntities: a string without "&" is returned unchanged', () => {
  assert.equal(decodeHtmlEntities('Josh Allen'), 'Josh Allen');
});

test('decodeHtmlEntities: named entity', () => {
  assert.equal(decodeHtmlEntities('Marcus &amp; Marcus'), 'Marcus & Marcus');
});

test('decodeHtmlEntities: numeric decimal reference (the real Ja\'Marr Chase bug)', () => {
  assert.equal(decodeHtmlEntities('Ja&#39;Marr Chase'), "Ja'Marr Chase");
});

test('decodeHtmlEntities: numeric hex reference', () => {
  assert.equal(decodeHtmlEntities('Ja&#x27;Marr Chase'), "Ja'Marr Chase");
});

test('decodeHtmlEntities: double-encoded entity recovers within the 3-pass loop', () => {
  assert.equal(decodeHtmlEntities('Ja&amp;#39;Marr Chase'), "Ja'Marr Chase");
});

test('decodeHtmlEntities: an unknown entity is left as-is instead of corrupting the string', () => {
  assert.equal(decodeHtmlEntities('Foo &notreal; Bar'), 'Foo &notreal; Bar');
});

test('decodeHtmlEntities: stable input (nothing left to decode) terminates without changing further', () => {
  assert.equal(decodeHtmlEntities('Plain text &amp; more'), 'Plain text & more');
});
