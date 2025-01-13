import os
import firebase_admin
from flask import Flask, send_from_directory
from flask_restful import Api
from flask_cors import CORS
from google.cloud import secretmanager
import json

# Function to access the secret from Secret Manager
def get_firebase_credentials(secret_id="credentials", version_id="latest"):
    """
    Fetch the secret from Google Secret Manager.
    """
    client = secretmanager.SecretManagerServiceClient()
    project_id = "lines-and-letters-bc7d5"
    secret_name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(name=secret_name)
    return response.payload.data.decode("UTF-8")

# Initialize Firebase
credentials_dict = json.loads(get_firebase_credentials())
cred = firebase_admin.credentials.Certificate(credentials_dict)
firebase_admin.initialize_app(cred, {'databaseURL': 'https://lines-and-letters-bc7d5-default-rtdb.firebaseio.com/'})

app = Flask(__name__, static_url_path='', static_folder='frontend/build')
CORS(app)
api = Api(app)

# Register API blueprints
from api.APIHandler import APIHandler
from api.lobbyAPI import lobby_api
from api.dotsandboxesAPI import dotsandboxes_api
from api.anagramsAPI import anagrams_api
from api.usersAPI import users_api

api.add_resource(APIHandler, '/flask/hello')
app.register_blueprint(lobby_api)
app.register_blueprint(dotsandboxes_api)
app.register_blueprint(anagrams_api)
app.register_blueprint(users_api)


@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  response.headers.add('Cache-Control', 'public, max-age=60, s-maxage=60')
  return response

# Serve frontend files
@app.route("/", defaults={'path':''})
def getApp(path):
    return send_from_directory(app.static_folder,'index.html')

if __name__ == '__main__':
    app.run(debug=True, host = "0.0.0.0", port = int(os.environ.get("PORT", 8080)))