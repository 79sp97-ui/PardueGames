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
      { label: "Straight 1–6", value: 1500 },
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
  const [finalRoundTurnPoints, setFinalRoundTurnPoints] = useState(0);
  const [stealPool, setStealPool] = useState([]);
  const [stealIndex, setStealIndex] = useState(null);
  const [originalFarkler, setOriginalFarkler] = useState(null);
  const [isStealPhase, setIsStealPhase] = useState(false);

  const [finalRoundActive, setFinalRoundActive] = useState(false);
  const [finalRoundStarter, setFinalRoundStarter] = useState(null);
  const [finalRoundQueue, setFinalRoundQueue] = useState([]);

  const [gameOver, setGameOver] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState(null);

  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  const [showRules, setShowRules] = useState(false);

  // ------------------------
  // Window resize
  // ------------------------
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ------------------------
  // Player actions
  // ------------------------
  const addPlayer = () => {
    if (!newPlayer.trim()) return;
    setPlayers(p => [...p, { name: newPlayer.trim(), score: 0 }]);
    setNewPlayer("");
  };

  const addPoints = val => {
    if (isStealPhase) {
      setStealPool(prev => [...prev, { player: players[stealIndex]?.name || "", points: val }]);
    } else if (finalRoundActive) {
      setFinalRoundTurnPoints(prev => prev + val);
    } else {
      setTurnPoints(prev => prev + val);
    }
  };

  const nextPlayer = () => {
    if (!finalRoundActive) {
      setCurrentTurn(t => (t + 1) % players.length);
    } else if (finalRoundQueue.length > 0) {
      const [next, ...rest] = finalRoundQueue;
      setCurrentTurn(next);
      setFinalRoundQueue(rest);
      setFinalRoundTurnPoints(0);
    } else {
      finishFinalRound(players);
    }
  };

  // ------------------------
  // Final Round
  // ------------------------
  const startFinalRound = scorer => {
    setFinalRoundActive(true);
    setFinalRoundStarter(scorer);

    const queue = players.map((_, idx) => idx).filter(idx => idx !== scorer);
    setCurrentTurn(queue[0]); // first player plays immediately
    setFinalRoundQueue(queue.slice(1)); // remove first from queue
    setFinalRoundTurnPoints(0);
  };

  const checkFinalRound = updatedPlayers => {
    if (!finalRoundActive) {
      const scorer = updatedPlayers.findIndex(p => p.score >= 10000);
      if (scorer !== -1) startFinalRound(scorer);
    }
  };

  const finishFinalRound = (finalPlayers = players) => {
    const maxScore = Math.max(...finalPlayers.map(p => p.score));
    const winner = finalPlayers.findIndex(p => p.score === maxScore);
    setWinnerIndex(winner);
    setGameOver(true);

    setFinalRoundActive(false);
    setFinalRoundQueue([]);
    setFinalRoundStarter(null);
    setStealPool([]);
    setStealIndex(null);
    setOriginalFarkler(null);
    setFinalRoundTurnPoints(0);
  };

  const endTurnWithScore = () => {
    if (gameOver) return;

    const pointsToAdd = isStealPhase
      ? stealPool.reduce((sum, c) => sum + c.points, 0)
      : finalRoundActive
      ? finalRoundTurnPoints
      : turnPoints;

    setPlayers(prev => {
      const updated = [...prev];
      updated[currentTurn].score += pointsToAdd;
      if (!finalRoundActive) checkFinalRound(updated);

      // If final round is ending, pass updated array
      if (finalRoundActive && finalRoundQueue.length === 0) finishFinalRound(updated);

      return updated;
    });

    // Clear turn state
    setTurnPoints(0);
    setFinalRoundTurnPoints(0);
    setStealPool([]);
    setIsStealPhase(false);
    setOriginalFarkler(null);

    // Advance turn
    if (finalRoundActive && finalRoundQueue.length > 0) {
      setCurrentTurn(finalRoundQueue[0]);
      setFinalRoundQueue(finalRoundQueue.slice(1));
    } else if (!finalRoundActive) {
      nextPlayer();
    }
  };

  // ------------------------
  // Farkle / Steal Mechanics
  // ------------------------
  const farkle = () => {
    if (players.length < 2 || (!turnPoints && !finalRoundTurnPoints) || gameOver) return;

    if (finalRoundActive && finalRoundQueue.length === 0) {
      alert("Cannot Farkle on last turn in final round!");
      return;
    }

    setStealPool([{ player: players[currentTurn].name, points: turnPoints || finalRoundTurnPoints }]);
    setTurnPoints(0);
    setFinalRoundTurnPoints(0);
    setOriginalFarkler(currentTurn);

    const next = (currentTurn + 1) % players.length;
    setStealIndex(next);
    setIsStealPhase(true);
  };

  const declineFarkle = () => {
    if (stealIndex === null) return;
    setStealPool([]);
    setTurnPoints(0);
    setFinalRoundTurnPoints(0);
    setCurrentTurn(stealIndex);
    setIsStealPhase(false);
    setStealIndex(null);
    setOriginalFarkler(null);
  };

  const stealFarkle = () => {
    if (stealIndex === null) return;

    const next = (stealIndex + 1) % players.length;

    if (finalRoundActive && finalRoundQueue.length === 0) {
      finishFinalRound(players);
      setStealPool([]);
      setIsStealPhase(false);
      setStealIndex(null);
      setOriginalFarkler(null);
      return;
    } else if (!finalRoundActive && next === originalFarkler) {
      setCurrentTurn(originalFarkler);
      setStealPool([]);
      setIsStealPhase(false);
      setStealIndex(null);
      setOriginalFarkler(null);
      return;
    }

    setStealIndex(next);
  };

  const claimSteal = () => {
    if (stealIndex === null) return;
    const total = stealPool.reduce((sum, c) => sum + c.points, 0) + turnPoints + finalRoundTurnPoints;

    setPlayers(prev => {
      const updated = [...prev];
      updated[stealIndex].score += total;
      if (!finalRoundActive) checkFinalRound(updated);
      return updated;
    });

    setCurrentTurn(stealIndex);
    setStealPool([]);
    setTurnPoints(0);
    setFinalRoundTurnPoints(0);
    setStealIndex(null);
    setOriginalFarkler(null);
    setIsStealPhase(false);

    nextPlayer();
  };

  // ------------------------
  // Player management
  // ------------------------
  const removePlayer = i => {
    setPlayers(prev => {
      const updated = prev.filter((_, idx) => idx !== i);
      if (currentTurn >= updated.length) setCurrentTurn(0);
      return updated;
    });
  };

  const restartGame = () => {
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    setCurrentTurn(0);
    setTurnPoints(0);
    setFinalRoundTurnPoints(0);
    setStealPool([]);
    setStealIndex(null);
    setIsStealPhase(false);
    setFinalRoundActive(false);
    setFinalRoundStarter(null);
    setOriginalFarkler(null);
    setFinalRoundQueue([]);
    setWinnerIndex(null);
    setGameOver(false);
  };

  const newGame = () => {
    setPlayers([]);
    setNewPlayer("");
    restartGame();
  };

  // ------------------------
  // Render
  // ------------------------
  return (
    <div className="p-3 max-w-md mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Farkle – House Rules</h1>

      <button
        className="bg-purple-600 text-white p-2 rounded"
        onClick={() => setShowRules(prev => !prev)}
      >
        {showRules ? "Hide Rules" : "Show Rules"}
      </button>

      {showRules && (
        <div className="bg-gray-100 p-3 rounded space-y-2 mt-2 text-sm">
          <h2 className="font-bold text-lg">Game Rules</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Players take turns selecting dice combinations to score points.</li>
            <li>First turn must score at least 500 points to bank.</li>
            <li>A Farkle occurs when no scoring options are available; turn points go to a steal pool.</li>
            <li>Next player may:
              <ul className="list-disc pl-5">
                <li>Claim the steal pool (banks points and starts a new turn)</li>
                <li>Farkle themselves (adds their points to the pool and passes it forward)</li>
                <li>Decline (discard the pool and start their own turn)</li>
              </ul>
            </li>
            <li>The first player to reach 10,000 triggers the final round.</li>
            <li>All other players get exactly one turn in final round.</li>
            <li>If a Farkle occurs in the final round, the player before the first scorer cannot Farkle.</li>
            <li>The player with the highest score at the end wins the game.</li>
          </ul>
        </div>
      )}

      {finalRoundActive && !gameOver && (
        <div className="text-yellow-700 font-bold">⚠️ Final Round Active!</div>
      )}

      {gameOver && windowWidth > 0 && (
        <>
          <Confetti width={windowWidth} height={windowHeight} />
          <div className="text-center mt-4 text-2xl font-bold text-green-700">
            🏆 Winner: {players[winnerIndex]?.name} 🏆
          </div>
        </>
      )}

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={newPlayer}
          onChange={e => setNewPlayer(e.target.value)}
          placeholder="Player name"
        />
        <button className="bg-blue-600 text-white p-2" onClick={addPlayer}>Add</button>
      </div>

      {players.map((p, i) => {
        let bg = "bg-gray-100";
        if (gameOver) bg = i === winnerIndex ? "bg-green-300" : "bg-gray-300 opacity-50";
        else if (isStealPhase && i === stealIndex) bg = "bg-orange-200";
        else if (i === currentTurn) bg = "bg-green-200";

        const outline = finalRoundActive && i === finalRoundStarter ? "ring-2 ring-yellow-500" : "";

        return (
          <div key={i} className={`p-2 rounded ${bg} ${outline}`}>
            <strong>{p.name}</strong> — {p.score}
            <button className="ml-2 text-red-600" onClick={() => removePlayer(i)}>✕</button>
          </div>
        );
      })}

      <h2 className="font-bold">
        {isStealPhase
          ? `Steal Pool Total: ${stealPool.reduce((sum, c) => sum + c.points, 0)}`
          : finalRoundActive
          ? `Final Round Turn Points: ${finalRoundTurnPoints}`
          : `Turn Points: ${turnPoints}`}
      </h2>

      {isStealPhase && stealPool.length > 0 && (
        <div>
          <p>Original Farkler: <span className="underline">{players[originalFarkler]?.name}</span></p>
          <p>Current Stealer: <span className="font-bold text-green-700">{players[stealIndex]?.name}</span></p>
          <ul className="list-disc pl-5">
            {stealPool.map((c, idx) => {
              const isCurrent = c.player === players[stealIndex]?.name;
              const isOriginal = c.player === players[originalFarkler]?.name;
              return (
                <li key={idx} className={`${isCurrent ? "text-green-700 font-bold" : ""} ${isOriginal ? "underline" : ""}`}>
                  {c.player} added {c.points} points
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {scoringCategories.map(cat => (
        <div key={cat.title}>
          <h3 className="font-bold">{cat.title}</h3>
          <div className="grid grid-cols-2 gap-2">
            {cat.options.map(o => (
              <button key={o.label} className="border p-2 rounded" onClick={() => addPoints(o.value)}>
                {o.label} (+{o.value})
              </button>
            ))}
          </div>
        </div>
      ))}

      {!isStealPhase && !gameOver && (
        <div className="flex gap-2 mt-3">
          <button
            disabled={players[currentTurn]?.score === 0 && !finalRoundActive && turnPoints < 500}
            className={`flex-1 p-3 rounded font-bold ${
              players[currentTurn]?.score === 0 && !finalRoundActive && turnPoints < 500 ? "bg-gray-400" : "bg-green-600 text-white"
            }`}
            onClick={endTurnWithScore}
          >
            End Turn
          </button>

          <button
            disabled={players.length < 2 || (!turnPoints && !finalRoundTurnPoints)}
            className={`flex-1 p-3 rounded font-bold ${
              players.length < 2 || (!turnPoints && !finalRoundTurnPoints) ? "bg-gray-400" : "bg-red-600 text-white"
            }`}
            onClick={farkle}
          >
            Farkle
          </button>
        </div>
      )}

      {isStealPhase && !gameOver && (
        <div className="bg-yellow-200 p-3 rounded space-y-2">
          <div className="flex gap-2 mt-2">
            <button className="bg-green-600 text-white p-2 flex-1" onClick={claimSteal}>Claim Steal</button>
            <button className="bg-red-600 text-white p-2 flex-1" onClick={stealFarkle}>Farkle (Pass)</button>
            <button className="bg-blue-600 text-white p-2 flex-1" onClick={declineFarkle}>Decline Steal</button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="flex gap-2">
          <button className="bg-green-600 text-white p-2 flex-1" onClick={restartGame}>Play Again</button>
          <button className="bg-purple-600 text-white p-2 flex-1" onClick={newGame}>New Game</button>
        </div>
      )}
    </div>
  );
}
