import React, { useState, useEffect } from "react";
import { get } from "../../utilities";

import "./Board.css";

const WordRow = (props) => {
  const getColorClass = (c) => {
    if (c == "Y") return "correct";
    else if (c == "N") return "incorrect";
    else return "present";
  };

  const renderLetters = () => {
    let letters = [];
    for (let i = 0; i < 5; i++) letters.push(props.word[i]); // ensure size 5 array
    return letters.map((letter, ix) => (
      <div
        key={ix}
        className={
          "text-square " +
          (props.colors == "" ? "" : getColorClass(props.colors[ix]))
        }
      >
        {" "}
        {letter}{" "}
      </div>
    ));
  };
  return (
    <div style={{ display: "flex", textAlign: "center" }}>
      {renderLetters()}
    </div>
  );
};

export default WordRow;
