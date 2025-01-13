import requests

# HTTP test requests for the backend APIs

# BASE_URL = "http://127.0.0.1:5000"
BASE_URL = "https://flask-fire-7o54nzynwq-uc.a.run.app"

LOBBY_ENDPOINT = "/lobby"
GAMES_ENDPOINT = "/games"
ANAGRAMS_ENDPOINT = "/anagrams"
USERS_ENDPOINT = "/users"

def test_create_singleplayer_game():
    create_payload = {"player_name": "sajel", "singleplayer": True, "cpu": "easy"}
    create_response = requests.put(BASE_URL + LOBBY_ENDPOINT, json = create_payload)

    if create_response.status_code == 200:
        print("Lobby created successfully!")
        print("Status: ", create_response.json())
    else:
        print("Failed to create lobby.")
        print("Response text: ", create_response.text)

    game_code = create_response.json()["game_code"]
    return game_code

def test_create_one_lobby_and_add_players():
    create_payload = {"player_name": "sajel", "singleplayer": False}
    create_response = requests.put(BASE_URL + LOBBY_ENDPOINT, json = create_payload)

    if create_response.status_code == 200:
        print("Lobby created successfully!")
        print("Status: ", create_response.json())
    else:
        print("Failed to create lobby.")
        print("Response text: ", create_response.text)

    game_code = create_response.json()["game_code"]

    # added some players
    join_payload = {"player_name": "serena", "singleplayer": False, "game_code": game_code}
    join_response = requests.put(BASE_URL + LOBBY_ENDPOINT, json = join_payload)
    print(join_response.json())
    
    join_payload = {"player_name": "peyton", "singleplayer": False, "game_code": game_code}
    join_response = requests.put(BASE_URL + LOBBY_ENDPOINT, json = join_payload)
    print(join_response.json())
    
    join_payload = {"player_name": "osose", "singleplayer": False, "game_code": game_code}
    join_response = requests.put(BASE_URL + LOBBY_ENDPOINT, json = join_payload)
    print(join_response.json())

    return game_code

def test_get_grid(game_code="A0J5"):
    params = {"grid": "get"}
    response = requests.post(BASE_URL + GAMES_ENDPOINT + "/" + game_code, json=params)
    if response.status_code == 200:
        print("Grid retrieved successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to retrieve grid.")
        print("Response text: ", response.text)
    
def test_get_players(game_code="A0J5"):
    params = {"players": "get"}
    response = requests.post(BASE_URL + GAMES_ENDPOINT + "/" + game_code, json=params)
    if response.status_code == 200:
        print("Players retrieved successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to retrieve players.")
        print("Response text: ", response.text)

def test_get_plays_made(game_code="A0J5"):
    params = {"plays_made": "get"}
    response = requests.post(BASE_URL + GAMES_ENDPOINT + "/" + game_code, json=params)
    if response.status_code == 200:
        print("Plays made retrieved successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to retrieve plays.")
        print("Response text: ", response.text)

def test_get_letters_captured(game_code="A0J5", player_id=1):
    # test for dots and boxes
    # params = {"letters_captured": "get",  "player_id": player_id}
    # response = requests.post(BASE_URL + GAMES_ENDPOINT + "/" + game_code, json=params)

    # test for anagrams
    params = {"letters_captured": "get", "game_code": game_code, "player_id": player_id}
    response = requests.put(BASE_URL + GAMES_ENDPOINT + "/" + game_code + ANAGRAMS_ENDPOINT + "/" + str(player_id), json=params)
    
    if response.status_code == 200:
        print("Letters captured retrieved successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to retrieve captured letters.")
        print("Response text: ", response.text)

def test_post_add_play_for_player(game_code="A0J5", play_x=1, play_y=7, player_id=1):
    params = {"play_x": play_x, "play_y": play_y, "player_id": player_id}
    response = requests.put(BASE_URL + GAMES_ENDPOINT + "/" + game_code, json=params)
    if response.status_code == 200:
        print("Player's plays were updated successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to update plays.")
        print("Response text: ", response.text)

def test_post_add_letter_for_player(game_code="A0J5", letter="z", point_value=1, player_id=1):
    params = {"letters": [{"letter": letter, "point_value": point_value}], "player_id": player_id}
    response = requests.put(BASE_URL + GAMES_ENDPOINT + "/" + game_code, json=params)
    if response.status_code == 200:
        print("Letter added successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to add letter.")
        print("Response text: ", response.text)

def test_post_update_grid(game_code="A0J5", new_grid_state="[[{ x: 0, y: 0 }, { x: 0, y: 1, claimer: 1 }, { x: 0, y: 2 } ], [  { x: 1, y: 0, claimer: 1 }, { x: 1, y: 1, letter: “A”, winner: 0, point_value: 1 }, { x: 1, y: 2, claimer: 2 } ],[  { x: 2, y: 0 }, { x: 2, y: 1, claimer: 3 }, { x: 2, y: 2 } ],]"):
    params = {"grid" : new_grid_state }
    response = requests.put(BASE_URL + GAMES_ENDPOINT + "/" + game_code, json=params)
    if response.status_code == 200:
        print("Grid state updated successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to update grid state.")
        print("Response text: ", response.text)

