// Netlify function: /api/amazon-image
// Amazon Creators API v3 — LwA OAuth2, JSON body, lowerCamelCase payload

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

    // Step 1: Get LwA access token — v3 uses JSON body with credentials in payload
    const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      // Try form-encoded as fallback (v2 style)
      const tokenRes2 = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      })
      const tokenData2 = await tokenRes2.json()
      if (!tokenData2.access_token) {
        return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Auth failed', detail: tokenData2 }) }
      }
      tokenData.access_token = tokenData2.access_token
    }

    const accessToken = tokenData.access_token

    // Step 2: Call Creators API SearchItems
    // v3 uses lowerCamelCase keys and different endpoint
    const payload = {
      keywords: keywords,
      partnerTag: partnerTag,
      partnerType: 'Associates',
      marketplace: 'www.amazon.com',
      resources: [
        'Images.Primary.Large',
        'Images.Primary.Medium',
        'ItemInfo.Title',
        'Offers.Listings.Price',
      ],
      itemCount: 1,
    }

    // Try Creators API endpoint first
    const searchRes = await fetch('https://affiliate-program.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await searchRes.json()

    // If Creators API endpoint fails, try legacy webservices endpoint
    if (!searchRes.ok || !data.SearchResult?.Items?.length) {
      const searchRes2 = await fetch('https://webservices.amazon.com/paapi5/searchitems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          // Also try PascalCase for legacy endpoint
          Keywords: keywords,
          PartnerTag: partnerTag,
          PartnerType: 'Associates',
          Marketplace: 'www.amazon.com',
          Resources: [
            'Images.Primary.Large',
            'Images.Primary.Medium',
            'ItemInfo.Title',
            'Offers.Listings.Price',
          ],
          ItemCount: 1,
        }),
      })
      const data2 = await searchRes2.json()
      if (!searchRes2.ok || !data2.SearchResult?.Items?.length) {
        return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'No results', detail1: data, detail2: data2 }) }
      }
      return buildResponse(data2, partnerTag, cors)
    }

    return buildResponse(data, partnerTag, cors)

  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) }
  }
}

function buildResponse(data, partnerTag, cors) {
  const item = data.SearchResult.Items[0]
  const imageUrl = item.Images?.Primary?.Large?.URL || item.Images?.Primary?.Medium?.URL || null
  const title = item.ItemInfo?.Title?.DisplayValue || null
  const price = item.Offers?.Listings?.[0]?.Price?.DisplayAmount || null
  const asin = item.ASIN || null
  const productUrl = asin ? `https://www.amazon.com/dp/${asin}?tag=${partnerTag}` : null

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({ image_url: imageUrl, title, price, asin, product_url: productUrl }),
  }
}
