from flask import Blueprint, request, jsonify, make_response
from flask_restful import Api, Resource
import firebase_admin
from firebase_admin import db
import string
import random

dotsandboxes_api = Blueprint('dotsandboxes_api', __name__)
api = Api(dotsandboxes_api)

# Reference to database
root_ref = db.reference("/")
games_ref = root_ref.child('games')

"""
games realtime database model

games : {
    game_code : {
            singleplayer : true,
            phase: 0,
            current_player: 1,
            grid : "[ grid_state ]",
            plays_made : {
                unique_key : "x,y",
                unique_key : "x,y"
            },
            players : {
                        1 : {
                            display_name: "shanice",
                            plays_made: { 
                                unique_key : "x,y",
                                unique_key : "x,y",
                            }
                            letters_captured : {
                                unique_key : {
                                    letter: "a",
                                    point_value: 1,
                                },
                                unique_key : {
                                    letter: "z",
                                    point_value: 3,
                                },
                            }
                            final_score: -1;
                        }
            }
    }
}

# Making a game (which happens in the lobbyAPI) should set up the skeleton for the datebase model.
"""

class Games(Resource):
    def __init__(self) -> None:
        super().__init__()
        self.game_ref = None
        self.plays_made = set()


    def post(self, game_code):
        """
        How to Interact With the POST Method for Dots and Boxes API
            to request the current saved grid state, your params should be {"grid" : "get"}
            to request players information, params = {"players": "get"} # probably sajels addition
            to request plays made, params = {"plays_made": "get"}
            to request letters capured by player, params = {"letters_captured": "get",  "player_id": id}
            to request final score of a player, params = {"final_score": "get",  "player_id": id}
            *let me (osose) know if there is specific information you would like to retrieve that this API doesn't already include
        """

        if "grid" not in request.json and "players" not in request.json and "plays_made" not in request.json and "letters_captured" not in request.json and "final_score" not in request.json:
            return make_response(jsonify("Invalid request params supplied."), 400)
        
        self.game_ref = db.reference('games/' + game_code)

        if "grid" in request.json:
            grid = self.get_grid()
            return make_response(jsonify({"grid": grid}), 200)

        if "players" in request.json:
            players = self.game_ref.child("players").get()
            print(f"Player information: {players}.")
            return make_response(jsonify({"players": players}), 200)
    
        if "plays_made" in request.json:
            plays_made = list(self.get_plays_made())
            print(f"Plays made: {plays_made}.")
            return make_response(jsonify({"plays_made": plays_made}), 200)

        if "letters_captured" in request.json and "player_id" in request.json:
            player_id = request.json["player_id"]
            letters = list(self.get_letters_for_player(player_id))
            print(f"Player with id {player_id} has letters {letters}.")
            return make_response(jsonify({"letters_captured": letters}), 200)

        if "final_score" in request.json and "player_id" in request.json:
            player_id = request.json["player_id"]
            score = self.get_final_score_for_player(player_id)
            print(f"Player with id {player_id} has score {score}.")
            return make_response(jsonify({"final_score": score}), 200)


        return make_response(jsonify("Request failed for unspecified reason; check your params."), 400)

    
    def put(self, game_code):
        """
        How to Interact With the PUT Method for Dots and Boxes API
            to add a play for player (we handle validation), your params should be {"play_x" : x, "play_y": y, "player_id" : id}. 
                    we check that this play is not present in our previously made plays 
                    we add play info to database and return success 
            to add a letter for player (no validation), params = {"letters": [{ "letter": "c", "point_value": 2 }], "player_id" : id}
                this should be called whenever a player captures a letter
            to update grid state, params = {"grid" : [ new_grid_state ] }
                this should be updated frequently, specifically on every grid change (however, you can bundle a player's turns changes, see me if you have questions)
            to update current player, params = {"advance_player": true}
        """
        if all(param not in request.json for param in ["play_x", "grid", "letters", "advance_player", "final_score"]):
            return make_response(jsonify("Invalid request params supplied."), 400)
        
        self.game_ref = db.reference('games/' + game_code)

        if "play_x" in request.json and "play_y" in request.json and "player_id" in request.json:
            play = (request.json["play_x"], request.json["play_y"])
            player_id = request.json["player_id"]
            if not self.add_play_for_player(play, player_id):
                return make_response(jsonify(f"Play {play} by player with id {player_id} failed."), 400)
            return make_response(jsonify(f"Play {play} by player with id {player_id} was made successfully."), 200)
        
        if "letters" in request.json and "player_id" in request.json:
            letters = request.json["letters"]
            player_id = request.json["player_id"]
            self.add_letters_claimed(letters, player_id)
            return make_response(jsonify(f"Letters {letters} was claimed by player with id {player_id}."), 200)

        if "final_score" in request.json and "player_id" in request.json:
            score = request.json["final_score"]
            player_id = request.json["player_id"]
            self.add_final_score_for_player(score, player_id)
            return make_response(jsonify(f"Final score {score} was submitted by player with id {player_id}."), 200)
        
        if "grid" in request.json:
            new_grid_state = request.json["grid"]
            if self.set_grid(new_grid_state):
                return make_response(jsonify(f"Game grid was updated to:\n{new_grid_state}\n"), 200)
            return make_response(jsonify("Grid update failed."), 400)
    
        if "advance_player" in request.json:
            next_player = self.game_ref.child("current_player").get() % (len(self.game_ref.child("players").get()) - 1) + 1
            self.game_ref.child("current_player").set(next_player)
            return make_response(jsonify(f"Current player was updated to: {next_player}"), 200)

        
        return make_response(jsonify("Request failed for unspecified reason; check your params."), 400)



    def get_grid(self):
        return self.game_ref.child("grid").get()
    
    def set_grid(self, new_grid_state):
        try: 
            self.game_ref.child("grid").set(new_grid_state)
            print("Update was successful. Check db to confirm.")
            return True
        except:
            return False

    def get_plays_made(self):
        if not self.plays_made:
            plays = self.game_ref.child("plays_made").get()
            if plays:
                self.plays_made = set(plays.values())
        return self.plays_made

    def get_letters_for_player(self, player_id):
        letters = self.game_ref.child("players").child(str(player_id)).child("letters_captured").get()
        if not letters:
            letters = {}
        return letters.values()

    def get_final_score_for_player(self, player_id):
        score = self.game_ref.child("players").child(str(player_id)).child("final_score").get()
        if not score:
            score = -1
        return score
        
    def add_play_for_player(self, play, player_id):
        play = str(play[0]) + "," + str(play[1])
        if play in self.get_plays_made():
            return False
        self.plays_made.add(play)

        personal_plays_made = self.game_ref.child("players").child(str(player_id)).child("plays_made").push(play)  
        self.game_ref.child("plays_made").push(play)   
        print(personal_plays_made)
        return True

    def add_letters_claimed(self, letters, player_id):
        for letter in letters:
            self.game_ref.child("players").child(str(player_id)).child("letters_captured").push(letter)
        personal_letters = self.get_letters_for_player(player_id)
        print(personal_letters)

    def add_final_score_for_player(self, final_score, player_id):
        self.game_ref.child("players").child(str(player_id)).child("final_score").set(final_score)
        personal_score = self.get_final_score_for_player(player_id)
        print(personal_score)
        

api.add_resource(Games, '/games/<game_code>')