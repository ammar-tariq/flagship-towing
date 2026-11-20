const { weatherCache } = require('./ttlCache')
const {
    findNearestServiceArea,
    findNearestCoastalServiceArea,
    getServiceAreaById,
    serviceAreaSupportsTides,
    SERVICE_AREAS,
} = require('./serviceAreas')

const NWS_USER_AGENT =
    process.env.NWS_USER_AGENT ||
    'FlagshipTowing/1.0 (support@flagshiptowing.com)'

const nwsHeaders = {
    Accept: 'application/geo+json',
    'User-Agent': NWS_USER_AGENT,
}

const TTL = {
    POINTS_MS: 6 * 60 * 60 * 1000,
    FORECAST_MS: 45 * 60 * 1000,
    GRID_MS: 45 * 60 * 1000,
    OBSERVATION_MS: 12 * 60 * 1000,
    TIDES_MS: 6 * 60 * 60 * 1000,
    WIND_FIELD_MS: 30 * 60 * 1000,
    RADAR_MS: 60 * 1000,
}

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const OPEN_METEO_HEADERS = {
    Accept: 'application/json',
    'User-Agent': NWS_USER_AGENT,
}

const WIND_GRID_SIZE = 9
const WIND_MAX_SPAN_DEG = 18
const WIND_MIN_SPAN_DEG = 0.6
const WIND_FORECAST_DAYS = 3

const SEVEN_DAY_COUNT = 7

const windDirectionAbbrev = {
    north: 'N',
    south: 'S',
    east: 'E',
    west: 'W',
    northeast: 'NE',
    northwest: 'NW',
    southeast: 'SE',
    southwest: 'SW',
}

const windDirectionDegrees = {
    north: 0,
    northeast: 45,
    east: 90,
    southeast: 135,
    south: 180,
    southwest: 225,
    west: 270,
    northwest: 315,
    n: 0,
    ne: 45,
    e: 90,
    se: 135,
    s: 180,
    sw: 225,
    w: 270,
    nw: 315,
}

const roundCoord = (value) => Number(value).toFixed(4)

const formatIsoDate = (date = new Date()) => {
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const ymdInZone = (date, timeZone = 'UTC') =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)

const compactYmd = (ymd) => ymd.replace(/-/g, '')

const addCalendarDays = (ymd, days) => {
    const [year, month, day] = ymd.split('-').map(Number)
    return formatIsoDate(new Date(Date.UTC(year, month - 1, day + days)))
}

const hourInZone = (date, timeZone = 'UTC') => {
    const hour = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        hour12: false,
        hourCycle: 'h23',
    }).format(date)
    return Number(hour)
}

const zonedParts = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        hour12: false,
    }).formatToParts(date)
    const map = {}
    parts.forEach((part) => {
        if (part.type !== 'literal') {
            map[part.type] = part.value
        }
    })
    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour === '24' ? 0 : map.hour),
        minute: Number(map.minute),
        second: Number(map.second),
    }
}

/** UTC millis for a civil date/time in `timeZone`. */
const zonedDateToUtcMs = (ymd, timeZone, hour = 0, minute = 0) => {
    const [year, month, day] = ymd.split('-').map(Number)
    let utc = Date.UTC(year, month - 1, day, hour, minute, 0)
    for (let i = 0; i < 4; i += 1) {
        const parts = zonedParts(new Date(utc), timeZone)
        const asUtc = Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second,
        )
        const wanted = Date.UTC(year, month - 1, day, hour, minute, 0)
        const delta = wanted - asUtc
        if (delta === 0) {
            break
        }
        utc += delta
    }
    return utc
}

const weekdayLabelForYmd = (ymd) => {
    const [year, month, day] = ymd.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day))
        .toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
        .toUpperCase()
}

const parseNoaaPredictionTime = (value) => {
    const [datePart, timePart = '00:00'] = value.split(' ')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute = 0] = timePart.split(':').map(Number)
    return Date.UTC(year, month - 1, day, hour, minute)
}

