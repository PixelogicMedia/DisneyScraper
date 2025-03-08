import {SecretsManagerClient,GetSecretValueCommand} from "@aws-sdk/client-secrets-manager";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { text } from 'stream/consumers';


export const handler = async (event,context) => {

  try {
    const secret_name = process.env.SecretName || '';
    const region = process.env.Region || '';
    const bucket_name = process.env.BucketName || '';
    const bucket_key = process.env.BucketKey || '';

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
    console.log('secret looks like:', secret);
    const url_to_query_list = JSON.parse(secret["url_to_query"]);
    console.log('url_to_query_list looks like:', url_to_query_list);

    const s3_params = {
      Bucket: bucket_name,
      Key: bucket_key
    };

    console.log('bucket_name looks like',bucket_name,'bucket_key looks like',bucket_key);
    const s3Client = new S3Client({ region: region });

    console.log('s3Client looks like:', s3Client);
    const s3_get_command = new GetObjectCommand(s3_params);
    const s3_response = await s3Client.send(s3_get_command);
    console.log('s3_response looks like:', s3_response)
    const s3_bodyContents = await text(s3_response.Body);
    const json_from_s3 = JSON.parse(s3_bodyContents);
    console.log('json_from_s3 looks like:', json_from_s3);
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

