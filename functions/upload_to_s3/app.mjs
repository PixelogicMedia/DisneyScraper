import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const huge_json_data = event['huge_json_data']
    const iterator_list = event['iteratorResult']

    function update_huge_json_data(huge_json_data,main_url,updated_hash) {
        if (!(main_url in huge_json_data)) {
            huge_json_data[main_url] = updated_hash;
            console.log('Added new URL:', main_url);
        }else {
            for (const key in updated_hash) {
                if (huge_json_data[main_url][key] !== updated_hash[key]) {
                    huge_json_data[main_url][key] = updated_hash[key];
                    console.log('Updated key:', key);
                }
            }
        }
        return huge_json_data;
    }

    const updated_data = {};
    for (const iterator of iterator_list) {
        const payload = iterator['Payload']; 
        const body = payload['body'];          
        const main_url = body['main_url']; 
        const updated_hash = body['updated_hash']
        console.log('main_url:', main_url)
        console.log('updated_hash:', updated_hash)
        updated_data[main_url] = updated_hash;
        huge_json_data = update_huge_json_data(huge_json_data,main_url,updated_hash);
    }

    const region = process.env.Region || '';
    const bucket_name = process.env.BucketName || '';
    const bucket_key = process.env.BucketKey || '';

    const s3_params = {
      Bucket: bucket_name,
      Key: bucket_key,
      Body: JSON.stringify(huge_json_data),
      ContentType: "application/json"
    };

    const s3Client = new S3Client({ region: region });

    const s3_put_command = new PutObjectCommand(s3_params);

    try {
        await s3Client.send(s3_put_command);
        console.log('Uploaded JSON to S3');
    } catch (error) {
        console.error('Error uploading JSON to S3:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to upload JSON file' }),
        };
    }   

    return {
        statusCode: 200,
        body: huge_json_data
    };
}