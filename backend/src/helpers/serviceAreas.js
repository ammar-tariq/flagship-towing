/**
 * Flagship service areas used for tides selection.
 * Keep in sync with mobileFlagship/src/Utils/serviceAreas.ts
 * Coastal areas map to fixed NOAA CO-OPS stations (not discovered dynamically).
 */
const SERVICE_AREAS = [
    {
        id: 'lake-travis-tx',
        name: 'Lake Travis, TX',
        latitude: 30.388,
        longitude: -97.94,
        noaaStationId: null,
        timeZone: 'America/Chicago',
    },
    {
        id: 'lake-austin-tx',
        name: 'Lake Austin, TX',
        latitude: 30.295,
        longitude: -97.785,
        noaaStationId: null,
        timeZone: 'America/Chicago',
    },
    {
        id: 'lake-lbj-tx',
        name: 'Lake LBJ, TX',
        latitude: 30.56,
        longitude: -98.35,
        noaaStationId: null,
        timeZone: 'America/Chicago',
    },
    {
        id: 'lake-ray-hubbard-tx',
        name: 'Lake Ray Hubbard, TX',
        latitude: 32.83,
        longitude: -96.51,
        noaaStationId: null,
        timeZone: 'America/Chicago',
    },
    {
        id: 'lake-conroe-tx',
        name: 'Lake Conroe, TX',
        latitude: 30.42,
        longitude: -95.58,
        noaaStationId: null,
        timeZone: 'America/Chicago',
    },
    {
        id: 'galveston-bay-tx',
        name: 'Galveston Bay, TX',
        latitude: 29.55,
        longitude: -94.85,
        noaaStationId: '8771013',
        timeZone: 'America/Chicago',
    },
    {
        id: 'tampa-bay-fl',
        name: 'Tampa Bay, FL',
        latitude: 27.76,
        longitude: -82.54,
        noaaStationId: '8726520',
        timeZone: 'America/New_York',
    },
    {
        id: 'fort-myers-fl',
        name: 'Fort Myers, FL',
        latitude: 26.64,
        longitude: -81.87,
        noaaStationId: '8725520',
        timeZone: 'America/New_York',
    },
    {
        id: 'miami-fl',
        name: 'Miami, FL',
        latitude: 25.76,
        longitude: -80.19,
        noaaStationId: '8723214',
        timeZone: 'America/New_York',
    },
    {
        id: 'fort-lauderdale-fl',
        name: 'Fort Lauderdale, FL',
        latitude: 26.12,
        longitude: -80.14,
        noaaStationId: '8722937',
        timeZone: 'America/New_York',
    },
    {
        id: 'daytona-beach-fl',
        name: 'Daytona Beach, FL',
        latitude: 29.21,
        longitude: -81.02,
        noaaStationId: '8721120',
        timeZone: 'America/New_York',
    },
    {
        id: 'saint-augustine-fl',
        name: 'Saint Augustine, FL',
        latitude: 29.89,
        longitude: -81.31,
        noaaStationId: '8720576',
        timeZone: 'America/New_York',
    },
]

const toRadians = (degrees) => (degrees * Math.PI) / 180

const distanceMiles = (lat1, lon1, lat2, lon2) => {
    const earthRadiusMiles = 3958.8
    const dLat = toRadians(lat2 - lat1)
    const dLon = toRadians(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
    return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const findNearestServiceArea = (latitude, longitude) => {
    if (!SERVICE_AREAS.length) {
        return null
    }

    let nearest = SERVICE_AREAS[0]
    let nearestDistance = Number.POSITIVE_INFINITY

    SERVICE_AREAS.forEach((area) => {
        const distance = distanceMiles(
            latitude,
            longitude,
            area.latitude,
            area.longitude,
        )
        if (distance < nearestDistance) {
            nearestDistance = distance
            nearest = area
        }
    })

    return nearest
}

const getServiceAreaById = (id) =>
    SERVICE_AREAS.find((area) => area.id === id) ?? null

const serviceAreaSupportsTides = (area) => Boolean(area?.noaaStationId)

const findNearestCoastalServiceArea = (latitude, longitude) => {
    const coastal = SERVICE_AREAS.filter((area) => serviceAreaSupportsTides(area))
    if (!coastal.length) {
        return null
    }

    let nearest = coastal[0]
    let nearestDistance = Number.POSITIVE_INFINITY

    coastal.forEach((area) => {
        const distance = distanceMiles(
            latitude,
            longitude,
            area.latitude,
            area.longitude,
        )
        if (distance < nearestDistance) {
            nearestDistance = distance
            nearest = area
        }
    })

    return nearest
}

module.exports = {
    SERVICE_AREAS,
    findNearestServiceArea,
    findNearestCoastalServiceArea,
    getServiceAreaById,
    serviceAreaSupportsTides,
}
