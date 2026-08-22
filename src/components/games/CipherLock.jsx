import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { useRafLoop } from '../../lib/useRafLoop.js';
import { formatScore, randInt } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';
import { Play, Lock } from '../ui/Icons.jsx';

/**
 * Cipher Lock — deduction under a clock.
 *
 * A hidden code of digits. Each guess comes back with two numbers: how many
 * digits are exactly right, and how many are the right digit in the wrong
 * place. That is all the information you get. Crack the lock in as few guesses
 * as you can, then do it again on a longer code.
 */

const LIVES = 3;

/** Stage n: how long the code is, which digits are allowed, how many guesses. */
const STAGES = [
  { length: 3, digits: 6, guesses: 8 },
  { length: 4, digits: 6, guesses: 9 },
  { length: 4, digits: 8, guesses: 9 },
  { length: 5, digits: 8, guesses: 10 },
  { length: 5, digits: 9, guesses: 10 },
  { length: 6, digits: 9, guesses: 11 },
];
const stageFor = (index) => STAGES[Math.min(index, STAGES.length - 1)];

/** Seconds on the clock for a stage — generous, but not generous enough. */
const timeForStage = (index) => 55000 + Math.min(index, 5) * 12000;

function makeCode({ length, digits }) {
  // Repeats are allowed, which roughly triples the search space.
  return Array.from({ length }, () => randInt(1, digits));
}

/** Classic Mastermind scoring: exact hits, then misplaced digits. */
function scoreGuess(guess, code) {
  const exact = guess.reduce((n, g, i) => n + (g === code[i] ? 1 : 0), 0);

  const codeCounts = new Map();
  const guessCounts = new Map();
  code.forEach((c, i) => {
    if (guess[i] !== c) {
      codeCounts.set(c, (codeCounts.get(c) ?? 0) + 1);
      guessCounts.set(guess[i], (guessCounts.get(guess[i]) ?? 0) + 1);
    }
  });

  let misplaced = 0;
  for (const [digit, count] of guessCounts) {
    misplaced += Math.min(count, codeCounts.get(digit) ?? 0);
  }
  return { exact, misplaced };
}