const buildNoaaDatagetterUrl = ({ stationId, beginDate, endDate, interval }) =>
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${beginDate}&end_date=${endDate}&station=${stationId}&product=predictions&datum=MLLW&time_zone=gmt&units=english&interval=${interval}&format=json`

const formatWindLabel = (direction, speed) => {
    if (!direction && !speed) {
        return '-'
    }
    const normalizedDirection = direction?.trim().toLowerCase() ?? ''
    const abbrev =
        windDirectionAbbrev[normalizedDirection] ??
        direction?.slice(0, 1).toUpperCase() ??
        ''
    const speedValue = speed?.replace(/\s*mph\s*$/i, '').trim() ?? ''
    if (!abbrev && !speedValue) {
        return '-'
    }
    if (!speedValue) {
        return abbrev
    }
    return `${abbrev}- ${speedValue}mph`
}

const getWindDirectionDeg = (direction) => {
    if (!direction) {
        return null
    }
    return windDirectionDegrees[direction.trim().toLowerCase()] ?? null
}

const toMph = (value, unitCode) => {
    if (value == null) {
        return null
    }
    if (unitCode?.includes('km_h')) {
        return value * 0.621371
    }
    if (unitCode?.includes('m_s')) {
        return value * 2.23694
    }
    return value
}

const parseDurationMs = (duration) => {
    if (!duration?.startsWith('P')) {
        return 0
    }

    // ISO-8601: PnDTnHnMnS — minutes only count after T.
    const [datePart, timePart = ''] = duration.slice(1).split('T')
    let ms = 0

    const dayMatch = datePart.match(/(\d+)D/)
    if (dayMatch) {
        ms += parseInt(dayMatch[1], 10) * 86400000
    }

    const hourMatch = timePart.match(/(\d+)H/)
    const minuteMatch = timePart.match(/(\d+)M/)
    const secondMatch = timePart.match(/(\d+)S/)
    if (hourMatch) {
        ms += parseInt(hourMatch[1], 10) * 3600000
    }
    if (minuteMatch) {
        ms += parseInt(minuteMatch[1], 10) * 60000
    }
    if (secondMatch) {
        ms += parseInt(secondMatch[1], 10) * 1000
    }

    return ms
}

const getGridEntryWindow = (entry) => {
    if (!entry?.validTime) {
        return null
    }
    const [startPart, durationPart] = entry.validTime.split('/')
    const start = new Date(startPart).getTime()
    if (Number.isNaN(start)) {
        return null
    }
    const durationMs = parseDurationMs(durationPart || '')
    return {
        start,
        end: start + (durationMs || 3600000),
        value: entry.value,
    }
}

/**
 * Resolve a grid time-series value at a timestamp.
 * Prefer the covering window; otherwise nearest by start time.
 * preferNonZero skips calm/placeholder 0s from NWS run-length encoding.
 */
const getGridValueAt = (
    series,
    atMs = Date.now(),
    { preferNonZero = false } = {},
) => {
    const values = series?.values
    if (!values?.length) {
        return null
    }

    const windows = values
        .map(getGridEntryWindow)
        .filter((entry) => entry && entry.value != null)

    if (!windows.length) {
        return null
    }

    const covering = windows.filter(
        (entry) => atMs >= entry.start && atMs < entry.end,
    )
    if (covering.length) {
        if (preferNonZero) {
            const nonZero = covering.find((entry) => entry.value !== 0)
            if (nonZero) {
                return nonZero.value
            }
        } else {
            return covering[0].value
        }
    }

    const ranked = [...windows].sort(
        (a, b) => Math.abs(a.start - atMs) - Math.abs(b.start - atMs),
    )

    if (preferNonZero) {
        const nonZero = ranked.find((entry) => entry.value !== 0)
        if (nonZero) {
            return nonZero.value
        }
    }

    return ranked[0]?.value ?? null
}

/** Peak wave for a UTC day window + period near that peak. */
const getWaveAndPeriodForDay = (gridData, dayStartMs, dayEndMs) => {
    const properties = gridData?.properties ?? {}
    const waveSeries = properties.waveHeight?.values?.length
        ? properties.waveHeight
        : properties.windWaveHeight
    const periodSeries = properties.wavePeriod

    const waveWindows = (waveSeries?.values || [])
        .map(getGridEntryWindow)
        .filter(
            (entry) =>
                entry &&
                entry.value != null &&
                entry.end > dayStartMs &&
                entry.start < dayEndMs,
        )

    if (!waveWindows.length) {
        return { wave: null, period: null, waveUom: waveSeries?.uom }
    }

    let peak = waveWindows[0]
    waveWindows.forEach((entry) => {
        if (entry.value > peak.value) {
            peak = entry
        }
    })

    const sampleAt = Math.min(
        Math.max(peak.start, dayStartMs),
        Math.max(dayEndMs - 1, dayStartMs),
    )
    const periodValue = getGridValueAt(periodSeries, sampleAt, {
        preferNonZero: true,
    })

    return {
        wave: peak.value,
        period: periodValue,
        waveUom: waveSeries?.uom,
    }
}

const getMaxGridValueForDay = (series, dayStartMs, dayEndMs) => {
    const windows = (series?.values || [])
        .map(getGridEntryWindow)
        .filter(
            (entry) =>
                entry &&
                entry.value != null &&
                entry.end > dayStartMs &&
                entry.start < dayEndMs,
        )
    if (!windows.length) {
        return null
    }
    return windows.reduce(
        (max, entry) => (entry.value > max ? entry.value : max),
        windows[0].value,
    )
}

const metersToFeet = (meters, uom) => {
    if (uom?.includes('ft') || uom?.includes('foot')) {
        return meters
    }
    return meters * 3.28084
}

const formatWaveHeight = (value, uom) => {
    if (value == null || Number.isNaN(Number(value))) {
        return '-'
    }
    const feet = metersToFeet(Number(value), uom)
    if (feet <= 0) {
        return 'Calm'
    }
    return `${feet.toFixed(1)} ft`
}

const formatWavePeriod = (value) => {
    if (value == null || Number.isNaN(Number(value))) {
        return '-'
    }
    const seconds = Number(value)
    // NWS sometimes emits 0 as a placeholder, not a real period.
    if (seconds <= 0) {
        return '-'
    }
    return `${Math.round(seconds)} s`
}

const fetchJson = async (url, headers = {}, { required = true } = {}) => {
    const response = await fetch(url, { headers })
    if (!response.ok) {
        if (!required) {
            return null
        }
        const error = new Error(`Request failed (${response.status}) for ${url}`)
        error.status = response.status
        throw error
    }
    return response.json()
}

const cachedFetchJson = async (
    cacheKey,
    ttlMs,
    url,
    headers = {},
    options = {},
) => {
    const cached = weatherCache.get(cacheKey)
    if (cached !== undefined) {
        return cached
    }

    const value = await fetchJson(url, headers, options)
    // Avoid caching hard misses from optional NWS endpoints for the full TTL.
    if (value != null) {
        weatherCache.set(cacheKey, value, ttlMs)
    }
    return value
}

const getPoints = async (latitude, longitude) => {
    const lat = roundCoord(latitude)
    const lon = roundCoord(longitude)
    const cacheKey = `nws:points:${lat},${lon}`
    const url = `https://api.weather.gov/points/${lat},${lon}`
    return cachedFetchJson(cacheKey, TTL.POINTS_MS, url, nwsHeaders, {
        required: true,
    })
}

const getForecast = async (forecastUrl) => {
    if (!forecastUrl) {
        return null
    }
    return cachedFetchJson(
        `nws:forecast:${forecastUrl}`,
        TTL.FORECAST_MS,
        forecastUrl,
        nwsHeaders,
        { required: false },
    )
}

const getForecastHourly = async (hourlyUrl) => {
    if (!hourlyUrl) {
        return null
    }
    return cachedFetchJson(
        `nws:hourly:${hourlyUrl}`,
        TTL.FORECAST_MS,
        hourlyUrl,
        nwsHeaders,
        { required: false },
    )
}

const getGridData = async (gridUrl) => {
    if (!gridUrl) {
        return null
    }
    return cachedFetchJson(
        `nws:grid:${gridUrl}`,
        TTL.GRID_MS,
        gridUrl,
        nwsHeaders,
        { required: false },
    )
}

const OBSERVATION_FIELDS = [
    'windGust',
    'visibility',
    'barometricPressure',
    'seaLevelPressure',
]
const OBSERVATION_STATION_LIMIT = 16
const OBSERVATION_BATCH_SIZE = 8

