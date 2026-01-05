import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'ap-northeast-2';
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
  console.warn(
    'AWS credentials or bucket name not set. S3 functionality will not work.',
  );
}

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'uploads',
): Promise<string> => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${folder}/${uniqueSuffix}.${fileExtension}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    //    ACL: 'public-read' as const,
  };

  const command = new PutObjectCommand(uploadParams);
  await s3Client.send(command);

  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileName}`;
};

export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  const fileName = fileUrl.split('.amazonaws.com/')[1];

  if (!fileName) {
    throw new Error('Invalid S3 URL');
  }

  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  };

  const command = new DeleteObjectCommand(deleteParams);
  await s3Client.send(command);
};

export const getPresignedUrl = async (
  fileUrl: string,
  expiresIn: number = 3600,
): Promise<string> => {
  const fileName = fileUrl.split('.amazonaws.com/')[1];

  if (!fileName) {
    throw new Error('Invalid S3 URL');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
};
