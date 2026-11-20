const directory = require('path')
const fs = require('fs')
const { UPLOADS_ROOT, ensureUploadDir } = require('./uploads')

const makeFolders = (() => {
    if (!fs.existsSync(UPLOADS_ROOT)) {
        fs.mkdirSync(UPLOADS_ROOT, { recursive: true })
    }
    ;['images', 'documents', 'chat', 'packages'].forEach(ensureUploadDir)
})

const removeImage = ((filePath) => {
    if (!filePath) return
    // Accept `uploads/...` relative or absolute under UPLOADS_ROOT
    const normalized = String(filePath).replace(/\\/g, '/')
    const uploadsIdx = normalized.lastIndexOf('uploads/')
    const relative = uploadsIdx >= 0
        ? normalized.slice(uploadsIdx + 'uploads/'.length)
        : normalized.replace(/^\//, '')
    const absolute = directory.join(UPLOADS_ROOT, relative)
    if (fs.existsSync(absolute)) {
        fs.unlinkSync(absolute)
    }
})

module.exports = { removeImage, makeFolders }