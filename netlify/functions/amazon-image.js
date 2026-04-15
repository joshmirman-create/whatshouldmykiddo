// Netlify function: /api/amazon-image
// Uses Amazon Creators API (OAuth2) to fetch product images
// Credentials: AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET, AMAZON_PARTNER_TAG

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

    // Step 1: Get OAuth2 access token
    const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'paapi',
      }).toString(),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Failed to get access token', detail: tokenData }) }
    }

    const accessToken = tokenData.access_token

    // Step 2: Call PA API SearchItems
    const payload = JSON.stringify({
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
    })

    const searchRes = await fetch('https://webservices.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      },
      body: payload,
    })

    const data = await searchRes.json()

    if (!searchRes.ok || !data.SearchResult?.Items?.length) {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'No results', detail: data }) }
    }

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

  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) }
  }
}
