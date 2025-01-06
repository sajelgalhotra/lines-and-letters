import "../styles/Popup.css";
import Grid from "./Grid";
import Popup from "./Popup";
import TextBubble from "./TextBubble";

import { useCallback, useEffect, useState } from "react";
import { ReactSession } from "react-client-session";

function HelpModal({ toggleForm, handleInputChange }) {
  const [page, setPage] = useState(0);
  const palette = ReactSession.get("palette");

  const handleKeyPress = useCallback((event) => {
    if (event.key === "ArrowLeft") {
      setPage(Math.max(0, page - 1));
    }
    if (event.key === "ArrowRight") {
      if (page === 4) {
        toggleForm();
      }
      setPage(Math.min(4, page + 1));
    }
  }, [toggleForm, page]);

  const handleClick = useCallback(() => {
    if (page < 4) {
      setPage(page + 1);
    } else {
      toggleForm();
    }
  }, [toggleForm, page]);

  useEffect(() => {
    document.body.addEventListener('keydown', handleKeyPress);
    return () => {
        document.body.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress]);

  const images = [
    (
      <div className="Help-image">
        <Grid 
          gridSquares={[
            [{ x: 0, y: 0 }, { x: 0, y: 1, claimer: 1 }, { x: 0, y: 2 }],
            [{ x: 1, y: 0, claimer: 0 }, { x: 1, y: 1, letter: "A", winner: 0, point_value: 1 }, { x: 1, y: 2, claimer: 0 }],
            [{ x: 2, y: 0 }, { x: 2, y: 1, claimer: 0 }, { x: 2, y: 2 }],
          ]}
          playerState={null}
          currentPlayer={1}
          mutable={false}
          helpModal={true}
        />
      </div>
    ), (
      <div className="Help-image">
        <Grid 
          gridSquares={[
            [{ x: 0, y: 0 }, { x: 0, y: 1, claimer: 1 }, { x: 0, y: 2 }],
            [{ x: 1, y: 0, claimer: 2 }, { x: 1, y: 1, letter: "A", winner: 1, point_value: 1 }, { x: 1, y: 2, claimer: 4 }],
            [{ x: 2, y: 0 }, { x: 2, y: 1, claimer: 1 }, { x: 2, y: 2 }],
          ]}
          playerState={null}
          currentPlayer={1}
          mutable={false}
          helpModal={true}
        />
      </div>
    ), (
      <div className="Help-image">
        <TextBubble id="help-bubble-word" text={"call"} styling={{"backgroundColor": palette["lighter"].normal, "marginTop": "4vw", "marginBottom": "1vw"}} />
        <TextBubble id="help-bubble-letters" text={"a d e e f g h i j k l m n"} styling={{"backgroundColor": palette["lighter"].normal}} />
      </div>
    ), (
      <div className="Help-image" style={{"display": "flex", "flexWrap": "wrap", "padding": "2.5vw"}}>
        <span style={{"fontSize": "9vw", "display": "flex", "marginRight": "2vw"}}>
          A
          <span className="Help-points-container">
            1
          </span>
        </span>
        <span style={{"fontSize": "9vw", "display": "flex"}}>
          H
          <span className="Help-points-container">
            2
          </span>
        </span>
        <span style={{"fontSize": "9vw", "display": "flex", "marginRight": "2vw"}}>
          K
          <span className="Help-points-container">
            3
          </span>
        </span>
        <span style={{"fontSize": "9vw", "display": "flex"}}>
          Q
          <span className="Help-points-container">
            5
          </span>
        </span>
      </div>
    ), null
  ];

  return (
    <Popup formType={`help ${page}`} 
           formStyle={[palette.darker, palette.textColor]} 
           toggleForm={toggleForm} 
           handleInputChange={handleInputChange}
           handleClick={handleClick}
           helpImage={images[page]}
    />
  );
}

export default HelpModal;