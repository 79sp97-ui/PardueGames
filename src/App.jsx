import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";

const scoringCategories = [
  {
    title: "Singles",
    options: [
      { label: "1 x (1)", value: 100 },
      { label: "1 x (5)", value: 50 },
    ],
  },
  {
    title: "Three of a Kind",
    options: [
      { label: "3 x 1s", value: 300 },
      { label: "3 x 2s", value: 200 },
      { label: "3 x 3s", value: 300 },
      { label: "3 x 4s", value: 400 },
      { label: "3 x 5s", value: 500 },
      { label: "3 x 6s", value: 600 },
    ],
  },
  {
    title: "Combos",
    options: [
      { label: "Straight 1 - 6", value: 1500 },
      { label: "Three Pairs", value: 1500 },
      { label: "4 + Pair", value: 1500 },
      { label: "Two Triplets", value: 2500 },
      { label: "4 of a Kind", value: 1000 },
      { label: "5 of a Kind", value: 2000 },
      { label: "6 of a Kind", value: 3000 },
    ],
  },
];

export default function FarkleCalculator() {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [currentTurn, setCurrentTurn] = useState(0);
  const [turnPoints, setTurnPoints] = useState(0);

  const [stealPool, setStealPool] = useState(0);
  const [stealIndex, setStealIndex] = useState(null);
  const [isStealPhase, setIsStealPhase] = useState(false);
  const [originalFarkler, setOriginalFarkler] = useState(null);

  const [finalRoundActive, setFinalRoundActive] = useState(false);
  const [finalRoundStarter, setFinalRoundStarter] = useState(null);

  const [winnerIndex, setWinnerIndex] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // SSR-safe window size
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const addPlayer = () => {
    if (!newPlayer.trim()) return;
    setPlayers(p => [...p, { name: newPlayer.trim(), score: 0 }]);
    setNewPlayer("");
  };

  const addPoints = value => setTurnPoints(p => p + value);

  const nextPlayer = () =>
    setCurrentTurn(t => (t + 1) % players.length);

  const endTurnWithScore = () => {
    if (gameOver || players.length === 0) return;

    const isFirstTurn = players[currentTurn].score === 0;
    if (isFirstTurn && turnPoints < 500) return;

    const newScore = players[currentTurn].score + turnPoints;
    const triggersFinal = !finalRoundActive && newScore >= 10000;

    setPlayers(prev => {
      const updated = [...prev];
      updated[currentTurn] = { ...updated[currentTurn], score: newScore };
      return updated;
    });

    setTurnPoints(0);

    if (triggersFinal) {
      setFinalRoundActive(true);
      setFinalRoundStarter(currentTurn);
      setCurrentTurn((currentTurn + 1) % players.length);
    } else {
      nextPlayer();
    }
  };

  const farkle = () => {
    if (gameOver || players.length < 2) return;
    if (turnPoints === 0) return;

    if (!isStealPhase) setOriginalFarkler(currentTurn);

    setStealPool(turnPoints);
    setTurnPoints(0);
    setIsStealPhase(true);
    setStealIndex((currentTurn + 1) % players.length);
  };

  const stealFarkle = () => {
    const next = (stealIndex + 1) % players.length;

    if (next === originalFarkler) {
      setIsStealPhase(false);
      setStealPool(0);
      setCurrentTurn(originalFarkler);
      setOriginalFarkler(null);
      return;
    }

    setStealIndex(next);
  };

  const claimSteal = () => {
    setPlayers(prev => {
      const updated = [...prev];
      updated[stealIndex].score += stealPool;
      return updated;
    });

    setCurrentTurn(stealIndex);
    setStealPool(0);
    setIsStealPhase(false);
    setOriginalFarkler(null);
  };

  const removePlayer = index => {
    setPlayers(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (currentTurn >= updated.length) setCurrentTurn(0);
      return updated;
    });
  };

  return (
    <div className="p-3 max-w-md mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Farkle House Rules</h1>

      {gameOver && windowWidth > 0 && (
        <Confetti width={windowWidth} height={windowHeight} />
      )}

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={newPlayer}
          onChange={e => setNewPlayer(e.target.value)}
          placeholder="Player name"
        />
        <button className="bg-blue-500 text-white p-2" onClick={addPlayer}>
          Add
        </button>
      </div>

      {players.map((p, i) => (
        <div key={i} className="p-2 bg-gray-100 rounded">
          <strong>{p.name}</strong> — {p.score}
          <button
            className="ml-2 text-red-600"
            onClick={() => removePlayer(i)}
          >
            ✕
          </button>
        </div>
      ))}

      {!isStealPhase && (
        <>
          <h2 className="font-bold">Turn Points: {turnPoints}</h2>

          {scoringCategories.map(cat => (
            <div key={cat.title}>
              <h3 className="font-bold">{cat.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                {cat.options.map(o => (
                  <button
                    key={o.label}
                    className="border p-2 rounded"
                    onClick={() => addPoints(o.value)}
                  >
                    {o.label} (+{o.value})
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-3">
            <button
              disabled={
                players[currentTurn]?.score === 0 && turnPoints < 500
              }
              className={`flex-1 p-3 font-bold rounded ${
                players[currentTurn]?.score === 0 && turnPoints < 500
                  ? "bg-gray-400"
                  : "bg-green-600 text-white"
              }`}
              onClick={endTurnWithScore}
            >
              End Turn
            </button>

            <button
              disabled={players.length < 2 || turnPoints === 0}
              className={`flex-1 p-3 font-bold rounded ${
                players.length < 2 || turnPoints === 0
                  ? "bg-gray-400"
                  : "bg-red-600 text-white"
              }`}
              onClick={farkle}
            >
              Farkle
            </button>
          </div>
        </>
      )}

      {isStealPhase && (
        <div className="bg-yellow-200 p-3 rounded">
          <h2 className="font-bold">Steal Phase</h2>
          <p>Pool: {stealPool}</p>
          <p>Stealer: {players[stealIndex]?.name}</p>

          <div className="flex gap-2 mt-2">
            <button className="bg-green-600 text-white p-2" onClick={claimSteal}>
              Claim
            </button>
            <button className="bg-red-600 text-white p-2" onClick={stealFarkle}>
              Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
