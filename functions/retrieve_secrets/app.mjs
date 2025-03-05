import {SecretsManagerClient,GetSecretValueCommand} from "@aws-sdk/client-secrets-manager";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { text } from 'stream/consumers';


export async function handler(event) {

  try {
    const secret_name = process.env.SecretName || '';
    const region = process.env.Region || '';

    const client = new SecretsManagerClient({
      region: region,
    });
  
    let secret_response;

    secret_response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", 
      })
    );
    const secret = JSON.parse(secret_response.SecretString);
    const url_to_query_list = JSON.parse(secret["url_to_query"]);
    const bucket_name = secret["s3_json_bucket_name"];
    const bucket_key = secret["s3_json_bucket_key"];

    const s3_params = {
      Bucket: bucket_name,
      Key: bucket_key,
    };

    const s3Client = new S3Client({ region: region });

    const s3_get_command = new GetObjectCommand(s3_params);
    const s3_response = await s3Client.send(s3_get_command);

    const s3_bodyContents = await text(s3_response.Body);
    const json_from_s3 = JSON.parse(s3_bodyContents);

    const total_secrets = {"huge_json_data":json_from_s3,"url_to_query_list":url_to_query_list};

    return {
      statusCode: 200,
      body: total_secrets
    };
  } catch (error) {
    console.error('Error fetching JSON from S3:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve JSON file' }),
    };
  }
  }

