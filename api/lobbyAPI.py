from flask import Blueprint, request, jsonify, make_response
from flask_restful import Api, Resource
from firebase_admin import db
import string
import random

lobby_api = Blueprint('lobby_api', __name__)
api = Api(lobby_api)

# Reference to database
root_ref = db.reference("/")
games_ref = root_ref.child('games')

class Lobby(Resource):
    def __init__(self) -> None:
        super().__init__()
        existing_games = games_ref.get()
        self.codes = set()
        if existing_games:
             self.codes = set(existing_games.keys())

    def post(self):
        """
        How to interact with POST method for Lobby API:
        Provide a valid game code and optionally a game phase.
        Response will have game code, host's name, players in game, and singleplayer flag.
        """
        if "game_code" not in request.json:
              return make_response(jsonify("Bad request. Game code required."), 400)
        game_code = request.json["game_code"]
        if game_code not in self.codes:
              return make_response(jsonify("Game not found."), 400)
        
        # Get scores post request
        if "scores" in request.json:
              players = games_ref.child(game_code).child("players").get()
              player_num = 1
              response = []
              for player in players:
                   if player:
                       response.append({player_num: player.get("total_score")})
                       player_num += 1
              return make_response(jsonify(response))
        
        # Change phase post request
        if "phase" in request.json:
              games_ref.child(game_code).child("phase").set(request.json["phase"])
              response = make_response(jsonify("Phase changed."), 200)
              return response
        
        if games_ref.child(game_code).child("phase").get():
              return make_response(jsonify("Game in progress."), 400)
        
        host = games_ref.child(game_code).child("players").child("1").child("display_name").get()
        players = games_ref.child(game_code).child("players").get()
        singleplayer = games_ref.child(game_code).child("singleplayer").get()
        response = make_response(jsonify({"game_code": game_code, "host": host,
                                          "players": players, "singleplayer": singleplayer}), 200)
        return response

    def put(self):
         """
         How to interact with PUT method for Lobby API:
         Must provide player_name and singleplayer flag.
         If game_code is provided, the player is added to the game and their player_id is returned.
         If game_code is not provided, a game code is generated for a new game and the game_code and player_id are returned.
         """
         # player_name and singleplayer flag must be present
         if "player_name" not in request.json or "singleplayer" not in request.json:
              return make_response(jsonify("Missing player_name or singleplayer flag."), 400)
         
         player_name = request.json["player_name"]
         singleplayer = request.json["singleplayer"]
         
         # if game_code is not present, generate it
         if "game_code" not in request.json:
              game_code = random.choice(string.ascii_uppercase) + str(random.randint(0, 9)) + random.choice(string.ascii_uppercase) + str(random.randint(0, 9))
              while game_code in self.codes:
                   game_code = random.choice(string.ascii_uppercase) + str(random.randint(0, 9)) + random.choice(string.ascii_uppercase) + str(random.randint(0, 9))
              
              # Add game_code, player_name, and singleplayer flag to database
              games_ref.child(game_code).set({"singleplayer": singleplayer, "phase": 0, "grid" : "[]", "current_player": 1})
              games_ref.child(game_code).child("players").child("1").set({"display_name": player_name, "letters_captured": "", "final_score": -1})
              self.codes.add(game_code)
              
              # Add CPU to game if singleplayer
              if singleplayer:
                   games_ref.child(game_code).child("players").child("2").set({"display_name": "CPU", "letters_captured": "", "final_score": -1})
              
              response = make_response(jsonify({"game_code": game_code, "player_id": 1}), 200)
              
              return response
         else:
              game_code = request.json["game_code"]
              if game_code not in self.codes:
                   return make_response(jsonify("Game code does not exist."), 400)
              else:
                   player_id = len(games_ref.child(game_code).child("players").get())
                   if games_ref.child(game_code).child("phase").get():
                        return make_response(jsonify("Cannot join game in progress."), 400)
                   if games_ref.child(game_code).child("singleplayer").get():
                        return make_response(jsonify("Cannot join singleplayer lobby."), 400)
                   if player_id > 4:
                        return make_response(jsonify("Max number of players (4) exceeded. Unable to join lobby."), 400)
                   games_ref.child(game_code).child("players").child(str(player_id)).set({"display_name": player_name, "letters_captured": "", "final_score": -1})

                   response = make_response(jsonify({"player_id": player_id}), 200)
                   
                   return response
    
    def delete(self):
         """
         How to interact with the DELETE method for the Lobby API:
         Provide a game code and delete_target.
         If the delete_target is "game", the game will be deleted from the database.
         If the delete_target is "player", "player_id" must also be provided and that player will be removed from the specified game.
         """
         if "game_code" not in request.json or "delete_target" not in request.json:
              return make_response(jsonify("Bad request. Game code and delete target required."), 400)
         
         game_code = request.json["game_code"]

         delete_target = request.json["delete_target"]

         if delete_target == "game":
              games_ref.child(game_code).delete()
              return make_response(jsonify("Game deleted."), 200)
         elif delete_target == "player":
              if "player_id" not in request.json:
                   return make_response(jsonify("Bad request. Player id required to delete player."), 400)
              
              player_id = str(request.json["player_id"])
              players_ref = games_ref.child(game_code).child("players")

              # delete player
              players_ref.child(str(player_id)).delete()
              players = [player for player in players_ref.get() if player is not None]
              n_players = len(players)

              # if zero players remain, delete game
              if n_players == 0:
                   games_ref.child(game_code).delete()
                   return make_response(jsonify("Player deleted. No players remain. Game deleted."), 200)
              # otherwise, rearrange player ids for remaining players
              else:
                   players_ref.delete()
                   new_players = {str(i): players[i - 1] for i in range(1, n_players + 1)}
                   games_ref.child(game_code).child("players").set(new_players)
                   return make_response(jsonify("Player deleted."), 200)
         else:
              return make_response(jsonify("Bad request. Delete target must be 'game' or 'player'."), 400)          


api.add_resource(Lobby, '/lobby', endpoint = 'lobby')