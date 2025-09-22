import { s3Client, AVATAR_PREFIX, S3_BUCKET } from '../config/index.js'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export async function uploadAvatarToS3(userId, fileBuffer, mimetype) {
  const key = `${AVATAR_PREFIX}${userId}`

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
    Metadata: {
      userId,
      type: 'avatar',
      uploadAt: new Date().toISOString(),
    },
  })

  try {
    const result = await s3Client.send(command)
    return {
      key,
      etag: result.ETag,
    }
  } catch (error) {
    throw new Error(`Failed to upload to S3: ${error.message}`)
  }
}
