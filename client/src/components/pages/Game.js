import React, { useState, useEffect, useRef } from "react";
import {navigate} from "@reach/router";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import Board from '../modules/Board.js'

import { socket } from "../../client-socket.js";
import { get, post } from "../../utilities";

import "../../utilities.css";
import "./Game.css";

const Game = (props) => {
	const  [gameID, setGameID] = useState("");
	const  [playerName, setPlayerName] = useState("");
	const  [warning, setWarning] = useState(false);
	const  [warningText, setWarningText] = useState(false);
	const  [joined, setJoined] = useState(false);
	const  [validSession, setValidSession] = useState(false);
	const  [gameState, setGameState] = useState({});
	const  [active, setActive] = useState(false);
	const  [time, setTime] = useState(0);
	const  [curGuess, setCurGuess] = useState('');
	const  [guesses, setGuesses] = useState([]);
	const  [colors, setColors] = useState([]);
	const  [invalidWord, setInvalidWord] = useState(false);
	const  [results, setResults] = useState({word: '', points: {}});


	function updateGuess(ix, letter) {
		if (letter == 'Backspace') {
			setCurGuess(curGuess.slice(0,-1));
		} else {
			setCurGuess((curGuess + letter.toUpperCase()));
		}
		setInvalidWord(false);
	}

	const inputChar = async (e) => {
		if (guesses >= 5 || !active || colors[colors.length-1] == "YYYYY") return;
		if ((String.fromCharCode(e.keyCode).match(/[a-zA-Z]/g) && curGuess.length < 5) || e.key == 'Backspace') updateGuess(guesses.length, e.key);
		else if (e.key == 'Enter') {
			console.log("GUESSING");
			if (curGuess.length < 5) return;
			let word_colors = (await post("/api/guess", {userid: props.userId, word: curGuess})).colors;
			if (word_colors == 'INVALID') {
				setInvalidWord(true);
				return;
			}

			console.log("GOT COLORS", word_colors);
			let newColors = [...colors];
			newColors.push(word_colors);
			setColors(newColors);
			let newGuesses = [...guesses];
			newGuesses.push(curGuess);
			setGuesses(newGuesses);
			setCurGuess('');
		}
	}


  useEffect(() => {
    window.addEventListener("keydown", inputChar);
	return () => {
		window.removeEventListener("keydown", inputChar);
	}

  }, [curGuess, active, colors]);

  useEffect(() => {
	  console.log("mounting");
	  socket.on("update", (state) => {
		  setGameState(state);
		  setActive(state.active);
		  setTime(state.timeRemaining);
	  });
	  socket.on("end", (res) => {
		  setActive(false);
		  setTime(0);
		  setResults(res)
	  });
	  return () => {
		  socket.off("update");
		  socket.off("end");
	  }
  }, []);

  useEffect(() => {
	  console.log("checking if can join");
	  console.log(props.gameId, ", ", props.userId);
	if (props.gameId && props.userId) {
		get("/api/validGame?id="+props.gameId+"&user="+props.userId).then((resp) => {
			if (resp.validGame && resp.validSession) {
				setValidSession(true);
				console.log("valid session");
			}
			else {
				setValidSession(false);
			 	setWarning(true);
				if (!resp.validGame) {
					setWarningText("Invalid Game!!!");
				}
				else setWarningText("Existing game session!!!");
	
			}
		});
	}
  }, [props.userId, props.gameId]);


  const timeFormat = (millis) => {
	  let minutes = Math.floor(millis / (60 * 1000)).toString();
	  let seconds = Math.ceil((millis - minutes * 60 * 1000)/1000).toString();
	  return minutes + ":" + (seconds.length < 2 ? "0" : "") + seconds;


  }

  const gameIDChange = (e) => {
	  setGameID(e.target.value.toUpperCase());
  }

  const nameChange = (e) => {
	  setPlayerName(e.target.value);
	  console.log("name: ", e.target.value);
  }

  const createGame = async () => {
	  let res = await post('/api/creategame');
	  navigate('/game/' + res.gameid);

  }


  const startGame = () => {
	  setCurGuess('');
	  setGuesses([]);
	  setTime(0);
	  setColors([]);
	  socket.emit("startGame", {gameid: props.gameId});

  }

  const joinGame = (e) => {
	  console.log(props.userId, props.gameId);
     if (props.userId && props.gameId) {
		  post("/api/initsocket", { playerName: playerName, user: props.userId, socketid: socket.id , gameid: props.gameId}).then((res) => {
			  		setGameState(res.gameState);
			  		setWarning(false);
			  		setJoined(true);
		  });

	  };
  }

  const showResults = () => {
	  let points = []
	  console.log(gameState.names);
	  for (const p in results.points) points.push({player: p, points: results.points[p]});
	  points.sort((a,b) => b.points > a.points ? 1 : -1);
	  return points.map((point) => <div key={point.player}> <b> {gameState.names[point.player]}: </b> {point.points} </div>);

  }

	const renderGame = (e) => {
			return (
				<>
				<Board guesses={guesses} colors={colors} curGuess={curGuess}/>
				<div style={{textAlign:'center'}}>
				Time Left: {timeFormat(time)}
				</div>
				{invalidWord ? <Alert variant='danger'>Invalid word!!! </Alert> : <div/> }

			<Modal
				show={!active}
      			size="lg"
      			aria-labelledby="contained-modal-title-vcenter"
      			centered
			>
				{!joined ? 
					<Modal.Body>
						<InputGroup>
							<Form.Control onChange={nameChange} placeholder="Name:"/>
    						<Button disabled={playerName == ""} onClick={joinGame}> Join </Button>
						</InputGroup>
					</Modal.Body>
					: 
				<Modal.Body>
			<div style={{display:'flex', flexDirection:'column', alignText:'center', alignItems:'center'}}>
					<h1> Game ID: {props.gameId} </h1>
				<div style={{height:'60px', textAlign:'center'}}>
			Players joined: {gameState.players.length}
				</div>
				{results.word == "" ? '' : 
					<div>
					<h2> Answer: </h2>
					<h2 style={{color:'blue'}}> {results.word} </h2>
					<h3 style={{alignText:'center'}}> Results: </h3>
					{showResults()}
					</div>
				}
			<Button onClick={startGame} style={{margin:'30px', width:'200px'}}>Click to Start Game!</Button>
			</div>
				</Modal.Body>
				}
			</Modal>
				</>

		)
		
	}
  return (
    <>
        {!validSession ?
      	<div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
			<Form style={{margin:"20px"}}>
				<InputGroup style={{width:'300px'}}>
					<Form.Control onChange={gameIDChange} placeholder="Game ID:"/>
    				<Button onClick={() => navigate('/game/' + gameID)}> Join </Button> 
		</InputGroup>
			</Form>

			OR
			<br/>

			<Button onClick={createGame} style={{margin:"30px"}}>
			Create New Game
			</Button>

			{warning ? 
			<Alert variant='danger'> {warningText} </Alert> : <div/>
			}
		</div>
		:
			renderGame()
		}
    </>
  );
};

export default Game;
