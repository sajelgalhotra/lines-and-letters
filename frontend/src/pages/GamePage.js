import Lobby from "./Lobby";
import AnagramsPage from "./AnagramsPage";
import DotsAndBoxesPage from "./DotsAndBoxesPage";

import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ReactSession } from "react-client-session";
import ResultsPage from "./ResultsPage";
import { BASE_URL } from "../components/utils.js";


import { get, onValue, ref } from "firebase/database";
import db from "../firebase.js";

function GamePage({ initialPhase = 0 }) {
  const singleplayer = useRef();
  const username = ReactSession.get("user");
  const { lobbyCode } = useParams();
  const location = useLocation();

  const [phase, setPhase] = useState(initialPhase);

  const [user, setUser] = useState(ReactSession.get("user_id"));
  const [playerState, setPlayerState] = useState([]);

  // Get singleplayer from DB on mount
  useEffect(() => {
    const singlePlayerRef = ref(db, "games/" + lobbyCode + "/singleplayer")
    get(singlePlayerRef)
      .then((snapshot) => {
        singleplayer.current = snapshot.val();
      });
  }, [lobbyCode])

  // Monitor game phase
  useEffect(() => {
    const phaseRef = ref(db, "games/" + lobbyCode + "/phase");
    return onValue(phaseRef, (snapshot1) => {
      setPhase(snapshot1.val());
    });
  }, [lobbyCode, username]);

  // Monitor player state
  useEffect(() => {
    const lobbyRef = ref(db, "games/" + lobbyCode + "/players");
    return onValue(lobbyRef, (snapshot) => {
      if (!snapshot.val()) { return playerState; }
      const newPlayerState = snapshot.val().slice(1).map((item) => {
        return { ...item, letters_captured: item.letters_captured === "" ? [] : Object.values(item.letters_captured) };
      });
      const filteredArray = newPlayerState.map((item) =>
        item.display_name === username ? 1 : 0
      );
      setUser(filteredArray.indexOf(1) + 1);
      setPlayerState(newPlayerState);
    });
  }, [lobbyCode, playerState, username])

  // Delete player on dismount if leaving before the game starts
  useEffect(() => {
    return () => {
      const phaseRef = ref(db, "games/" + lobbyCode + "/phase")
      get(phaseRef)
        .then((snapshot) => {
          if (snapshot.val() === 0) {
            const requestData = { "game_code": lobbyCode, "delete_target": "player", "player_id": ReactSession.get("user_id") };
            const requestOptions = {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestData)
            };
            fetch(`${BASE_URL}/lobby`, requestOptions)
              .catch(error => console.error(error));
          }
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  if (phase === 0) {
    return (
      <Lobby
        lobbyCode={lobbyCode}
        playerState={playerState}
        setPhase={setPhase}
        singleplayer={singleplayer.current}
      />
    );
  } else if (phase === 1) {
    return (
      <DotsAndBoxesPage user={user}
        lobbyCode={lobbyCode}
        playerState={playerState}
        setPlayerState={setPlayerState}
        setPhase={setPhase}
        singleplayer={singleplayer.current}
      />
    );
  } else if (phase === 2) {
    return (
      <AnagramsPage
        letters={playerState[user - 1].letters_captured}
        lobbyCode={lobbyCode}
        setPhase={setPhase}
        singleplayer={singleplayer.current}
      />
    );
  } else if (phase === 3) {
    return (
      <ResultsPage
        playerState={playerState}
        lobbyCode={lobbyCode}
      />
    );
  }

  return (
    <AnagramsPage
      letters={playerState[user - 1].letters_captured}
      lobbyCode={lobbyCode}
      setPhase={setPhase}
    />
  );
}

export default GamePage;
