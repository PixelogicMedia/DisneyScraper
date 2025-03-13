import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const handler = async (event, context) => {
    const huge_json_data = event['huge_json_data']
    const iterator_list = event['iteratorResult']
    const huge_json_data_for_s3 = JSON.parse(JSON.stringify(huge_json_data));

    let changesDetected =  false;

    function update_huge_json_data(huge_json_data_for_s3,main_url,updated_hash) {

        for (const key in updated_hash) {
            if (huge_json_data_for_s3[main_url][key] !== updated_hash[key]) {
                huge_json_data_for_s3[main_url][key] = updated_hash[key];
                changesDetected = true;
                console.log('Updated key:', key);
            }
        }
    }
    

    function add_new_hash_to_huge_json_data(huge_json_data_for_s3,main_url,new_hash) {
        if (!(main_url in huge_json_data_for_s3)) {
            huge_json_data_for_s3[main_url] = new_hash;
            console.log('Added new URL:', main_url);
            changesDetected = true;
        } else {
            for (const key in new_hash) {
                if (!(key in huge_json_data_for_s3[main_url])) {
                    huge_json_data_for_s3[main_url][key] = new_hash[key];
                    console.log('Added new key:', key);
                    changesDetected = true;
                }
            }
        }
    }
    
    function delete_hash_from_huge_json_data(huge_json_data_for_s3,main_url,deleted_hash) {
        for (const key in deleted_hash) {
            if (huge_json_data_for_s3[main_url][key] === deleted_hash[key]) {
                delete huge_json_data_for_s3[main_url][key];
                console.log('Deleted key:', key);
                changesDetected = true;
            }
        }
    }

    const consolidated_data = {};
    for (const iterator of iterator_list) {
        const payload = iterator['Payload']; 
        const body = payload['body'];          
        const main_url = body['main_url']; 
        const updated_hash = body['updated_hash']
        const new_hash = body['new_hash']
        const deleted_hash = body['deleted_hash']

        console.log('main_url:', main_url)
        consolidated_data[main_url] = {updated_hash, new_hash, deleted_hash};
        console.log('consolidated_data updated:', consolidated_data[main_url]);

        update_huge_json_data(huge_json_data_for_s3, main_url, updated_hash);
        add_new_hash_to_huge_json_data(huge_json_data_for_s3, main_url, new_hash);
        delete_hash_from_huge_json_data(huge_json_data_for_s3, main_url, deleted_hash);
    }

    console.log('Final updated_huge_json_data:', huge_json_data_for_s3);
    console.log('change detected status',changesDetected);

    if (changesDetected) { 
    const region = process.env.Region || '';
    const bucket_name = process.env.BucketName || '';
    const bucket_key = process.env.BucketKey || '';

    const s3_params = {
      Bucket: bucket_name,
      Key: bucket_key,
      Body: JSON.stringify(huge_json_data_for_s3),
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
};

    return {
        statusCode: 200,
        body: {
            consolidated_data,
            changesDetected
        }
    };
};