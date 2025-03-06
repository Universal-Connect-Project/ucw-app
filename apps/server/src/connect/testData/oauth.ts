export const oauthSuccessResponse = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script type="text/javascript" src="/oauth/oauth.js" ></script>
    <title>OAuth Completion</title>
    <style>
        body {
            background-color: #add8e6; /* Light blue background */
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
            color: #333;
        }
        .container {
            text-align: center;
            padding: 20px;
            border-radius: 10px;
            background-color: white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        p {
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Thank you for completing OAuth.</h1>
        <p>Please wait while we redirect you back to the connect widget.</p>
        <button id="oauth-close-window">Go back to app</button>
    </div>
    <script type="text/javascript">
      var app_url = 'scheme://oauth_complete?metadata=%7B%22aggregator%22%3A%22testExampleA%22%2C%22id%22%3A%22request_id%22%2C%22member_guid%22%3A%22request_id%22%2C%22user_guid%22%3A%22userId%22%2C%22session_guid%22%3A%22session_id%22%7D'
      var post_message = 'oauthComplete/success'
      var member_guid = 'request_id'
      var redirect = true
      var error_reason = ''
      document.addEventListener("DOMContentLoaded", function(){
        handle_oauth(redirect, app_url, post_message, member_guid, error_reason);
      })
    </script>
</body>
</html>
`;
