import multer from 'multer'

// Configure multer storage engine (memory-based)
const storage = multer.memoryStorage()

// validation parameters
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']

/**
 * multer() creates a multer instance with an options object
 * containing 3 main options (storage, limits and fileFilter)
 *  - storage (engine) : either memory or disk.
 *  - limits : constraints enforced on the file(s).
 *  - fileFilter : a function to be called on each file.
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Check MIME Type and decide
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true) // accept the file
    } else {
      cb(
        new Error('Invalid file type. Only JPEG and PNG images are allowed'),
        false
      ) // reject the file
    }
  },
}).single('avatar') // get a single field named "avatar" from the request

/**
 * Avatar upload middleware wrapper
 * Handles file upload, parsing, validation, and error formatting
 */
export function avatarUpload(req, res, next) {
  upload(req, res, (err) => {
    // Handle "Multer" errors
    if (err instanceof multer.MulterError) {
      // file limit exceeded
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: `File too large. Maximum size ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        })
      }

      // unknown field or more than defined num of fields
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          error: 'Unexpected field name. Use "avatar" as the field name.',
        })
      }
    }

    if (err) {
      return res.status(400).json({
        error: err.message,
      })
    }

    // check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      })
    }

    next() // Move on to the next middleware
  })
}
