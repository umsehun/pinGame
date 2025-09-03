import React from 'react';

type Props = {
  setScene: (scene: 'start' | 'select' | 'game' | 'finish') => void;
};

const StartScene: React.FC<Props> = ({ setScene }) => {
  return (
    <div>
      <h1>Pin Game</h1>
      <button onClick={() => setScene('game')}>Game Start</button>
      <button onClick={() => alert('Settings not implemented yet.')}>Settings</button>
      <button onClick={() => setScene('select')}>Select Song</button>
    </div>
  );
};

export default StartScene;
