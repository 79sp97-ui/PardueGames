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
      { label: "Straight 1 -6", value: 1500 },
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

  const [finalRoundActive, setFinalRoundActive] = useState(false);
  const [finalRoundStarter, setFinalRoundStarter] = useState(null);
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [originalFarkler, setOriginalFarkler] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const addPlayer = () => {
    const name = newPlayer.trim();
    if (!name) return;
    setPlayers(prev => [...prev, { name, score: 0 }]);
    setNewPlayer("");
  };

  const addPoints = value => setTurnPoints(tp => tp + value);

  const nextPlayer = () => {
    if (players.length === 0) return;
    setCurrentTurn(ct => (ct + 1) % players.length);
  };

  const checkForFinalRound = (updatedPlayers, justScoredIndex) => {
    const score = updatedPlayers[justScoredIndex]?.score ?? 0;
    if (!finalRoundActive && score >= 10000) {
      setFinalRoundActive(true);
      setFinalRoundStarter(justScoredIndex);
      setCurrentTurn((justScoredIndex + 1) % updatedPlayers.length);
    }
  };

  const finishFinalRoundTurn = () => {
    if (!finalRoundActive) return;

    if ((isStealPhase && stealIndex === finalRoundStarter) || (!isStealPhase && currentTurn === finalRoundStarter)) {
      let highestScore = -1;
      let winner = null;
      players.forEach((p, i) => {
        if (p.score > highestScore) {
          highestScore = p.score;
          winner = i;
        }
      });
      setWinnerIndex(winner);
      setGameOver(true);
      setFinalRoundActive(false);
      setIsStealPhase(false);
      setStealPool(0);
      setOriginalFarkler(null);
    }
  };

  const endTurnWithScore = () => {
    if (players.length === 0 || gameOver) return;

    const canBank = players[currentTurn].score > 0 || turnPoints >= 500;
    if (!canBank) {
      alert("You must score at least 500 points to bank on your first turn!");
      return;
    }

    setPlayers(prev => {
      const updated = [...prev];
      updated[currentTurn] = { ...updated[currentTurn], score: updated[currentTurn].score + turnPoints };
      checkForFinalRound(updated, currentTurn);
      return updated;
    });

    setTurnPoints(0);

    if (finalRoundActive) {
      nextPlayer();
      finishFinalRoundTurn();
    } else {
      nextPlayer();
    }
  };

  const farkle = () => {
    if (players.length < 2 || gameOver) return;
    setStealPool(turnPoints);
    setTurnPoints(0);

    let next = (currentTurn + 1) % players.length;

    if (!finalRoundActive) {
      if (next === originalFarkler) {
        setIsStealPhase(false);
        setStealPool(0);
        setCurrentTurn(originalFarkler);
        setOriginalFarkler(null);
        return;
      }
    } else {
      if (next === finalRoundStarter) {
        setIsStealPhase(false);
        setStealPool(0);
        finishFinalRoundTurn();
        return;
      }
    }

    setOriginalFarkler(currentTurn);
    setIsStealPhase(true);
    setStealIndex(next);
  };

  const stealFarkle = () => {
    if (players.length < 2 || stealIndex === null || gameOver) return;

    let next = (stealIndex + 1) % players.length;

    if (!finalRoundActive) {
      if (next === originalFarkler) {
        setIsStealPhase(false);
        setStealPool(0);
        setCurrentTurn(originalFarkler);
        setOriginalFarkler(null);
        return;
      }
    } else {
      if (next === finalRoundStarter || stealIndex === players.length - 1) {
        setIsStealPhase(false);
        setStealPool(0);
        finishFinalRoundTurn();
        return;
      }
    }

    setStealIndex(next);
  };

  const claimSteal = () => {
    if (stealIndex === null || players.length === 0 || gameOver) return;
    setPlayers(prev => {
      const updated = [...prev];
      updated[stealIndex] = { ...updated[stealIndex], score: updated[stealIndex].score + stealPool };
      checkForFinalRound(updated, stealIndex);
      return updated;
    });
    setCurrentTurn(stealIndex);
    setIsStealPhase(false);
    setStealPool(0);
    setOriginalFarkler(null);

    if (finalRoundActive) finishFinalRoundTurn();
  };

  const takeRegularTurnInstead = () => {
    setTurnPoints(0);
    setIsStealPhase(false);
    if (stealIndex !== null) setCurrentTurn(stealIndex);
    setStealPool(0);
    setStealIndex(null);
    setOriginalFarkler(null);

    if (finalRoundActive) finishFinalRoundTurn();
  };

  const endFinalRound = () => {
    if (!finalRoundActive) return;
    finishFinalRoundTurn();
  };

  const restartGame = () => {
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    setCurrentTurn(0);
    setTurnPoints(0);
    setStealPool(0);
    setStealIndex(null);
    setIsStealPhase(false);
    setFinalRoundActive(false);
    setFinalRoundStarter(null);
    setOriginalFarkler(null);
    setWinnerIndex(null);
    setGameOver(false);
  };

  const newGame = () => {
    setPlayers([]);
    setNewPlayer("");
    setCurrentTurn(0);
    setTurnPoints(0);
    setStealPool(0);
    setStealIndex(null);
    setIsStealPhase(false);
    setFinalRoundActive(false);
    setFinalRoundStarter(null);
    setOriginalFarkler(null);
    setWinnerIndex(null);
    setGameOver(false);
  };

  const renderedPlayers = players.map((p, i) => {
    let bg = "bg-gray-100";
    if (gameOver) {
      bg = i === winnerIndex ? "bg-green-300" : "bg-gray-300 opacity-50";
    } else if (finalRoundActive) {
      bg = i === currentTurn ? "bg-green-200" : i !== finalRoundStarter ? "bg-yellow-200" : "bg-gray-100";
    } else if (i === currentTurn) {
      bg = "bg-green-200";
    }
    return { ...p, bg };
  });

  return (
    <div className="p-2 max-w-md mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Farkle House Rules Edition</h1>

      <button className="bg-gray-700 text-white p-2 rounded w-full" onClick={restartGame}>Reset Game</button>

      {gameOver && winnerIndex !== null && players[winnerIndex] && (
        <>
          <Confetti width={windowWidth} height={windowHeight} />
          <div className="p-4 bg-green-300 rounded text-center">
            <h2 className="text-2xl font-bold">Winner: {players[winnerIndex].name}!</h2>
            <div className="flex gap-2 justify-center mt-3">
              <button className="bg-blue-600 text-white p-2 rounded" onClick={restartGame}>Restart</button>
              <button className="bg-purple-600 text-white p-2 rounded" onClick={newGame}>New Game</button>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2">
        <input className="border rounded p-2 flex-1" value={newPlayer} placeholder="Player name" onChange={e => setNewPlayer(e.target.value)} />
        <button className="bg-blue-500 text-white p-2 rounded" onClick={addPlayer}>Add Player</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renderedPlayers.map((p, i) => (
          <div key={i} className={`p-3 rounded shadow ${p.bg}`}>
            <div className="font-bold">{p.name}</div>
            <div>Score: {p.score}</div>
            <button className="bg-red-500 text-white text-sm p-1 mt-2 rounded" onClick={() => setPlayers(players.filter((_, idx) => idx !== i))}>Remove Player</button>
          </div>
        ))}
      </div>

      {!isStealPhase && !gameOver && (
        <>
          <h2 className="text-xl font-bold">Current Turn Points: {turnPoints}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {scoringOptions.map((opt, i) => (
              <button key={i} className="p-2 bg-purple-300 rounded shadow" onClick={() => addPoints(opt.value)}>{opt.label}</button>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="bg-green-500 text-white p-2 rounded flex-1" onClick={endTurnWithScore}>Bank Points</button>
            <button className="bg-red-500 text-white p-2 rounded flex-1" onClick={farkle}>Farkle</button>
          </div>
        </>
      )}

      {finalRoundActive && !gameOver && (
        <button className="bg-yellow-600 text-white p-2 rounded w-full mt-4" onClick={endFinalRound}>End Final Round</button>
      )}

      {isStealPhase && !gameOver && players.length > 0 && stealIndex !== null && (
        <div className="p-4 bg-yellow-200 rounded space-y-4">
          <h2 className="text-xl font-bold">Steal Phase</h2>
          <p>Steal Pool: {stealPool}</p>
          <p>Current Stealer: {players[stealIndex]?.name}</p>
          <h3 className="text-lg font-bold">Add Points to Steal Pool</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {scoringOptions.map((opt, i) => (
              <button key={i} className="p-2 bg-orange-300 rounded shadow" onClick={() => setStealPool(s => s + opt.value)}>{opt.label}</button>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="bg-green-600 text-white p-2 rounded flex-1" onClick={claimSteal}>Steal Successfully</button>
            <button className="bg-red-600 text-white p-2 rounded flex-1" onClick={stealFarkle}>Farkle (Pass Steal)</button>
            <button className="bg-blue-600 text-white p-2 rounded flex-1" onClick={takeRegularTurnInstead}>Take Regular Turn Instead</button>
          </div>
        </div>
      )}
    </div>
  );
}
