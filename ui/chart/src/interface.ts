import type Highcharts from 'highcharts';
import { PlotlyHTMLElement } from 'plotly.js-dist-min';

export interface PlyChart extends Highcharts.ChartObject {
  firstPly: number;
  selectPly(ply: number, isMainline: boolean): void;
}

export interface AcplChart extends PlyChart {
  updateData(d: AnalyseData, mainline: Tree.Node[]): void;
}

export interface Division {
  middle?: number;
  end?: number;
}

export interface Player {
  color: 'white' | 'black';
  blurs?: {
    bits?: string;
  };
}

export interface AnalyseData {
  player: Player;
  opponent: Player;
  treeParts: Tree.Node[];
  game: {
    division?: Division;
    variant: {
      key: string;
    };
    moveCentis?: number[];
    status: {
      name: string;
    };
  };
  analysis?: {
    partial: boolean;
  };
  clock?: {
    running: boolean;
    initial: number;
    increment: number;
  };
}

export interface ChartGame {
  acpl(el: HTMLElement, data: AnalyseData, mainline: Tree.Node[], trans: Trans): Promise<AcplChart>;
  movetime(
    el: HTMLElement,
    data: AnalyseData,
    trans: Trans,
    hunter: boolean
  ): Promise<PlotlyHTMLElement | undefined>;
}

export interface DistributionData {
  freq: number[];
  i18n: {
    cumulative: string;
    glicko2Rating: string;
    players: string;
    yourRating: string;
  };
  myRating?: number;
  otherPlayer?: string;
  otherRating?: number;
}

export interface PerfRatingHistory {
  name: string;
  points: [number, number, number, number][];
}
