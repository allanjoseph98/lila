import { Classes, h, VNode } from 'snabbdom';
import * as licon from 'common/licon';
import perfIcons from 'common/perfIcons';
import { Tournament, Clock } from '../interfaces';
import { Ctrl, Lane } from '../tournament.schedule';
import dragscroll from 'dragscroll';
import { padWithZero } from './util';

const scale = 8;
let now: number, startTime: number, stopTime: number;

const i18nNames: Record<string, string> = {};

const startDirection = () => (document.dir == 'rtl' ? 'right' : 'left');

function i18nName(t: Tournament) {
  if (!i18nNames[t.id]) i18nNames[t.id] = t.fullName;
  return i18nNames[t.id];
}

function displayClockLimit(limit: number) {
  switch (limit) {
    case 15:
      return '¼';
    case 30:
      return '½';
    case 45:
      return '¾';
    case 90:
      return '1.5';
    default:
      return limit / 60;
  }
}

const displayClock = (clock: Clock) => displayClockLimit(clock.limit) + '+' + clock.increment;

function leftPos(time: number) {
  const rounded = 1000 * 60 * Math.floor(time / 1000 / 60);
  return (scale * (rounded - startTime)) / 1000 / 60;
}

function laneGrouper(t: Tournament): number {
  if (t.schedule && t.schedule.freq === 'unique') {
    return -1;
  } else if (t.variant.key !== 'standard') {
    return 99;
  } else if (t.schedule && t.hasMaxRating) {
    return 50 + parseInt(t.fullName.slice(1, 5)) / 10000;
  } else if (t.schedule && t.schedule.speed === 'superBlitz') {
    return t.perf.position - 0.5;
  } else if ((t.schedule && t.schedule.speed === 'hyperBullet') || t.perf.key === 'ultraBullet') {
    return 4;
  } else {
    return t.perf.position;
  }
}

const group = (arr: Tournament[], grouper: (t: Tournament) => number): Lane[] =>
  Array.from(
    arr.reduce<Map<number, Tournament[]>>((groups, e) => {
      const groupId = grouper(e);
      const maybeGroup = groups.get(groupId);
      maybeGroup ? maybeGroup.push(e) : groups.set(groupId, [e]);
      return groups;
    }, new Map()),
  )
    .sort(([a, _], [b, _2]) => a - b)
    .map(g => g[1]);

const truncSeconds = (epoch: number): number => epoch - (epoch % (60 * 1000));

const fitLane = (lane: Lane, tour2: Tournament) =>
  !lane.some(
    (tour1: Tournament) =>
      !(
        truncSeconds(tour1.finishesAt) <= truncSeconds(tour2.startsAt) ||
        truncSeconds(tour2.finishesAt) <= truncSeconds(tour1.startsAt)
      ),
  );

// splits lanes that have collisions, but keeps
// groups separate by not compacting existing lanes
const splitOverlaping = (lanes: Lane[]): Lane[] =>
  lanes.reduce<Lane[]>(
    (ret, lane) =>
      ret.concat(
        lane.reduce<Lane[]>(
          (newLanes, tour) => {
            const maybeFit = newLanes.find(l => fitLane(l, tour));
            maybeFit ? maybeFit.push(tour) : newLanes.push([tour]);
            return newLanes;
          },
          [[]],
        ),
      ),
    [],
  );

function tournamentClass(tour: Tournament): Classes {
  const finished = tour.status === 30,
    userCreated = tour.createdBy !== 'lichess',
    classes = {
      'tsht-rated': tour.rated,
      'tsht-casual': !tour.rated,
      'tsht-finished': finished,
      'tsht-joinable': !finished,
      'tsht-user-created': userCreated,
      'tsht-thematic': !!tour.position,
      'tsht-short': tour.minutes <= 30,
      'tsht-max-rating': !userCreated && tour.hasMaxRating,
    } as Classes;
  if (tour.schedule) classes['tsht-' + tour.schedule.freq] = true;
  return classes;
}

const iconOf = (tour: Tournament) =>
  tour.schedule?.freq === 'shield' ? licon.Shield : perfIcons[tour.perf.key];

let mousedownAt: number[] | undefined;

