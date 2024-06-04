import "dotenv/config";
export const port = Number(process.env.PORT);
export const DbUrl = String(process.env.DB_URL);
export const AwsBucketName = String(process.env.AWS_BUCKET_NAME);
export const AwsRegion = String(process.env.AWS_REGION);
export const AwsAccessKey = String(process.env.AWS_ACCESS_KEY);
export const AwsSecretKey = String(process.env.AWS_SECRET_KEY);
