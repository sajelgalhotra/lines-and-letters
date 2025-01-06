import '../styles/FrontPage.css';
import pfp from '../images/pfp.png';
import { colors } from '../styles/colors';
import React, { useState, useMemo } from 'react';
import Popup from '../components/Popup.js'

import { Tooltip } from 'react-tooltip';
import { ReactSession } from "react-client-session";

function FrontPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSource, setFormSource] = useState('');
  const [formData, setFormData] = useState({
    'name': '',
    'cpu': '',
    'code': '',
  });

  const [palette, setPalette] = useState(ReactSession.get("palette"));

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsFormOpen(false);
  };


  const toggleForm = (source) => {
    setIsFormOpen(!isFormOpen);
    setIsMenuOpen(false);
    setFormSource(source);
  };

  const inputChange = useMemo(() => {
    return (currentTemplate, value) => {
      if (currentTemplate === "select difficulty" && formData.cpu !== value) {
        setFormData(prevFormData => ({
          ...prevFormData,
          'cpu': value
        }));
      } else if (currentTemplate === "enter code" && formData.code !== value) {
        setFormData(prevFormData => ({
          ...prevFormData,
          'code': value
        }));
      } else if (currentTemplate === "enter name" && formData.name !== value) {
        setFormData(prevFormData => ({
          ...prevFormData,
          'name': value
        }));
      }
    };
  }, [formData]);

  const [isLoggedIn, setIsLoggedIn] = useState(ReactSession.get("user") !== "Guest");

  return (
    <div>
      <img src={pfp} className="Pfp-button" alt="pfp" onClick={() => toggleForm("signed in")} data-tooltip-id="profile-tooltip" data-tooltip-content="Profile" />
      <Tooltip id="profile-tooltip" style={{ "fontSize": "3vmin" }} />
      <div className="App-logo">
        <div className="Square"
          style={{ '--border-colors': [palette.lighter.normal, palette.darker.normal, palette.darkest.normal, palette.lightest.normal].join(" ") }}>
          <span className="Dot TopLeft"></span>
          <span className="Dot TopRight"></span>
          <span className="Dot BottomLeft"></span>
          <span className="Dot BottomRight"></span>
          <div className="Logo-content">a</div>
        </div>
      </div>
      <div className="Palette-circle"
        onClick={toggleMenu}
        style={{ '--border-colors': [palette.lighter.normal, palette.darker.normal, palette.darkest.normal, palette.lightest.normal].join(" ") }}
        data-tooltip-id="palette-tooltip" data-tooltip-content="Color Palette Selector"
      />
      <Tooltip id="palette-tooltip" style={{ "fontSize": "3vmin" }} />
      {
        isMenuOpen && (
          <div className="Palette-popup">
            <div className="Palette-popup-content">
              <div className="Palette-nav">
                <div className="Palette-description">Color Customization Menu </div>
                <button className="Leave-menu-button" onClick={toggleMenu}>X</button>
              </div>
              {Object.keys(colors).map(function (key) {
                return (
                  <div className="Palette-container">
                    <div className="Palette-name">{key}</div>
                    <div key={key}
                      onClick={() => {
                        ReactSession.set("palette", colors[key]);
                        setPalette(colors[key]);
                      }}
                      className="Swatch-container">
                      <div className="Lightest-swatch" style={{ '--selected-color': colors[key].lightest.normal }} />
                      <div className="Lighter-swatch" style={{ '--selected-color': colors[key].lighter.normal }} />
                      <div className="Darker-swatch" style={{ '--selected-color': colors[key].darker.normal }} />
                      <div className="Darkest-swatch" style={{ '--selected-color': colors[key].darkest.normal }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      }
      <p>
        Lines & Letters
      </p>
      {isFormOpen && isLoggedIn && (
        < Popup formType={formSource} formStyle={[palette.darkest, palette.textColor]} toggleForm={toggleForm} handleInputChange={inputChange} handleSubmit={() => { setIsLoggedIn(false) }} />
      )}
      {isFormOpen && !isLoggedIn && (
        < Popup formType="profile creation" formStyle={[palette.darkest, palette.textColor]} toggleForm={toggleForm} handleInputChange={inputChange} handleSubmit={() => setIsLoggedIn(true)} />
      )}
      <div className="Button-container" style={{ '--selected': palette.textColor }}>
        <button className="Single-play-button" onClick={() => toggleForm("select difficulty")} style={{ '--selected-color': palette.lighter.normal }}>
          Single Player
        </button>
        <button className="Join-lobby-button" onClick={() => toggleForm("enter code")} style={{ '--selected-color': palette.darker.normal }}>
          Join a Lobby
        </button>
        <button className="Create-lobby-button" onClick={() => toggleForm("receive code")} style={{ '--selected-color': palette.darkest.normal }}>
          Create a Lobby
        </button>
      </div>
    </div>
  );
}

export default FrontPage;