const observationHasVisibilityAndPressure = (observationData) => {
    const properties = observationData?.properties
    if (!properties) {
        return false
    }
    const hasVisibility = properties.visibility?.value != null
    const hasPressure =
        properties.barometricPressure?.value != null ||
        properties.seaLevelPressure?.value != null
    return hasVisibility && hasPressure
}

const fetchStationObservation = async (stationId) => {
    if (!stationId) {
        return null
    }
    return cachedFetchJson(
        `nws:obs:${stationId}`,
        TTL.OBSERVATION_MS,
        `https://api.weather.gov/stations/${stationId}/observations/latest`,
        nwsHeaders,
        { required: false },
    )
}

const mergeObservationProperties = (observations) => {
    const properties = {}
    observations.forEach((observation) => {
        const source = observation?.properties
        if (!source) {
            return
        }
        OBSERVATION_FIELDS.forEach((field) => {
            if (properties[field]?.value == null && source[field]?.value != null) {
                properties[field] = source[field]
            }
        })
    })
    return { properties }
}

const getLatestObservation = async (stationsUrl) => {
    if (!stationsUrl) {
        return null
    }

    const stationsData = await cachedFetchJson(
        `nws:stations:${stationsUrl}`,
        TTL.POINTS_MS,
        stationsUrl,
        nwsHeaders,
        { required: false },
    )
    const stationIds = (stationsData?.features || [])
        .map((feature) => feature?.properties?.stationIdentifier)
        .filter(Boolean)
        .slice(0, OBSERVATION_STATION_LIMIT)

    if (!stationIds.length) {
        return null
    }

    let merged = { properties: {} }
    for (let i = 0; i < stationIds.length; i += OBSERVATION_BATCH_SIZE) {
        const batch = await Promise.all(
            stationIds
                .slice(i, i + OBSERVATION_BATCH_SIZE)
                .map(fetchStationObservation),
        )
        merged = mergeObservationProperties([merged, ...batch])
        if (observationHasVisibilityAndPressure(merged)) {
            break
        }
    }

    return merged
}

const formatObservationExtras = (observationData) => {
    if (!observationData) {
        return { gust: '-', visibility: '-', pressure: '-' }
    }

    const properties = observationData.properties ?? {}
    const gustMph = toMph(
        properties?.windGust?.value,
        properties?.windGust?.unitCode,
    )
    const visibilityMiles =
        properties?.visibility?.value != null
            ? properties.visibility.unitCode?.includes('wmoUnit:m')
                ? properties.visibility.value / 1609.34
                : properties.visibility.value
            : null
    const pressureMb =
        properties?.barometricPressure?.value != null
            ? properties.barometricPressure.value / 100
            : properties?.seaLevelPressure?.value != null
              ? properties.seaLevelPressure.value / 100
              : null

    return {
        gust: gustMph != null ? `${Math.round(gustMph)} mph` : '-',
        visibility:
            visibilityMiles != null
                ? `${Math.round(visibilityMiles)} miles`
                : '-',
        pressure: pressureMb != null ? `${pressureMb.toFixed(2)} mb` : '-',
    }
}

const gridHasRealWaves = (gridData) => {
    const series =
        gridData?.properties?.waveHeight?.values?.length
            ? gridData.properties.waveHeight
            : gridData?.properties?.windWaveHeight
    return (series?.values || []).some(
        (entry) => entry?.value != null && entry.value !== 0,
    )
}

const getWaveGridData = async (latitude, longitude, localGrid) => {
    if (gridHasRealWaves(localGrid)) {
        return localGrid
    }

    const coastal = findNearestCoastalServiceArea(latitude, longitude)
    if (!coastal) {
        return localGrid
    }

    const coastalPoints = await getPoints(coastal.latitude, coastal.longitude)
    const coastalGrid = await getGridData(
        coastalPoints?.properties?.forecastGridData,
    )
    return gridHasRealWaves(coastalGrid) ? coastalGrid : localGrid
}

const celsiusToFahrenheit = (celsius) => (celsius * 9) / 5 + 32

const extractGridFallbackConditions = (gridData, atMs = Date.now()) => {
    const properties = gridData?.properties ?? {}
    const tempSeries = properties.temperature
    const windSpeedSeries = properties.windSpeed
    const windDirSeries = properties.windDirection

    const tempC = getGridValueAt(tempSeries, atMs)
    const windMs = getGridValueAt(windSpeedSeries, atMs)
    const windDir = getGridValueAt(windDirSeries, atMs)

    let temperature = '-'
    if (tempC != null) {
        const tempF = tempSeries?.uom?.includes('degC')
            ? celsiusToFahrenheit(tempC)
            : tempC
        temperature = `${Math.round(tempF)}°`
    }

    let windLabel = '-'
    let windDirectionDeg = null
    if (windDir != null) {
        windDirectionDeg = Math.round(windDir)
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
        const abbrev = dirs[Math.round(((windDir % 360) / 45)) % 8]
        if (windMs != null) {
            const mph = windSpeedSeries?.uom?.includes('m_s')
                ? windMs * 2.23694
                : windSpeedSeries?.uom?.includes('km_h')
                  ? windMs * 0.621371
                  : windMs
            windLabel = `${abbrev}- ${Math.round(mph)}mph`
        } else {
            windLabel = abbrev
        }
    }

    const visibilityM = getGridValueAt(properties.visibility, atMs)
    const pressurePa = getGridValueAt(
        properties.pressure || properties.seaLevelPressure,
        atMs,
    )

    let visibility = '-'
    if (visibilityM != null) {
        const miles = properties.visibility?.uom?.includes('wmoUnit:m')
            ? visibilityM / 1609.34
            : visibilityM
        if (Number.isFinite(miles)) {
            visibility = `${Math.round(miles)} miles`
        }
    }

    let pressure = '-'
    if (pressurePa != null) {
        const mb = properties.pressure?.uom?.includes('Pa')
            ? pressurePa / 100
            : pressurePa
        if (Number.isFinite(mb)) {
            pressure = `${mb.toFixed(2)} mb`
        }
    }

    return { temperature, windLabel, windDirectionDeg, visibility, pressure }
}

