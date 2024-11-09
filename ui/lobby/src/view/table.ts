import { h, thunk } from 'snabbdom';
import { bind, onInsert } from 'common/snabbdom';
import type LobbyController from '../ctrl';
import type { GameType } from '../interfaces';
import renderSetupModal from './setup/modal';
import { numberFormat } from 'common/number';

export default function table(ctrl: LobbyController) {
  const { data, opts } = ctrl;
  const hasOngoingRealTimeGame = ctrl.hasOngoingRealTimeGame();
  const hookDisabled =
    opts.playban || opts.hasUnreadLichessMessage || ctrl.me?.isBot || hasOngoingRealTimeGame;
  const { members, rounds } = data.counters;
  return h('div.lobby__table', [
    h(
      'div.lobby__start',
      (site.blindMode ? [h('h2', 'Play')] : []).concat(
        [
          ['hook', i18n.site.createAGame, hookDisabled],
          ['friend', i18n.site.playWithAFriend, hasOngoingRealTimeGame],
          ['ai', i18n.site.playWithTheMachine, hasOngoingRealTimeGame],
        ].map(([gameType, text, disabled]: [Exclude<GameType, 'local'>, string, boolean]) =>
          h(
            `button.button.button-metal.config_${gameType}`,
            {
              class: { active: ctrl.setupCtrl.gameType === gameType, disabled },
              attrs: { type: 'button' },
              hook: disabled ? {} : bind('click', () => ctrl.setupCtrl.openModal(gameType), ctrl.redraw),
            },
            text,
          ),
        ),
      ),
    ),
    renderSetupModal(ctrl),
    // Use a thunk here so that snabbdom does not rerender; we will do so manually after insert
    thunk(
      'div.lobby__counters',
      () =>
        h('div.lobby__counters', [
          site.blindMode ? h('h2', 'Counters') : null,
          h(
            'a',
            { attrs: site.blindMode ? {} : { href: '/player' } },
            i18n.site.nbPlayers.asArray(
              members,
              h(
                'strong',
                {
                  attrs: { 'data-count': members },
                  hook: onInsert<HTMLAnchorElement>(elm => {
                    ctrl.spreadPlayersNumber = ctrl.initNumberSpreader(elm, 10, members);
                  }),
                },
                numberFormat(members),
              ),
            ),
          ),
          h(
            'a',
            site.blindMode ? {} : { attrs: { href: '/games' } },
            i18n.site.nbGamesInPlay.asArray(
              rounds,
              h(
                'strong',
                {
                  attrs: { 'data-count': rounds },
                  hook: onInsert<HTMLAnchorElement>(elm => {
                    ctrl.spreadGamesNumber = ctrl.initNumberSpreader(elm, 8, rounds);
                  }),
                },
                numberFormat(rounds),
              ),
            ),
          ),
        ]),
      [],
    ),
  ]);
}
