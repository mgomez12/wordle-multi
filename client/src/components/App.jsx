import React, { useState, useEffect } from "react";
import { Router, Redirect } from "@reach/router";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import NotFound from "./pages/NotFound.jsx";
import Game from "./pages/Game.jsx";

import { get, post } from "../utilities";

// to use styles, import the necessary CSS files
import "../utilities.css";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Define the "App" component as a function.
 */
const App = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const setFp = async () => {
      const fp = await FingerprintJS.load();

      const { visitorId } = await fp.get();
      console.log("setting id");
      setUserId(visitorId);
    };
    setFp();
  }, []);
  // required method: whatever is returned defines what
  // shows up on screen
  return (
    // <> is like a <div>, but won't show
    // up in the DOM tree
    <>
      <h1 style={{ textAlign: "center", margin: "30px", color: "green" }}>
        WORDLEEE
      </h1>
      <div className="App-container">
        <Router>
          <Redirect noThrow={true} from="/" to="/game" />
          <Game
            path="/game"
            style={{ display: "flex" }}
            gameId={null}
            userId={userId}
          />
          <Game path="/game/:gameId" userId={userId} />
          <NotFound default />
        </Router>
      </div>
    </>
  );
};

export default App;