const fetchNoaaPredictions = async (stationId, interval, beginDate, endDate) => {
    const cacheKey = `noaa:tides:gmt:${stationId}:${beginDate}:${endDate}:${interval}`
    const url = buildNoaaDatagetterUrl({
        stationId,
        beginDate,
        endDate,
        interval,
    })
    const { value } = await weatherCache.getOrSet(cacheKey, TTL.TIDES_MS, async () => {
        const response = await fetch(url)
        if (!response.ok) {
            return { predictions: [] }
        }
        const data = await response.json()
        if (data?.error) {
            return { predictions: [] }
        }
        return data
    })
    return value?.predictions ?? []
}

const noaaGmtRangeForZone = (timeZone) => {
    const todayYmd = ymdInZone(new Date(), timeZone)
    return {
        todayYmd,
        beginDate: compactYmd(addCalendarDays(todayYmd, -1)),
        endDate: compactYmd(addCalendarDays(todayYmd, 2)),
    }
}

const parseTideEvent = (entry) => ({
    type: entry.type,
    timestamp: parseNoaaPredictionTime(entry.t),
    height: parseFloat(entry.v),
    raw: entry,
})

const getHiLoTidesForArea = async (area) => {
    if (!serviceAreaSupportsTides(area) || !area.noaaStationId) {
        return { lowTide: '-', highTide: '-' }
    }

    const timeZone = area.timeZone || 'America/Chicago'
    const { todayYmd, beginDate, endDate } = noaaGmtRangeForZone(timeZone)
    const predictions = await fetchNoaaPredictions(
        area.noaaStationId,
        'hilo',
        beginDate,
        endDate,
    )
    const todays = predictions
        .map(parseTideEvent)
        .filter(
            (entry) =>
                Number.isFinite(entry.timestamp) &&
                Number.isFinite(entry.height) &&
                ymdInZone(new Date(entry.timestamp), timeZone) === todayYmd,
        )
    const lows = todays.filter((entry) => entry.type === 'L')
    const highs = todays.filter((entry) => entry.type === 'H')
    const lowTide = lows.length
        ? lows.reduce((min, entry) =>
              entry.height < min.height ? entry : min,
          )
        : null
    const highTide = highs.length
        ? highs.reduce((max, entry) =>
              entry.height > max.height ? entry : max,
          )
        : null

    return {
        lowTide: lowTide ? `${lowTide.height.toFixed(2)} ft` : '-',
        highTide: highTide ? `${highTide.height.toFixed(2)} ft` : '-',
    }
}

const getMoonPhaseName = (date = new Date()) => {
    const lunarCycle = 29.530588853
    const reference = new Date('2000-01-06T18:14:00Z').getTime()
    const age =
        (((date.getTime() - reference) / 86400000) % lunarCycle) / lunarCycle

    if (age < 0.03 || age > 0.97) return 'New Moon'
    if (age < 0.22) return 'Waxing Crescent'
    if (age < 0.28) return 'First Quarter'
    if (age < 0.47) return 'Waxing Gibbous'
    if (age < 0.53) return 'Full Moon'
    if (age < 0.72) return 'Waning Gibbous'
    if (age < 0.78) return 'Last Quarter'
    return 'Waning Crescent'
}

