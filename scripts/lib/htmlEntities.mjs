const NAMED_HTML_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeHtmlEntitiesOnce(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const codePoint =
        entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    return NAMED_HTML_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

// FantasyPros' player names come out of a CMS that HTML-encodes them (e.g.
// "Ja&#39;Marr Chase" instead of "Ja'Marr Chase"). Decode in a small loop
// (bounded) so this also recovers from an entity being encoded more than
// once, without looping forever on input that never stabilizes.
export function decodeHtmlEntities(value) {
  if (typeof value !== 'string' || !value.includes('&')) return value;
  let result = value;
  for (let i = 0; i < 3; i += 1) {
    const decoded = decodeHtmlEntitiesOnce(result);
    if (decoded === result) break;
    result = decoded;
  }
  return result;
}
