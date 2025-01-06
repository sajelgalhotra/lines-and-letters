from flask import Blueprint, request, jsonify, make_response
from flask_restful import Api, Resource
from firebase_admin import db
from itertools import permutations

import math
import random

anagrams_api = Blueprint('anagrams_api', __name__)
api = Api(anagrams_api)

root_ref = db.reference("/")
games_ref = root_ref.child("games")

file_path = 'valid_words.txt'
valid_words = set()
with open(file_path, 'r') as file:
    for line in file:
        word = line.strip()
        valid_words.add(word)

class Anagrams(Resource):
    def __init__(self) -> None:
        super().__init__()
        self.player_ref = None

    def put(self, game_code, player_id):
        """
        How to interact with the PUT method for the Anagrams API:
        Include "game_code" and "player_id" in all requests.
        Include "letters_captured": "get" to request a player's captured letters and corresponding point values be sent to frontend.
        (Note: need to do this for every player in game, including CPU.)
        Include "cpu": "get" to request the CPU's maximum possible score and difficulty level be sent to frontend.
        (Note: player_id should be 2)
        Include "word_entered": word to check that an inputted word is valid to play (a real word and not played before)
        and "letters": [{"letter": letter, "point_value": point_value},...] to get back word score.
        Include "done": True to indicate when the player with the specified player_id has finished their anagrams phase.
        (Note: need to do this for every player in game, including CPU.)
        If other players are still playing, you will get back "can_proceed": False. If all players are done, you will get back "can_proceed": True
        """
        self.player_ref = db.reference('games/' + game_code + '/players/' + str(player_id))

        letters_and_points = list(self.get_letters_and_points_for_player())
        
        if "letters_captured" in request.json:
            letters = [entry["letter"] for entry in letters_and_points]
            # perms = self.generate_permutations(letters)
            # possible_words = valid_words.intersection(perms)
            # print(possible_words)
            possible_words = self.check_letters_against_words(letters)
            # print(possible_words)
            self.player_ref.child("possible_words").set(list(possible_words))
            self.player_ref.child("played_words").set([])
            self.player_ref.child("total_score").set(0)
            self.player_ref.child("done").set(False)
            return make_response(jsonify({"letters_captured": letters_and_points}), 200)
        
        if "cpu" in request.json:
            max_cpu_score = 0
            cpu_possible_words = self.player_ref.child("possible_words").get()
            letters2points = self.form_letters_points_dict(letters_and_points)
            for word in cpu_possible_words:
                score = self.score_word(word, letters2points)
                max_cpu_score += score
            difficulty = games_ref.child(game_code).child("singleplayer").get()
            final_cpu_score = self.get_final_cpu_score(max_cpu_score, difficulty)
            self.player_ref.child("done").set(True)
            self.player_ref.child("total_score").set(final_cpu_score)
            self.player_ref.child("final_score").set(final_cpu_score)

            return make_response(jsonify({"max_cpu_score": max_cpu_score, "difficulty": difficulty}), 200)
        
        if "word_entered" in request.json:
            word_entered = request.json["word_entered"]
            possible_words = self.player_ref.child("possible_words").get()
            played_words = self.player_ref.child("played_words").get()
            if not played_words:
                played_words = []
            else:
                played_words = list(played_words.values())

            if word_entered not in possible_words:
                return make_response(jsonify("Not a valid word."), 400)
            elif word_entered in played_words:
                return make_response(jsonify("Word has already been played."), 400)
            else:
                word_letters_points = request.json["letters"]
                word_score = sum(letter['point_value'] for letter in word_letters_points)
                new_total_score = self.player_ref.child("total_score").get() + word_score
                self.player_ref.child("total_score").set(new_total_score)
                self.player_ref.child("played_words").push(word_entered)
                return make_response(jsonify({"word_score": word_score}), 200)
            
        if "done" in request.json:
            self.player_ref.child("done").set(True)
            players = games_ref.child(game_code).child("players").get()
            for player in players:
                if player and not player.get("done"):
                    return make_response(jsonify({"can_proceed": False}), 200)
            return make_response(jsonify({"can_proceed": True}), 200)
            
        return make_response(jsonify({"message": "Request failed for unspecified reason."}), 400)
            
    def get_final_cpu_score(self, max_score, difficulty):
        print(max_score, difficulty)
        if difficulty == "Easy Peasy":
            return math.floor(max_score * random.uniform(0.2, 0.3))
        if difficulty == "Mid":
            return math.floor(max_score * random.uniform(0.3, 0.4))
        if difficulty == "Don't Even Bother Trying":
            return math.floor(max_score * random.uniform(0.4, 0.5))
    
    def get_letters_and_points_for_player(self):
        letters = self.player_ref.child("letters_captured").get()
        if not letters:
            letters = {}
        return letters.values()
    
    def generate_permutations(self, letters):
        all_perms = set()
        min_length = 3
        max_length = len(letters)
        for length in range(min_length, max_length + 1):
            perms = {"".join(perm) for perm in permutations(letters, length)}
            all_perms.update(perms)
        return all_perms
    
    def check_letters_against_words(self, letters):
        possible_words = set()
        letters = sorted(letters)
        min_length = 3
        max_length = len(letters)
        freq_dict = {}
        for letter in letters:
            if letter not in freq_dict:
                freq_dict[letter] = 0
            freq_dict[letter] += 1

        for word in valid_words:
            word_len = len(word)
            if word_len < min_length:
                continue
            if word_len > max_length:
                continue 
            
            word_lst = sorted(word)
            w = 0
            l = 0
            while w < word_len and l < max_length:
                if word_lst[w] == letters[l]:
                    w += 1
                    l += 1
                else:
                    l += 1
            if w == word_len:
                possible_words.add(word)
        return possible_words



    
    def form_letters_points_dict(self, letters_and_points):
        letters2points = {}
        
        for item in letters_and_points:
            letter = item['letter']
            point_value = item['point_value']
            if letter not in letters2points or point_value > letters2points[letter]:
                letters2points[letter] = point_value
                
        return letters2points
    
    def score_word(self, word, letters2points):
        score = 0
        for letter in word:
            score += letters2points[letter]
        return score

api.add_resource(Anagrams, "/games/<game_code>/anagrams/<player_id>")