const formatCountdown = (targetMs) => {
    const diffMs = Math.max(targetMs - Date.now(), 0)
    const totalMinutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours} h ${minutes} min`
}

const formatClock = (timestamp, timeZone = 'UTC') =>
    new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone,
    })

const isValidTimeZone = (value) => {
    if (!value || typeof value !== 'string') {
        return false
    }
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date())
        return true
    } catch {
        return false
    }
}

const resolveDisplayTimeZone = (...candidates) => {
    for (const candidate of candidates) {
        if (isValidTimeZone(candidate)) {
            return candidate
        }
    }
    return 'UTC'
}

const getSevenDayKeys = (timeZone = 'UTC') => {
    const todayKey = ymdInZone(new Date(), timeZone)

    return Array.from({ length: SEVEN_DAY_COUNT }, (_, index) => {
        const key = addCalendarDays(todayKey, index)
        const dayStartMs = zonedDateToUtcMs(key, timeZone, 0, 0)
        const dayEndMs = zonedDateToUtcMs(
            addCalendarDays(key, 1),
            timeZone,
            0,
            0,
        )
        const dateNum = Number(key.slice(-2))

        return {
            key,
            index,
            dayLabel: index === 0 ? 'TODAY' : weekdayLabelForYmd(key),
            dateNum,
            dayStartMs,
            dayEndMs,
            sampleMs: zonedDateToUtcMs(key, timeZone, 15, 0),
        }
    })
}

const groupPeriodsByDay = (periods, timeZone = 'UTC') => {
    const grouped = new Map()
    periods.forEach((period) => {
        const dayKey = ymdInZone(new Date(period.startTime), timeZone)
        const existing = grouped.get(dayKey) ?? {
            day: null,
            night: null,
            temps: [],
        }
        if (typeof period.temperature === 'number') {
            existing.temps.push(period.temperature)
        }
        if (period.isDaytime) {
            existing.day = period
        } else {
            existing.night = period
        }
        grouped.set(dayKey, existing)
    })
    return grouped
}

const groupHourlyPeriodsByDay = (periods, timeZone = 'UTC') => {
    const grouped = new Map()
    periods.forEach((period) => {
        const dayKey = ymdInZone(new Date(period.startTime), timeZone)
        const existing = grouped.get(dayKey) ?? []
        existing.push(period)
        grouped.set(dayKey, existing)
    })
    return grouped
}

const resolveWeatherIconKey = (shortForecast, iconUrl) => {
    const text = `${shortForecast || ''} ${iconUrl || ''}`.toLowerCase()
    if (text.includes('thunder') || text.includes('tstorm')) return 'tsra'
    if (text.includes('snow')) return 'sn'
    if (text.includes('rain') || text.includes('shower')) return 'ra'
    if (text.includes('fog') || text.includes('haze')) return 'fg'
    if (text.includes('cloud') && text.includes('part')) return 'sct'
    if (text.includes('cloud') || text.includes('overcast')) return 'ovc'
    if (text.includes('clear') || text.includes('sunny')) return 'skc'
    return 'sct'
}

const resolveWeatherIconPeriod = (iconUrl, isDaytime) => {
    if (typeof isDaytime === 'boolean') {
        return isDaytime ? 'day' : 'night'
    }
    if (typeof iconUrl === 'string' && iconUrl.includes('/night/')) {
        return 'night'
    }
    return 'day'
}

/**
 * Home-card weather summary for a lat/lon.
 * Uses fixed service-area NOAA stations for tides.
 */
const getWeatherSummary = async (latitude, longitude) => {
    const pointsData = await getPoints(latitude, longitude)
    const relativeLocation =
        pointsData?.properties?.relativeLocation?.properties
    const forecastUrl = pointsData?.properties?.forecast
    const forecastGridDataUrl = pointsData?.properties?.forecastGridData
    const stationsUrl = pointsData?.properties?.observationStations

    let windLabel = '-'
    let windDirectionDeg = null
    let temperature = '-'
    let weatherIconKey = 'sct'
    let weatherIconPeriod = 'day'

    const forecastData = await getForecast(forecastUrl)
    const currentPeriod = forecastData?.properties?.periods?.[0]
    if (currentPeriod) {
        windLabel = formatWindLabel(
            currentPeriod.windDirection,
            currentPeriod.windSpeed,
        )
        windDirectionDeg = getWindDirectionDeg(currentPeriod.windDirection)
        if (currentPeriod.temperature != null) {
            temperature = `${currentPeriod.temperature}°`
        }
        weatherIconKey = resolveWeatherIconKey(
            currentPeriod.shortForecast,
            currentPeriod.icon,
        )
        weatherIconPeriod = resolveWeatherIconPeriod(
            currentPeriod.icon,
            currentPeriod.isDaytime,
        )
    }

    const [observationData, gridData] = await Promise.all([
        getLatestObservation(stationsUrl),
        getGridData(forecastGridDataUrl),
    ])

    if (temperature === '-' || windLabel === '-') {
        const gridFallback = extractGridFallbackConditions(gridData)
        if (temperature === '-') {
            temperature = gridFallback.temperature
        }
        if (windLabel === '-') {
            windLabel = gridFallback.windLabel
            windDirectionDeg = gridFallback.windDirectionDeg
        }
    }

    const observationExtras = formatObservationExtras(observationData)
    const timeZone = pointsData?.properties?.timeZone || 'UTC'
    const todayWindow = getSevenDayKeys(timeZone)[0]
    const waveGrid = await getWaveGridData(latitude, longitude, gridData)
    const dayWaves = getWaveAndPeriodForDay(
        waveGrid,
        todayWindow.dayStartMs,
        todayWindow.dayEndMs,
    )
    const wave = formatWaveHeight(dayWaves.wave, dayWaves.waveUom)
    const period = formatWavePeriod(
        dayWaves.wave == null || dayWaves.wave === 0
            ? null
            : dayWaves.period,
    )

    const nearestArea = findNearestServiceArea(latitude, longitude)
    const tideArea = serviceAreaSupportsTides(nearestArea)
        ? nearestArea
        : findNearestCoastalServiceArea(latitude, longitude) ?? nearestArea
    const tides = await getHiLoTidesForArea(tideArea)

    return {
        fallbackAddress: relativeLocation
            ? `${relativeLocation.city}, ${relativeLocation.state}`
            : '',
        windLabel,
        windDirectionDeg,
        temperature,
        weatherIconKey,
        weatherIconPeriod,
        gust: observationExtras.gust,
        wave,
        period,
        lowTide: tides.lowTide,
        highTide: tides.highTide,
        serviceAreaId: tideArea?.id ?? nearestArea?.id ?? null,
        serviceAreaName: tideArea?.name ?? nearestArea?.name ?? '',
    }
}

/**
 * 7-day marine forecast including wave height + period per day.
 */
const parseMphValue = (speed) => {
    if (speed == null) {
        return null
    }
    if (typeof speed === 'number') {
        return Number.isFinite(speed) ? speed : null
    }
    const match = String(speed).match(/(\d+(?:\.\d+)?)/)
    return match ? Number(match[1]) : null
}

const getWeatherForecast = async (latitude, longitude, requestedTimeZone) => {
    const pointsData = await getPoints(latitude, longitude)
    const timeZone = resolveDisplayTimeZone(
        requestedTimeZone,
        pointsData?.properties?.timeZone,
        'UTC',
    )
    const forecastUrl = pointsData?.properties?.forecast
    const hourlyUrl = pointsData?.properties?.forecastHourly
    const forecastGridDataUrl = pointsData?.properties?.forecastGridData
    const stationsUrl = pointsData?.properties?.observationStations

    const [forecastData, hourlyData, observationData, gridData] =
        await Promise.all([
            getForecast(forecastUrl),
            getForecastHourly(hourlyUrl),
            getLatestObservation(stationsUrl),
            getGridData(forecastGridDataUrl),
        ])
    const waveGrid = await getWaveGridData(latitude, longitude, gridData)

    const observationExtras = formatObservationExtras(observationData)
    const forecastPeriods = forecastData?.properties?.periods ?? []
    const hourlyPeriods = hourlyData?.properties?.periods ?? []
    const hourlyGrouped = groupHourlyPeriodsByDay(hourlyPeriods, timeZone)
    const forecastGrouped = groupPeriodsByDay(forecastPeriods, timeZone)
    const dayKeys = getSevenDayKeys(timeZone)

    const days = dayKeys.map(
        ({ key, index, dayLabel, dateNum, dayStartMs, dayEndMs, sampleMs }) => {
        const hours = hourlyGrouped.get(key) ?? []
        const forecastDay = forecastGrouped.get(key)
        const forecastDisplay = forecastDay?.day ?? forecastDay?.night

        const temps = hours
            .map((hour) => hour.temperature)
            .filter((value) => typeof value === 'number')
        if (forecastDay?.temps?.length) {
            temps.push(...forecastDay.temps)
        }

        const daytimeHour =
            hours.find((hour) => {
                const hourOfDay = hourInZone(
                    new Date(hour.startTime),
                    timeZone,
                )
                return hourOfDay >= 11 && hourOfDay <= 16
            }) ??
            hours[Math.floor(hours.length / 2)] ??
            hours[0]

        const precipValues = hours.map(
            (hour) => hour.probabilityOfPrecipitation?.value ?? 0,
        )
        if (forecastDisplay?.probabilityOfPrecipitation?.value != null) {
            precipValues.push(
                forecastDisplay.probabilityOfPrecipitation.value,
            )
        }

        const hourlyGusts = hours
            .map((hour) => parseMphValue(hour.windGust))
            .filter((value) => value != null)
        const dayGustMph = hourlyGusts.length
            ? Math.round(Math.max(...hourlyGusts))
            : null
        const gridGustRaw = getMaxGridValueForDay(
            gridData?.properties?.windGust,
            dayStartMs,
            dayEndMs,
        )
        const gridGustMph =
            gridGustRaw != null
                ? Math.round(
                      toMph(gridGustRaw, gridData?.properties?.windGust?.uom),
                  )
                : null
        const gust =
            dayGustMph != null
                ? `${dayGustMph} mph`
                : gridGustMph != null
                  ? `${gridGustMph} mph`
                  : index === 0
                    ? observationExtras.gust
                    : '-'

        const gridFallback = extractGridFallbackConditions(
            gridData,
            sampleMs,
        )
        const visibility =
            index === 0 && observationExtras.visibility !== '-'
                ? observationExtras.visibility
                : gridFallback.visibility || '-'
        const pressure =
            index === 0 && observationExtras.pressure !== '-'
                ? observationExtras.pressure
                : gridFallback.pressure || '-'

        const dayWaves = getWaveAndPeriodForDay(
            waveGrid,
            dayStartMs,
            dayEndMs,
        )
        const wave = formatWaveHeight(dayWaves.wave, dayWaves.waveUom)
        const period = formatWavePeriod(
            dayWaves.wave == null || dayWaves.wave === 0
                ? null
                : dayWaves.period,
        )

        const temp =
            daytimeHour?.temperature ??
            forecastDisplay?.temperature ??
            null
        const windDirection =
            daytimeHour?.windDirection ??
            forecastDisplay?.windDirection ??
            null
        const windSpeed =
            daytimeHour?.windSpeed ?? forecastDisplay?.windSpeed ?? null

        let resolvedTemp = temp
        let resolvedWindDirection = (windDirection || '').trim() || '-'
        let resolvedWindSpeed = (windSpeed || '').trim() || '-'
        const speedMph = parseMphValue(resolvedWindSpeed)

        if (resolvedTemp == null && gridFallback.temperature !== '-') {
            const match = gridFallback.temperature.match(/(\d+)/)
            resolvedTemp = match ? Number(match[1]) : null
        }
        if (
            (resolvedWindDirection === '-' ||
                resolvedWindSpeed === '-' ||
                speedMph === 0) &&
            gridFallback.windLabel !== '-'
        ) {
            const windMatch = gridFallback.windLabel.match(
                /^([A-Za-z]{1,2})-\s*(\d+)/,
            )
            if (
                (resolvedWindDirection === '-' || speedMph === 0) &&
                windMatch?.[1]
            ) {
                resolvedWindDirection = windMatch[1]
            }
            if (
                (resolvedWindSpeed === '-' || speedMph === 0) &&
                windMatch?.[2]
            ) {
                resolvedWindSpeed = `${windMatch[2]} mph`
            }
        }
        if (
            resolvedWindSpeed !== '-' &&
            parseMphValue(resolvedWindSpeed) === 0
        ) {
            resolvedWindSpeed = 'Calm'
            if (resolvedWindDirection === '-') {
                resolvedWindDirection = '-'
            }
        }

        return {
            key,
            dayLabel,
            dateNum,
            temp: resolvedTemp,
            tempHigh: temps.length
                ? Math.max(...temps)
                : resolvedTemp,
            tempLow: temps.length ? Math.min(...temps) : resolvedTemp,
            precipPercent: precipValues.length
                ? Math.max(...precipValues)
                : null,
            windDirection: resolvedWindDirection,
            windSpeed: resolvedWindSpeed,
            gust,
            visibility,
            pressure,
            wave,
            period,
            weatherIconKey: resolveWeatherIconKey(
                daytimeHour?.shortForecast ?? forecastDisplay?.shortForecast,
                daytimeHour?.icon ?? forecastDisplay?.icon,
            ),
            weatherIconPeriod: resolveWeatherIconPeriod(
                daytimeHour?.icon ?? forecastDisplay?.icon,
                daytimeHour?.isDaytime ??
                    forecastDisplay?.isDaytime ??
                    true,
            ),
        }
    },
    )

    return { days }
}

/**
 * Tide chart detail for a fixed service-area station.
 */
const TIDE_CURVE_STEP_MS = 30 * 60 * 1000

/**
 * Subordinate NOAA stations (Daytona Beach Shores, St. Augustine city dock)
 * publish high/low predictions only. Hourly `interval=h` comes back empty,
 * which used to hide the whole tide chart. Fill the curve from those highs
 * and lows with a cosine so the beach still shows a tide day.
 */
const interpolateTideCurve = (events) => {
    const sorted = events
        .filter(
            (entry) =>
                Number.isFinite(entry.timestamp) &&
                Number.isFinite(entry.height),
        )
        .sort((a, b) => a.timestamp - b.timestamp)
    const points = []
    for (let i = 0; i < sorted.length - 1; i += 1) {
        const start = sorted[i]
        const end = sorted[i + 1]
        const span = end.timestamp - start.timestamp
        if (span <= 0) continue
        for (
            let timestamp = start.timestamp;
            timestamp < end.timestamp;
            timestamp += TIDE_CURVE_STEP_MS
        ) {
            const progress = (timestamp - start.timestamp) / span
            const height =
                start.height +
                ((end.height - start.height) * (1 - Math.cos(Math.PI * progress))) /
                    2
            points.push({ timestamp, height })
        }
    }
    const last = sorted[sorted.length - 1]
    if (last) {
        points.push({ timestamp: last.timestamp, height: last.height })
    }
    return points
}

const getTideDetail = async (serviceAreaId, requestedTimeZone) => {
    const area = getServiceAreaById(serviceAreaId)
    if (!area) {
        const error = new Error('Unknown service area')
        error.status = 404
        throw error
    }
    if (!serviceAreaSupportsTides(area) || !area.noaaStationId) {
        return null
    }

    const stationId = area.noaaStationId
    const timeZone = resolveDisplayTimeZone(
        requestedTimeZone,
        area.timeZone,
        'UTC',
    )
    const { todayYmd, beginDate, endDate } = noaaGmtRangeForZone(timeZone)
    const [hourlyPredictions, hiloEvents] = await Promise.all([
        fetchNoaaPredictions(stationId, 'h', beginDate, endDate),
        fetchNoaaPredictions(stationId, 'hilo', beginDate, endDate),
    ])

    const isLocalToday = (timestamp) =>
        ymdInZone(new Date(timestamp), timeZone) === todayYmd

    const toChartPoint = (timestamp, height) => ({
        timestamp,
        height,
        label: new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true,
            timeZone,
        }),
    })

    const hourlyPoints = hourlyPredictions
        .map((entry) => {
            const height = parseFloat(entry.v)
            const timestamp = parseNoaaPredictionTime(entry.t)
            return toChartPoint(timestamp, height)
        })
        .filter(
            (point) =>
                Number.isFinite(point.timestamp) &&
                Number.isFinite(point.height),
        )

    const tideEvents = hiloEvents.map(parseTideEvent)
    const sourcePoints = hourlyPoints.length
        ? hourlyPoints
        : interpolateTideCurve(tideEvents).map((point) =>
              toChartPoint(point.timestamp, point.height),
          )

    const chartPoints = sourcePoints.filter((point) =>
        isLocalToday(point.timestamp),
    )

    if (!chartPoints.length) {
        return null
    }

    const heights = chartPoints.map((point) => point.height)
    const minHeight = heights.length ? Math.min(...heights) : -1
    const maxHeight = heights.length ? Math.max(...heights) : 1
    const padding = 1
    const chartLow = Math.floor(minHeight - padding)
    const chartHigh = Math.ceil(maxHeight + padding)

    const allEvents = tideEvents
        .filter(
            (entry) =>
                Number.isFinite(entry.timestamp) &&
                Number.isFinite(entry.height),
        )
        .sort((a, b) => a.timestamp - b.timestamp)

    const markers = allEvents.filter((entry) => isLocalToday(entry.timestamp))

    const now = Date.now()
    const currentPoint =
        chartPoints.find((point, index) => {
            const nextPoint = chartPoints[index + 1]
            if (!nextPoint) {
                return true
            }
            return point.timestamp <= now && nextPoint.timestamp > now
        }) ?? chartPoints[0]

    const currentIndex = chartPoints.findIndex(
        (point) => point.timestamp === currentPoint?.timestamp,
    )
    const nextPoint = chartPoints[currentIndex + 1]
    const currentTrend =
        currentPoint && nextPoint && nextPoint.height >= currentPoint.height
            ? 'up'
            : 'down'

    const lastPastOf = (type) => {
        const past = allEvents.filter(
            (entry) => entry.type === type && entry.timestamp <= now,
        )
        return past[past.length - 1] ?? null
    }
    const nextOf = (type) =>
        allEvents.find(
            (entry) => entry.type === type && entry.timestamp >= now,
        )
    const firstTodayOf = (type) =>
        markers.find((entry) => entry.type === type) ?? null

    const nextHigh = nextOf('H')
    const nextLow = nextOf('L')
    const displayHigh = lastPastOf('H') ?? firstTodayOf('H')
    const displayLow = lastPastOf('L') ?? firstTodayOf('L')

    const dayStartTimestamp = zonedDateToUtcMs(todayYmd, timeZone, 0, 0)
    const dayEndTimestamp = zonedDateToUtcMs(
        addCalendarDays(todayYmd, 1),
        timeZone,
        0,
        0,
    )

    return {
        serviceAreaId: area.id,
        serviceAreaName: area.name,
        stationId,
        dayStartTimestamp,
        dayEndTimestamp,
        chartLow,
        chartHigh,
        chartPoints,
        markers,
        currentTimestamp: now,
        currentHeight: currentPoint?.height ?? null,
        currentTrend,
        moonPhase: getMoonPhaseName(),
        nextHighCountdown: nextHigh
            ? formatCountdown(nextHigh.timestamp)
            : '-',
        nextLowCountdown: nextLow ? formatCountdown(nextLow.timestamp) : '-',
        highTideTime: displayHigh
            ? formatClock(displayHigh.timestamp, timeZone)
            : '-',
        highTideHeight: displayHigh
            ? `${displayHigh.height.toFixed(2)}ft`
            : '-',
        lowTideTime: displayLow
            ? formatClock(displayLow.timestamp, timeZone)
            : '-',
        lowTideHeight: displayLow
            ? `${displayLow.height.toFixed(2)}ft`
            : '-',
    }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const normalizeBbox = (minLat, minLon, maxLat, maxLon) => {
    let south = Math.min(minLat, maxLat)
    let north = Math.max(minLat, maxLat)
    let west = Math.min(minLon, maxLon)
    let east = Math.max(minLon, maxLon)

    south = clamp(south, -85, 85)
    north = clamp(north, -85, 85)
    west = clamp(west, -180, 180)
    east = clamp(east, -180, 180)

    let latSpan = north - south
    let lonSpan = east - west
    const latMid = (south + north) / 2
    const lonMid = (west + east) / 2

    if (latSpan < WIND_MIN_SPAN_DEG) {
        south = clamp(latMid - WIND_MIN_SPAN_DEG / 2, -85, 85)
        north = clamp(latMid + WIND_MIN_SPAN_DEG / 2, -85, 85)
        latSpan = north - south
    }
    if (lonSpan < WIND_MIN_SPAN_DEG) {
        west = clamp(lonMid - WIND_MIN_SPAN_DEG / 2, -180, 180)
        east = clamp(lonMid + WIND_MIN_SPAN_DEG / 2, -180, 180)
        lonSpan = east - west
    }
    if (latSpan > WIND_MAX_SPAN_DEG) {
        south = latMid - WIND_MAX_SPAN_DEG / 2
        north = latMid + WIND_MAX_SPAN_DEG / 2
        latSpan = WIND_MAX_SPAN_DEG
    }
    if (lonSpan > WIND_MAX_SPAN_DEG) {
        west = lonMid - WIND_MAX_SPAN_DEG / 2
        east = lonMid + WIND_MAX_SPAN_DEG / 2
        lonSpan = WIND_MAX_SPAN_DEG
    }

    return { south, west, north, east, latSpan, lonSpan }
}

const buildWindGrid = (bbox) => {
    const { south, west, north, east, latSpan, lonSpan } = bbox
    const steps = WIND_GRID_SIZE - 1
    const latStep = latSpan / steps
    const lonStep = lonSpan / steps
    const lats = []
    const lons = []
    for (let row = 0; row < WIND_GRID_SIZE; row += 1) {
        for (let col = 0; col < WIND_GRID_SIZE; col += 1) {
            lats.push(Number((south + row * latStep).toFixed(4)))
            lons.push(Number((west + col * lonStep).toFixed(4)))
        }
    }
    return {
        lats,
        lons,
        cellLatDeg: latStep,
        cellLonDeg: lonStep,
    }
}

const toIsoUtcHour = (value) => {
    if (!value) {
        return null
    }
    const withZone = /Z|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`
    const date = new Date(withZone)
    if (Number.isNaN(date.getTime())) {
        return null
    }
    return date.toISOString()
}

