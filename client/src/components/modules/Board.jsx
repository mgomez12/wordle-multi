import React, { useState, useEffect } from "react";
import { get } from "../../utilities";
import WordRow from "./WordRow.jsx";

import "./Board.css";

const Board = (props) => {
  const renderRows = () => {
    let rows = [];
    for (let i = 0; i < 5; i++) {
      rows.push(
        <WordRow
          key={i}
          word={
            i < props.guesses.length
              ? props.guesses[i]
              : i == props.guesses.length
              ? props.curGuess
              : ""
          }
          current={props.guesses.length == i}
          colors={i >= props.colors.length ? "" : props.colors[i]}
        />
      );
    }
    return rows;
  };

  return (
    <div style={{ justifyContent: "center", outline: "none" }}>
      <div
        style={{
          display: "flex",
          margin: "auto",
          width: "400px",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        {renderRows()}
      </div>
    </div>
  );
};

export default Board;
