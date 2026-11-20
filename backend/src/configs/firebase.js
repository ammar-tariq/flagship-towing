const admin = require("firebase-admin");

const serviceAccount = require("./flagshiptowing.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = admin