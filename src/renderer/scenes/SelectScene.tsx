import React from 'react';

type Props = {
  setScene: (scene: 'start' | 'select' | 'game' | 'finish') => void;
};

const SelectScene: React.FC<Props> = ({ setScene }) => {
  return (
    <div>
      <h1>Select Song</h1>
      {/* 곡 목록이 여기에 표시됩니다. */}
      <button onClick={() => setScene('start')}>Back to Start</button>
    </div>
  );
};

export default SelectScene;
