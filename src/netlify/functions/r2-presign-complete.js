const { CompleteMultipartUploadCommand } = require("@aws-sdk/client-s3");
const { getR2Client, getBucketName } = require("./r2-client");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { key, uploadId, parts } = JSON.parse(event.body || "{}");
    if (!key || !uploadId || !Array.isArray(parts)) {
      return { statusCode: 400, body: "Missing key, uploadId, or parts" };
    }

    const client = getR2Client();
    const command = new CompleteMultipartUploadCommand({
      Bucket: getBucketName(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.map((part) => ({
          PartNumber: Number(part.partNumber),
          ETag: part.etag
        }))
      }
    });

    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        location: response.Location || "",
        key
      })
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
