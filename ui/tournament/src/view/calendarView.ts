import { Classes, h, VNode } from 'snabbdom';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import addDays from 'date-fns/addDays';
import getHours from 'date-fns/getHours';
import getMinutes from 'date-fns/getMinutes';
import areIntervalsOverlapping from 'date-fns/areIntervalsOverlapping';
import format from 'date-fns/format';
import { Tournament } from '../interfaces';
import { Ctrl, Lanes } from '../tournament.calendar';
import * as licon from 'common/licon';
import perfIcons from 'common/perfIcons';
import { padWithZero } from './util';

function tournamentClass(tour: Tournament, day: Date): Classes {
  const classes: Classes = {
    rated: tour.rated,
    casual: !tour.rated,
    'max-rating': tour.hasMaxRating,
    yesterday: tour.bounds.start < day,
  };
  classes[tour.schedule.freq] = !!tour.schedule;
  return classes;
}

const iconOf = (tour: Tournament) =>
  tour.schedule?.freq === 'shield' ? licon.Shield : perfIcons[tour.perf.key];

const startDirection = () => (document.dir == 'rtl' ? 'right' : 'left');

function renderTournament(tour: Tournament, day: Date) {
  let left = ((getHours(tour.bounds.start) + getMinutes(tour.bounds.start) / 60) / 24) * 100;
  if (tour.bounds.start < day) left -= 100;
  const width = (tour.minutes / 60 / 24) * 100;

  return h(
    'a.tournament',
    {
      class: tournamentClass(tour, day),
      attrs: {
        href: '/tournament/' + tour.id,
        style: 'width: ' + width + '%; ' + startDirection() + ': ' + left + '%',
        title: `${tour.fullName} - ${format(tour.bounds.start, 'EEEE, dd/MM/yyyy HH:mm')}`,
      },
    },
    [
      h('span.icon', tour.perf ? { attrs: { 'data-icon': iconOf(tour) } } : {}),
      h('span.body', [tour.fullName]),
    ],
  );
}

const renderLane = (tours: Tournament[], day: Date) =>
  h(
    'lane',
    tours.map(t => renderTournament(t, day)),
  );

const fitLane = (lane: Tournament[], tour2: Tournament) =>
  !lane.some(tour1 => areIntervalsOverlapping(tour1.bounds, tour2.bounds));

const makeLanes = (tours: Tournament[]): Lanes =>
  tours.reduce<Lanes>((lanes, t) => {
    const lane = lanes.find(l => fitLane(l, t));
    lane ? lane.push(t) : lanes.push([t]);
    return lanes;
  }, []);

const renderDay =
  (ctrl: Ctrl) =>
  (day: Date): VNode => {
    const dayEnd = addDays(day, 1);
    const tours = ctrl.data.tournaments.filter(t => t.bounds.start < dayEnd && t.bounds.end > day);
    return h('day', [
      h('date', { attrs: { title: format(day, 'EEEE, dd/MM/yyyy') } }, [format(day, 'dd/MM')]),
      h(
        'lanes',
        makeLanes(tours).map(l => renderLane(l, day)),
      ),
    ]);
  };

const renderGroup =
  (ctrl: Ctrl) =>
  (group: Date[]): VNode =>
    h('group', [renderTimeline(), h('days', group.map(renderDay(ctrl)))]);

const renderTimeline = () =>
  h(
    'div.timeline',
    Array.from(Array(25).keys()).map(hour =>
      h(
        'div.timeheader',
        { attrs: { style: startDirection() + ': ' + (hour / 24) * 100 + '%' } },
        padWithZero(hour),
      ),
    ),
  );

const makeGroups = (days: Date[]): Date[][] =>
  days.reduce<Date[][]>((groups, d, i) => {
    i % 10 == 0 ? groups.push([d]) : groups[groups.length - 1].push(d);
    return groups;
  }, []);

export default function (ctrl: Ctrl) {
  const days = eachDayOfInterval({
    start: new Date(ctrl.data.since),
    end: new Date(ctrl.data.to),
  });
  const groups = makeGroups(days);
  return h('div#tournament-calendar', h('groups', groups.map(renderGroup(ctrl))));
}
