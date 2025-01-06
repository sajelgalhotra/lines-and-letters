from flask import Blueprint, request, jsonify, make_response
from flask_restful import Api, Resource
import firebase_admin
from firebase_admin import db
import string
import random

from cryptography.fernet import Fernet

"""
User objects store their name, preferred palette, and highest previous score.
Palette starts as rainbow sherbet, previous score starts as zero.

You are able to report new scores and new palettes. 
Testing and examples of interacting with this API are in test.py.

"""
users_api = Blueprint('users_api', __name__)
api = Api(users_api)

# Reference to database
root_ref = db.reference("/")
users_ref = root_ref.child('users')

class Users(Resource):
    def __init__(self) -> None:
        super().__init__()
        existing_users = users_ref.get()
        self.users = set()
        if existing_users:
            self.users = set(existing_users.keys())
       
    def get(self, user_name):
        # login / request profile information for existing user
        if user_name not in self.users:
            return make_response(jsonify("User profile not found; make sure to sign up before logging in."), 400)
        profile = users_ref.child(user_name).get()
        return make_response(jsonify({"profile": profile}), 200)
        
        
    def put(self, user_name):
        # sign up / add new user 
        if "sign_up" in request.json:
            if user_name in self.users:
                return make_response(jsonify("Username is already taken; please choose a unique name."), 400)
            users_ref.child(user_name).set({"name": user_name, "preferred_palette": "Rainbow Sherbet", "high_score" : 0})
            profile = users_ref.child(user_name).get()
            self.users.add(user_name)
            return make_response(jsonify({"profile": profile}), 200)
                
        # report new score 
        elif "new_score" in request.json:
            if user_name not in self.users:
                return make_response(jsonify(f"User with name {user_name} does not exist."), 400)
            new_score = int(request.json["new_score"])
            old_score = users_ref.child(user_name).child("high_score").get()
            if new_score > old_score:
                users_ref.child(user_name).child("high_score").set(new_score)
            profile = users_ref.child(user_name).get()
            return make_response(jsonify({"profile": profile}), 200) 
        
        # add new palette 
        elif "new_palette" in request.json:
            if user_name not in self.users:
                return make_response(jsonify(f"User with name {user_name} does not exist."), 400)
            new_palette = request.json["new_palette"]
            users_ref.child(user_name).child("preferred_palette").set(new_palette)
            profile = users_ref.child(user_name).get()
            return make_response(jsonify({"profile": profile}), 200) 
        else:
            return make_response(jsonify("Malformed request. Request does not contain any of the necessary params."), 400)

api.add_resource(Users, '/users/<user_name>')