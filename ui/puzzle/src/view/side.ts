import type { Puzzle, PuzzleGame, PuzzleDifficulty } from '../interfaces';
import * as licon from 'lib/licon';
import { type VNode, dataIcon, onInsert, type MaybeVNode, hl } from 'lib/snabbdom';
import { numberFormat } from 'lib/i18n';
import perfIcons from 'lib/game/perfIcons';
import { userLink } from 'lib/view/userLink';
import type PuzzleStreak from '../streak';
import type PuzzleCtrl from '../ctrl';

export function puzzleBox(ctrl: PuzzleCtrl): VNode {
  const data = ctrl.data;
  return hl('div.puzzle__side__metas', [
    puzzleInfos(ctrl, data.puzzle),
    gameInfos(ctrl, data.game, data.puzzle),
  ]);
}

const angleImg = (ctrl: PuzzleCtrl): string => {
  const angle = ctrl.data.angle;
  const name =
    angle.opening || angle.openingAbstract ? 'opening' : angle.key.startsWith('mateIn') ? 'mate' : angle.key;
  return site.asset.url(`images/puzzle-themes/${name}.svg`);
};

const puzzleInfos = (ctrl: PuzzleCtrl, puzzle: Puzzle): VNode =>
  hl('div.infos.puzzle', [
    hl('img.infos__angle-img', { attrs: { src: angleImg(ctrl), alt: ctrl.data.angle.name } }),
    hl('div', [
      hl(
        'p',
        i18n.puzzle.puzzleId.asArray(
          ctrl.streak && ctrl.mode === 'play'
            ? hl('span.hidden', i18n.puzzle.hidden)
            : hl(
                'a',
                {
                  attrs: {
                    href: ctrl.routerWithLang(`/training/${puzzle.id}`),
                    ...(ctrl.streak ? { target: '_blank' } : {}),
                  },
                },
                '#' + puzzle.id,
              ),
        ),
      ),
      ctrl.opts.showRatings &&
        hl(
          'p',
          i18n.puzzle.ratingX.asArray(
            !ctrl.streak && ctrl.mode === 'play'
              ? hl('span.hidden', i18n.puzzle.hidden)
              : hl('strong', `${puzzle.rating}`),
          ),
        ),
      hl('p', i18n.puzzle.playedXTimes.asArray(puzzle.plays, hl('strong', numberFormat(puzzle.plays)))),
    ]),
  ]);

function gameInfos(ctrl: PuzzleCtrl, game: PuzzleGame, puzzle: Puzzle): VNode {
  const gameName = game.clock && game.perf ? `${game.clock} • ${game.perf.name}` : 'import';
  return hl('div.infos', { attrs: game.perf && dataIcon(perfIcons[game.perf.key]) }, [
    hl('div', [
      hl(
        'p',
        i18n.puzzle.fromGameLink.asArray(
          ctrl.mode === 'play'
            ? hl('span', gameName)
            : hl('a', { attrs: { href: `/${game.id}/${ctrl.pov}#${puzzle.initialPly}` } }, gameName),
        ),
      ),
      hl(
        'div.players',
        game.players.map(p => {
          const user =
            p.name == 'ghost'
              ? p.rating?.toString() || ''
              : userLink({ ...p, rating: ctrl.opts.showRatings ? p.rating : undefined, line: false });
          return hl('div.player.color-icon.is.text.' + p.color, user);
        }),
      ),
    ]),
  ]);
}

const renderStreak = (streak: PuzzleStreak) =>
  hl(
    'div.puzzle__side__streak',
    streak.data.index === 0
      ? hl('div.puzzle__side__streak__info', [
          hl('h1.text', { attrs: dataIcon(licon.ArrowThruApple) }, 'Puzzle Streak'),
          hl('p', i18n.puzzle.streakDescription),
        ])
      : hl(
          'div.puzzle__side__streak__score.text',
          { attrs: dataIcon(licon.ArrowThruApple) },
          `${streak.data.index}`,
        ),
  );

export const userBox = (ctrl: PuzzleCtrl): VNode => {
  const data = ctrl.data;
  if (!data.user)
    return hl('div.puzzle__side__user', [
      hl('p', i18n.puzzle.toGetPersonalizedPuzzles),
      hl('a.button', { attrs: { href: ctrl.routerWithLang('/signup') } }, i18n.site.signUp),
    ]);
  const diff = ctrl.round?.ratingDiff,
    ratedId = `puzzle-toggle-rated_hint-${ctrl.hintHasBeenShown()}`;
  return hl('div.puzzle__side__user', [
    !data.replay &&
      !ctrl.streak &&
      data.user &&
      hl('div.puzzle__side__config__toggle', [
        hl('div.switch', [
          hl(`input#${ratedId}.cmn-toggle.cmn-toggle--subtle.`, {
            attrs: {
              type: 'checkbox',
              checked: ctrl.rated() && !ctrl.hintHasBeenShown(),
              disabled: ctrl.lastFeedback !== 'init' || ctrl.hintHasBeenShown(),
            },
            hook: onInsert(el => el.addEventListener('change', ctrl.toggleRated)),
          }),
          hl('label', { attrs: { for: ratedId } }),
        ]),
        hl('label', { attrs: { for: ratedId } }, i18n.site.rated),
      ]),
    hl(
      'div.puzzle__side__user__rating',
      ctrl.rated()
        ? ctrl.opts.showRatings &&
            hl('strong', [
              data.user.rating - (diff || 0),
              !!diff && diff > 0 && [' ', hl('good.rp', '+' + diff)],
              !!diff && diff < 0 && [' ', hl('bad.rp', '−' + -diff)],
            ])
        : hl('p.puzzle__side__user__rating__casual', i18n.puzzle.yourPuzzleRatingWillNotChange),
    ),
  ]);
};