const asOpenMeteoList = (payload) => {
    if (Array.isArray(payload)) {
        return payload
    }
    if (payload && typeof payload === 'object') {
        return [payload]
    }
    return []
}

/**
 * Gridded 10m wind for a map bbox. Open-Meteo is used because NWS gridpoint
 * APIs are one cell per request and cannot fill a regional map efficiently.
 */
const getWindField = async (minLat, minLon, maxLat, maxLon) => {
    const bbox = normalizeBbox(minLat, minLon, maxLat, maxLon)
    const cacheKey = `wind:${bbox.south.toFixed(2)},${bbox.west.toFixed(2)},${bbox.north.toFixed(2)},${bbox.east.toFixed(2)}`

    const { value } = await weatherCache.getOrSet(
        cacheKey,
        TTL.WIND_FIELD_MS,
        async () => {
            const grid = buildWindGrid(bbox)
            const url =
                `${OPEN_METEO_FORECAST_URL}` +
                `?latitude=${grid.lats.join(',')}` +
                `&longitude=${grid.lons.join(',')}` +
                `&hourly=wind_speed_10m,wind_direction_10m` +
                `&wind_speed_unit=mph` +
                `&forecast_days=${WIND_FORECAST_DAYS}` +
                `&timezone=UTC`

            const payload = await fetchJson(url, OPEN_METEO_HEADERS, {
                required: true,
            })
            const locations = asOpenMeteoList(payload)
            if (!locations.length || locations[0]?.error) {
                const reason = locations[0]?.reason || 'Open-Meteo wind field unavailable'
                throw new Error(reason)
            }

            const hours = (locations[0]?.hourly?.time ?? [])
                .map(toIsoUtcHour)
                .filter(Boolean)

            const points = grid.lats.map((lat, index) => {
                const location = locations[index] ?? locations[0]
                const speeds = (location?.hourly?.wind_speed_10m ?? []).map(
                    (speed) =>
                        speed == null || !Number.isFinite(Number(speed))
                            ? null
                            : Math.round(Number(speed) * 10) / 10,
                )
                const directions = (location?.hourly?.wind_direction_10m ?? []).map(
                    (deg) =>
                        deg == null || !Number.isFinite(Number(deg))
                            ? null
                            : Math.round(Number(deg)),
                )
                return {
                    lat,
                    lon: grid.lons[index],
                    speeds,
                    directions,
                }
            })

            return {
                hours,
                cellLatDeg: Number(grid.cellLatDeg.toFixed(4)),
                cellLonDeg: Number(grid.cellLonDeg.toFixed(4)),
                points,
            }
        },
    )

    return value
}

