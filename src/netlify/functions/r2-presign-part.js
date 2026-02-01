const { UploadPartCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getR2Client, getBucketName } = require("./r2-client");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { key, uploadId, partNumber } = JSON.parse(event.body || "{}");
    if (!key || !uploadId || !partNumber) {
      return { statusCode: 400, body: "Missing key, uploadId, or partNumber" };
    }

    const client = getR2Client();
    const command = new UploadPartCommand({
      Bucket: getBucketName(),
      Key: key,
      UploadId: uploadId,
      PartNumber: Number(partNumber)
    });

    const url = await getSignedUrl(client, command, { expiresIn: 60 * 15 });

    return {
      statusCode: 200,
      body: JSON.stringify({ url })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};
