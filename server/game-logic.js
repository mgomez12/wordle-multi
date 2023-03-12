/** constants */
TIME_LIMIT = 1000 * 60 * 2;

var fs = require("fs");
var solutions = fs.readFileSync(require('path').resolve(__dirname, 'solutions.txt'));
var valid_words = fs.readFileSync(require('path').resolve(__dirname, 'valid-wordle-words.txt'));
var words = new Set(valid_words.toString().split("\n"));
var solutions = solutions.toString().split("\n");

/** Game state */
const gameStates = {};

/** Game logic */

const createGame = () => {
	let gameid = '';
	do {
		gameid = ''
		for (let i = 0; i < 6; i++) gameid += randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
	} while (gameid in gameStates);
	gameStates[gameid] = {
		players:new Set(),
		active: false,
		timeStarted: null,
		word:"" ,
		guesses: {},
		points: {},
		names: {}
	}
	return gameid;
}

const startGame = (gameid) => {
	let state = gameStates[gameid];
	state.active = true;
	state.timeStarted = Date.now();
	state.word = solutions[Math.trunc(Math.random() * solutions.length)].toUpperCase();
	state.guesses = {};
	for (const player of state.players) {
		state.guesses[player] = [];
		state.points[player] = 0;
	}
}

const getPublicGameState = (gameid) => {
	let state = gameStates[gameid];
	let time_left = TIME_LIMIT - (Date.now() - state.timeStarted)
	let publicState = {
		players: [],
		guessNums: [],
		active: state.active,
		names: state.names,
		timeRemaining: time_left >= 0 ? time_left : 0	}
	for (const player of state.players) {
		publicState.players.push(player);
		publicState.guessNums.push(state.guesses[player].length);
	}
	return publicState;

}


const guess = (gameid, userid, guess) => {
	if (!words.has(guess.toLowerCase())) return 'INVALID';
	let state = gameStates[gameid];
	state.guesses[userid].push(guess);
	let colors = "";
	let word = state.word;
	for (let i = 0; i < 5; i++) {
		if (word[i] == guess[i]) {
			colors += "Y";
			word[i] = "_";
		}
		else {
			let ix = word.indexOf(guess[i]);
			if (ix == -1) colors += "N"
			else {
				colors += "?"
				word[ix] = "_";
			}
		}

	}

	if (colors == "YYYYY") {
		let points = 60 - 10 * (state.guesses[userid].length - 1);
		points += 40 - 10 * Math.floor((Date.now() - state.timeStarted) / (30 * 1000));
		state.points[userid] = points;

	}
	return colors;


}

/** Check win condition */
const endGame = (gameid) => {
	gameStates[gameid].active = false;
	return {
		word: gameStates[gameid].word,
		points: gameStates[gameid].points

	}

}


/** Update the game state. This function is called once per server tick. */
const updateGameState = () => {
  checkWin();
  computePlayersEatPlayers();
  computePlayersEatFoods();
  checkEnoughFoods();
};

/** Remove a player from the game state if they disconnect or if they get eaten */
const removePlayer = (id) => {
  if (gameState.players[id] != undefined) {
    delete gameState.players[id];
  }
};


const resetWinner = () => {
  gameState.winner = null;
};

module.exports = {
  gameStates,
  removePlayer,
  updateGameState,
  resetWinner,
  startGame,
	createGame,
  getPublicGameState,
	endGame,
	guess


};