export default function CipherLock({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | playing | cracked | done
  const [stageIndex, setStageIndex] = useState(0);
  const [code, setCode] = useState([]);
  const [draft, setDraft] = useState([]);
  const [history, setHistory] = useState([]);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [shake, setShake] = useState(false);
  const [cracked, setCracked] = useState(0);

  const timeRef = useRef(0);
  const stage = stageFor(stageIndex);
  const stageTotal = useMemo(() => timeForStage(stageIndex), [stageIndex]);

  useRafLoop(phase === 'playing', (delta) => {
    timeRef.current = Math.max(0, timeRef.current - delta);
    setTimeLeft(timeRef.current);
  });

  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      play('bad');
      setReveal(true);
      setPhase('done');
    }
  }, [phase, timeLeft]);

  const startStage = useCallback((index, keepScore = true) => {
    const config = stageFor(index);
    setStageIndex(index);
    setCode(makeCode(config));
    setDraft([]);
    setHistory([]);
    setReveal(false);
    timeRef.current = timeForStage(index);
    setTimeLeft(timeRef.current);
    if (!keepScore) setScore(0);
    setPhase('playing');
    play('start');
  }, []);

  const begin = useCallback(() => {
    rearm();
    setLives(LIVES);
    setScore(0);
    setCracked(0);
    startStage(0, false);
  }, [rearm, startStage]);

  const pressDigit = useCallback(
    (digit) => {
      if (phase !== 'playing' || draft.length >= stage.length) return;
      play('click');
      buzz(5);
      setDraft((d) => [...d, digit]);
    },
    [phase, draft.length, stage.length],
  );

  const backspace = useCallback(() => {
    if (phase !== 'playing') return;
    play('tick');
    setDraft((d) => d.slice(0, -1));
  }, [phase]);

  const submit = useCallback(() => {
    if (phase !== 'playing' || draft.length !== stage.length) return;

    const feedback = scoreGuess(draft, code);
    const nextHistory = [...history, { guess: draft, ...feedback }];
    setHistory(nextHistory);
    setDraft([]);

    if (feedback.exact === stage.length) {
      // Cracked it. Fewer guesses and more time left are both worth points.
      const guessBonus = Math.max(0, stage.guesses - nextHistory.length) * 120;
      const timeBonus = Math.round((timeRef.current / stageTotal) * 400);
      const points = 400 + stage.length * 150 + guessBonus + timeBonus;

      play('perfect');
      buzz([12, 40, 12]);
      setScore((s) => s + points);
      setCracked((c) => c + 1);
      setReveal(true);
      setPhase('cracked');
      return;
    }

    play(feedback.exact > 0 ? 'good' : 'tick');
    buzz(7);

    if (nextHistory.length >= stage.guesses) {
      // Out of guesses on this lock — costs a life, then a fresh code.
      const nextLives = lives - 1;
      setLives(nextLives);
      setReveal(true);
      setShake(true);
      play('bad');
      setTimeout(() => setShake(false), 420);

      setTimeout(() => {
        if (nextLives <= 0) setPhase('done');
        else startStage(stageIndex, true);
      }, 2200);
      setPhase('failed');
    }
  }, [phase, draft, stage, code, history, lives, stageIndex, stageTotal, startStage]);

  // Advance to the next lock after a successful crack.
  useEffect(() => {
    if (phase !== 'cracked') return undefined;
    const id = setTimeout(() => startStage(stageIndex + 1, true), 1800);
    return () => clearTimeout(id);
  }, [phase, stageIndex, startStage]);

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    finish({
      score,
      stats: { cracked, stage: stageIndex + 1 },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        cracked >= 5
          ? 'Codebreaker'
          : cracked >= 3
            ? 'Sharp deduction'
            : cracked >= 1
              ? 'You got in'
              : 'The lock held',
      blurb:
        cracked === 0
          ? 'Start by learning the digits, not the order — a guess of all-the-same-digit tells you exactly how many of them are in the code.'
          : `You opened ${cracked} lock${cracked > 1 ? 's' : ''}, the last one ${stage.length} digits long from ${stage.digits} possibilities.`,
      cells: [
        { label: 'Locks opened', value: cracked, tone: 'var(--accent)' },
        { label: 'Reached', value: `${stage.length}-digit` },
        { label: 'Lives left', value: Math.max(0, lives) },
      ],
    });
  }, [phase, score, cracked, stageIndex, stage, lives, finish]);

  // --- keyboard: type the code, Enter to submit --------------------------
  useEffect(() => {
    function onKey(e) {
      if (phase === 'ready' && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        begin();
        return;
      }
      if (phase !== 'playing') return;
      const n = Number(e.key);
      if (n >= 1 && n <= stage.digits) pressDigit(n);
      if (e.key === 'Backspace') {
        e.preventDefault();
        backspace();
      }
      if (e.key === 'Enter') submit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin, pressDigit, backspace, submit, stage.digits]);

  const timeFrac = stageTotal ? timeLeft / stageTotal : 0;
  const guessesLeft = stage.guesses - history.length;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase === 'playing' || phase === 'cracked' || phase === 'failed'}
      liveScore={formatScore(score)}
    >
      <section className={`stage${shake ? ' shake' : ''}`}>
        {phase !== 'ready' && phase !== 'done' && (
          <>
            <div className="timebar">
              <div
                className="timebar__fill"
                data-low={timeFrac < 0.25}
                style={{ transform: `scaleX(${Math.max(0, timeFrac)})` }}
              />
            </div>
            <div className="hudbar">
              <span className="lives" aria-label={`${lives} lives left`}>
                {Array.from({ length: LIVES }, (_, i) => (
                  <span key={i} className="life" data-lost={i >= lives} />
                ))}
              </span>
              <span className="hudbar__cell">
                Lock <b>{stageIndex + 1}</b> · {stage.length} digits · 1–{stage.digits}
              </span>
              <span className="hudbar__cell">
                Guesses <b>{guessesLeft}</b>
              </span>
            </div>
          </>
        )}

        {phase === 'ready' && (
          <div className="ready">
            <span className="ready__icon">
              <Lock />
            </span>
            <h2>{game.tagline}</h2>
            <div className="ready__rules">
              {game.rules.map((rule, i) => (
                <p className="ready__rule" key={rule}>
                  <i>{i + 1}</i>
                  {rule}
                </p>
              ))}
            </div>
            <div className="cipherlegend">
              <span>
                <b className="cipherpip cipherpip--exact" /> right digit, right place
              </span>
              <span>
                <b className="cipherpip cipherpip--near" /> right digit, wrong place
              </span>
            </div>
            <button type="button" className="btn btn--primary btn--lg" onClick={begin}>
              <Play />
              Start cracking
            </button>
          </div>
        )}

        {phase !== 'ready' && phase !== 'done' && (
          <div className="cipher">
            <div className="cipher__history">
              {history.length === 0 && (
                <p className="stage__label">no data yet — make a guess</p>
              )}
              {history.map((row, i) => (
                <div className="cipherrow" key={i}>
                  <span className="cipherrow__n num">{i + 1}</span>
                  <span className="cipherrow__digits">
                    {row.guess.map((d, j) => (
                      <span key={j} className="cipherdigit num">
                        {d}
                      </span>
                    ))}
                  </span>
                  <span className="cipherrow__feedback">
                    <span className="cipherscore cipherscore--exact num">
                      <b className="cipherpip cipherpip--exact" />
                      {row.exact}
                    </span>
                    <span className="cipherscore cipherscore--near num">
                      <b className="cipherpip cipherpip--near" />
                      {row.misplaced}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            {reveal && (
              <div className="cipherreveal" data-good={phase === 'cracked'}>
                {phase === 'cracked' ? 'OPEN' : 'The code was'}
                <span className="cipherreveal__code num">{code.join(' ')}</span>
              </div>
            )}

            {phase === 'playing' && (
              <>
                <div className="cipherdraft">
                  {Array.from({ length: stage.length }, (_, i) => (
                    <span key={i} className="cipherslot num" data-filled={draft[i] !== undefined}>
                      {draft[i] ?? '·'}
                    </span>
                  ))}
                </div>

                <div className="cipherpad">
                  {Array.from({ length: stage.digits }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      className="cipherkey num"
                      onClick={() => pressDigit(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <div className="cipheractions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={backspace}
                    disabled={!draft.length}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={submit}
                    disabled={draft.length !== stage.length}
                  >
                    Try it
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}
