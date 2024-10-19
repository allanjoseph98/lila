import notify from 'common/notification';
import { TournamentData } from './interfaces';
import { once } from 'common/storage';

let countDownTimeout: number | undefined;

function doCountDown(targetTime: number) {
  let started = false;

  return function curCounter() {
    const secondsToStart = (targetTime - window.performance.now()) / 1000;

    // always play the 0 sound before completing.
    const bestTick = Math.max(0, Math.round(secondsToStart));
    if (bestTick <= 10) site.sound.play('countDown' + bestTick);

    if (bestTick > 0) {
      const nextTick = Math.min(10, bestTick - 1);
      countDownTimeout = setTimeout(
        curCounter,
        1000 * Math.min(1.1, Math.max(0.8, secondsToStart - nextTick)),
      );
    }

    if (!started && bestTick <= 10) {
      started = true;
      notify('The tournament is starting!');
    }
  };
}

export function end(data: TournamentData) {
  if (data.me && data.isRecentlyFinished && once('tournament.end.sound.' + data.id))
    site.sound.play('tournament' + keyFromRank(data.me.rank));
}

const keyFromRank = (rank: number) => (rank < 4 ? '1st' : rank < 11 ? '2nd' : rank < 21 ? '3rd' : 'Other');

export function countDown(data: TournamentData) {
  if (!data.me || !data.secondsToStart) {
    if (countDownTimeout) clearTimeout(countDownTimeout);
    countDownTimeout = undefined;
    return;
  }
  if (countDownTimeout) return;
  if (data.secondsToStart > 60 * 60 * 24) return;

  countDownTimeout = setTimeout(
    doCountDown(window.performance.now() + 1000 * data.secondsToStart - 100),
    900,
  ); // wait 900ms before starting countdown.

  // Preload countdown sounds.
  for (let i = 10; i >= 0; i--) {
    const s = 'countDown' + i;
    site.sound.load(s);
  }
}
