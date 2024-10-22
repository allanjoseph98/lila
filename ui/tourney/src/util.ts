import { h, VNode, VNodeChildren } from 'snabbdom';
import * as licon from 'common/licon';
import { numberFormat } from 'common/number';
import { dataIcon } from 'common/snabbdom';
import { fullName, userRating } from 'common/userLink';
import { BasePlayer as SwissPlayer, Player } from './interfaces';

export const ratio2percent = (r: number): string => Math.round(100 * r) + '%';

const isSwissPlayer = (p: Player): p is SwissPlayer => 'user' in p;

export const player = (
  p: Player,
  asLink: boolean,
  withRating: boolean,
  defender = false,
  leader = false,
): VNode => {
  const fromSwiss = isSwissPlayer(p);
  const user = fromSwiss ? p.user : p;
  return h(
    'a.ulpt.user-link' + (((user.title || '') + user.name).length > 15 ? '.long' : ''),
    {
      attrs:
        asLink || 'ontouchstart' in window ? { href: '/@/' + user.name } : { 'data-href': '/@/' + user.name },
      hook: { destroy: vnode => $.powerTip.destroy(vnode.elm as HTMLElement) },
    },
    [
      h(
        'span.name' + (defender ? '.defender' : leader ? '.leader' : ''),
        defender ? { attrs: dataIcon(licon.Shield) } : leader ? { attrs: dataIcon(licon.Crown) } : {},
        fullName(user),
      ),
      withRating ? h('span.rating', userRating({ ...user, brackets: false })) : null,
    ],
  );
};

export function numberRow(name: string, value: number): VNode;
export function numberRow(name: string, value: [number, number], typ: 'percent'): VNode;
export function numberRow(name: string, value: VNodeChildren, typ: 'raw'): VNode;
export function numberRow(name: string, value: any, typ?: string) {
  return h('tr', [
    h('th', name),
    h(
      'td',
      typ === 'raw'
        ? value
        : typ === 'percent'
          ? value[1] > 0
            ? ratio2percent(value[0] / value[1])
            : 0
          : numberFormat(value),
    ),
  ]);
}

export const padWithZero = (n: number): string => `${n}`.padStart(2, '0');
