const readRequestBody = (request) => new Promise((resolve, reject) => {
  const chunks = [];
  request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  request.on('error', reject);
});

export const createAiDevMiddleware = (handler) => async (request, response, next) => {
  if (request.url?.split('?')[0] !== '/api/ai') {
    next();
    return;
  }

  try {
    const body = await readRequestBody(request);
    const apiResponse = {
      status(code) {
        response.statusCode = code;
        return this;
      },
      setHeader(name, value) {
        response.setHeader(name, value);
        return this;
      },
      json(payload) {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(payload));
        return this;
      },
    };

    await handler({
      method: request.method,
      headers: request.headers,
      body,
    }, apiResponse);
  } catch {
    response.statusCode = 500;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ error: 'Local AI server failed' }));
  }
};

export default createAiDevMiddleware;
