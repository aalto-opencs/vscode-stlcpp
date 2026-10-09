const assert = require('node:assert/strict');
const test = require('node:test');
const { getUrl } = require('typed-rest-client/Util');

test('the publishing client preserves query values without injecting parameters', () => {
  const result = new URL(getUrl('/extensions', 'https://example.test/', {
    params: { publisher: 'Aalto & team=other', tags: ['C++', 'λ'], filter: { name: 'STLC++' } },
  }));
  assert.equal(result.searchParams.get('publisher'), 'Aalto & team=other');
  assert.equal(result.searchParams.has('team'), false);
  assert.deepEqual(result.searchParams.getAll('tags'), ['C++', 'λ']);
  assert.equal(result.searchParams.get('filter[name]'), 'STLC++');
});

test('the publishing client rejects cyclic query data instead of recursing forever', () => {
  const params = { name: 'stlcpp' };
  params.self = params;
  assert.throws(() => getUrl('https://example.test/extensions', undefined, { params }), /[Cc]yclic/);
});
