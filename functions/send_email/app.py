import os
import json
import boto3

# Initialize the S3 client outside the handler for performance
s3 = boto3.client('s3')

def handler(event, context):
    try:
        # Extract data from the event
        updated_list = event.get("Updated_List")
        print('Got Updated List:', updated_list)
        
        # Build the HTML content
        html_content = "<html><body>\n"
        html_content += f"<h1>Changed urls are:</h1>\n"
        for main_url, sub_urls in updated_list.items():
            html_content += f"<h2>{main_url}</h2>\n"
            for sub_url in sub_urls.keys():
                html_content += f"<p>{sub_url}</p>\n"
        html_content += "</body></html>"
        

        with open("output.html", "w") as file:
            file.write(html_content)
        print("HTML output saved to output.html")
        
        return {
            "statusCode": 200,
            "body": html_content
        }
    
    except Exception as e:
        raise e
    


if __name__ == '__main__':
    # Create a sample event with your expected data structure
    sample_event = {
    "Updated_List": {
      "https://mediatechspecs.disney.com/localization/audio/localized-audio": {
        "https://mediatechspecs.disney.com/localization/audio/localized-audio?tab=loudness-standards": "fdc46f46c3de74841c4eaa3847baad369a90a8422837b743387466d62258a82b"
      },
      "https://mediatechspecs.disney.com/theatrical/audio-theatrical/audio_spec_theatrical_tha": {
        "https://mediatechspecs.disney.com/theatrical/audio-theatrical/audio_spec_theatrical_tha?tab=theatrical_sound_spec_tha": "fad0a764e1e2824810c75369fef6a8f6a83937ccb11313555293221fd91b6884"
      },
      "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge": {
        "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=loudness-stds-mast-ge": "a6aa9cef2cca10cd361ad7c1810e8786d53f91ac363058efa7022db2a5a8081f",
        "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=master-del-mast-ge": "7b6624ad13a10d350d153b23c9b232cb7c37e59d706c0a65213b6257dede1572",
        "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=master-del-mast-ge&spec=stems-ge-supersession": "ca6650556d1f66ead3db6762f00c5d60e6786e0000aa00b84e98c59450186bc0",
        "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=master-del-mast-ge&spec=music-and-effects-ge-supersession": "b1ea354b07527d5e403c2970e87d4f25a3b0194a981a6665aa5bede069b5a168",
        "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=master-del-mast-ge&spec=audio-description-session-mast-ge": "c72e815f92959805090ab4403da4dba6616922d12738ec2552b4fac14e753467",
        "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=distribution-deliverables-mast-ge": "a23d3a9496128ee0aad6c45c0d563ae17cc214375fe29276ecbfe8e7868442f7"
      }
    }
  }
    
    context = {}
    response = handler(sample_event, context)
    html_output = response.get("body", "")
    
    print('HTML Output:', html_output)
    # Write output to a local file in the current directory
    with open("output.html", "w") as file:
        file.write(html_output)
    
    print("HTML output saved to output.html")