const { S3Client } = require("@aws-sdk/client-s3");

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return process.env[name];
}

function getR2Client() {
  const accountId = requireEnv("CF_ACCOUNT_ID");
  const accessKeyId = requireEnv("CF_R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("CF_R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

function getBucketName() {
  return requireEnv("CF_R2_BUCKET_NAME");
}

function getPublicBaseUrl() {
  return process.env.CF_R2_PUBLIC_BASE_URL || "";
}

module.exports = {
  getR2Client,
  getBucketName,
  getPublicBaseUrl,
  requireEnv
};
