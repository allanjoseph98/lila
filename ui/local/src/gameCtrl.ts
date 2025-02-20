import * as co from 'chessops';
import { RoundProxy } from './roundProxy';
import { type GameContext, type GameStatus, LocalGame } from './localGame';
import { statusOf, clockToSpeed } from 'game';
import type { ClockData } from 'round';
import type { LocalPlayOpts, LocalSetup, SoundEvent, LocalSpeed } from './types';
import { env } from './localEnv';
import { pubsub } from 'common/pubsub';

export class GameCtrl {
  live: LocalGame;
  rewind?: LocalGame;
  proxy: RoundProxy;
  clock?: ClockData & { since?: number };
  orientation: Color = 'white';

  private stopped = true;
  private resolveThink?: () => void;

  constructor(readonly opts: LocalPlayOpts) {
    pubsub.on('ply', this.jump);
    pubsub.on('flip', () => env.redraw());
    this.proxy = new RoundProxy(opts.pref);
  }

  load(game: LocalSetup | undefined): void {
    this.stop();
    this.rewind = undefined;
    this.live = new LocalGame({ ...this.live?.setup, ...game });
    env.bot.setUids(this.live);
    this.orientation = this.black ? 'white' : this.white ? 'black' : 'white';
    this.resetClock();
    this.proxy.reset();
    this.updateClockUi();
    env.round?.redraw();
    this.triggerStart(this.live.ply > 0 && Number.isFinite(this.initial));
  }

  start(): void {
    this.stopped = false;
    if (this.rewind) this.live = this.rewind;
    this.rewind = undefined;
    if (!this.live.finished) this.updateTurn(); // ??
  }

  stop(): void {
    if (this.isStopped) return;
    this.stopped = true;
    this.resolveThink?.();
  }

  flag(): void {
    if (this.clock) this.clock[this.live.turn] = 0;
    this.live.finish({ winner: this.live.awaiting, status: statusOf('outoftime') });
    this.gameOver({ winner: this.live.awaiting, status: statusOf('outoftime') });
    this.updateClockUi();
  }

  resign(): void {
    this.gameOver({ winner: this.live.awaiting, status: statusOf('resign') });
  }

  draw(): void {
    this.gameOver({ winner: undefined, status: statusOf('draw') });
  }

  nameOf(color: Color): string {
    if (!this[color] && this[co.opposite(color)]) return env.username;
    return this[color] ? (env.bot.get(this[color])?.name ?? this[color]) : i18n.site[color];
  }

  idOf(color: Color): string {
    return this[color] ?? env.user;
  }

  get isStopped(): boolean {
    return this.stopped; // ??
  }

  get isLive(): boolean {
    return this.rewind === undefined && !this.isStopped;
  }

  get screenOrientation(): Color {
    return env.round?.flip ? co.opposite(this.orientation) : this.orientation;
  }

  get speed(): LocalSpeed {
    return clockToSpeed(this.initial, this.increment);
  }

  get white(): string | undefined {
    return this.live?.white;
  }

  get black(): string | undefined {
    return this.live?.black;
  }

  get initial(): number {
    return this.clock?.initial ?? Infinity;
  }

  get increment(): number {
    return this.clock?.increment ?? 0;
  }

  // get initialFen(): string {
  //   return this.live.setupFen; //this.setup.initialFen ?? co.fen.INITIAL_FEN;
  // }

  move(uci: Uci): void {
    if (this.rewind) this.live = this.rewind;
    this.rewind = undefined;
    this.stopped = false;
    env.dev?.beforeMove(uci);

    if (this.clock?.since) this.clock[this.live.turn] -= (performance.now() - this.clock.since) / 1000;
    const moveCtx = this.live.move({ uci, clock: this.clock });

    this.proxy.data.steps.splice(this.live.moves.length);

    env.dev?.afterMove?.(moveCtx);

    this.playSounds(moveCtx);
    env.round.apiMove(moveCtx);

    if (moveCtx.move?.promotion)
      env.round.chessground?.setPieces(
        new Map([
          [
            uci.slice(2, 4) as Key,
            { color: this.live.awaiting, role: moveCtx.move.promotion, promoted: true },
          ],
        ]),
      );

    if (this.live.finished) this.gameOver(moveCtx);
    env.db.put(this.live);
    if (this.clock?.increment) {
      this.clock[this.live.awaiting] += this.clock.increment;
    }
    this.updateClockUi();
    env.redraw();
  }

