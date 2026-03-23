import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  maxAttempts: 3,
  requestHandler: new NodeHttpHandler({
    requestTimeout: 300000,
    connectionTimeout: 30000,
  }),
});

export default r2Client;
export const R2_BUCKET = process.env.R2_BUCKET_NAME;
