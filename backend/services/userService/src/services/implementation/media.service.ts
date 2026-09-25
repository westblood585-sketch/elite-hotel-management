import { IMediaService, IUploadResult } from '../interface/IMedia.service'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import s3Client, { S3_BUCKET } from '../../config/s3.config'
import { v4 as uuidv4 } from 'uuid'

export class MediaService implements IMediaService {
  async uploadImage(
    buffer: Buffer,
    filename?: string,
    folder: string = process.env.AWS_S3_FOLDER || 'user/avatars'
  ): Promise<IUploadResult> {
    // Generate unique key for S3
    const timestamp = Date.now()
    const uniqueId = uuidv4()
    const sanitizedFilename = filename || 'avatar.jpg'
    const key = `${folder}/${timestamp}-${uniqueId}-${sanitizedFilename}`

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg', // Could be made dynamic based on file type
    })

    await s3Client.send(command)

    // Construct the S3 URL
    const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    return { publicId: key, url }
  }

  async deleteImage(publicId: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: publicId,
    })

    await s3Client.send(command)
  }
}
