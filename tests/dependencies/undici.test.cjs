const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { once } = require('node:events');
const { fetch, Headers } = require('undici');

test('the packaging HTTP client follows redirects and decodes split UTF-8 JSON', async () => {
  const body = Buffer.from(JSON.stringify({ name: 'STLC++', description: 'λ → ✓' }));
  const server = createServer((request, response) => {
    if (request.url === '/redirect') {
      response.writeHead(302, { location: '/metadata?extension=stlcpp' });
      response.end();
      return;
    }
    assert.equal(request.url, '/metadata?extension=stlcpp');
    response.writeHead(200, { 'content-type': 'application/json' });
    for (const byte of body) response.write(Buffer.from([byte]));
    response.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/redirect`);
    assert.equal(response.status, 200);
    assert.equal(response.redirected, true);
    assert.deepEqual(await response.json(), { name: 'STLC++', description: 'λ → ✓' });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('header values cannot inject a second HTTP header', () => {
  assert.throws(() => new Headers({ authorization: 'token\r\nX-Injected: true' }), TypeError);
});
