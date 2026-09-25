import multer from 'multer'
import CustomError from '../utils/CustomError'
import { HttpStatus } from '../enums/http.status'

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 5)
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

const storage = multer.memoryStorage()

// Allowed MIME types and their magic numbers (file signatures)
const ALLOWED_IMAGE_TYPES = [
  { mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif', magic: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', magic: [0x52, 0x49, 0x46, 0x46] }, // WebP starts with RIFF
]

// Validate file signature (magic number) to prevent MIME type spoofing
const validateFileSignature = (buffer: Buffer): boolean => {
  return ALLOWED_IMAGE_TYPES.some((type) => {
    const magic = type.magic
    for (let i = 0; i < magic.length; i++) {
      if (buffer[i] !== magic[i]) return false
    }
    return true
  })
}

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  // Check MIME type first
  const allowedMimeTypes = ALLOWED_IMAGE_TYPES.map((t) => t.mime)
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new CustomError(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed',
        HttpStatus.BAD_REQUEST
      )
    )
  }
  
  cb(null, true)
}

// Custom middleware to validate file content after upload
export const validateImageContent = (
  req: any,
  res: any,
  next: any
) => {
  const file = req.file as Express.Multer.File | undefined

  if (!file) {
    return next()
  }

  // Validate file signature
  if (!validateFileSignature(file.buffer)) {
    return next(
      new CustomError(
        'Invalid file format. File content does not match expected image format',
        HttpStatus.BAD_REQUEST
      )
    )
  }

  // Additional validation: check minimum file size (avoid empty/corrupted files)
  if (file.buffer.length < 100) {
    return next(
      new CustomError(
        'File is too small or corrupted',
        HttpStatus.BAD_REQUEST
      )
    )
  }

  next()
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only allow one file at a time
  },
})
