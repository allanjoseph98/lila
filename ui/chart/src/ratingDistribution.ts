import Plotly, { Config, Data, Layout, Shape } from 'plotly.js-dist-min';
import { DistributionData } from './interface';

export default function (data: DistributionData) {
  const trans = lichess.trans(data.i18n);
  $('#rating_distribution_chart').each(function (this: HTMLElement) {
    const arraySum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const ratingAt = (i: number) => 400 + i * 25;
    const sum = arraySum(data.freq);
    const cumul = [];
    for (let i = 0; i < data.freq.length; i++) cumul.push(arraySum(data.freq.slice(0, i)) / sum);
    const ratings = data.freq.map((_, i: number) => ratingAt(i));
    const tickColor = '#707070';
    const blueLineColor = '#7798BF';
    const gridColor = '#404040';
    const makeTitle = (title: string) => ({
      text: title,
      font: {
        color: tickColor,
        size: 12,
      },
    });
    const makeLine = (rating: number, color: string, label: string): Partial<Shape> => ({
      type: 'line',
      x0: rating,
      x1: rating,
      y0: 0,
      y1: 1,
      yref: 'paper',
      line: {
        color: color,
        dash: 'dash',
        width: 3,
      },
      label: {
        text: label,
        font: { color: color },
        textposition: 'end',
        xanchor: rating < 1800 ? 'left' : 'right',
        yanchor: 'top',
        textangle: 0,
      },
    });
    const plotdata: Data[] = [
      {
        y: data.freq,
        x: ratings,
        fill: 'tozeroy',
        line: { color: blueLineColor, width: 4 },
        mode: 'lines+markers',
        marker: { color: blueLineColor, size: 7 },
        name: trans.noarg('players'),
      },
      {
        y: cumul,
        yaxis: 'y2',
        textinfo: 'percent',
        x: ratings,
        line: { color: '#dddf0d' },
        name: trans.noarg('cumulative'),
      },
    ];
    const layout: Partial<Layout> = {
      showlegend: false,
      paper_bgcolor: '#262421',
      plot_bgcolor: '#262421',
      margin: { t: 0, l: 50, b: 50, r: 50 },
      hovermode: 'x unified',
      hoverlabel: { font: { color: '#a0a0a0' } },
      font: {
        family: '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
      },
      xaxis: {
        fixedrange: true,
        gridcolor: gridColor,
        tickfont: {
          color: tickColor,
        },
        title: makeTitle(trans.noarg('glicko2Rating')),
        tickmode: 'linear',
        tick0: ratings[0],
        dtick: 100,
        tickangle: -45,
        spikecolor: gridColor,
      },
      yaxis: {
        fixedrange: true,
        title: makeTitle(trans.noarg('players')),
        gridcolor: '#404040',
        tickfont: {
          color: tickColor,
        },
      },
      yaxis2: {
        //cumul
        fixedrange: true,
        overlaying: 'y',
        title: makeTitle(trans.noarg('cumulative')),
        side: 'right',
        tickformat: '.0%',
        tickfont: {
          color: tickColor,
        },
        rangemode: 'tozero',
      },
      shapes: (data?.myRating ? [makeLine(data.myRating, '#55bf3b', data.i18n.yourRating)] : []).concat(
        data?.otherRating && data?.otherPlayer
          ? [makeLine(data.otherRating, '#eeaaee', data.otherPlayer)]
          : []
      ),
    };
    const config: Partial<Config> = {
      displayModeBar: false,
      responsive: true,
      doubleClick: false,
    };
    Plotly.newPlot(this, plotdata, layout, config);
  });
}
