import { IMediaService, IUploadResult } from '../interface/IMedia.service'
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import s3Client, { S3_BUCKET } from '../../config/s3.config'
import { v4 as uuidv4 } from 'uuid'

export class MediaService implements IMediaService {
  async uploadImage(
    buffer: Buffer,
    filename?: string,
    folder: string = process.env.AWS_S3_FOLDER || 'user/guests'
  ): Promise<IUploadResult> {
    // Generate unique key for S3
    const timestamp = Date.now()
    const uniqueId = uuidv4()
    const sanitizedFilename = filename || 'document.jpg'
    const key = `${folder}/${timestamp}-${uniqueId}-${sanitizedFilename}`

    // Upload to S3 (PRIVATE - no public/ACL specified)
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg', // Could be made dynamic based on file type
      // NO ACL specified - file is private by default
    })

    await s3Client.send(command)

    // Generate a signed URL (valid for 15 minutes) instead of direct URL
    const url = await this.getSignedUrl(key)

    return { publicId: key, url }
  }

  /**
   * Generate a pre-signed URL for secure, temporary access to private documents
   * @param key - S3 object key
   * @param expiresIn - Expiration time in seconds (default: 900 = 15 minutes)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })

    // Generate signed URL that expires after specified time
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return signedUrl
  }

  async deleteImage(publicId: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: publicId,
    })

    await s3Client.send(command)
  }
}
