// import divisionLines from './division';
import { MovePoint } from './common';
import { AnalyseData, Player } from './interface';
import Plotly, { Config, Layout, LayoutAxis, PlotData } from 'plotly.js-dist-min';

export default async function (el: HTMLElement, data: AnalyseData, trans: Trans, hunter: boolean) {
  const moveCentis = data.game.moveCentis;
  if (!moveCentis) return; // imported games
  const highlightColor = '#3893E8';
  const xAxisColor = '#cccccc99';
  // const whiteAreaFill = hunter ? 'white' : 'rgba(255, 255, 255, 0.2)';
  const whiteColumnFill = 'rgba(255, 255, 255, 0.9)';
  const whiteColumnBorder = '#00000044';
  // const blackAreaFill = hunter ? 'black' : 'rgba(0, 0, 0, 0.4)';
  const blackColumnFill = 'rgba(0, 0, 0, 0.9)';
  const blackColumnBorder = '#ffffff33';

  const moveSeries = {
    white: [] as MovePoint[],
    black: [] as MovePoint[],
  };
  const totalSeries = {
    white: [] as MovePoint[],
    black: [] as MovePoint[],
  };
  const labels: string[] = [];

  const tree = data.treeParts;
  let ply = 0,
    maxMove = 0,
    maxTotal = 0;

  const logC = Math.pow(Math.log(3), 2);

  const blurs = [toBlurArray(data.player), toBlurArray(data.opponent)];
  if (data.player.color === 'white') blurs.reverse();

  moveCentis.forEach((centis: number, x: number) => {
    const node = tree[x + 1];
    ply = node ? node.ply : ply + 1;
    const san = node ? node.san : '-';

    const turn = (ply + 1) >> 1;
    const color = ply & 1;
    const colorName = color ? 'white' : 'black';

    const y = Math.pow(Math.log(0.005 * Math.min(centis, 12e4) + 3), 2) - logC;
    maxMove = Math.max(y, maxMove);

    let label = turn + (color ? '. ' : '... ') + san;
    const movePoint: MovePoint = {
      x,
      y: color ? y : -y,
    };

    if (blurs[color].shift() === '1') {
    }

    const seconds = (centis / 100).toFixed(centis >= 200 ? 1 : 2);
    label += '<br />' + trans('nbSeconds', '<strong>' + seconds + '</strong>');
    moveSeries[colorName].push(movePoint);

    //hunter stuff
    let clock = node?.clock;
    if (clock == undefined) {
      if (data.game.status.name === 'outoftime') clock = 0;
      else if (data.clock) {
        const prevClock = tree[x - 1]?.clock;
        if (prevClock != undefined) clock = prevClock + data.clock.increment - centis;
      }
    }
    if (clock != undefined) {
      label += '<br />' + formatClock(clock);
      maxTotal = Math.max(clock, maxTotal);
      totalSeries[colorName].push({
        x,
        y: color ? clock : -clock,
      });
    }

    labels.push(label);
  });

  const plotData = (
    colorSeries: MovePoint[],
    white: Boolean,
    axis: number | undefined
  ): Partial<PlotData> => ({
    name: `${white ? 'White' : 'Black'} move time`,
    type: axis == undefined ? 'bar' : 'scatter',
    mode: axis == 2 ? 'lines' : undefined,
    fill: axis === 3 ? 'tozeroy' : undefined,
    x: colorSeries.map(movePoint => Math.floor(movePoint.x / 2)),
    y: colorSeries.map(movePoint => movePoint.y),
    marker: {
      color: white ? whiteColumnFill : blackColumnFill,
      line: {
        color: white ? whiteColumnBorder : blackColumnBorder,
        width: 2,
      },
    },
    line: { color: axis == 2 ? highlightColor : undefined },
    xaxis: axis ? `x${axis}` : undefined,
    yaxis: axis ? `y${axis}` : undefined,
    offset: axis == undefined && !white ? 0.5 : 0,
  });

  const getWhiteAndBlackData = (
    series: { white: MovePoint[]; black: MovePoint[] },
    line: Boolean,
    hunter: Boolean = false
  ): Partial<PlotData>[] =>
    [series.white, series.black].map((colorSeries, i) =>
      plotData(colorSeries, i == 0 ? true : false, hunter ? 3 : line ? 2 : undefined)
    );

  const plotDatas: Partial<PlotData>[] = getWhiteAndBlackData(moveSeries, false)
    .concat(getWhiteAndBlackData(totalSeries, true))
    .concat(hunter ? getWhiteAndBlackData(moveSeries, false, true) : []);

  const axisOpts: Partial<LayoutAxis> = {
    fixedrange: true,
    showgrid: false,
    showticklabels: false,
  };
  const layout: Partial<Layout> = {
    grid: hunter
      ? {
          rows: 2,
          columns: 1,
          pattern: 'independent',
        }
      : undefined,
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 0, l: 0, b: 0, r: 0 },
    barmode: 'relative',
    bargap: 0,
    bargroupgap: 0,
    font: {
      family: '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
    },
    xaxis: { ...axisOpts, color: xAxisColor },
    yaxis: axisOpts,
    xaxis2: { ...axisOpts, overlaying: 'x' },
    yaxis2: { ...axisOpts, overlaying: 'y' },
    xaxis3: axisOpts,
    yaxis3: axisOpts,
  };

  const config: Partial<Config> = {
    displayModeBar: false,
    responsive: true,
    doubleClick: false,
  };

  return Plotly.newPlot(el, plotDatas, layout, config);
}

const toBlurArray = (player: Player) => (player?.blurs?.bits ? player.blurs.bits.split('') : []);

const formatClock = (centis: number) => {
  let result = '';
  if (centis >= 60 * 60 * 100) result += Math.floor(centis / 60 / 6000) + ':';
  result +=
    Math.floor((centis % (60 * 6000)) / 6000)
      .toString()
      .padStart(2, '0') + ':';
  const secs = (centis % 6000) / 100;
  if (centis < 6000) result += secs.toFixed(2).padStart(5, '0');
  else result += Math.floor(secs).toString().padStart(2, '0');
  return result;
};
