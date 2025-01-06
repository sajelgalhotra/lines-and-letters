import "../styles/ResultsPage.css";
import ScoreIndicatorBar from "../components/ScoreIndicatorBar";
import { useEffect, useState } from "react";
import { ReactSession } from "react-client-session";
import { PLAYER_TO_COLOR } from "../styles/colors";
import { BASE_URL } from "../components/utils";

import { useNavigate } from "react-router-dom";
export default function ResultsPage({ playerState, lobbyCode }) {
  const palette = ReactSession.get("palette");
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState([1, 90]);
  const navigate = useNavigate();
  useEffect(() => {
    async function fetchScores() {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_code: lobbyCode,
          scores: true,
        })
      };
      try {
        const newPlayers = await fetch(`${BASE_URL}/lobby`, requestOptions).then(response => response.json());
        setPlayers(newPlayers);
        const scores = newPlayers.map((item) => Object.values(item)[0]);
        setWinner([scores.indexOf(Math.max(...scores)), Math.max(...scores)]);
      } catch (error) {
        console.error("Error: " + error);
      }
    }
    fetchScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ResultsPage">
      <div className="winner-text-container" style={{"--winner-color": palette[PLAYER_TO_COLOR[winner[0] + 1]].normal}}>
        <div className="winner-text">
          {playerState[winner[0]].display_name} wins
        </div>
      </div>
      <div className="score-container">
        {players
          .sort()
          .map((player, index) => ({
            ...player,
            ...playerState[index],
          }))
          .map((player, index) => (
            <div key={index} className="score-indicator-bar-row">
              <ScoreIndicatorBar
                width={90 * (player.total_score / winner[1])}
                score={player.total_score}
                color={palette[PLAYER_TO_COLOR[index + 1]].normal}
                player={player}
              />
            </div>
          ))}
      </div>
      <div className="action-buttons">
        <button
          onClick={() => {
            navigate(`/`);
          }}
        >
          Return to Lobby
        </button>
      </div>
    </div>
  );
}
