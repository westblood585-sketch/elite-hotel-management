import multer from 'multer'
import CustomError from '../utils/CustomError'
import { HttpStatus } from '../enums/http.status'

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB || 5)
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024

const storage = multer.memoryStorage()

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(
      new CustomError('Only image uploads are allowed', HttpStatus.BAD_REQUEST)
    )
  }
  cb(null, true)
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
})
