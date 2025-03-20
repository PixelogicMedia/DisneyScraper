import os
import json
import boto3
from pxl.utils.notification import NotificationService
from pxl.utils.aws_secret import get_env_secret

def handler(event, context):
    try:
        secrets = get_env_secret()
        status_map = {'updated_hash':'modified', 'new_hash':'added', 'deleted_hash':'deleted'}
        updated_list = event.get("Updated_List")
        print('Got Updated List:', updated_list)   
        
        html_content = "<html><body>\n"
        html_content += "<h1>Changed URLs are:</h1>\n"
        html_content += "<table border='1' cellspacing='0' cellpadding='10'>\n"
        html_content += "<tr><th>Urls</th><th>Status</th></tr>\n"

        for main_url, sections in updated_list.items():
            has_suburls = False
            sub_rows = ""
            for status_key, sub_urls in sections.items():
                if sub_urls:
                    has_suburls = True
                    for sub_url in sub_urls.keys():
                        display_text = sub_url.replace(main_url, "")
                        if not display_text:
                            display_text = sub_url
                        sub_rows += "<tr>"
                        sub_rows += f"<td style='padding-left:40px;'><a href='{sub_url}' target='_blank'>{display_text}</a></td>"
                        sub_rows += f"<td>{status_map.get(status_key,status_key)}</td>"
                        sub_rows += "</tr>\n"
     
            main_status = "" if has_suburls else "not changed"       
            html_content += "<tr>"
            html_content += f"<td><a href='{main_url}' target='_blank'>{main_url}</a></td>"
            html_content += f"<td>{main_status}</td>"
            html_content += "</tr>\n"
            
            html_content += sub_rows

        html_content += "</table>\n"
        html_content += "</body></html>"
  
        ns = NotificationService()
        try:
            ns.send_notification(secrets['email_recipients'], "Disney MediaSpecs Updated Notification", html_content)
        except Exception as e:
            print(f"Failed to send email notification: {e}")
        
        
        return {
            "statusCode": 200,
            "body": html_content
        }
    
    except Exception as e:
        error_message = f"An error occurred: {str(e)}"
        print(error_message)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": error_message})
        }
