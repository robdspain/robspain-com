const { CreateMultipartUploadCommand } = require("@aws-sdk/client-s3");
const { getR2Client, getBucketName } = require("./r2-client");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { key, contentType } = JSON.parse(event.body || "{}");
    if (!key) {
      return { statusCode: 400, body: "Missing key" };
    }

    const client = getR2Client();
    const command = new CreateMultipartUploadCommand({
      Bucket: getBucketName(),
      Key: key,
      ContentType: contentType || "application/octet-stream"
    });

    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadId: response.UploadId,
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
