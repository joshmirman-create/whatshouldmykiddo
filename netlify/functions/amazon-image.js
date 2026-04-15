// Netlify function: /api/amazon-image
// Uses amazon-creators-api npm package (official SDK wrapper)

const { ApiClient, SearchItemsRequestContent, SearchItemsResource, DefaultApi } = require('amazon-creators-api')

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

    const apiClient = new ApiClient()
    apiClient.credentialId = clientId
    apiClient.credentialSecret = clientSecret
    apiClient.version = '3.1'

    const api = new DefaultApi(apiClient)
    const marketplace = 'www.amazon.com'

    const searchRequest = new SearchItemsRequestContent(partnerTag, keywords)
    searchRequest.resources = [
      'images.primary.large',
      'images.primary.medium',
      'itemInfo.title',
      'offersV2.listings.price',
    ].map(r => SearchItemsResource.constructFromObject(r))
    searchRequest.itemCount = 1

    const response = await api.searchItems(marketplace, searchRequest)

    if (!response?.searchResult?.items?.length) {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'No results found' }) }
    }

    const item = response.searchResult.items[0]
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
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: e.message, stack: e.stack?.slice(0, 500) })
    }
  }
}
