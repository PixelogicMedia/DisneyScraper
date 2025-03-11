import os
import json
import boto3
# from pxl.utils.notification import NotificationService

# Initialize the S3 client outside the handler for performance
s3 = boto3.client('s3')

def handler(event, context):
    try:

        status_map = {'updated_hash':'modified', 'new_hash':'added', 'deleted_hash':'deleted'}
        updated_list = event.get("Updated_List")
        print('Got Updated List:', updated_list)
        
        html_content = "<html><body>\n"
        html_content += "<h1>Changed URLs are:</h1>\n"
        html_content += "<table border='1' cellspacing='0' cellpadding='10'>\n"
        html_content += "<tr><th>Urls</th><th>Status</th></tr>\n"
        
        for main_url, sections in updated_list.items():
            html_content += "<tr>"
            html_content += f"<td><a href='{main_url}' target='_blank'>{main_url}</a></td>"
            html_content += "<td></td>"
            html_content += "</tr>\n"
            
            for status_key in ['new_hash','updated_hash','deleted_hash']:
                sub_urls = sections.get(status_key, {})
                if sub_urls:
                    for sub_url in sub_urls.keys():
                        display_text = sub_url.replace(main_url, "")
                        if not display_text:
                            display_text = sub_url
                        html_content += "<tr>"
                        html_content += f"<td style='padding-left:40px;'><a href='{sub_url}' target='_blank'>{display_text}</a></td>"
                        html_content += f"<td>{status_map.get(status_key, status_key)}</td>"
                        html_content += "</tr>\n"
        
        html_content += "</table>\n"
        html_content += "</body></html>"
        
        with open("output.html", "w") as file:
            file.write(html_content)
        print("HTML output saved to output.html")

        # secret_name = os.environ.get("SECRET_NAME")
        # print(f"Secret Name: {secret_name}")
        # media_tools_secret_name = os.environ.get("MEDIATOOLS_SECRET_NAME")
        # print(f"Media Secret Name: {media_tools_secret_name}")
        # ns = NotificationService()
        # try:
        #     ns.send_notification("lixing.chen@pixelogicmedia.com", "Disney MediaSpecs Updated Notification", html_content)
        # except Exception as e:
        #     print(f"Failed to send email notification: {e}")
        
        
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
          "updated_hash": {
            "https://mediatechspecs.disney.com/localization/audio/localized-audio?tab=loudness-standards": "fdc46f46c3de74841c4eaa3847baad369a90a8422837b743387466d62258a82b"
          },
          "new_hash": {},
          "deleted_hash": {
            "https://mediatechspecs.disney.com/localization/audio/localized-audio?tab=loudness-standards&spec=666": "fdc46f46c3de74841c4eaa3847baad369a90a8422837b743387466d62258a82b777"
          }
        },
        "https://mediatechspecs.disney.com/theatrical/audio-theatrical/audio_spec_theatrical_tha": {
          "updated_hash": {
            "https://mediatechspecs.disney.com/theatrical/audio-theatrical/audio_spec_theatrical_tha?tab=theatrical_sound_spec_tha": "fad0a764e1e2824810c75369fef6a8f6a83937ccb11313555293221fd91b6884"
          },
          "new_hash": {},
          "deleted_hash": {
            "https://mediatechspecs.disney.com/theatrical/audio-theatrical/audio_spec_theatrical_tha?tab=theatrical_666": "fad0a764e1e2824810c75369fef6a8f6a83937ccb11313555293221fd91b6884666"
          }
        },
        "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge": {
          "updated_hash": {
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=master-del-mast-ge": "62f11a322a2e422a3404b5e720744c4f5eaa0f21038c2b02df12a7f38c7308df",
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=master-del-mast-ge&spec=stems-ge-supersession": "ca6650556d1f66ead3db6762f00c5d60e6786e0000aa00b84e98c59450186bc0",
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=master-del-mast-ge&spec=music-and-effects-ge-supersession": "b1ea354b07527d5e403c2970e87d4f25a3b0194a981a6665aa5bede069b5a168",
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=master-del-mast-ge&spec=audio-description-session-mast-ge": "c72e815f92959805090ab4403da4dba6616922d12738ec2552b4fac14e753467",
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=distribution-deliverables-mast-ge": "90d887135a452549c88cb5c77f65ad044e318515e7ab1a781784bd91d07859ed",
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=distribution-deliverables-mast-ge&spec=home-atmos-adm-bwav-tech-spec-ge": "7833674eb5a55953ee900bc684e4ce8110b6d6c1abf95f8bac77c2e20fd3c6b7",
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=distribution-deliverables-mast-ge&spec=DPO-wav-mast-ge": "ec17a6202be616a4a426e76e16f08d73d80075de303b79a3bfe13b28b200b7e1",
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=distribution-deliverables-mast-ge&spec=distribution-formatting-(dpo)": "fed9b2ab6545509fb247dd3c0942370fa3a99c8163e4a9a81c30b884b6885c6a"
          },
          "new_hash": {
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=loudness-stds-mast-ge": "c4c3077dad106e2ddfe14665a796a355982b180d99483972326c92f2c31ecc47",
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=distribution-deliverables-mast-ge&spec=DPO-wav-mast-ge-ME": "44d8221623b62c44c3cc1270c063c64d128da15b90e22dbc6fec4c776b0e3205",
            "https://mediatechspecs.disney.com/mastering/audio/audio-specifications-mast-ge?tab=distribution-deliverables-mast-ge&spec=DPO-wav-mast-ge-AD": "b94b3b6c7c3b2c159dab795a6f1c7ccf7a5a737e5ac0cd4428e8e2adaca18c13"
          },
          "deleted_hash": {}
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