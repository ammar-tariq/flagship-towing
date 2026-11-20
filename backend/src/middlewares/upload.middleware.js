const multer = require("multer");
const path = require("path")
const { ensureUploadDir } = require("../helpers/uploads")

const ALLOWED_MIME_BY_FOLDER = {
    images: new Set([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/heic',
        'image/heif',
    ]),
    documents: new Set([
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
    ]),
    chat: new Set([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'audio/mpeg',
        'audio/mp4',
        'video/mp4',
    ]),
    quiz: new Set([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'application/pdf',
    ]),
    packages: new Set([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
    ]),
}

const DEFAULT_ALLOWED = ALLOWED_MIME_BY_FOLDER.images

const storage = (folder) =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            // Absolute path under backendFlagship/uploads — matches express.static.
            // Relative `uploads/...` follows process.cwd() and can 404 on GET.
            try {
                cb(null, ensureUploadDir(folder));
            } catch (err) {
                cb(err);
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 10)
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
    });

const fileFilterFor = (folder) => (req, file, cb) => {
    const allowed = ALLOWED_MIME_BY_FOLDER[folder] || DEFAULT_ALLOWED
    if (allowed.has(file.mimetype)) {
        return cb(null, true)
    }
    return cb(new Error(`File type not allowed: ${file.mimetype}`))
};

const upload = (folder) => {
    return multer({
        storage: storage(folder),
        fileFilter: fileFilterFor(folder),
        limits: { fileSize: 15 * 1024 * 1024 },
    })
}

module.exports = upload;
