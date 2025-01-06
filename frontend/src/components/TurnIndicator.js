function TurnIndicator({ player, isUser }) {
  return (
    <div className={"TurnIndicator"} style={{ "backgroundColor": player.color, "color": player.fontColor }}>
      {isUser ? "Your Turn" : `${player.name}'s Turn`}
    </div>
  );
}

export default TurnIndicator;