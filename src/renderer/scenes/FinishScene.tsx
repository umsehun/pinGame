import React from 'react';

type Props = {
  setScene: (scene: 'start' | 'select' | 'game' | 'finish') => void;
};

const FinishScene: React.FC<Props> = ({ setScene }) => {
  return (
    <div>
      <h1>Game Over</h1>
      {/* 결과가 여기에 표시됩니다. */}
      <button onClick={() => setScene('start')}>Back to Start</button>
    </div>
  );
};

export default FinishScene;
