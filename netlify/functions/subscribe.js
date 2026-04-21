// Netlify function: /api/subscribe
// Adds email to Brevo list #3 — Weekly Activity Ideas

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    if (!event.body) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'No body received' }) }
    }
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body
    const { email, firstName } = JSON.parse(rawBody)
    if (!email || !email.includes('@')) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Valid email required' }) }
    }

    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Email service not configured' }) }
    }

    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        attributes: firstName ? { FIRSTNAME: firstName.trim() } : {},
        listIds: [3],
        updateEnabled: true,
      }),
    })

    const data = await res.json()

    // 204 = created, 400 with "Contact already exist" = already subscribed (treat as success)
    if (res.status === 201 || res.status === 204 || (res.status === 400 && data.message?.includes('already exist'))) {
      return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true }) }
    }

    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: data.message || 'Could not subscribe' }) }

  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) }
  }
}
