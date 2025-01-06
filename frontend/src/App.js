import "./styles/App.css";
import FrontPage from "./pages/FrontPage";

import { colors } from "./styles/colors";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import GamePage from "./pages/GamePage";
import ResultsPage from "./pages/ResultsPage";
import { ReactSession } from "react-client-session";

function App() {
  ReactSession.setStoreType("localStorage");
  if (!ReactSession.get("user")) {
    ReactSession.set("user", "Guest");
  }
  if (!ReactSession.get("palette")) {
    ReactSession.set("palette", colors["Rainbow Sherbet"]);
  }
  if (!ReactSession.get("user_id")) {
    ReactSession.set("user_id", 0);
  }

  return (
    <div className="App">
      <header className="App-header">
        <BrowserRouter>
          <Routes>
            <Route path="results" element={<ResultsPage />} /> Stashed changes
            <Route exact path="/" element={<FrontPage />} />
            <Route path="lobby/:lobbyCode" element={<GamePage />} />
          </Routes>
        </BrowserRouter>
      </header>
    </div>
  );
}

export default App;