function renderTournament(ctrl: Ctrl, tour: Tournament) {
  let width = tour.minutes * scale;
  const left = leftPos(tour.startsAt);
  // moves content into viewport, for long tourneys and marathons
  const paddingLeft =
    tour.minutes < 90
      ? 0
      : Math.max(
          0,
          Math.min(
            width - 250, // max padding, reserved text space
            leftPos(now) - left - 380,
          ),
        ); // distance from Now
  // cut right overflow to fit viewport and not widen it, for marathons
  width = Math.min(width, leftPos(stopTime) - left);

  return h(
    'a.tsht',
    {
      class: tournamentClass(tour),
      attrs: {
        href: '/tournament/' + tour.id,
        style:
          'width: ' +
          width +
          'px; ' +
          startDirection() +
          ': ' +
          left +
          'px; padding-' +
          startDirection() +
          ': ' +
          paddingLeft +
          'px',
      },
    },
    [
      h('span.icon', tour.perf ? { attrs: { 'data-icon': iconOf(tour), title: tour.perf.name } } : {}),
      h('span.body', [
        h('span.name', i18nName(tour)),
        h('span.infos', [
          h('span.text', [
            displayClock(tour.clock) + ' ',
            tour.variant.key === 'standard' ? null : tour.variant.name + ' ',
            tour.position ? 'Thematic ' : null,
            tour.rated ? ctrl.trans('ratedTournament') : ctrl.trans('casualTournament'),
          ]),
          tour.nbPlayers
            ? h('span.nb-players', { attrs: { 'data-icon': licon.User } }, tour.nbPlayers)
            : null,
        ]),
      ]),
    ],
  );
}

function renderTimeline() {
  const minutesBetween = 10;
  const time = new Date(startTime);
  time.setSeconds(0);
  time.setMinutes(Math.floor(time.getMinutes() / minutesBetween) * minutesBetween);

  const timeHeaders: VNode[] = [];
  const count = (stopTime - startTime) / (minutesBetween * 60 * 1000);
  for (let i = 0; i < count; i++) {
    timeHeaders.push(
      h(
        'div.timeheader',
        {
          class: { hour: !time.getMinutes() },
          attrs: { style: startDirection() + ': ' + leftPos(time.getTime()) + 'px' },
        },
        timeString(time),
      ),
    );
    time.setUTCMinutes(time.getUTCMinutes() + minutesBetween);
  }
  timeHeaders.push(
    h('div.timeheader.now', { attrs: { style: startDirection() + ': ' + leftPos(now) + 'px' } }),
  );

  return h('div.timeline', timeHeaders);
}

// converts Date to "%H:%M" with leading zeros
const timeString = (time: Date) => padWithZero(time.getHours()) + ':' + padWithZero(time.getMinutes());

export default function (ctrl: Ctrl) {
  now = Date.now();
  startTime = now - 3 * 60 * 60 * 1000;
  stopTime = startTime + 10 * 60 * 60 * 1000;

  const data = ctrl.data();

  const systemTours: Tournament[] = [],
    userTours: Tournament[] = [];

  data.finished
    .concat(data.started)
    .concat(data.created)
    .filter(t => t.finishesAt > startTime)
    .forEach(t => {
      t.schedule ? systemTours.push(t) : userTours.push(t);
    });

  // group system tournaments into dedicated lanes for PerfType
  const tourLanes = splitOverlaping(group(systemTours, laneGrouper).concat([userTours])).filter(
    lane => lane.length > 0,
  );

  return h('div.tour-chart', [
    h(
      'div.tour-chart__inner.dragscroll.',
      {
        hook: {
          insert: vnode => {
            const el = vnode.elm as HTMLElement;
            const bitLater = now + 15 * 60 * 1000;
            const scroll = leftPos(bitLater - (el.clientWidth / 2.5 / scale) * 60 * 1000);
            el.scrollLeft = document.dir == 'rtl' ? -1 * scroll : scroll;

            dragscroll.reset();

            el.addEventListener('mousedown', e => {
              mousedownAt = [e.clientX, e.clientY];
            });
            el.addEventListener('click', e => {
              const dist = mousedownAt
                ? Math.abs(e.clientX - mousedownAt[0]) + Math.abs(e.clientY - mousedownAt[1])
                : 0;
              if (dist > 20) {
                e.preventDefault();
                return false;
              }
              return true;
            });
          },
        },
      },
      [
        renderTimeline(),
        ...tourLanes.map(lane =>
          h(
            'div.tournamentline',
            lane.map(tour => renderTournament(ctrl, tour)),
          ),
        ),
      ],
    ),
  ]);
}