  private async maybeBotMove(): Promise<void> {
    const [bot, game] = [env.bot[this.live.turn], this.live];
    if (!bot || game.finished || this.isStopped || this.resolveThink) return;
    const move = await env.bot.move({
      pos: { fen: game.setupFen, moves: game.moves.map(x => x.uci) },
      chess: this.live.chess,
      avoid: this.live.threefoldMoves,
      remaining: this.clock?.[this.live.turn],
      initial: this.clock?.initial,
      increment: this.clock?.increment,
    });
    if (!move) return;
    await new Promise<void>(resolve => {
      if (this.clock) {
        this.clock[this.live.turn] -= move.thinkTime;
        this.clock.since = undefined;
      }
      if (env.dev?.hurry) return resolve();
      this.resolveThink = resolve;
      const realWait = Math.min(1 + 2 * Math.random(), this.live.ply > 0 ? move.thinkTime : 0);
      setTimeout(resolve, realWait * 1000);
    });
    this.resolveThink = undefined;
    if (!this.isStopped && game === this.live && env.round.ply === game.ply) this.move(move.uci);
    else setTimeout(() => this.updateTurn(), 200);
  }

  private jump = (ply: number) => {
    this.rewind = ply < this.live.moves.length ? new LocalGame(this.live, ply) : undefined;
    if (this.clock) this.clock.since = this.rewind ? undefined : performance.now();
    this.updateTurn();
    setTimeout(env.redraw);
  };

  private updateTurn(game: LocalGame = this.rewind ?? this.live) {
    if (this.clock && game !== this.live) this.clock = { ...this.clock, ...game.clock };
    this.proxy.updateBoard(game, game.ply === 0 ? { lastMove: undefined } : {});
    this.updateClockUi();
    if (this.isLive) this.maybeBotMove();
  }

  private updateClockUi() {
    if (!this.clock) return;
    this.clock.running = this.isLive && this.live.ply > 0 && !this.isStopped;
    env.round?.clock?.setClock(this.proxy.data, this.clock.white, this.clock.black);
    if (this.isStopped || !this.isLive) env.round?.clock?.stopClock();
  }

  private gameOver(final: GameStatus) {
    this.stop();
    if (this.clock) env.round.clock?.stopClock();
    if (!env.dev?.onGameOver(final)) {
      // ?? that check
      env.round.endWithData?.({ status: final.status, winner: final.winner, boosted: false });
    }
  }

  private playSounds(moveCtx: GameContext) {
    if (moveCtx.silent) return;
    const justPlayed = this.live.awaiting;
    const { san } = moveCtx;
    const sounds: SoundEvent[] = [];
    const prefix = env.bot[justPlayed] ? 'bot' : 'player';
    if (san.includes('x')) sounds.push(`${prefix}Capture`);
    if (this.live.chess.isCheck()) sounds.push(`${prefix}Check`);
    if (this.live.finished) sounds.push(`${prefix}Win`);
    sounds.push(`${prefix}Move`);
    const boardSoundVolume = sounds ? env.bot.playSound(justPlayed, sounds) : 1;
    if (boardSoundVolume) site.sound.move({ ...moveCtx, volume: boardSoundVolume });
  }

  private triggerStart(inProgress = false) {
    ['white', 'black'].forEach(c => env.bot.playSound(c as Color, ['greeting']));
    if (env.dev || !env.bot[this.live.turn]) return;
    if (!inProgress) {
      setTimeout(() => this.start(), 200);
      return;
    }
    const main = document.querySelector<HTMLElement>('#main-wrap');
    main?.classList.add('paused');
    setTimeout(() => {
      // TODO fix
      const board = main?.querySelector<HTMLElement>('cg-container');
      const onclick = () => {
        main?.classList.remove('paused');
        this.start();
        board?.removeEventListener('click', onclick);
      };
      board?.addEventListener('click', onclick);
    }, 200);
  }

  private resetClock() {
    const initial = this.live.initial as number;
    this.clock = Number.isFinite(initial)
      ? {
          initial: initial,
          increment: this.live.increment ?? 0,
          white: this.live.clock?.white ?? initial,
          black: this.live.clock?.black ?? initial,
          emerg: 0,
          showTenths: this.opts.pref.clockTenths,
          showBar: true,
          moretime: 0,
          running: false,
          since: undefined,
        }
      : undefined;
  }
}
