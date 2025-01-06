import '../styles/DotsAndBoxesPage.css';
import { PLAYER_TO_COLOR } from '../styles/colors';
import Grid from '../components/Grid';
import LetterBox from '../components/LetterBox';
import TurnIndicator from '../components/TurnIndicator';
import HelpModal from '../components/HelpModal';
import logout from '../images/logout.png';
import help from '../images/help.svg';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { ReactSession } from "react-client-session";

import { CPU, syncGridDB } from '../components/utils.js';

import db from '../firebase.js';
import { get, onValue, ref } from "firebase/database";

function DotsAndBoxesPage({ user = 1, lobbyCode, playerState, setPhase, singleplayer = false }) {

  const [currentPlayer, setCurrentPlayer] = useState(1);

  const palette = ReactSession.get("palette");

  const [gridSquares, setGridSquares] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  }

  useEffect(() => {
    const lobbyRef = ref(db, "games/" + lobbyCode + "/grid");
    return onValue(lobbyRef, (snapshot) => {
      setGridSquares(JSON.parse(snapshot.val()));
    });
  }, [gridSquares, lobbyCode])

  useEffect(() => {
    const currentPlayerRef = ref(db, "games/" + lobbyCode + "/current_player");
    return onValue(currentPlayerRef, (snapshot) => {
      setCurrentPlayer(snapshot.val());
      if (snapshot.val() === 2 && singleplayer) {
        setTimeout(() => {
          get(ref(db, "games/" + lobbyCode + "/grid"))
            .then((snapshot) => {
              const gridState = JSON.parse(snapshot.val());
              const updates = CPU(gridState, singleplayer);
              syncGridDB(updates.grid, lobbyCode, updates.claimedLetters, 2, setPhase)
            })
        }, 700)
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="DAB-Page">
      <Link to="/">
        <img src={logout} className="DAB-Page-logout" alt="logout" 
             data-tooltip-id="logout-tooltip" data-tooltip-content="Return Home"
        />
        <Tooltip id="logout-tooltip" style={{"fontSize": "3vmin"}}/>
      </Link>
      <TurnIndicator player={{name: playerState[currentPlayer - 1].display_name, 
                              color: palette[PLAYER_TO_COLOR[currentPlayer]].normal,
                              fontColor: palette.textColor}} 
                              isUser={currentPlayer === user} />
      <div onClick={toggleForm} className="DAB-Page-help">
        <img src={help} className="DAB-Page-help-icon" alt="help"
             data-tooltip-id="help-tooltip" data-tooltip-content="Tutorial"
        />
        <Tooltip id="help-tooltip" style={{"fontSize": "3vmin"}}/>
      </div>
      {isFormOpen ? (<HelpModal toggleForm={toggleForm} handleInputChange={() => {}} palette={palette}/>) : null}
      <LetterBox playerState={playerState[user - 1]} 
                 color={palette[PLAYER_TO_COLOR[user]].normal}
                 big
                 currentPlayer
      />
      <Grid lobbyCode={lobbyCode}
            gridSquares={gridSquares} 
            setGridSquares={setGridSquares} 
            currentPlayer={currentPlayer}
            setPhase={setPhase}
            mutable={user === currentPlayer}
            singleplayer={singleplayer}
      />
      <div className="DAB-Page-opponents-container">
        {playerState.map((player, index) => {
          if (index + 1 !== user) {
            return (
              <LetterBox key={index}
                         playerState={player}
                         color={palette[PLAYER_TO_COLOR[index + 1]].normal}
                         big={playerState.length === 2}
              />
            ) 
          } else {
              return null;
          }
        })}
      </div>
    </div>
  );
}

export default DotsAndBoxesPage;