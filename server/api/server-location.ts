import { promises as dns } from 'dns'

interface GeoLocationResponse {
  status: string
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
  query: string
  message?: string
}

interface ServerLocationResult {
  success: boolean
  domain: string
  ip: string
  country: string
  countryCode: string
  city: string
  region: string
  coordinates: {
    lat: number
    lon: number
  }
  provider: string
  organization: string
  timezone: string
  error?: string
}

export default defineEventHandler(async (event): Promise<ServerLocationResult> => {
  const query = getQuery(event)
  const domain = query.domain as string

  if (!domain) {
    return {
      success: false,
      domain: '',
      ip: '',
      country: '',
      countryCode: '',
      city: '',
      region: '',
      coordinates: { lat: 0, lon: 0 },
      provider: '',
      organization: '',
      timezone: '',
      error: 'Domain parameter is required'
    }
  }

  // Clean the domain (remove protocol and path)
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
    .toLowerCase()
    .trim()

  try {
    // Step 1: Resolve domain to IP address
    let ip: string

    try {
      const addresses = await dns.resolve4(cleanDomain)
      if (!addresses[0]) throw new Error('No IP found')
      ip = addresses[0]
    } catch {
      // Try with www prefix if direct lookup fails
      try {
        const addresses = await dns.resolve4(`www.${cleanDomain}`)
        if (!addresses[0]) throw new Error('No IP found')
        ip = addresses[0]
      } catch {
        return {
          success: false,
          domain: cleanDomain,
          ip: '',
          country: '',
          countryCode: '',
          city: '',
          region: '',
          coordinates: { lat: 0, lon: 0 },
          provider: '',
          organization: '',
          timezone: '',
          error: `Could not resolve domain: ${cleanDomain}`
        }
      }
    }

    // Step 2: Get geolocation data from ip-api.com (free, no API key needed)
    // Note: ip-api.com has a rate limit of 45 requests per minute for non-commercial use
    const geoResponse = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
    )

    if (!geoResponse.ok) {
      throw new Error(`Geolocation API error: ${geoResponse.status}`)
    }

    const geoData: GeoLocationResponse = await geoResponse.json()

    if (geoData.status === 'fail') {
      return {
        success: false,
        domain: cleanDomain,
        ip,
        country: '',
        countryCode: '',
        city: '',
        region: '',
        coordinates: { lat: 0, lon: 0 },
        provider: '',
        organization: '',
        timezone: '',
        error: geoData.message || 'Failed to get geolocation data'
      }
    }

    // Step 3: Return the combined result
    return {
      success: true,
      domain: cleanDomain,
      ip: geoData.query || ip,
      country: geoData.country || 'Unknown',
      countryCode: geoData.countryCode || '',
      city: geoData.city ? `${geoData.city}${geoData.regionName ? `, ${geoData.regionName}` : ''}` : 'Unknown',
      region: geoData.regionName || '',
      coordinates: {
        lat: geoData.lat || 0,
        lon: geoData.lon || 0
      },
      provider: geoData.isp || geoData.org || 'Unknown',
      organization: geoData.org || '',
      timezone: geoData.timezone || ''
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return {
      success: false,
      domain: cleanDomain,
      ip: '',
      country: '',
      countryCode: '',
      city: '',
      region: '',
      coordinates: { lat: 0, lon: 0 },
      provider: '',
      organization: '',
      timezone: '',
      error: errorMessage
    }
  }
})
