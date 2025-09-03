import React, { useState } from 'react';
import GameScene from './scenes/GameScene';
import StartScene from './scenes/StartScene';
import SelectScene from './scenes/SelectScene';
import FinishScene from './scenes/FinishScene';

type Scene = 'start' | 'select' | 'game' | 'finish';

function App() {
  const [scene, setScene]: [Scene, React.Dispatch<React.SetStateAction<Scene>>] = useState<Scene>('start');

  const renderScene = () => {
    switch (scene) {
      case 'start':
        return <StartScene setScene={setScene} />;
      case 'select':
        return <SelectScene setScene={setScene} />;
      case 'game':
        return <GameScene />;
      case 'finish':
        return <FinishScene setScene={setScene} />;
      default:
        return <StartScene setScene={setScene} />;
    }
  };

  return (
    <div className="App">
      {renderScene()}
    </div>
  );
}

export default App;
