/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

const socketManager = require("./server-socket");
const gameLogic = require("./game-logic");

router.get("/validGame", (req, res) => {
  let id = req.query.id;
  let user = req.query.user;
  console.log("aaaauser", user);
  console.log(socketManager.gameExists(req.id));
  res.send({
    validGame: socketManager.gameExists(id),
    validSession: !socketManager.getGameFromUserID(user),
  });
  console.log("id", id);
  console.log("got game", socketManager.getGameFromUserID(user));
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.body.user) {
    if (!socketManager.gameExists(req.body.gameid)) {
      res.statusCode = 400;
      console.log("game ", req.body.gameid, "nonexistent");
    } else {
      socket = socketManager.getSocketFromSocketID(req.body.socketid);
      console.log("received ", req.body);
      res.statusCode = socketManager.addUser(
        req.body.user,
        req.body.gameid,
        req.body.playerName,
        socket
      );
      res.send({ gameState: gameLogic.getPublicGameState(req.body.gameid) });
      socket.join(req.body.gameid);
      return;
    }
  } else res.statusCode = 400;
  res.send({});
});

router.post("/creategame", (req, res) => {
  let id = socketManager.createGame();
  res.send({ gameid: id });
});

router.post("/guess", (req, res) => {
  let user = req.body.userid;
  let game = socketManager.getGameFromUserID(user);
  if (user && game) {
    res.send({ colors: gameLogic.guess(game, user, req.body.word) });
    socketManager.sendPublicGameState(game);
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