export const streakBox = (ctrl: PuzzleCtrl) => hl('div.puzzle__side__user', renderStreak(ctrl.streak!));

const difficulties: [PuzzleDifficulty, number][] = [
  ['easiest', -600],
  ['easier', -300],
  ['normal', 0],
  ['harder', 300],
  ['hardest', 600],
];
const colors = [
  ['black', 'asBlack'],
  ['random', 'randomColor'],
  ['white', 'asWhite'],
] as const;

export function replay(ctrl: PuzzleCtrl): MaybeVNode {
  const replay = ctrl.data.replay;
  if (!replay) return;
  const i = replay.i + (ctrl.mode === 'play' ? 0 : 1);
  const text = i18n.puzzleTheme[ctrl.data.angle.key];
  return hl('div.puzzle__side__replay', [
    hl('a', { attrs: { href: `/training/dashboard/${replay.days}` } }, ['« ', `Replaying ${text} puzzles`]),
    hl('div.puzzle__side__replay__bar', {
      attrs: {
        style: `---p:${replay.of ? Math.round((100 * i) / replay.of) : 1}%`,
        'data-text': `${i} / ${replay.of}`,
      },
    }),
  ]);
}

export function config(ctrl: PuzzleCtrl): MaybeVNode {
  const autoNextId = 'puzzle-toggle-autonext',
    data = ctrl.data;
  return hl('div.puzzle__side__config', [
    hl('div.puzzle__side__config__toggle', [
      hl('div.switch', [
        hl(`input#${autoNextId}.cmn-toggle.cmn-toggle--subtle`, {
          attrs: { type: 'checkbox', checked: ctrl.autoNext() },
          hook: {
            insert: vnode =>
              (vnode.elm as HTMLElement).addEventListener('change', () => {
                ctrl.autoNext(!ctrl.autoNext());
                if (ctrl.autoNext() && ctrl.resultSent && !ctrl.streak) {
                  ctrl.nextPuzzle();
                }
              }),
          },
        }),
        hl('label', { attrs: { for: autoNextId } }),
      ]),
      hl('label', { attrs: { for: autoNextId } }, i18n.puzzle.jumpToNextPuzzleImmediately),
    ]),
    !data.user || data.replay || ctrl.streak ? null : renderDifficultyForm(ctrl),
  ]);
}

export const renderDifficultyForm = (ctrl: PuzzleCtrl): VNode =>
  hl(
    'form.puzzle__side__config__difficulty',
    { attrs: { action: `/training/difficulty/${ctrl.data.angle.key}`, method: 'post' } },
    [
      hl('label', { attrs: { for: 'puzzle-difficulty' } }, i18n.puzzle.difficultyLevel),
      hl(
        'select#puzzle-difficulty.puzzle__difficulty__selector',
        {
          attrs: { name: 'difficulty' },
          hook: onInsert(elm =>
            elm.addEventListener('change', () => (elm.parentNode as HTMLFormElement).submit()),
          ),
        },
        difficulties.map(([key, delta]) =>
          hl(
            'option',
            {
              attrs: {
                value: key,
                selected: key === ctrl.opts.settings.difficulty,
                title:
                  !!delta && delta < 0
                    ? i18n.puzzle.nbPointsBelowYourPuzzleRating(Math.abs(delta))
                    : i18n.puzzle.nbPointsAboveYourPuzzleRating(Math.abs(delta)),
              },
            },
            [i18n.puzzle[key], delta ? ` (${delta > 0 ? '+' : ''}${delta})` : ''],
          ),
        ),
      ),
    ],
  );

export const renderColorForm = (ctrl: PuzzleCtrl): VNode =>
  hl(
    'div.puzzle__side__config__color',
    hl(
      'group.radio',
      colors.map(([key, i18nKey]) =>
        hl('div', [
          hl(
            `a.label.color-${key}${key === (ctrl.opts.settings.color || 'random') ? '.active' : ''}`,
            {
              attrs: { href: `/training/${ctrl.data.angle.key}/${key}`, title: i18n.site[i18nKey] },
            },
            hl('i'),
          ),
        ]),
      ),
    ),
  );
