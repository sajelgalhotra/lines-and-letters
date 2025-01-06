import '../styles/DotsAndBoxesPage.css'

function LetterBox({ playerState, color, big = false, currentPlayer = false }) {
  let style = { 'backgroundColor': color };
  let location =  { 'gridColumn': currentPlayer ? 2 : 4, 'gridRowStart': 2, 'gridRowEnd': 4};
  let pointStyle = { "left": big ? "3.2vw" : "1.8vw" };
  let pointStyleW = { "left": big ? "4vw" : "2.2vw" };
  return (
    <div className={"LetterBox-container"} style={location}>
      <div className={big ? "LetterBox-big-name-container" : "LetterBox-small-name-container"}>
        {playerState.display_name}    
      </div>
      <div className={big ? "LetterBox-big" : "LetterBox-small"} style={style}>
        {playerState.letters_captured.map((letter) => 
          <span style={{"marginRight": big ? "3vw" : "2vw"}}>
            {letter.letter}
            <span className='LetterBox-point-container' style={letter.letter === "W" ? pointStyleW : pointStyle}>
              {letter.point_value}
            </span>
          </span>
        )}
      </div>
    </div>

  );
}

export default LetterBox;