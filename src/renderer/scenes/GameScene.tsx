import React, { useRef, useEffect, useCallback, useState } from 'react';
import { parseSmFile } from '../utils/smParser';
import { Judgement, GameNote, Hit } from '../../shared/types';


const BEATS_PER_ROTATION = 4;

const GameScene: React.FC = () => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastJudgement, setLastJudgement] = useState<{ type: Judgement; time: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notesRef = useRef<GameNote[]>([]);
  const hitsRef = useRef<Hit[]>([]);
  const rotationRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const lastJudgementRef = useRef<{ type: Judgement; time: number } | null>(null);
  const bpmRef = useRef(138); // Default BPM
  const lastTimeRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const offsetRef = useRef(0);
  const gameRunningRef = useRef(false);

  const judge = useCallback(() => {
    if (!gameRunningRef.current) return;

    const TARGET_ANGLE = Math.PI * 1.5; // 12 o'clock
    const currentRotation = rotationRef.current % (Math.PI * 2);

    let closestNoteIndex = -1;
    let minDiff = Infinity;

    for (let i = 0; i < notesRef.current.length; i++) {
      if (notesRef.current[i].hit) continue;

      const note = notesRef.current[i];
      const notePos = (note.angle + currentRotation) % (Math.PI * 2);
      let diff = Math.abs(notePos - TARGET_ANGLE);
      if (diff > Math.PI) {
        diff = 2 * Math.PI - diff;
      }

      if (diff < minDiff) {
        minDiff = diff;
        closestNoteIndex = i;
      }
    }

    if (closestNoteIndex === -1) return;

    const hitNote = notesRef.current[closestNoteIndex];
    const timingWindow = { KOOL: 0.1, COOL: 0.2, GOOD: 0.3, MISS: 0.5 };
    let judgement: Judgement = 'MISS';

    if (minDiff < timingWindow.KOOL) judgement = 'KOOL';
    else if (minDiff < timingWindow.COOL) judgement = 'COOL';
    else if (minDiff < timingWindow.GOOD) judgement = 'GOOD';

    if (judgement !== 'MISS') {
      scoreRef.current += { KOOL: 300, COOL: 200, GOOD: 100 }[judgement];
      setScore(scoreRef.current);
      comboRef.current++;
      setCombo(comboRef.current);
      lastJudgementRef.current = { type: judgement, time: Date.now() };
      setLastJudgement(lastJudgementRef.current);
      notesRef.current[closestNoteIndex].hit = true;
      hitsRef.current.push({ id: hitNote.id, angle: hitNote.angle, judgement });
    }
  }, []);

  const handleFileSelect = useCallback(async () => {
    const filePath = await window.electron.selectFile();
    if (filePath) {
      const fileData = await window.electron.loadFile(filePath);
      if (fileData && fileData.smText) {
        const smFile = parseSmFile(fileData.smText);

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        notesRef.current = smFile.charts[0].notes.map((note, i) => ({
          id: i,
          angle: (note.beat / BEATS_PER_ROTATION) * Math.PI * 2,
          hit: false,
        }));
        bpmRef.current = smFile.bpms[0].bpm;
        offsetRef.current = smFile.offset;
        lastTimeRef.current = 0;
        rotationRef.current = 0;
        scoreRef.current = 0;
        setScore(0);
        comboRef.current = 0;
        setCombo(0);
        hitsRef.current = [];
        lastJudgementRef.current = null;
        setLastJudgement(null);
        gameRunningRef.current = true;

        if (audioRef.current && fileData.audioDataUrl) {
          audioRef.current.src = fileData.audioDataUrl;
          audioRef.current.load();
          const startPlayback = () => {
            setTimeout(() => {
              audioRef.current?.play().catch(e => console.error('Audio play failed:', e));
            }, offsetRef.current * 1000);
          };
          startPlayback();
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleInput = () => judge();
    window.addEventListener('keydown', (e) => e.key === 's' && handleInput());
    window.addEventListener('mousedown', handleInput);

    return () => {
      window.removeEventListener('keydown', (e) => e.key === 's' && handleInput());
      window.removeEventListener('mousedown', handleInput);
    };
  }, [judge]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const centerX = canvas.width / 2, centerY = 250, radius = 100, pinLength = 30;

    let animFrameId: number;
    const gameLoop = (currentTime: number) => {
      if (!gameRunningRef.current) {
        animFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      const rotationsPerSecond = bpmRef.current / 60 / BEATS_PER_ROTATION;
      rotationRef.current += rotationsPerSecond * Math.PI * 2 * deltaTime;

      const TARGET_ANGLE = Math.PI * 1.5;
      const currentRotation = rotationRef.current % (Math.PI * 2);
      const missedNotes = notesRef.current.filter(note => {
        if (note.hit) return false;
        const notePos = (note.angle + currentRotation) % (Math.PI * 2);
        const missThreshold = 0.5;
        const noteDistance = (notePos - TARGET_ANGLE + Math.PI * 2) % (Math.PI * 2);
        return noteDistance > missThreshold && noteDistance < Math.PI;
      });

      if (missedNotes.length > 0) {
        comboRef.current = 0;
        setCombo(0);
        lastJudgementRef.current = { type: 'MISS', time: Date.now() };
        setLastJudgement(lastJudgementRef.current);
        missedNotes.forEach(missedNote => {
          const index = notesRef.current.findIndex(n => n.id === missedNote.id);
          if (index !== -1) notesRef.current[index].hit = true;
        });
      }

      ctx.fillStyle = '#111827'; // bg-gray-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius - 5);
      ctx.lineTo(centerX, centerY - radius - pinLength - 5);
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationRef.current);

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();

      notesRef.current.forEach(note => {
        if (note.hit) return;
        ctx.save();
        ctx.rotate(note.angle);
        ctx.fillStyle = 'cyan';
        ctx.fillRect(-2.5, -radius - 10, 5, 10);
        ctx.restore();
      });

      hitsRef.current.forEach(hit => {
        ctx.save();
        ctx.rotate(hit.angle);
        ctx.fillStyle = hit.judgement === 'KOOL' ? 'gold' : hit.judgement === 'COOL' ? 'green' : 'orange';
        ctx.fillRect(-2.5, -radius - pinLength, 5, pinLength);
        ctx.restore();
      });

      ctx.restore();

      
      animFrameId = requestAnimationFrame(gameLoop);
    };

    animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [judge]);

  return (
    <div className="relative w-screen h-screen flex flex-col justify-center items-center bg-gray-900 text-white font-sans">
      <div className="absolute top-4 left-4">
        <button
          onClick={handleFileSelect}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md shadow-lg transition-colors"
        >
          Load SM File
        </button>
      </div>
      <canvas ref={canvasRef} width={800} height={800} />
      <div className="absolute top-5 w-full flex justify-between px-10 text-4xl font-bold">
        <span>Score: {score}</span>
        <span>Combo: {combo}</span>
      </div>
      {lastJudgement && Date.now() - lastJudgement.time < 500 && (
        <div
          className={`absolute text-6xl font-extrabold transition-opacity duration-500 ${lastJudgement.type === 'MISS' ? 'text-red-500' : 'text-white'}`}>
          {lastJudgement.type}
        </div>
      )}
      <audio ref={audioRef} />
    </div>
  );
};

export default GameScene;
