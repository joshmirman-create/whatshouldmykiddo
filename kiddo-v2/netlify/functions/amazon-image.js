// Netlify function: /api/amazon-image
// Direct implementation using official Amazon Creators API v3 auth
// Scope: creatorsapi::default, LWA JSON body, version 3.1

const https = require('https')

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body)
    const req = https.request({ hostname, path, method: 'POST', headers }, (res) => {
      let raw = ''
      res.on('data', chunk => raw += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
        catch(e) { resolve({ status: res.statusCode, body: raw }) }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { keywords } = JSON.parse(event.body)
    if (!keywords) return { statusCode: 400, body: JSON.stringify({ error: 'keywords required' }) }

    const clientId = process.env.AMAZON_CLIENT_ID
    const clientSecret = process.env.AMAZON_CLIENT_SECRET
    const partnerTag = process.env.AMAZON_PARTNER_TAG || 'zenmonkeystud-20'

    if (!clientId || !clientSecret) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Amazon credentials not configured' }) }
    }

    // Step 1: Get LWA token — v3.1 uses JSON body with scope creatorsapi::default
    const tokenRes = await httpsPost(
      'api.amazon.com',
      '/auth/o2/token',
      { 'Content-Type': 'application/json' },
      {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'creatorsapi::default'
      }
    )

    if (!tokenRes.body.access_token) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Token failed', detail: tokenRes.body }) }
    }

    const token = tokenRes.body.access_token

    // Step 2: Call Creators API SearchItems
    const payload = {
      partnerTag: partnerTag,
      partnerType: 'Associates',
      keywords: keywords,
      searchIndex: 'All',
      itemCount: 1,
      resources: [
        'images.primary.large',
        'images.primary.medium',
        'itemInfo.title',
        'offersV2.listings.price',
      ]
    }

    const searchRes = await httpsPost(
      'creatorsapi.amazon',
      '/paapi5/searchitems',
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      payload
    )

    if (searchRes.status !== 200 || !searchRes.body.searchResult?.items?.length) {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'No results', detail: searchRes.body }) }
    }

    const item = searchRes.body.searchResult.items[0]
    const imageUrl = item.images?.primary?.large?.url || item.images?.primary?.medium?.url || null
    const title = item.itemInfo?.title?.displayValue || null
    const price = item.offersV2?.listings?.[0]?.price?.displayAmount || null
    const asin = item.asin || null
    const productUrl = asin ? `https://www.amazon.com/dp/${asin}?tag=${partnerTag}` : null

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ image_url: imageUrl, title, price, asin, product_url: productUrl }),
    }

  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) }
  }
}
