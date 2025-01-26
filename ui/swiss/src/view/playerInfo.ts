import type { VNode } from 'snabbdom';
import * as licon from 'common/licon';
import { spinnerVdom as spinner } from 'common/spinner';
import { bind, dataIcon, looseH as h } from 'common/snabbdom';
import { player as renderPlayer, numberRow } from './util';
import type { Pairing } from '../interfaces';
import { isOutcome } from '../util';
import type SwissCtrl from '../ctrl';
import { fullName } from 'common/userLink';

export default function (ctrl: SwissCtrl): VNode | undefined {
  if (!ctrl.playerInfoId) return;
  const data = ctrl.data.playerInfo;
  const tag = 'div.swiss__player-info.swiss__table';
  if (data?.user.id !== ctrl.playerInfoId)
    return h(tag, [h('div.stats', [h('h2', ctrl.playerInfoId), spinner()])]);
  const games = data.sheet.filter(p => !isOutcome(p) && p.g).length;
  const wins = data.sheet.filter(p => !isOutcome(p) && p.w).length;
  const avgOp: number | undefined = games
    ? Math.round(data.sheet.reduce((r, p) => r + (!isOutcome(p) ? p.rating : 1), 0) / games)
    : undefined;
  return h(tag, { hook: { insert: setup, postpatch: (_, vnode) => setup(vnode) } }, [
    h('a.close', {
      attrs: dataIcon(licon.X),
      hook: bind('click', () => ctrl.showPlayerInfo(data), ctrl.redraw),
    }),
    h('div.stats', [
      h('h2', [h('span.rank', data.rank + '. '), renderPlayer(data, true, false)]),
      h('table', [
        numberRow(i18n.site.points, data.points, 'raw'),
        numberRow(i18n.swiss.tieBreak, data.tieBreak, 'raw'),
        ...(games
          ? [
              data.performance &&
                ctrl.opts.showRatings &&
                numberRow(i18n.site.performance, data.performance + (games < 3 ? '?' : ''), 'raw'),
              numberRow(i18n.site.winRate, [wins, games], 'percent'),
              ctrl.opts.showRatings && numberRow(i18n.site.averageOpponent, avgOp, 'raw'),
            ]
          : []),
      ]),
    ]),
    h('div', [
      h(
        'table.pairings.sublist',
        {
          hook: bind('click', e => {
            const href = ((e.target as HTMLElement).parentNode as HTMLElement).getAttribute('data-href');
            if (href) window.open(href, '_blank');
          }),
        },
        data.sheet.map((p, i) => {
          const round = ctrl.data.round - i;
          if (isOutcome(p))
            return h('tr.' + p, { key: round }, [
              h('th', '' + round),
              h('td.outcome', { attrs: { colspan: 3 } }, p),
              h('td', p === 'absent' ? '-' : p === 'bye' ? '1' : '½'),
            ]);
          const res = result(p);
          return h(
            'tr.glpt.' + (res === '1' ? '.win' : res === '0' ? '.loss' : ''),
            {
              key: round,
              attrs: { 'data-href': '/' + p.g + (p.c ? '' : '/black') },
              hook: { destroy: vnode => $.powerTip.destroy(vnode.elm as HTMLElement) },
            },
            [
              h('th', '' + round),
              h('td', fullName(p.user)),
              ctrl.opts.showRatings && h('td', '' + p.rating),
              h('td.is.color-icon.' + (p.c ? 'white' : 'black')),
              h('td.result', res),
            ],
          );
        }),
      ),
    ]),
  ]);
}

function result(p: Pairing): string {
  switch (p.w) {
    case true:
      return '1';
    case false:
      return '0';
    default:
      return p.o ? '*' : '½';
  }
}

function setup(vnode: VNode) {
  const el = vnode.elm as HTMLElement,
    p = site.powertip;
  p.manualUserIn(el);
  p.manualGameIn(el);
}
