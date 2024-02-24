import {
  ArcElement,
  Chart,
  ChartConfiguration,
  ChartDataset,
  ChartType,
  DoughnutController,
  Title,
} from 'chart.js';
import dataLabels from 'chartjs-plugin-datalabels';
import { fontColor, fontFamily, resizePolyfill } from './common';

declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    needle?: {
      value: number;
    };
  }
}

resizePolyfill();
Chart.register(DoughnutController, ArcElement, dataLabels, Title);
Chart.defaults.font = fontFamily();

const v = {
  server: -1,
  network: -1,
  networkAlt: -1,
};

export async function initModule() {
  site.StrongSocket.firstConnect.then(() => site.socket.send('moveLat', true));
  const otherSocket = new site.StrongSocket('/socket/v5', false, {
    options: { useAlt: !usingAltSocket },
  });
  $('.meter canvas').each(function (this: HTMLCanvasElement, index) {
    const colors = ['#55bf3b', '#dddf0d', '#df5353'];
    const dataset: ChartDataset<'doughnut'>[] = [
      {
        data: [500, 150, 100],
        backgroundColor: colors,
        hoverBackgroundColor: colors,
        borderColor: '#d9d9d9',
        borderWidth: 3,
        circumference: 180,
        rotation: 270,
      },
    ];
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['0-500', '500-650', '650-750'],
        datasets: dataset,
      },
      options: {
        events: [],
        plugins: {
          title: {
            display: true,
            text: '',
            padding: { top: 100 },
            color: fontColor,
          },
          needle: {
            value: index ? v.network : v.server,
          },
          datalabels: {
            color: 'black',
            formatter: (_, ctx) => ctx.chart.data.labels![ctx.dataIndex],
          },
        },
      },
      plugins: [
        {
          id: 'needle',
          afterDatasetDraw(chart, _args, _opts) {
            const ctx = chart.ctx;
            ctx.save();
            const data = chart.getDatasetMeta(0).data[0] as ArcElement;
            const first = chart.data.datasets[0].data[0] as number;
            let dest = data.circumference / Math.PI / first;
            dest = dest * (chart.options.plugins?.needle?.value ?? 1);
            const outer = data.outerRadius;
            ctx.translate(data.x, data.y);
            ctx.rotate(Math.PI * (dest + 1.5));
            ctx.beginPath();
            ctx.fillStyle = '#838382';
            ctx.moveTo(0 - 10, 0);
            ctx.lineWidth = 1;
            ctx.lineTo(0, -outer);
            ctx.lineTo(0 + 10, 0);
            ctx.lineTo(0 - 10, 0);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, (Math.PI / 180) * 360, false);
            ctx.fill();

            ctx.restore();
          },
        },
      ],
    };
    const chart = new Chart(this, config);
    if (index == 0)
      site.pubsub.on('socket.in.mlat', (d: number) => {
        v.server = d;
        update(chart, v.server, false);
      });
    else {
      setInterval(function () {
        const altSocket = usingAltSocket ? site.socket : otherSocket;
        const directSocket = usingAltSocket ? otherSocket : site.socket;
        v.network = Math.round(directSocket.averageLag);
        v.networkAlt = Math.round(altSocket.averageLag);
        update(chart, v.network, true, v.networkAlt);
      }, 1000);
    }
  });
}

const update = (chart: Chart<'doughnut'>, lat: number, ping: boolean, altLat?: number) => {
  if (lat <= 0) return;
  chart.options.plugins!.needle!.value = Math.min(750, lat);
  chart.options.plugins!.title!.text! = makeTitle(ping, lat, altLat);
  if (v.server === -1 || v.network === -1) return;
  const c = v.server <= 100 && v.network <= 500 ? 'nope-nope' : v.server <= 100 ? 'nope-yep' : 'yep';
  $('.lag .answer span')
    .addClass('none')
    .parent()
    .find('.' + c)
    .removeClass('none');
  chart.update();
};

const makeTitle = (ping: boolean, lat: number, altLat?: number) => [
  (ping ? 'Ping' : 'Server latency') + ' in milliseconds',
  `${lat}`,
  altLat ? `${altLat} using CDN routing` : '',
];

const usingAltSocket = document.body.classList.contains('socket-alt');
