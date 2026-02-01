const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { getR2Client, getBucketName, getPublicBaseUrl } = require("./r2-client");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const prefix = event.queryStringParameters?.prefix || "videos/";
    const client = getR2Client();
    const command = new ListObjectsV2Command({
      Bucket: getBucketName(),
      Prefix: prefix
    });

    const response = await client.send(command);
    const publicBaseUrl = getPublicBaseUrl();

    const items = (response.Contents || []).map((item) => {
      const key = item.Key;
      return {
        key,
        size: item.Size,
        lastModified: item.LastModified,
        url: publicBaseUrl && key ? `${publicBaseUrl.replace(/\/$/, "")}/${key}` : ""
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        items
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
