import '../styles/DotsAndBoxesPage.css'
import dot from '../images/blackdot.png'
import { PLAYER_TO_COLOR } from '../styles/colors'
import { getClaimedLetters, syncGridDB } from './utils';

import { useCallback } from 'react';
import { ReactSession } from 'react-client-session';

// Individual squares in grid. Highlights background with square's winner.
function Square({ loc, letter, pointValue, winner, helpModal }) {
  const palette = ReactSession.get("palette");
  // Configure styles based on data, if it's help modal or not
  let squareStyle = { "backgroundColor": `${palette[PLAYER_TO_COLOR[winner]].fill}` };
  if (!winner) {
    squareStyle["backgroundColor"] = "rgba(0, 0, 0, 0)";
  }
  if (helpModal) {
    squareStyle["fontSize"] = "10vw";
    squareStyle["color"] = palette.textColor;
  } else {
    squareStyle["fontSize"] = "calc(20vw / var(--dimension))";
  }
  if (letter === "W") {
    squareStyle["paddingLeft"] = "0.5vw";
  }
  
  return (
    <span id={"square-" + loc.x.toString() + "-" + loc.y.toString()}
          className='Grid-square'
          style={squareStyle}
    > 
      {letter} 
      {helpModal ? null : 
      <span className='Square-point-container' 
            style={{ "right": letter === "W" ? "0.5vw" : "", "left": letter === "W" ? "" : "0.2vw"}}
      >
        {pointValue}
      </span>
      }     
    </span>
  )
}

// Borders of squares, i.e. what players claim. Processes game logic for turns and claiming.
function Border({ loc, claimer, gridSquares, setGridSquares, currentPlayer, 
                  helpModal, lobbyCode, setPhase, mutable }) {
  const palette = ReactSession.get("palette");
  // Set colors, including hover
  let borderStyle = { "--claimer-color": palette[PLAYER_TO_COLOR[claimer]].normal }
  if (helpModal && claimer === 0) {
    borderStyle["opacity"] = 0;
  } else if (mutable && claimer === 0) {
    borderStyle["--hover-color"] = palette[PLAYER_TO_COLOR[currentPlayer]].normal;
    borderStyle["cursor"] = "pointer";
  } else if (mutable) {
    borderStyle["--hover-color"] = palette[PLAYER_TO_COLOR[claimer]].normal;
  } else {
    borderStyle["--hover-color"] = palette[PLAYER_TO_COLOR[claimer]].normal;
  }
  // On claim
  const handleClick = useCallback(() => {
    // Only trigger if it's your turn (mutable) and the border is unclaimed
    if (mutable && gridSquares[loc.y][loc.x].claimer === 0) {
      let newGridSquares = [...gridSquares];
      newGridSquares[loc.y][loc.x].claimer = currentPlayer;
      // Detect finished boxes
      const claimedLetters = getClaimedLetters(newGridSquares, gridSquares, loc.x, loc.y, currentPlayer);
      setGridSquares(newGridSquares);
      syncGridDB(newGridSquares, lobbyCode, claimedLetters, currentPlayer, setPhase);
    }
  }, [loc, gridSquares, setGridSquares, 
      currentPlayer, lobbyCode, setPhase, mutable])
  
  return ( 
    <div id={"border-" + loc.x.toString() + "-" + loc.y.toString()}
         onClick={handleClick} 
         className="Grid-border"
         style={borderStyle}
    /> );
}

function Dot({ loc, helpModal }) {
  let dotStyle;
  if (helpModal) {
    dotStyle = {"zIndex": 5};
  }
  return ( 
  <div className="Grid-dot-container">
    <img id={"dot-" + loc.x.toString() + "-" + loc.y.toString()}
         src={dot}
         alt={"black dot"}
         className="Grid-dot"
         style={dotStyle}
    />
  </div> );
}

function Grid({ lobbyCode, gridSquares, setGridSquares = () => {}, currentPlayer, 
                helpModal = false, setPhase = () => {}, mutable = true }) {
  const dim = Math.trunc(gridSquares.length / 2);
  const gridStyle = { "--dimension": dim };

  return (
    <div className="Grid-grid" style={gridStyle}>
      {gridSquares.map((gridrow, y) => 
        gridrow.map((griditem, x) => {
          if (griditem.hasOwnProperty("winner")) { 
            return (
              <Square 
                key={griditem.x.toString() + griditem.y.toString()}
                loc={{x: x, y: y}}
                letter={griditem.letter}
                pointValue={griditem.point_value}
                winner={griditem.winner}
                helpModal={helpModal}
              />
            )
          } else if (griditem.hasOwnProperty("claimer")) { 
            return (
              <Border 
                key={griditem.x.toString() + griditem.y.toString()}
                loc={{x: x, y: y}}
                claimer={griditem.claimer}
                gridSquares={gridSquares}
                currentPlayer={currentPlayer}
                setGridSquares={setGridSquares}
                helpModal={helpModal}
                lobbyCode={lobbyCode}
                setPhase={setPhase}
                mutable={mutable}
              />
            )
          } else { 
            return (
              <Dot key={griditem.x.toString() + griditem.y.toString()}
                   loc={{x: x, y: y}}
                   helpModal={helpModal}
              />
            )
          }
        })
      )}
    </div>
  )
}

export default Grid;