const RAINVIEWER_MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json'
const RAINVIEWER_HEADERS = {
    Accept: 'application/json',
    'User-Agent': NWS_USER_AGENT,
}
const RADAR_TILE_SIZE = 256
/** NEXRAD Level III — US storm radar greens/yellows/reds. */
const RADAR_COLOR_SCHEME = 6
const RADAR_OPTIONS = '1_1'

const buildRadarTileUrl = (host, path, colorScheme = RADAR_COLOR_SCHEME, options = RADAR_OPTIONS) =>
    `${String(host).replace(/\/$/, '')}${path}/${RADAR_TILE_SIZE}/{z}/{x}/{y}/${colorScheme}/${options}.png`

const mapRadarFrame = (
    item,
    kind,
    host,
    colorScheme = RADAR_COLOR_SCHEME,
    options = RADAR_OPTIONS,
) => {
    const time = Number(item?.time)
    const path = String(item?.path || '').trim()
    if (!Number.isFinite(time) || time <= 0 || !path) {
        return null
    }
    return {
        time,
        iso: new Date(time * 1000).toISOString(),
        kind,
        path,
        tileUrl: buildRadarTileUrl(host, path, colorScheme, options),
    }
}

/**
 * RainViewer composite radar frames for the storm loop (past ~2h, plus
 * nowcast when the public API includes it). Tile URLs are xyz templates.
 */
