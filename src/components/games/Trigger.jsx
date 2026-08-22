import { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame from '../GameFrame.jsx';
import ReadySplash from '../ui/ReadySplash.jsx';
import ResultCard from '../ui/ResultCard.jsx';
import { FREE_SESSION, useGameRun } from '../../lib/useGameRun.js';
import { clamp, formatScore, mean, randInt } from '../../lib/util.js';
import { play, buzz } from '../../lib/sound.js';

/**
 * Trigger — go / no-go.
 *
 * Reaction Rush measures how fast you can move. This measures how fast you can
 * move *and stop*, which is a different and much harder thing: roughly a third
 * of the cues are traps you must not hit, and the interval between them keeps
 * shrinking. Firing on a no-go costs more than a slow go, so the temptation to
 * mash is exactly the wrong instinct.
 */

const TRIALS = 24;
const NO_GO_RATE = 0.33;
/** Window to respond, shrinking as the run goes on. */
const windowFor = (trial) => clamp(1100 - trial * 22, 620, 1100);
const gapFor = (trial) => randInt(Math.max(450, 1100 - trial * 26), Math.max(900, 2000 - trial * 40));

export default function Trigger({ game, onExit, session = FREE_SESSION }) {
  const { finish, rearm, result } = useGameRun(game, session);

  const [phase, setPhase] = useState('ready'); // ready | waiting | cue | feedback | done
  const [trial, setTrial] = useState(0);
  const [cue, setCue] = useState(null); // 'go' | 'nogo'
  const [feedback, setFeedback] = useState(null); // { kind, ms }
  const [times, setTimes] = useState([]);
  const [hits, setHits] = useState(0);
  const [falseFires, setFalseFires] = useState(0);
  const [misses, setMisses] = useState(0);
  const [correctHolds, setCorrectHolds] = useState(0);

  const shownAt = useRef(0);
  const timers = useRef([]);
  const answered = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const showFeedback = useCallback((kind, ms, nextTrial) => {
    setFeedback({ kind, ms });
    setPhase('feedback');
    later(() => {
      setFeedback(null);
      if (nextTrial >= TRIALS) setPhase('done');
      else setTrial(nextTrial);
    }, 620);
  }, []);

  /** Arm and then present one cue. */
  const runTrial = useCallback(
    (index) => {
      clearTimers();
      answered.current = false;
      setCue(null);
      setPhase('waiting');

      later(() => {
        const isGo = Math.random() > NO_GO_RATE;
        setCue(isGo ? 'go' : 'nogo');
        shownAt.current = performance.now();
        setPhase('cue');
        play(isGo ? 'go' : 'tick');

        later(() => {
          if (answered.current) return;
          answered.current = true;
          if (isGo) {
            // Failed to fire on a go cue.
            play('bad');
            setMisses((m) => m + 1);
            showFeedback('missed', null, index + 1);
          } else {
            // Correctly held. This is the quiet win the game is really about.
            play('good');
            setCorrectHolds((c) => c + 1);
            showFeedback('held', null, index + 1);
          }
        }, windowFor(index));
      }, gapFor(index));
    },
    [showFeedback],
  );

  const fire = useCallback(() => {
    if (phase === 'ready') return;
    if (phase === 'waiting') {
      // Jumped before any cue at all.
      if (answered.current) return;
      answered.current = true;
      clearTimers();
      play('bad');
      buzz([20, 50, 20]);
      setFalseFires((f) => f + 1);
      showFeedback('early', null, trial + 1);
      return;
    }
    if (phase !== 'cue' || answered.current) return;
    answered.current = true;
    clearTimers();

    if (cue === 'go') {
      const ms = performance.now() - shownAt.current;
      play('great');
      buzz(8);
      setTimes((t) => [...t, ms]);
      setHits((h) => h + 1);
      showFeedback('hit', ms, trial + 1);
    } else {
      play('bomb');
      buzz([28, 60, 28]);
      setFalseFires((f) => f + 1);
      showFeedback('fired', null, trial + 1);
    }
  }, [phase, cue, trial, showFeedback]);

  // A new trial index means: run it. Deliberately keyed on `trial` alone —
  // runTrial schedules its own timers and must not be restarted by unrelated
  // state changes during a trial.
  useEffect(() => {
    if (phase === 'ready' || phase === 'done') return;
    runTrial(trial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial]);

  useEffect(() => clearTimers, []);

  const begin = useCallback(() => {
    play('start');
    rearm();
    clearTimers();
    setTimes([]);
    setHits(0);
    setFalseFires(0);
    setMisses(0);
    setCorrectHolds(0);
    setFeedback(null);
    setTrial(0);
    setPhase('waiting');
    runTrial(0);
  }, [rearm, runTrial]);

  // --- commit the run ----------------------------------------------------
  useEffect(() => {
    if (phase !== 'done') return;
    clearTimers();
    const avg = times.length ? mean(times) : 0;
    // Speed earns, mistakes cost. Holding correctly is worth real points.
    const speedPoints = times.reduce((sum, ms) => sum + Math.max(0, 520 - ms), 0);
    const score = Math.max(
      0,
      Math.round(speedPoints + correctHolds * 140 - falseFires * 260 - misses * 120),
    );

    finish({
      score,
      stats: { avg, falseFires, misses, correctHolds, hits },
      scoreLabel: formatScore(score),
      unitLabel: 'points',
      verdict:
        falseFires === 0 && avg > 0 && avg < 340
          ? 'Fast and disciplined'
          : falseFires <= 1
            ? 'Good control'
            : falseFires <= 3
              ? 'A bit trigger-happy'
              : 'Pure reflex, no brakes',
      blurb:
        falseFires === 0
          ? 'Not one false fire. Stopping yourself is the hard half of this task.'
          : `You fired on ${falseFires} no-go cue${falseFires === 1 ? '' : 's'}. Inhibition costs about 100ms more than reaction does.`,
      cells: [
        { label: 'Avg go', value: avg ? `${Math.round(avg)}ms` : '—', tone: 'var(--accent)' },
        { label: 'False fires', value: falseFires, tone: falseFires ? 'var(--danger)' : undefined },
        { label: 'Held', value: `${correctHolds}` },
      ],
    });
  }, [phase, times, falseFires, misses, correctHolds, hits, finish]);

  useEffect(() => {
    function onKey(e) {
      if (e.code !== 'Space' && e.key !== 'Enter') return;
      if (phase === 'done') return;
      e.preventDefault();
      if (phase === 'ready') begin();
      else fire();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, begin, fire]);

  const padState =
    phase === 'cue' ? cue : phase === 'feedback' ? `fb-${feedback?.kind}` : phase;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      session={session}
      running={phase !== 'ready' && phase !== 'done'}
      liveScore={`${trial}/${TRIALS}`}
      liveLabel="Trial"
    >
      <section className="stage" style={{ padding: phase === 'ready' ? undefined : 0 }}>
        {phase === 'ready' && <ReadySplash game={game} onStart={begin} cta="Arm" />}

        {phase !== 'ready' && phase !== 'done' && (
          <div className="trigger" data-state={padState} onPointerDown={fire} role="presentation">
            {phase === 'waiting' && <span className="trigger__wait">hold…</span>}

            {phase === 'cue' && cue === 'go' && (
              <span className="trigger__go" aria-label="Go">
                <span className="trigger__circle" />
                <b>FIRE</b>
              </span>
            )}

            {phase === 'cue' && cue === 'nogo' && (
              <span className="trigger__nogo" aria-label="Do not go">
                <span className="trigger__square" />
                <b>HOLD</b>
              </span>
            )}

            {phase === 'feedback' && feedback && (
              <span className="trigger__fb" data-kind={feedback.kind}>
                {feedback.kind === 'hit' && (
                  <>
                    <b className="num">{Math.round(feedback.ms)}</b>
                    <small>ms</small>
                  </>
                )}
                {feedback.kind === 'held' && <b>Held</b>}
                {feedback.kind === 'fired' && <b>Fired on a hold</b>}
                {feedback.kind === 'missed' && <b>Too slow</b>}
                {feedback.kind === 'early' && <b>Too early</b>}
              </span>
            )}

            <div className="trigger__tally">
              <span>
                <i className="trigger__dot trigger__dot--go" />
                {hits} fired
              </span>
              <span>
                <i className="trigger__dot trigger__dot--hold" />
                {correctHolds} held
              </span>
              <span>
                <i className="trigger__dot trigger__dot--bad" />
                {falseFires + misses} errors
              </span>
            </div>
          </div>
        )}
      </section>

      {result && <ResultCard {...result} gameId={game.id} onReplay={begin} onExit={onExit} />}
    </GameFrame>
  );
}
