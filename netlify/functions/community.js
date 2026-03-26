const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };

  const KEY = process.env.JSONBIN_MASTER_KEY;

  const getBin = async () => {
    const r = await fetch(`${JSONBIN_URL}/latest`, { headers: { 'X-Master-Key': KEY } });
    const d = await r.json();
    return d.record?.posts || [];
  };

  const putBin = async (posts) => {
    await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: { 'X-Master-Key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ posts }),
    });
  };

  try {
    if (event.httpMethod === 'GET') {
      const posts = await getBin();
      return { statusCode: 200, headers: cors, body: JSON.stringify(posts) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      let posts = await getBin();

      if (body.action === 'add') {
        const newPost = {
          ...body.post,
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          votes: 0,
          ts: Date.now(),
        };
        posts = [newPost, ...posts].slice(0, 500);
        await putBin(posts);
        return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true, post: newPost }) };
      }

      if (body.action === 'upvote') {
        posts = posts.map(p => p.id === body.id ? { ...p, votes: (p.votes || 0) + 1 } : p);
        await putBin(posts);
        return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true }) };
      }
    }

    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
