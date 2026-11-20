const {
    getWeatherSummary,
    getWeatherForecast,
    getTideDetail,
    getWindField,
    getRadarFrames,
    SERVICE_AREAS,
} = require('../helpers/weatherService')

const parseCoord = (value) => {
    const num = Number(value)
    if (!Number.isFinite(num)) {
        return null
    }
    return num
}

module.exports = {
    getSummary: async (req, res) => {
        try {
            const latitude = parseCoord(req.query.lat)
            const longitude = parseCoord(req.query.lon)

            if (latitude == null || longitude == null) {
                return res.status(400).send({
                    success: false,
                    message: 'lat and lon query params are required',
                })
            }

            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return res.status(400).send({
                    success: false,
                    message: 'lat/lon out of range',
                })
            }

            const data = await getWeatherSummary(latitude, longitude)
            return res.status(200).send({
                success: true,
                message: 'Weather summary retrieved',
                data,
            })
        } catch (e) {
            console.log('Weather summary error :: ', e.message || e)
            return res.status(e.status && e.status < 500 ? e.status : 400).send({
                success: false,
                message: e.message || 'Unable to load weather summary',
            })
        }
    },

    getForecast: async (req, res) => {
        try {
            const latitude = parseCoord(req.query.lat)
            const longitude = parseCoord(req.query.lon)

            if (latitude == null || longitude == null) {
                return res.status(400).send({
                    success: false,
                    message: 'lat and lon query params are required',
                })
            }

            const data = await getWeatherForecast(
                latitude,
                longitude,
                req.query.timeZone,
            )
            return res.status(200).send({
                success: true,
                message: 'Weather forecast retrieved',
                data,
            })
        } catch (e) {
            console.log('Weather forecast error :: ', e.message || e)
            return res.status(e.status && e.status < 500 ? e.status : 400).send({
                success: false,
                message: e.message || 'Unable to load weather forecast',
            })
        }
    },

    getTides: async (req, res) => {
        try {
            const serviceAreaId = String(req.query.serviceAreaId || '').trim()
            if (!serviceAreaId) {
                return res.status(400).send({
                    success: false,
                    message: 'serviceAreaId query param is required',
                })
            }

            const data = await getTideDetail(
                serviceAreaId,
                req.query.timeZone,
            )
            return res.status(200).send({
                success: true,
                message: data
                    ? 'Tide detail retrieved'
                    : 'Tides unavailable for this service area',
                data,
            })
        } catch (e) {
            console.log('Weather tides error :: ', e.message || e)
            return res.status(e.status && e.status < 500 ? e.status : 400).send({
                success: false,
                message: e.message || 'Unable to load tides',
            })
        }
    },

    getServiceAreas: async (_req, res) => {
        try {
            return res.status(200).send({
                success: true,
                message: 'Service areas retrieved',
                data: SERVICE_AREAS,
            })
        } catch (e) {
            return res.status(400).send({
                success: false,
                message: e.message,
            })
        }
    },

    getWindField: async (req, res) => {
        try {
            const minLat = parseCoord(req.query.minLat)
            const minLon = parseCoord(req.query.minLon)
            const maxLat = parseCoord(req.query.maxLat)
            const maxLon = parseCoord(req.query.maxLon)

            if (
                minLat == null ||
                minLon == null ||
                maxLat == null ||
                maxLon == null
            ) {
                return res.status(400).send({
                    success: false,
                    message:
                        'minLat, minLon, maxLat, and maxLon query params are required',
                })
            }

            if (
                minLat < -90 ||
                minLat > 90 ||
                maxLat < -90 ||
                maxLat > 90 ||
                minLon < -180 ||
                minLon > 180 ||
                maxLon < -180 ||
                maxLon > 180
            ) {
                return res.status(400).send({
                    success: false,
                    message: 'bbox lat/lon out of range',
                })
            }

            const data = await getWindField(minLat, minLon, maxLat, maxLon)
            return res.status(200).send({
                success: true,
                message: 'Wind field retrieved',
                data,
            })
        } catch (e) {
            console.log('Weather wind-field error :: ', e.message || e)
            return res.status(e.status && e.status < 500 ? e.status : 400).send({
                success: false,
                message: e.message || 'Unable to load wind field',
            })
        }
    },

    getRadar: async (_req, res) => {
        try {
            const data = await getRadarFrames()
            return res.status(200).send({
                success: true,
                message: 'Radar frames retrieved',
                data,
            })
        } catch (e) {
            console.log('Weather radar error :: ', e.message || e)
            return res.status(e.status && e.status < 500 ? e.status : 400).send({
                success: false,
                message: e.message || 'Unable to load radar',
            })
        }
    },
}
