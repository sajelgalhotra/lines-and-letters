import '../styles/Lobby.css'

import { useEffect } from "react"; 
import { ReactSession } from "react-client-session";

import TextBubble from "../components/TextBubble.js";
import { PLAYER_TO_COLOR } from "../styles/colors.js";

import { BASE_URL, generateGrid } from '../components/utils';

function Lobby({ lobbyCode, playerState, setPhase, singleplayer }) {
    const host = playerState.length ? playerState[0]["display_name"] : "";
    const username = ReactSession.get("user");
    const palette = ReactSession.get("palette");

    const startDotsAndBoxes = () => {
        let gridSize = 5;
        if (playerState.length === 2) {
            gridSize = 4;
        }

        const gridItems = generateGrid(gridSize);

        const boardRequestData = { "grid": JSON.stringify(gridItems) };
        const boardRequestOptions = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(boardRequestData)
        };
        fetch(`${BASE_URL}/games/${lobbyCode}`, boardRequestOptions)
          .then(response => {
            const requestData = { "game_code": lobbyCode, "phase": 1 };
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            };
            fetch(`${BASE_URL}/lobby`, requestOptions)
                .then(response => { setPhase(1); })
                .catch(error => console.error('Error:', error));
            
          })
          .catch(error => console.error('Error:', error));
    }
    

    useEffect(() => {
        return () => {
            // Delete player from lobby. Needs API
        }
    })

    let bottomText = "Waiting for host to start the game";
    if (username === host) {
        if (playerState.length > 1) {
            bottomText = "Start Game";
        } else {
            bottomText = "Waiting for opponents to join";
        }
    }

    let playerBubbles = [...playerState];
    while (!singleplayer && playerBubbles.length < 4) {
        playerBubbles.push(null);
    }

    return (
        <div className="Lobby-page">
            <TextBubble id="code-bubble" text={lobbyCode} styling={{"backgroundColor": palette["lightest"].normal}}/>
            <div className="Lobby-player-container">
                {playerBubbles.map((player, index) => 
                    (player ? 
                        <TextBubble id={`player-bubble-${index}`} 
                                    text={player.display_name} 
                                    styling={{ 
                                        "marginLeft": (Math.floor(index / 2) ? "10vw" : null),
                                        "backgroundColor": palette[PLAYER_TO_COLOR[index + 1]].normal,
                                        "gridRow": Math.floor(index / 2) + 1,
                                        "gridColumn": index % 2 + 1 
                                    }}
                        />
                        :
                        <TextBubble id={`player-bubble-${index}`} 
                                    text={"Waiting to join..."} 
                                    styling={{
                                        "marginLeft": (Math.floor(index / 2) ? "10vw" : null),
                                        "borderColor": palette["textColor"],
                                        "borderWidth": "3px",
                                        "borderStyle": "solid",
                                        "gridRow": Math.floor(index / 2) + 1,
                                        "gridColumn": index % 2 + 1
                                    }}
                        />
                    )
                )}
            </div>
                <TextBubble onClick={bottomText === "Start Game" ? () => startDotsAndBoxes : () => {} }
                            id="bottom-bubble"
                            text={bottomText}
                            styling={{"backgroundColor": palette["lightest"].normal, 
                                      "cursor": bottomText === "Start Game" ? "pointer" : "default"}}/>
        </div>
    )
}

export default Lobby;