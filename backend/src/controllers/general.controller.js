const { join } = require("path");
const User = require("../models/user.model")
const { ROLES } = require("../utils");
const { toPublicUploadUrl } = require("../helpers/uploads");
const { getRequestUploadsBaseUrl } = require("../configs/serverUrl");

const upload = (async (req, res) => {
    try {

        if (!req.file) {
            throw new Error("No File Uploaded")
        }

        // Absolute disk path from multer → public https URL (same as packages).
        const path = toPublicUploadUrl(req.file.path)
        if (!path) {
            throw new Error("Upload succeeded but no public path could be built")
        }

        return res.status(200).send({
            success: true,
            data: {
                path,
            }
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getDashboardData = async (req, res) => {
    try {

        const { year } = req.query

        const user_count = await User.countDocuments({ role: ROLES.USER })

        let current_year = Number(year) ?? new Date()?.getFullYear()

        const registration_stats = await User.aggregate([
            {
                $match: {
                    role: ROLES.USER,
                    createdAt: {
                        $gte: new Date(`${current_year}-01-01T00:00:00.000Z`),
                        $lt: new Date(`${current_year + 1}-01-01T00:00:00.000Z`)
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const stats = Array(12).fill(0).map((_, index) => ({
            month: months[index],
            count: registration_stats.find(u => u._id === index + 1)?.count || 0
        }));

        let data = {
            user_count,
            stats
        };

        return res.status(200).send({
            success: true,
            data,
        });

    } catch (e) {
        console.log("Error Message :: ", e);
        return res.status(400).send({
            success: false,
            message: e.message,
        });
    }
};

const getData = async (req, res) => {
    try {

        let data = {

            coordinates: [
                {
                    // pompano beach
                    lat: 26.2292647080566,
                    lng: -80.12505691241843,
                    radius: 80467.2
                },
                {
                    // matlata beach
                    lat: 26.62990037067933,
                    lng: -82.07090373189963,
                    radius: 80467.2
                },
                {
                    // st peterburg
                    lat: 27.767514649833522,
                    lng: -82.64032522902595,
                    radius: 75462.14
                },
                {
                    // ormand beach
                    lat: 29.301345,
                    lng: -81.010879,
                    radius: 33538.729
                },
                {
                    // st. augustine
                    lat: 29.844858520507213,
                    lng: -81.2674057818771,
                    radius: 40233.6
                },
                {
                    // Kemah
                    lat: 29.54265382863149,
                    lng: -95.02054251954385,
                    radius: 80467.2
                },
                {
                    // Lake conroe
                    lat: 30.458789510695517,
                    lng: -95.6019519322551,
                    radius: 14564.56
                },
                {
                    // Lake Austin
                    lat: 30.28996583393178,
                    lng: -97.79188589174744,
                    radius: 14500.16
                },
                {
                    // Lake Travis
                    lat: 30.42344524689885,
                    lng: -98.02172812070263,
                    radius: 11394.16
                },
                {
                    // Lake LBJ
                    lat: 30.61570392805274,
                    lng: -98.41109087852413,
                    radius: 10653.86
                },
                {
                    // Lake Ray Hubbard
                    lat: 32.90735400482264,
                    lng: -96.50322874282303,
                    radius: 11780.4
                },
            ]

            // coordinates: [
            //     {
            //         lat: 30.294332156,
            //         lng: -97.786330188,
            //         radius: 1000
            //     },
            //     {
            //         lat: 30.55333112,
            //         lng: -98.335998656,
            //         radius: 1000
            //     },
            //     {
            //         lat: 30.388498446,
            //         lng: -97.903996384,
            //         radius: 1000
            //     },
            //     {
            //         lat: 27.96916279,
            //         lng: -82.458831498,
            //         radius: 1000
            //     },
            //     {
            //         lat: 29.30135,
            //         lng: -94.7977,
            //         radius: 1000
            //     },
            //     {
            //         lat: 30.35416525,
            //         lng: -95.556164442,
            //         radius: 1000
            //     },
            //     {
            //         lat: 29.541164502,
            //         lng: -95.026166562,
            //         radius: 1000
            //     },
            //     {
            //         lat: 32.792996828,
            //         lng: -96.490331372,
            //         radius: 1000
            //     },
            //     {
            //         lat: 26.12231,
            //         lng: -80.14338,
            //         radius: 1000
            //     },
            //     {
            //         lat: 25.785996856,
            //         lng: -80.221165782,
            //         radius: 1000
            //     },
            //     {
            //         lat: 29.889829774,
            //         lng: -81.307998768,
            //         radius: 1000
            //     },
            //     {
            //         lat: 29.207309,
            //         lng: -81.0379,
            //         radius: 1000
            //     },
            //     {
            //         lat: 26.62168,
            //         lng: -81.84059,
            //         radius: 1000
            //     },
            // ]

        }

        return res.status(200).send({
            success: true,
            data,
        });

    } catch (e) {
        console.log("Error Message :: ", e);
        return res.status(400).send({
            success: false,
            message: e.message,
        });
    }
};

const getBoatingLocations = async (req, res) => {
    try {
        const boating_locations = require(join(__dirname, "../../content/boating_locations.json"))

        return res.status(200).send({
            success: true,
            data: boating_locations,
        })
    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message,
        })
    }
}

const getContent = async (req, res) => {
    try {

        let base = `${getRequestUploadsBaseUrl(req)}/`
        let faqs = require(join(__dirname, "../../content/faqs.json"))
        let safety_tips = require(join(__dirname, "../../content/safety_tips.json"))
        let emergency_situation = require(join(__dirname, "../../content/emergency_situation.json"))

        let data = {
            about_us: base + "about-us.html",
            privacy_policy: base + "privacy-policy.html",
            terms_and_conditions: base + "terms-and-conditions.html",
            member_agreement: base + "member-agreement.html",
            locations: base + "locations.html",
            locationsFrame: base + "locations-frame.html",
            faqs,
            safety_tips,
            emergency_situation
        };

        return res.status(200).send({
            success: true,
            data,
        });

    } catch (e) {
        console.log("Error Message :: ", e);
        return res.status(400).send({
            success: false,
            message: e.message,
        });
    }
};

module.exports = {
    upload,
    getData,
    getContent,
    getDashboardData,
    getBoatingLocations,
}