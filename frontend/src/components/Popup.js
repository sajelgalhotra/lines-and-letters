import '../styles/Popup.css';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { ReactSession } from "react-client-session";

import { BASE_URL } from './utils';

function JoinForm({ formType, formStyle, toggleForm, handleInputChange, handleClick = () => { }, helpImage = null, handleSubmit }) {
    const navigate = useNavigate();
    const types = {
        "enter code": {
            instructions: "Enter Your Lobby Code",
            tip: "If you don't have a lobby code, ask your lobby host or create a lobby for others to join.",
            submit: "Submit",
            mode: "joiner",
        },
        "receive code": {
            instructions: "This is Your Lobby Code",
            tip: "Share this code with others to have them join your lobby.",
            submit: "Proceed",
            mode: "host",
        },
        "select difficulty": {
            instructions: "Select CPU Difficulty",
            tip: "This determines how hard your AI opponent will be to play against.",
            submit: "Start Game",
            mode: "singleplayer",
        },
        "help 0": {
            instructions: "How to Play",
            tip: "When it's your turn, draw a line horizontally or vertically to connect two dots.",
        },
        "help 1": {
            instructions: "How to Play",
            tip: "Capture a letter by completing the box it's in.",
        },
        "help 2": {
            instructions: "How to Play",
            tip: "Once every letter is captured, use your letters to build words.",
        },
        "help 3": {
            instructions: "How to Play",
            tip: "Each letter has a point value. Some are worth more than others!",
        },
        "help 4": {
            instructions: "How to Play",
            tip: "The person who earns the most points wins!",
        },
        "profile creation": {
            instructions: "Sign In",
            tip: "If you have an account, enter your credentials here. If not, sign up with a unique username.",
            submit: "Submit"
        },
        "signed in": {
            instructions: "Hi " + ReactSession.get("user") + "!",
            tip: "Here's Your Highest Score!",
            submit: "Log Out"
        }
    }

    const [hostCode, setHostCode] = useState("");

    // 0 = valid, 1 = no code found, 2 = lobby full
    const [isCodeValid, setIsCodeValid] = useState(1);

    const [highScore, setHighScore] = useState(0);

    const verifyCode = async (currentCode) => {
        const requestData = { 'game_code': currentCode };
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        };

        try {
            const response = await fetch(BASE_URL + `/lobby`, requestOptions);
            const responseJson = await response.json();
            if (!response.ok) {
                setIsCodeValid(1);
            } else if (responseJson.players.length > 4) {
                setIsCodeValid(2);
            } else {
                console.log("ok");
                setHostCode(currentCode);
                setIsCodeValid(0);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const joinLobby = (code) => {
        const requestData = { "player_name": ReactSession.get("user"), "singleplayer": false, 'game_code': code };
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        };

        fetch(BASE_URL + `/lobby`, requestOptions)
            .then(response => response.json())
            .then(responseData => ReactSession.set("user_id", responseData.player_id))
            .catch(error => console.error('Error:', error));

    }

    const [shouldDisplayError, setShouldDisplayError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const updateShouldDisplayError = (errorText) => {
        setShouldDisplayError(isCodeValid !== 0);
        setErrorMessage(errorText);
    }

    const difficultyLevels = ["Easy Peasy", "Mid", "Don't Even Bother Trying"]

    const processInput = event => {
        event.target.value = ("" + event.target.value).toUpperCase();
        handleInputChange(formType, event.target.value);
        setHostCode(event.target.value);
        verifyCode(event.target.value);
    };

    const startSinglePlayer = (buttonName) => {
        const requestData = { "player_name": ReactSession.get("user"), "singleplayer": buttonName };
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        };
        if (hostCode === "") {
            fetch(BASE_URL + `/lobby`, requestOptions)
                .then(response => response.json())
                .then(responseData => {
                    console.log(responseData);
                    ReactSession.set("user_id", responseData.player_id);
                    setHostCode(responseData.game_code);
                    navigate(`/lobby/${responseData.game_code}`);
                })
                .catch(error =>
                    console.error('Error:', error)
                );
        }
    }

    const [username, setUsername] = useState(ReactSession.get("user"));

    let inputFieldElement;
    if (formType === "select difficulty") {
        const inputChange = (buttonName) => {
            startSinglePlayer(buttonName);
        }
        inputFieldElement = <div className="Cpu-Options">
            {
                difficultyLevels.map(function (key) {
                    return (
                        <Link className="Cpu-Link" to={"/"}><button id={key} className="Cpu-Button" onClick={() => { inputChange(key) }} style={{ '--selected-color': formStyle[0].fill }}>{key}</button> </Link>
                    )
                })
            }
        </div>;

    } else if (formType === "receive code") {
        const requestData = { "player_name": ReactSession.get("user"), "singleplayer": false };
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        };
        if (hostCode === "") {
            fetch(BASE_URL + `/lobby`, requestOptions)
                .then(response => response.json())
                .then(responseData => {
                    ReactSession.set("user_id", responseData.player_id);
                    setHostCode(responseData.game_code);
                    handleInputChange(formType, responseData.game_code);
                    setIsCodeValid(0);
                })
                .catch(error =>
                    console.error('Error:', error)
                );
        }
        inputFieldElement = <div className="Input-field" style={{ '--selected-color': formStyle[0].fill }}>{hostCode}</div>
        handleInputChange(formType, hostCode);
    } else if (formType === "profile creation") {
        const handleUsername = (event) => {
            setUsername(event.target.value);
        }
        inputFieldElement =
            <input className="Input-field" style={{ '--selected-color': formStyle[0].fill }} placeholder="Username" onChange={handleUsername}></input >

    } else if (formType === "signed in") {
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };
        fetch(BASE_URL + `/users/` + username, requestOptions)
            .then(response => response.json())
            .then(responseData => { setHighScore(responseData.profile.high_score); })
            .catch(error =>
                console.error('Error:', error)
            );
        inputFieldElement = <div className="Input-field" style={{ '--selected-color': formStyle[0].fill }}>
            {highScore}
        </div>
    }
    else if (!formType.startsWith("help")) {
        inputFieldElement = <input className="Input-field" onInput={processInput} style={{ '--selected-color': formStyle[0].fill }
        }></input >;
    }

    let submitButton;
    if (formType === "profile creation") {
        const submitUsername = () => {
            ReactSession.set("user", username);
            const requestData = { "sign_up": "put" };
            const requestOptions = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            };
            fetch(BASE_URL + `/users/` + username, requestOptions)
                .catch(error =>
                    console.error('Error:', error)
                );

        }
        submitButton = <Link className="Create-profile" ><button className="Submit-button" onClick={() => { submitUsername(); handleSubmit(); }} style={{ '--selected-color': formStyle[0].fill }}>{types[formType].submit}</button></Link >;
    } else if (formType === "signed in") {
        const resetUsername = () => {
            ReactSession.set("user", "Guest");
            ReactSession.set("user_id", -1);
        }
        submitButton = <Link className="Create-profile" ><button className="Submit-button" onClick={() => { resetUsername(); handleSubmit(); }} style={{ '--selected-color': formStyle[0].fill }}>{types[formType].submit}</button></Link >;
    } else if (formType !== "select difficulty" && types[formType].hasOwnProperty("submit")) {
        submitButton = (<Link className="Enter-lobby" to={isCodeValid === 0 ? '/lobby/' + hostCode : '/'}>
            <button className="Submit-button"
                onClick={() => {
                    updateShouldDisplayError(isCodeValid === 1 ? "No lobby with code " + hostCode + " found. Please try again." : "Lobby is full.");
                    if (isCodeValid === 0 && formType !== "receive code") { joinLobby(hostCode) }
                }}
                style={{ '--selected-color': formStyle[0].fill }}>
                {types[formType].submit}
            </button>
        </Link >);
    }

    let tipStyle = { '--selected-color': formStyle[1] };
    if (formType.startsWith("help")) {
        Object.assign(tipStyle, { "fontSize": "130%", "width": "50%", "marginTop": "4vw" });
    }
    return (
        <div>
            <div className="Form" style={{ '--selected-color': formStyle[0].normal }} onClick={handleClick}>
                <div className="Exit-button" onClick={toggleForm} style={{ '--selected-color': formStyle[1] }}>  X </div>
                <div className="Instructions" style={{ '--selected-color': formStyle[1] }}>{types[formType].instructions}</div>
                <div className="Tip-container">
                    <div className="Tip" style={tipStyle}>{types[formType].tip}</div>
                    {helpImage}
                </div>
                {shouldDisplayError && <div className="Error-message" style={{ '--selected-color': formStyle[0].fill }}>{errorMessage}</div>}
                {inputFieldElement}
                {submitButton}
                <div className="Page-display">
                    {formType.startsWith("help") ? ["0", "1", "2", "3", "4"].map((id) =>
                        formType[formType.length - 1] === id ?
                            <div key={id} className="Page-display-item" style={{ "backgroundColor": "black", "color": "black" }} />
                            :
                            <div key={id} className="Page-display-item" style={{ "backgroundColor": "grey", "color": "grey" }} />
                    ) : null}
                </div>
            </div>
        </div>)
}

export default JoinForm;