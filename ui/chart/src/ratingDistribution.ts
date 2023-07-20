import Plotly, { Config, Data, Layout } from 'plotly.js-dist-min';
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
    const plotdata: Data[] = [
      {
        y: data.freq,
        x: ratings,
        fill: 'tozeroy',
        line: { color: '#7798BF', width: 4},
        mode: 'lines+markers',
        marker: { color: '#7798BF' , size: 7},
      },
      { y: cumul, yaxis: 'y2', textinfo: 'percent', x: ratings, line: { color: '#dddf0d' } },
    ];
    const makeTitle = (title: string) => ({
      text: title,
      font: {
        color: '#707070',
        size: 12,
      },
    });
    const layout: Partial<Layout> = {
      showlegend: false,
      paper_bgcolor: '#262421',
      plot_bgcolor: '#262421',
      xaxis: {
        fixedrange: true,
        gridcolor: '#404040',
        tickfont: {
          color: '#707070',
        },
        title: makeTitle(trans.noarg('glicko2Rating')),
        tickmode: 'linear',
        tick0: ratings[0],
        dtick: 100,
        tickangle: -45,
      },
      yaxis: {
        fixedrange: true,
        title: makeTitle(trans.noarg('players')),
        gridcolor: '#404040',
        tickfont: {
          color: '#707070',
        },
      },
      yaxis2: {
        overlaying: 'y',
        title: makeTitle(trans.noarg('cumulative')),
        side: 'right',
        tickformat: '.0%',
        rangemode: 'tozero'
      },
      font: {
        family: '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
      },
      margin: { t: 0, l: 50, b: 50, r: 50 },
    };
    const config: Partial<Config> = {
      displayModeBar: false,
      responsive: true,
      doubleClick: false,
    };
    Plotly.newPlot(this, plotdata, layout, config);
  });
}
