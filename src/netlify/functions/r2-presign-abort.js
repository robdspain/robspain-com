const { AbortMultipartUploadCommand } = require("@aws-sdk/client-s3");
const { getR2Client, getBucketName } = require("./r2-client");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { key, uploadId } = JSON.parse(event.body || "{}");
    if (!key || !uploadId) {
      return { statusCode: 400, body: "Missing key or uploadId" };
    }

    const client = getR2Client();
    const command = new AbortMultipartUploadCommand({
      Bucket: getBucketName(),
      Key: key,
      UploadId: uploadId
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        aborted: true,
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