def test_put_anagrams_word(game_code, player_id, word):
    params = {"game_code": game_code, "player_id": player_id, "word_entered": word, 
              "letters": [{"letter": "B", "point_value": 1}, {"letter": "A", "point_value": 1}, {"letter": "D", "point_value": 1}]}
    response = requests.put(BASE_URL + GAMES_ENDPOINT + "/" + game_code + ANAGRAMS_ENDPOINT + "/" + str(player_id), json=params)
    
    if response.status_code == 200:
        print("Successfully entered word!")
        print("Status: ", response.json())
    else:
        print("Invalid word entry.")
        print("Response text: ", response.text)

def test_put_anagrams_cpu(game_code, player_id):
    params = {"cpu": "get", "game_code": game_code, "player_id": player_id}
    response = requests.put(BASE_URL + GAMES_ENDPOINT + "/" + game_code + ANAGRAMS_ENDPOINT + "/" + str(player_id), json=params)

    if response.status_code == 200:
        print("Successfully retrieved max cpu score!")
        print("Status: ", response.json())
    else:
        print("Unsuccessful.")
        print("Response text: ", response.text)


def test_put_anagrams_done(game_code, player_id):
    params = {"game_code": game_code, "player_id": player_id, "done": True}
    response = requests.put(BASE_URL + GAMES_ENDPOINT + "/" + game_code + ANAGRAMS_ENDPOINT + "/" + str(params["player_id"]), json=params)
    print(response.json())

def test_delete_game(game_code):
    params = {"game_code": game_code}
    response = requests.delete(BASE_URL + LOBBY_ENDPOINT, json = params)

    if response.status_code == 200:
        print("Successfully deleted game.")
        print("Status: ", response.json())
    else:
        print("Couldn't delete game.")
        print("Response test: ", response.text)

def test_get_lobby(game_code):
    params = {"game_code": game_code}
    response = requests.get(BASE_URL + LOBBY_ENDPOINT, json = params)

    print(response.json())

def test_sign_up():
    user_name = "Shayla"
    params = {"sign_up": "put"}
    response = requests.put(BASE_URL + USERS_ENDPOINT + "/" + user_name, json=params)
    if response.status_code == 200:
        print("User signed up successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to sign up user.")
        print("Response text: ", response.text)

def test_login():
    user_name = "Shayla"
    params = {"login": "get"}
    response = requests.get(BASE_URL + USERS_ENDPOINT + "/" + user_name, json=params)
    if response.status_code == 200:
        print("User info retreived successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to log in user.")
        print("Response text: ", response.text)

def test_change_palette():
    user_name = "Shayla"
    params = {"new_palette": "Iced Coffee"}
    response = requests.put(BASE_URL + USERS_ENDPOINT + "/" + user_name, json=params)
    if response.status_code == 200:
        print("Palette changed successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to change palette.")
        print("Response text: ", response.text)

def test_report_new_high_score():
    user_name = "Shayla"
    params = {"new_score": 30}
    response = requests.put(BASE_URL + USERS_ENDPOINT + "/" + user_name, json=params)
    if response.status_code == 200:
        print("Score reported successfully!")
        print("Status: ", response.json())
    else:
        print("Failed to report new score.")
        print("Response text: ", response.text)

if __name__ == "__main__":
    # comment out the ones you don't care to test
    
    # game_code = test_create_singleplayer_game()
    game_code = test_create_one_lobby_and_add_players()
    # test_get_grid(game_code)
    # test_get_players(game_code)
    # test_get_plays_made(game_code)
    # test_get_letters_captured(game_code, 2)
    # test_post_add_play_for_player(game_code)
    test_post_add_letter_for_player(game_code, "A", 1, 1)
    test_post_add_letter_for_player(game_code, "B", 1, 1)
    test_post_add_letter_for_player(game_code, "T", 1, 1)
    test_post_add_letter_for_player(game_code, "D", 1, 1)    
    # test_post_update_grid(game_code)
    test_get_letters_captured(game_code, 1)
    test_get_letters_captured(game_code, 2)
    test_get_letters_captured(game_code, 3)
    test_get_letters_captured(game_code, 4)
    # test_put_anagrams_cpu(game_code, 2)
    # test_put_anagrams_word(game_code, 1, "BAD")
    # test_put_anagrams_word(game_code, 1, "CAB")
    # test_put_anagrams_word(game_code, 1, "BAD")
    # test_put_anagrams_done(game_code, 3)
    # test_put_anagrams_done(game_code, 2)
    # test_put_anagrams_done(game_code, 1)
    # test_put_anagrams_done(game_code, 4)
    # test_get_lobby(game_code)
    # test_delete_game(game_code)
    # test_delete_player(game_code)
    # test_sign_up()
    # test_login()
    # test_change_palette()
    # test_report_new_high_score()

