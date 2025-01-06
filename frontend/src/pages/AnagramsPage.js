import React, { useState, useEffect, useCallback } from "react";
import { ReactSession } from "react-client-session";
import "../styles/AnagramsPage.css";
import { submitFinalScore } from "../components/utils.js";
import { BASE_URL, canProceed } from "../components/utils";

function AnagramsPage({ letters, lobbyCode, setPhase, singleplayer }) {
  const palette = ReactSession.get("palette");
  const [leftLetters, setLeftLetters] = useState(letters);
  const [middleLetters, setMiddleLetters] = useState([]);
  const [rightWords, setRightWords] = useState([]);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [middleMessage, setMiddleMessage] = useState("");

  const [showMiddleMessage, setShowMiddleMessage] = useState(false);

  const handleEnterKey = useCallback(async () => {
    const isValidWord = async (word) => {
      // check if the word is valid

      const requestOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word_entered: word,
          letters: middleLetters.map((letter) => ({
            letter: letter.letter,
            point_value: letter.point_value,
          })),
        }),
      };
      let status = -1;
      let text = "";
      await fetch(
        `${BASE_URL}/games/${lobbyCode}/anagrams/${ReactSession.get(
          "user_id"
        )}`,
        requestOptions
      ).then(async (response) => {
        status = response.status;
        text = await response.text();
      });

      if (status === 200) {
        return true;
      }

      if (status === 400) {
        setMiddleMessage(text.slice(1, text.length - 2));
        setShowMiddleMessage(true);
      }

      return false;
    };

    if (isTimerRunning) {
      const word = middleLetters.map((letter) => letter.letter).join("");
      const wordScore = middleLetters
        .map((letter) => letter.point_value)
        .reduce((a, b) => a + b);
      if (word && (await isValidWord(word))) {
        if (rightWords.map((word) => word.word).includes(word)) {
          setShowMiddleMessage(true);
        } else {
          setRightWords([{ word: word, score: wordScore }, ...rightWords]);
          setMiddleLetters([]);
          setScore(score + wordScore);
          setShowMiddleMessage(false);
          setLeftLetters(letters);
        }
      }
    }
  }, [letters, isTimerRunning, middleLetters, rightWords, score, lobbyCode]);

  // Handle timer
  useEffect(() => {
    if (isTimerRunning) {
      const timer = setInterval(async () => {
        if (timeRemaining > 0) {
          setTimeRemaining((prevTime) => prevTime - 1);
        } else {
          setIsTimerRunning(false);
        }
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    } else {
      const requestData = { new_score: score };
      const requestOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      };
      fetch(
        BASE_URL + `/users/` + ReactSession.get("user"),
        requestOptions
      ).catch((error) => console.error("Error:", error));

      submitFinalScore(lobbyCode, ReactSession.get("user_id"), score);

      const timer = setInterval(async () => {
        let goToResults = await canProceed(
          lobbyCode,
          ReactSession.get("user_id"),
          true
        );

        if (goToResults) {
          alert("Changing to results!");
          setPhase(3);
        }
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, isTimerRunning]);

  // Input words
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        handleEnterKey();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleEnterKey]);

  // Set backend on mount
  useEffect(() => {
    const requestData = { "letters_captured": true };
    const requestOptions = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    };
    fetch(`${BASE_URL}/games/${lobbyCode}/anagrams/${ReactSession.get("user_id")}`, requestOptions)
      .catch((error) => console.error("Error: " + error));
    if (singleplayer) {
      fetch(`${BASE_URL}/games/${lobbyCode}/anagrams/2`, requestOptions)
        .then(response => {
          const cpuRequestData = { "cpu": true };
          const cpuRequestOptions = {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(cpuRequestData)
          };
          fetch(`${BASE_URL}/games/${lobbyCode}/anagrams/2`, cpuRequestOptions)
            .catch((error) => console.error("Error: " + error));
        })
        .catch((error) => console.error("Error: " + error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeftClick = (letter) => {
    if (isTimerRunning) {
      const index = leftLetters.indexOf(letter);
      if (index !== -1) {
        setLeftLetters(leftLetters.filter((_, i) => i !== index));
        setMiddleLetters([...middleLetters, letter]);
        setShowMiddleMessage(false);
      }
    }
  };

  const handleMiddleClick = (index) => {
    if (isTimerRunning) {
      const letter = middleLetters[index];
      setMiddleLetters(middleLetters.filter((_, i) => i !== index));
      setLeftLetters([...leftLetters, letter].sort());
      setShowMiddleMessage(false);
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="AnagramsPage"
      style={{ backgroundColor: palette.backgroundColor }}
    >
      <header className="header">
        <div
          className="timer"
          style={{
            backgroundColor: palette.lightest.normal,
            color: palette.textColor,
          }}
        >
          {formatTime(timeRemaining)}
        </div>
      </header>
      <div className="game-container">
        <div
          className="left-side"
          style={{ backgroundColor: palette.lightest.normal }}
        >
          {leftLetters.map((letter, index) => (
            <span
              key={index}
              onClick={() => handleLeftClick(letter)}
              style={{ color: palette.backgroundColor }}
            >
              {letter.letter}
              <span className="point-container">{letter.point_value}</span>
            </span>
          ))}
        </div>
        <div className="middle-section">
          <div className="message-box">
            <div
              className={`already-submitted ${(isTimerRunning && showMiddleMessage) || !isTimerRunning
                ? "visible"
                : "hidden"
                }`}
              style={{
                backgroundColor: palette.darker.normal,
                color: palette.backgroundColor,
              }}
            >
              {isTimerRunning ? middleMessage : "Time's up!"}
            </div>
          </div>
          <div
            className="selected-letters"
            style={{
              backgroundColor: palette.darkest.normal,
            }}
          >
            {middleLetters.map((letter, index) => (
              <span
                key={index}
                onClick={() => handleMiddleClick(index)}
                style={{ color: palette.backgroundColor }}
              >
                {letter.letter}
              </span>
            ))}
          </div>
        </div>
        <div
          className="right-section"
          style={{ backgroundColor: palette.lightest.normal }}
        >
          <div className="score" style={{ color: palette.textColor }}>
            Total: {score}
          </div>
          <div className="word-list" style={{ color: palette.backgroundColor }}>
            {rightWords.map((word, index) => (
              <div key={index}>
                {word.word} - {word.score}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnagramsPage;
