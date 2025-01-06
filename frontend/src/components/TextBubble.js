import '../styles/Popup.css';

function TextBubble({ onClick = () => {}, id, text, styling }) {
  return (
    <div id={id} className="Help-letter-box" style={styling} onMouseUp={onClick()}>
      {text}
    </div>
  )
}

export default TextBubble;
