import { useState, useRef } from "react";

export default function Player() {
  const enteredName = useRef();
  const [ playerName, setPlayerName ] = useState(null);

  function handleClick() {
    setPlayerName(enteredName.current.value);
    enteredName.current.value = '';
  }

  return (
    <section id="player">
      <h2>Welcome {playerName ?? 'unknown entity'}</h2>
      <p>
        <input ref={enteredName} type="text"/>
        <button onClick={handleClick}>Set Name</button>
      </p>
    </section>
  );
}
