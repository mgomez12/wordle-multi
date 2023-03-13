const gameLogic = require("./game-logic");

let io;

const userToSocketMap = {}; // maps user ID to socket object
const socketToUserMap = {}; // maps socket ID to user object
const userToGameMap = {};

const getSocketFromUserID = (userid) => userToSocketMap[userid];
const getUserFromSocketID = (socketid) => socketToUserMap[socketid];
const getSocketFromSocketID = (socketid) => io.sockets.connected[socketid];
//const getUsersInGame = (gameid) => gameStates[gameid].players;
const getGameFromUserID = (userid) => userToGameMap[userid];
const gameExists = (gameid) => gameid in gameLogic.gameStates;

/** Send game state to client */

const createGame = () => {
  return gameLogic.createGame();
};

const sendPublicGameState = (gameId) => {
  io.to(gameId).emit("update", gameLogic.getPublicGameState(gameId));
};

/** Start running game: game loop emits game states to all clients at 60 frames per second */
const startRunningGame = (gameId) => {
  gameLogic.startGame(gameId);
  sendPublicGameState(gameId);
  gameLogic.gameStates[gameId].iid = setInterval(() => {
    // Reset game 5 seconds after someone wins.
    let publicState = gameLogic.getPublicGameState(gameId);
    let finished = true;
    let pointsArr = gameLogic.gameStates[gameId].points;
    for (const player in pointsArr)
      finished = finished && pointsArr[player] != 0;
    if (publicState.timeRemaining == 0 || finished) {
      let results = gameLogic.endGame(gameId);
      io.to(gameId).emit("end", results);
      clearInterval(gameLogic.gameStates[gameId].iid);
    } else {
      sendPublicGameState(gameId);
    }
  }, 1000); // 60 frames per second
};

const addUserToGame = (user, game, name) => {
  gameLogic.gameStates[game].players.add(user);
  gameLogic.gameStates[game].guesses[user] = [];
  gameLogic.gameStates[game].points[user] = 0;
  gameLogic.gameStates[game].names[user] = name;
};

const removeUserFromGame = (user, game) => {
  state = gameLogic.gameStates[game];
  state.players.delete(user);
  if (state.players.size == 0) {
    if (state.iid) clearInterval(state.iid);
    delete gameLogic.gameStates[game];
  }
};

const addUser = (user, gameid, name, socket) => {
  const oldSocket = userToSocketMap[user._id];
  if (oldSocket && oldSocket.id !== socket.id) {
    // there was an old tab open for this user, force it to disconnect
    oldSocket.disconnect();
    delete socketToUserMap[oldSocket.id];
  }

  let curGame = userToGameMap[user];
  console.log("user", user);
  console.log("found game", curGame);
  if (curGame) {
    return 401;
  }
  userToGameMap[user] = gameid;
  console.log("gamemap is now", userToGameMap);
  addUserToGame(user, gameid, name);
  sendPublicGameState(gameid);

  userToSocketMap[user] = socket;
  socketToUserMap[socket.id] = user;
  return 200;
  //io.emit("activeUsers", { activeUsers: getAllConnectedUsers() });
};

const removeUser = (user, socket) => {
  if (user) {
    delete userToSocketMap[user];
    removeUserFromGame(user, userToGameMap[user]); // Remove user from game if they disconnect
    delete userToGameMap[user];
  }
  delete socketToUserMap[socket.id];
};

module.exports = {
  init: (http) => {
    io = require("socket.io")(http);

    io.on("connection", (socket) => {
      console.log(`socket has connected ${socket.id}`);
      socket.on("disconnect", (reason) => {
        console.log(`socket disconnect ${socket.id}`);
        const user = getUserFromSocketID(socket.id);
        removeUser(user, socket);
      });
      socket.on("startGame", (resp) => {
        // Listen for moves from client and move player accordingly
        const user = getUserFromSocketID(socket.id);
        if (user) startRunningGame(resp.gameid);
      });
    });
  },

  addUser: addUser,
  removeUser: removeUser,
  createGame: createGame,

  getSocketFromUserID: getSocketFromUserID,
  getUserFromSocketID: getUserFromSocketID,
  getSocketFromSocketID: getSocketFromSocketID,
  addUserToGame: addUserToGame,
  removeUserFromGame: removeUserFromGame,
  sendPublicGameState: sendPublicGameState,
  //getUsersInGame: getUsersInGame,
  getGameFromUserID: getGameFromUserID,
  gameExists: gameExists,
  getIo: () => io,
};
