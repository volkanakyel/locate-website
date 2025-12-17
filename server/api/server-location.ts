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

interface CountryInfo {
  code: string
  name: string
  city: string
  lat: number
  lon: number
}

const TLD_COUNTRY_INFO: Record<string, CountryInfo> = {
  uk: { code: 'GB', name: 'United Kingdom', city: 'London', lat: 51.5074, lon: -0.1278 },
  au: { code: 'AU', name: 'Australia', city: 'Sydney', lat: -33.8688, lon: 151.2093 },
  de: { code: 'DE', name: 'Germany', city: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
  fr: { code: 'FR', name: 'France', city: 'Paris', lat: 48.8566, lon: 2.3522 },
  jp: { code: 'JP', name: 'Japan', city: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  cn: { code: 'CN', name: 'China', city: 'Beijing', lat: 39.9042, lon: 116.4074 },
  br: { code: 'BR', name: 'Brazil', city: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  in: { code: 'IN', name: 'India', city: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  ru: { code: 'RU', name: 'Russia', city: 'Moscow', lat: 55.7558, lon: 37.6173 },
  ca: { code: 'CA', name: 'Canada', city: 'Toronto', lat: 43.6532, lon: -79.3832 },
  it: { code: 'IT', name: 'Italy', city: 'Milan', lat: 45.4642, lon: 9.1900 },
  es: { code: 'ES', name: 'Spain', city: 'Madrid', lat: 40.4168, lon: -3.7038 },
  nl: { code: 'NL', name: 'Netherlands', city: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  se: { code: 'SE', name: 'Sweden', city: 'Stockholm', lat: 59.3293, lon: 18.0686 },
  no: { code: 'NO', name: 'Norway', city: 'Oslo', lat: 59.9139, lon: 10.7522 },
  dk: { code: 'DK', name: 'Denmark', city: 'Copenhagen', lat: 55.6761, lon: 12.5683 },
  fi: { code: 'FI', name: 'Finland', city: 'Helsinki', lat: 60.1699, lon: 24.9384 },
  pl: { code: 'PL', name: 'Poland', city: 'Warsaw', lat: 52.2297, lon: 21.0122 },
  ch: { code: 'CH', name: 'Switzerland', city: 'Zurich', lat: 47.3769, lon: 8.5417 },
  at: { code: 'AT', name: 'Austria', city: 'Vienna', lat: 48.2082, lon: 16.3738 },
  be: { code: 'BE', name: 'Belgium', city: 'Brussels', lat: 50.8503, lon: 4.3517 },
  nz: { code: 'NZ', name: 'New Zealand', city: 'Auckland', lat: -36.8509, lon: 174.7645 },
  ie: { code: 'IE', name: 'Ireland', city: 'Dublin', lat: 53.3498, lon: -6.2603 },
  sg: { code: 'SG', name: 'Singapore', city: 'Singapore', lat: 1.3521, lon: 103.8198 },
  hk: { code: 'HK', name: 'Hong Kong', city: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  kr: { code: 'KR', name: 'South Korea', city: 'Seoul', lat: 37.5665, lon: 126.9780 },
  tw: { code: 'TW', name: 'Taiwan', city: 'Taipei', lat: 25.0330, lon: 121.5654 },
  mx: { code: 'MX', name: 'Mexico', city: 'Mexico City', lat: 19.4326, lon: -99.1332 },
  ar: { code: 'AR', name: 'Argentina', city: 'Buenos Aires', lat: -34.6037, lon: -58.3816 },
  za: { code: 'ZA', name: 'South Africa', city: 'Johannesburg', lat: -26.2041, lon: 28.0473 },
  pt: { code: 'PT', name: 'Portugal', city: 'Lisbon', lat: 38.7223, lon: -9.1393 },
  gr: { code: 'GR', name: 'Greece', city: 'Athens', lat: 37.9838, lon: 23.7275 },
  cz: { code: 'CZ', name: 'Czech Republic', city: 'Prague', lat: 50.0755, lon: 14.4378 },
  hu: { code: 'HU', name: 'Hungary', city: 'Budapest', lat: 47.4979, lon: 19.0402 },
  ro: { code: 'RO', name: 'Romania', city: 'Bucharest', lat: 44.4268, lon: 26.1025 },
  ua: { code: 'UA', name: 'Ukraine', city: 'Kyiv', lat: 50.4501, lon: 30.5234 },
  il: { code: 'IL', name: 'Israel', city: 'Tel Aviv', lat: 32.0853, lon: 34.7818 },
  ae: { code: 'AE', name: 'United Arab Emirates', city: 'Dubai', lat: 25.2048, lon: 55.2708 },
  th: { code: 'TH', name: 'Thailand', city: 'Bangkok', lat: 13.7563, lon: 100.5018 },
  my: { code: 'MY', name: 'Malaysia', city: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869 },
  id: { code: 'ID', name: 'Indonesia', city: 'Jakarta', lat: -6.2088, lon: 106.8456 },
  ph: { code: 'PH', name: 'Philippines', city: 'Manila', lat: 14.5995, lon: 120.9842 },
  vn: { code: 'VN', name: 'Vietnam', city: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297 },
  cl: { code: 'CL', name: 'Chile', city: 'Santiago', lat: -33.4489, lon: -70.6693 },
  co: { code: 'CO', name: 'Colombia', city: 'Bogotá', lat: 4.7110, lon: -74.0721 },
  pe: { code: 'PE', name: 'Peru', city: 'Lima', lat: -12.0464, lon: -77.0428 },
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

const COMPANY_HEADQUARTERS: Record<string, CountryInfo> = {
  google: { code: 'US', name: 'United States', city: 'Mountain View, CA', lat: 37.4220, lon: -122.0841 },
  facebook: { code: 'US', name: 'United States', city: 'Menlo Park, CA', lat: 37.4530, lon: -122.1817 },
  meta: { code: 'US', name: 'United States', city: 'Menlo Park, CA', lat: 37.4530, lon: -122.1817 },
  amazon: { code: 'US', name: 'United States', city: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
  microsoft: { code: 'US', name: 'United States', city: 'Redmond, WA', lat: 47.6740, lon: -122.1215 },
  apple: { code: 'US', name: 'United States', city: 'Cupertino, CA', lat: 37.3349, lon: -122.0090 },
  netflix: { code: 'US', name: 'United States', city: 'Los Gatos, CA', lat: 37.2358, lon: -121.9624 },
  twitter: { code: 'US', name: 'United States', city: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
  github: { code: 'US', name: 'United States', city: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
  linkedin: { code: 'US', name: 'United States', city: 'Sunnyvale, CA', lat: 37.3688, lon: -122.0363 },
  openai: { code: 'US', name: 'United States', city: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
  spotify: { code: 'SE', name: 'Sweden', city: 'Stockholm', lat: 59.3293, lon: 18.0686 },
  alibaba: { code: 'CN', name: 'China', city: 'Hangzhou', lat: 30.2741, lon: 120.1551 },
  tencent: { code: 'CN', name: 'China', city: 'Shenzhen', lat: 22.5431, lon: 114.0579 },
  baidu: { code: 'CN', name: 'China', city: 'Beijing', lat: 39.9042, lon: 116.4074 },
  samsung: { code: 'KR', name: 'South Korea', city: 'Seoul', lat: 37.5665, lon: 126.9780 },
  sony: { code: 'JP', name: 'Japan', city: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  toyota: { code: 'JP', name: 'Japan', city: 'Toyota City', lat: 35.0826, lon: 137.1560 },
  bmw: { code: 'DE', name: 'Germany', city: 'Munich', lat: 48.1351, lon: 11.5820 },
  volkswagen: { code: 'DE', name: 'Germany', city: 'Wolfsburg', lat: 52.4227, lon: 10.7865 },
  sap: { code: 'DE', name: 'Germany', city: 'Walldorf', lat: 49.3063, lon: 8.6432 },
}

function getCompanyFromDomain(domain: string): CountryInfo | null {
  const parts = domain.split('.')
  const name = parts[0] || ''

  for (const [company, info] of Object.entries(COMPANY_HEADQUARTERS)) {
    if (name.includes(company)) {
      return info
    }
  }

  return null
}

function getCountryFromTLD(domain: string): CountryInfo | null {
  const parts = domain.split('.')
  if (parts.length < 2) return null

  const tld = parts[parts.length - 1] || ''
  const secondLevel = parts.length > 2 ? parts[parts.length - 2] || '' : ''

  if (['com', 'net', 'org', 'co'].includes(secondLevel) && TLD_COUNTRY_INFO[tld]) {
    return TLD_COUNTRY_INFO[tld] || null
  }

  if (secondLevel === 'co' && tld === 'uk') {
    return TLD_COUNTRY_INFO['uk'] || null
  }

  if (TLD_COUNTRY_INFO[tld]) {
    return TLD_COUNTRY_INFO[tld] || null
  }

  return null
}

async function resolveIP(domain: string): Promise<string | null> {
  const variants = [domain, `www.${domain}`]

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
          if (record.type === 1 && record.data) {
            return record.data
          }
        }
      }
    } catch {
      continue
    }
  }

  return null
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
      error: 'Invalid domain format',
    }
  }

  try {
    const ip = await resolveIP(cleanDomain)

    if (!ip) {
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
        error: `Could not resolve domain: ${cleanDomain}`,
      }
    }

    const geoResult = await getGeoForIP(ip)

    if (!geoResult) {
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
        error: 'Failed to get geolocation data',
      }
    }

    const companyInfo = getCompanyFromDomain(cleanDomain)

    if (companyInfo) {
      return {
        success: true,
        domain: cleanDomain,
        ip: geoResult.ip,
        country: companyInfo.name,
        countryCode: companyInfo.code,
        city: companyInfo.city,
        region: '',
        coordinates: {
          lat: companyInfo.lat,
          lon: companyInfo.lon,
        },
        provider: geoResult.isp || geoResult.org || 'Unknown',
        organization: geoResult.org || '',
        timezone: geoResult.timezone || '',
      }
    }

    const countryFromTLD = getCountryFromTLD(cleanDomain)

    if (countryFromTLD) {
      return {
        success: true,
        domain: cleanDomain,
        ip: geoResult.ip,
        country: countryFromTLD.name,
        countryCode: countryFromTLD.code,
        city: countryFromTLD.city,
        region: '',
        coordinates: {
          lat: countryFromTLD.lat,
          lon: countryFromTLD.lon,
        },
        provider: geoResult.isp || geoResult.org || 'Unknown',
        organization: geoResult.org || '',
        timezone: geoResult.timezone || '',
      }
    }

    return {
      success: true,
      domain: cleanDomain,
      ip: geoResult.ip,
      country: geoResult.country || 'Unknown',
      countryCode: geoResult.countryCode || '',
      city: geoResult.city
        ? `${geoResult.city}${geoResult.region ? `, ${geoResult.region}` : ''}`
        : geoResult.region || 'Unknown',
      region: geoResult.region || '',
      coordinates: {
        lat: geoResult.lat || 0,
        lon: geoResult.lon || 0,
      },
      provider: geoResult.isp || geoResult.org || 'Unknown',
      organization: geoResult.org || '',
      timezone: geoResult.timezone || '',
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
