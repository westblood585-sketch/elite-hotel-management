export interface IUploadResult {
  publicId: string
  url: string
}

export interface IMediaService {
  uploadImage(
    buffer: Buffer,
    filename?: string,
    folder?: string
  ): Promise<IUploadResult>
  deleteImage(publicId: string): Promise<void>
  getSignedUrl?(key: string, expiresIn?: number): Promise<string> // Optional: for signed URLs
}
