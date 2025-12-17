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

interface GoogleDNSResponse {
  Status: number
  Answer?: Array<{
    name: string
    type: number
    TTL: number
    data: string
  }>
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

interface GeoResult {
  ip: string
  country: string
  countryCode: string
  city: string
  region: string
  lat: number
  lon: number
  isp: string
  org: string
  timezone: string
}

const TLD_COUNTRY_MAP: Record<string, string[]> = {
  uk: ['GB'],
  au: ['AU'],
  de: ['DE'],
  fr: ['FR'],
  jp: ['JP'],
  cn: ['CN'],
  br: ['BR'],
  in: ['IN'],
  ru: ['RU'],
  ca: ['CA'],
  it: ['IT'],
  es: ['ES'],
  nl: ['NL'],
  se: ['SE'],
  no: ['NO'],
  dk: ['DK'],
  fi: ['FI'],
  pl: ['PL'],
  ch: ['CH'],
  at: ['AT'],
  be: ['BE'],
  nz: ['NZ'],
  ie: ['IE'],
  sg: ['SG'],
  hk: ['HK'],
  kr: ['KR'],
  tw: ['TW'],
  mx: ['MX'],
  ar: ['AR'],
  za: ['ZA'],
  co: ['GB', 'CO'],
  com: [],
  net: [],
  org: [],
}

function cleanDomainInput(input: string): string {
  return input
    .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
    .replace(/^www\./i, '')
    .toLowerCase()
    .trim()
}

async function resolveAllIPs(domain: string): Promise<string[]> {
  const variants = [domain, `www.${domain}`]
  const allIPs: string[] = []

  for (const variant of variants) {
    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(variant)}&type=A`,
        { headers: { Accept: 'application/dns-json' } }
      )

      if (!response.ok) continue

      const data: GoogleDNSResponse = await response.json()

      if (data.Status === 0 && data.Answer) {
        for (const record of data.Answer) {
          if (record.type === 1 && record.data && !allIPs.includes(record.data)) {
            allIPs.push(record.data)
          }
        }
      }

      if (allIPs.length > 0) break
    } catch {
      continue
    }
  }

  return allIPs
}

async function getGeoForIP(ip: string): Promise<GeoResult | null> {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,query`
    )

    if (!response.ok) return null

    const data: GeoLocationResponse = await response.json()

    if (data.status === 'fail') return null

    return {
      ip: data.query || ip,
      country: data.country || '',
      countryCode: data.countryCode || '',
      city: data.city || '',
      region: data.regionName || '',
      lat: data.lat || 0,
      lon: data.lon || 0,
      isp: data.isp || '',
      org: data.org || '',
      timezone: data.timezone || '',
    }
  } catch {
    return null
  }
}

function selectBestGeoResult(results: GeoResult[], domain: string): GeoResult | null {
  if (results.length === 0) return null
  const firstResult = results[0]
  if (!firstResult) return null
  if (results.length === 1) return firstResult

  const domainParts = domain.split('.')
  const tld = domainParts[domainParts.length - 1] || ''
  const secondLevel = domainParts.length > 2 ? domainParts[domainParts.length - 2] || '' : ''

  let expectedCountries: string[] = []

  if (tld && TLD_COUNTRY_MAP[tld]) {
    expectedCountries = TLD_COUNTRY_MAP[tld]
  }

  if (secondLevel === 'co' && tld === 'uk') {
    expectedCountries = ['GB']
  } else if (secondLevel && ['com', 'net', 'org'].includes(secondLevel) && tld && TLD_COUNTRY_MAP[tld]) {
    expectedCountries = TLD_COUNTRY_MAP[tld]
  }

  if (expectedCountries.length > 0) {
    const matchingResult = results.find((r) => expectedCountries.includes(r.countryCode))
    if (matchingResult) return matchingResult
  }

  const countryCount: Record<string, { count: number; result: GeoResult }> = {}

  for (const result of results) {
    const country = result.countryCode
    if (!countryCount[country]) {
      countryCount[country] = { count: 0, result }
    }
    countryCount[country].count++
  }

  let bestResult: GeoResult = firstResult
  let bestCount = 0

  for (const [, data] of Object.entries(countryCount)) {
    if (data.count > bestCount) {
      bestCount = data.count
      bestResult = data.result
    }
  }

  return bestResult
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
      error: 'Domain parameter is required',
    }
  }

  const cleanDomain = cleanDomainInput(domain)

  if (!cleanDomain || cleanDomain.length < 3 || !cleanDomain.includes('.')) {
    return {
      success: false,
      domain: cleanDomain || domain,
      ip: '',
      country: '',
      countryCode: '',
      city: '',
      region: '',
      coordinates: { lat: 0, lon: 0 },
      provider: '',
      organization: '',
      timezone: '',
      error: 'Invalid domain format. Please enter a valid domain (e.g., example.com, bbc.co.uk)',
    }
  }

  try {
    const ips = await resolveAllIPs(cleanDomain)

    if (ips.length === 0) {
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
        error: `Could not resolve domain: ${cleanDomain}. Please check the domain is correct.`,
      }
    }

    const ipsToCheck = ips.slice(0, 5)
    const geoResults: GeoResult[] = []

    for (const ip of ipsToCheck) {
      const geo = await getGeoForIP(ip)
      if (geo) {
        geoResults.push(geo)
      }
      if (ipsToCheck.indexOf(ip) < ipsToCheck.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    if (geoResults.length === 0) {
      return {
        success: false,
        domain: cleanDomain,
        ip: ips[0] || '',
        country: '',
        countryCode: '',
        city: '',
        region: '',
        coordinates: { lat: 0, lon: 0 },
        provider: '',
        organization: '',
        timezone: '',
        error: 'Failed to get geolocation data for this domain',
      }
    }

    const bestResult = selectBestGeoResult(geoResults, cleanDomain)

    if (!bestResult) {
      return {
        success: false,
        domain: cleanDomain,
        ip: ips[0] || '',
        country: '',
        countryCode: '',
        city: '',
        region: '',
        coordinates: { lat: 0, lon: 0 },
        provider: '',
        organization: '',
        timezone: '',
        error: 'Could not determine server location',
      }
    }

    return {
      success: true,
      domain: cleanDomain,
      ip: bestResult.ip,
      country: bestResult.country || 'Unknown',
      countryCode: bestResult.countryCode || '',
      city: bestResult.city
        ? `${bestResult.city}${bestResult.region ? `, ${bestResult.region}` : ''}`
        : bestResult.region || 'Unknown',
      region: bestResult.region || '',
      coordinates: {
        lat: bestResult.lat || 0,
        lon: bestResult.lon || 0,
      },
      provider: bestResult.isp || bestResult.org || 'Unknown',
      organization: bestResult.org || '',
      timezone: bestResult.timezone || '',
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
      error: errorMessage,
    }
  }
})
