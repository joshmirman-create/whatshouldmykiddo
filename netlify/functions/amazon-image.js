// Netlify function: /api/amazon-image
// Fetches product image from Amazon PA API v5 using search keywords
// Returns: { image_url, title, price, asin, product_url }

const REGION = 'us-east-1'
const HOST = 'webservices.amazon.com'
const PATH = '/paapi5/searchitems'

// AWS Signature V4 signing
const crypto = require('crypto')

function sign(key, msg) {
  return crypto.createHmac('sha256', key).update(msg, 'utf8').digest()
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = sign('AWS4' + key, dateStamp)
  const kRegion = sign(kDate, regionName)
  const kService = sign(kRegion, serviceName)
  const kSigning = sign(kService, 'aws4_request')
  return kSigning
}

function toHex(buffer) {
  return buffer.toString('hex')
}

async function searchAmazon(keywords, partnerTag, clientId, clientSecret) {
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const dateStamp = amzDate.slice(0, 8)

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

  const payloadHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex')

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`

  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target'

  const canonicalRequest = [
    'POST',
    PATH,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const credentialScope = `${dateStamp}/${REGION}/ProductAdvertisingAPI/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex'),
  ].join('\n')

  const signingKey = getSignatureKey(clientSecret, dateStamp, REGION, 'ProductAdvertisingAPI')
  const signature = toHex(crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest())

  const authHeader = `AWS4-HMAC-SHA256 Credential=${clientId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const response = await fetch(`https://${HOST}${PATH}`, {
    method: 'POST',
    headers: {
      'content-encoding': 'amz-1.0',
      'content-type': 'application/json; charset=utf-8',
      host: HOST,
      'x-amz-date': amzDate,
      'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      Authorization: authHeader,
    },
    body: payload,
  })

  const data = await response.json()

  if (!response.ok || !data.SearchResult?.Items?.length) {
    return null
  }

  const item = data.SearchResult.Items[0]
  const imageUrl =
    item.Images?.Primary?.Large?.URL ||
    item.Images?.Primary?.Medium?.URL ||
    null
  const title = item.ItemInfo?.Title?.DisplayValue || null
  const price = item.Offers?.Listings?.[0]?.Price?.DisplayAmount || null
  const asin = item.ASIN || null
  const productUrl = asin
    ? `https://www.amazon.com/dp/${asin}?tag=${partnerTag}`
    : null

  return { image_url: imageUrl, title, price, asin, product_url: productUrl }
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

    const result = await searchAmazon(keywords, partnerTag, clientId, clientSecret)

    if (!result) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No results found' }) }
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify(result),
    }
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) }
  }
}