const getRadarFrames = async () => {
    const { value } = await weatherCache.getOrSet(
        'radar:frames',
        TTL.RADAR_MS,
        async () => {
            const payload = await fetchJson(RAINVIEWER_MAPS_URL, RAINVIEWER_HEADERS, {
                required: true,
            })
            const host = String(
                payload?.host || 'https://tilecache.rainviewer.com',
            ).replace(/\/$/, '')
            const past = Array.isArray(payload?.radar?.past)
                ? payload.radar.past
                : []
            const nowcast = Array.isArray(payload?.radar?.nowcast)
                ? payload.radar.nowcast
                : []

            const pastFrames = past
                .map((item) => mapRadarFrame(item, 'past', host))
                .filter(Boolean)
            const nowcastFrames = nowcast
                .map((item) => mapRadarFrame(item, 'nowcast', host))
                .filter(Boolean)
            const frames = [...pastFrames, ...nowcastFrames]
            if (!frames.length) {
                throw new Error('Radar frames unavailable')
            }

            const infrared = Array.isArray(payload?.satellite?.infrared)
                ? payload.satellite.infrared
                : []
            const satelliteFrames = infrared
                .map((item) => mapRadarFrame(item, 'past', host, 0, '0_0'))
                .filter(Boolean)

            return {
                generated: Number(payload?.generated) || Math.floor(Date.now() / 1000),
                host,
                tileSize: RADAR_TILE_SIZE,
                maxzoom: 7,
                nowIndex: Math.max(pastFrames.length - 1, 0),
                frames,
                satelliteFrames,
                satelliteNowIndex: Math.max(satelliteFrames.length - 1, 0),
            }
        },
    )

    return value
}

module.exports = {
    getWeatherSummary,
    getWeatherForecast,
    getTideDetail,
    getWindField,
    getRadarFrames,
    SERVICE_AREAS,
}
