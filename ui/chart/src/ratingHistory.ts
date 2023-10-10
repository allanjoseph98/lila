import { loadHighcharts } from './common';

interface Opts {
  data: PerfRatingHistory[];
  singlePerfName?: string;
  perfIndex?: number;
}

  function smoothDates(data: [number, number][]) {
    if (!data.length) return [];

    const oneDay = 86400000;
    const begin = data[0][0];
    const end = data[data.length - 1][0];
    const reversed = data.slice().reverse();
    const allDates: number[] = [];
    for (let i = begin - oneDay; i <= end; i += oneDay) allDates.push(i);
    const lastRatingByDate: [number, number][] = [];
    for (let j = 1; j < allDates.length; j++) {
      const match = reversed.find(x => x[0] <= allDates[j]);
      if (match) lastRatingByDate.push([allDates[j], match[1]]);
    }
    return lastRatingByDate;
  }
  const $el = $('div.rating-history');
  const singlePerfIndex = data.findIndex(x => x.name === singlePerfName);
  if (singlePerfName && data[singlePerfIndex].points.length === 0) {
    $el.hide();
    return;
  }
  const indexFilter = (_: any, i: number) => !singlePerfName || i === singlePerfIndex;
  await loadHighcharts('highstock');
  // support: Fx when user bio overflows
  const disabled = { enabled: false };
  const noText = { text: null };
  $el.each(function (this: HTMLElement) {
    const dashStyles = [
      // order of perfs from RatingChartApi.scala
      'Solid', // Bullet
      'Solid', // Blitz
      'Solid', // Rapid
      'Solid', // Classical
      'ShortDash', // Correspondence
      'ShortDash', // Chess960
      'ShortDash', // KotH
      'ShortDot', // 3+
      'ShortDot', // Anti
      'ShortDot', // Atomic
      'Dash', // Horde
      'ShortDot', // Racing Kings
      'Dash', // Crazyhouse
      'Dash', // Puzzle
      'Dash', // Ultrabullet
    ].filter(indexFilter);
    window.Highcharts.stockChart(this, {
      yAxis: {
        title: noText,
      },
      credits: disabled,
      legend: disabled,
      colors: [
        '#56B4E9',
        '#0072B2',
        '#009E73',
        '#459F3B',
        '#F0E442',
        '#E69F00',
        '#D55E00',
        '#CC79A7',
        '#DF5353',
        '#66558C',
        '#99E699',
        '#FFAEAA',
        '#56B4E9',
        '#0072B2',
        '#009E73',
      ].filter(indexFilter),
      rangeSelector: {
        enabled: true,
        selected: 1,
        inputEnabled: false,
        labelStyle: {
          display: 'none',
        },
      },
      tooltip: {
        valueDecimals: 0,
      },
      xAxis: {
        title: noText,
        labels: disabled,
        lineWidth: 0,
        tickWidth: 0,
      },
      navigator: {
        baseSeries: perfIndex,
      },
      scrollbar: disabled,
      series: data
        .filter((v: any) => !singlePerfName || v.name === singlePerfName)
        .map((serie: any, i: number) => {
          const originalDatesAndRatings = serie.points.map((r: any) =>
            singlePerfName && serie.name !== singlePerfName ? [] : [Date.UTC(r[0], r[1], r[2]), r[3]]
          );
          return {
            name: serie.name,
            type: 'line',
            dashStyle: dashStyles[i],
            marker: disabled,
            data: smoothDates(originalDatesAndRatings),
          };
        }),
    });
  });
}
