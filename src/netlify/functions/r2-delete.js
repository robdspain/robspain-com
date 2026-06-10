const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getR2Client, getBucketName } = require("./r2-client");

exports.handler = async (event) => {
  if (event.httpMethod !== "DELETE") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { key } = JSON.parse(event.body || "{}");
    if (!key) {
      return { statusCode: 400, body: "Missing key" };
    }

    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        deleted: true,
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
