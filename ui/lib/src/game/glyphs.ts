import { parseUci, makeSquare, squareRank } from 'chessops/util';
import type { DrawShape } from '@lichess-org/chessground/draw';

export function annotationShapes(node: Tree.Node): DrawShape[] {
  const { uci, glyphs, san } = node;
  if (uci && san && glyphs?.[0]) {
    const move = parseUci(uci)!;
    const destSquare = san.startsWith('O-O') // castle, short or long
      ? squareRank(move.to) === 0 // white castle
        ? san.startsWith('O-O-O')
          ? 'c1'
          : 'g1'
        : san.startsWith('O-O-O')
          ? 'c8'
          : 'g8'
      : makeSquare(move.to);
    const symbol = glyphs[0].symbol;
    const prerendered = glyphToSvg[symbol];
    return [
      {
        orig: destSquare,
        brush: prerendered ? '' : undefined,
        customSvg: prerendered ? { html: prerendered } : undefined,
        label: prerendered ? undefined : { text: symbol, fill: 'purple' },
        // keep some purple just to keep feedback forum on their toes
      },
    ];
  } else return [];
}

const composeGlyph = (fill: string, path: string) =>
  `<defs><filter id="shadow"><feDropShadow dx="4" dy="7" stdDeviation="5" flood-opacity="0.5" /></filter></defs><g transform="translate(71 -12) scale(0.4)"><circle style="fill:${fill};filter:url(#shadow)" cx="50" cy="50" r="50" />${path}</g>`;

const whiteIsWinning = composeGlyph(
  '#bbb',
  '<path d="M 29,27 L 29,73 M 6,50 L 52,50" stroke="#fff" stroke-width="7" fill="none"/><path stroke="#fff" stroke-width="7" fill="none" d="M 60,50 L 96,50"/>',
);

const blackIsWinning = composeGlyph(
  '#333',
  '<path d="M 71,27 L 71,73 M 94,50 L 48,50" stroke="#fff" stroke-width="8" fill="none"/><path stroke="#fff" stroke-width="8" fill="none" d="M 40,50 L 4,50"/>',
);

const glyphToSvg: Dictionary<string> = {
  // Inaccuracy
  '?!': composeGlyph(
    '#56b4e9',
    '<path fill="#fff" d="M37.734 21.947c-3.714 0-7.128.464-10.242 1.393-3.113.928-6.009 2.13-8.685 3.605l4.343 8.766c2.35-1.202 4.644-2.157 6.883-2.867a22.366 22.366 0 0 1 6.799-1.065c2.294 0 4.07.464 5.326 1.393 1.311.874 1.967 2.186 1.967 3.933 0 1.748-.546 3.277-1.639 4.588-1.038 1.257-2.786 2.758-5.244 4.506-2.786 2.021-4.751 3.961-5.898 5.819-1.147 1.857-1.721 4.15-1.721 6.88v2.952h10.568v-2.377c0-1.147.137-2.103.41-2.868.328-.764.93-1.557 1.803-2.376.874-.82 2.104-1.803 3.688-2.95 2.13-1.584 3.906-3.058 5.326-4.424 1.42-1.42 2.485-2.95 3.195-4.59.71-1.638 1.065-3.576 1.065-5.816 0-4.206-1.584-7.675-4.752-10.406-3.114-2.731-7.51-4.096-13.192-4.096zm24.745.819l2.048 39.084h9.75l2.047-39.084zM35.357 68.73c-1.966 0-3.632.52-4.998 1.557-1.365.983-2.047 2.732-2.047 5.244 0 2.404.682 4.152 2.047 5.244 1.366 1.038 3.032 1.557 4.998 1.557 1.912 0 3.55-.519 4.916-1.557 1.366-1.092 2.05-2.84 2.05-5.244 0-2.512-.684-4.26-2.05-5.244-1.365-1.038-3.004-1.557-4.916-1.557zm34.004 0c-1.966 0-3.632.52-4.998 1.557-1.365.983-2.049 2.732-2.049 5.244 0 2.404.684 4.152 2.05 5.244 1.365 1.038 3.03 1.557 4.997 1.557 1.912 0 3.55-.519 4.916-1.557 1.366-1.092 2.047-2.84 2.047-5.244 0-2.512-.681-4.26-2.047-5.244-1.365-1.038-3.004-1.557-4.916-1.557z"/>',
  ),

  // Mistake
  '?': composeGlyph(
    '#e69f00',
    '<path fill="#fff" d="M40.436 60.851q0-4.66 1.957-7.83 1.958-3.17 6.712-6.619 4.195-2.983 5.967-5.127 1.864-2.237 1.864-5.22 0-2.983-2.237-4.475-2.144-1.585-6.06-1.585-3.915 0-7.737 1.212t-7.83 3.263l-4.941-9.975q4.568-2.517 9.881-4.101 5.314-1.585 11.653-1.585 9.695 0 15.008 4.661 5.407 4.661 5.407 11.839 0 3.822-1.212 6.619-1.212 2.796-3.635 5.22-2.424 2.33-6.06 5.034-2.703 1.958-4.195 3.356-1.491 1.398-2.05 2.703-.467 1.305-.467 3.263v2.703H40.436zm-1.492 18.924q0-4.288 2.33-5.966 2.331-1.771 5.687-1.771 3.263 0 5.594 1.771 2.33 1.678 2.33 5.966 0 4.102-2.33 5.966-2.331 1.772-5.594 1.772-3.356 0-5.686-1.772-2.33-1.864-2.33-5.966z"/>',
  ),

  // Blunder
  '??': composeGlyph(
    '#df5353',
    '<path fill="#fff" d="M31.8 22.22c-3.675 0-7.052.46-10.132 1.38-3.08.918-5.945 2.106-8.593 3.565l4.298 8.674c2.323-1.189 4.592-2.136 6.808-2.838a22.138 22.138 0 0 1 6.728-1.053c2.27 0 4.025.46 5.268 1.378 1.297.865 1.946 2.16 1.946 3.89s-.541 3.242-1.622 4.539c-1.027 1.243-2.756 2.73-5.188 4.458-2.756 2-4.7 3.918-5.836 5.755-1.134 1.837-1.702 4.107-1.702 6.808v2.92h10.457v-2.35c0-1.135.135-2.082.406-2.839.324-.756.918-1.54 1.783-2.35.864-.81 2.079-1.784 3.646-2.918 2.107-1.568 3.863-3.026 5.268-4.376 1.405-1.405 2.46-2.92 3.162-4.541.703-1.621 1.054-3.54 1.054-5.755 0-4.161-1.568-7.592-4.702-10.294-3.08-2.702-7.43-4.052-13.05-4.052zm38.664 0c-3.675 0-7.053.46-10.133 1.38-3.08.918-5.944 2.106-8.591 3.565l4.295 8.674c2.324-1.189 4.593-2.136 6.808-2.838a22.138 22.138 0 0 1 6.728-1.053c2.27 0 4.026.46 5.269 1.378 1.297.865 1.946 2.16 1.946 3.89s-.54 3.242-1.62 4.539c-1.027 1.243-2.757 2.73-5.189 4.458-2.756 2-4.7 3.918-5.835 5.755-1.135 1.837-1.703 4.107-1.703 6.808v2.92h10.457v-2.35c0-1.135.134-2.082.404-2.839.324-.756.918-1.54 1.783-2.35.865-.81 2.081-1.784 3.648-2.918 2.108-1.568 3.864-3.026 5.269-4.376 1.405-1.405 2.46-2.92 3.162-4.541.702-1.621 1.053-3.54 1.053-5.755 0-4.161-1.567-7.592-4.702-10.294-3.08-2.702-7.43-4.052-13.05-4.052zM29.449 68.504c-1.945 0-3.593.513-4.944 1.54-1.351.973-2.027 2.703-2.027 5.188 0 2.378.676 4.108 2.027 5.188 1.35 1.027 3 1.54 4.944 1.54 1.892 0 3.512-.513 4.863-1.54 1.35-1.08 2.026-2.81 2.026-5.188 0-2.485-.675-4.215-2.026-5.188-1.351-1.027-2.971-1.54-4.863-1.54zm38.663 0c-1.945 0-3.592.513-4.943 1.54-1.35.973-2.026 2.703-2.026 5.188 0 2.378.675 4.108 2.026 5.188 1.351 1.027 2.998 1.54 4.943 1.54 1.891 0 3.513-.513 4.864-1.54 1.351-1.08 2.027-2.81 2.027-5.188 0-2.485-.676-4.215-2.027-5.188-1.35-1.027-2.973-1.54-4.864-1.54z"/>',
  ),

  // Interesting move
  '!?': composeGlyph(
    '#ea45d8',
    '<path fill="#fff" d="M60.823 58.9q0-4.098 1.72-6.883 1.721-2.786 5.9-5.818 3.687-2.622 5.243-4.506 1.64-1.966 1.64-4.588t-1.967-3.933q-1.885-1.393-5.326-1.393t-6.8 1.065q-3.36 1.065-6.883 2.868l-4.343-8.767q4.015-2.212 8.685-3.605 4.67-1.393 10.242-1.393 8.521 0 13.192 4.097 4.752 4.096 4.752 10.405 0 3.36-1.065 5.818-1.066 2.458-3.196 4.588-2.13 2.048-5.326 4.424-2.376 1.72-3.687 2.95-1.31 1.229-1.802 2.376-.41 1.147-.41 2.868v2.376h-10.57zm-1.311 16.632q0-3.77 2.048-5.244 2.049-1.557 4.998-1.557 2.868 0 4.916 1.557 2.049 1.475 2.049 5.244 0 3.605-2.049 5.244-2.048 1.556-4.916 1.556-2.95 0-4.998-1.556-2.048-1.64-2.048-5.244zM36.967 61.849h-9.75l-2.049-39.083h13.847zM25.004 75.532q0-3.77 2.049-5.244 2.048-1.557 4.998-1.557 2.867 0 4.916 1.557 2.048 1.475 2.048 5.244 0 3.605-2.048 5.244-2.049 1.556-4.916 1.556-2.95 0-4.998-1.556-2.049-1.64-2.049-5.244z" vector-effect="non-scaling-stroke"/>',
  ),

  // Good move
  '!': composeGlyph(
    '#22ac38',
    '<path fill="#fff" d="M54.967 62.349h-9.75l-2.049-39.083h13.847zM43.004 76.032q0-3.77 2.049-5.244 2.048-1.557 4.998-1.557 2.867 0 4.916 1.557 2.048 1.475 2.048 5.244 0 3.605-2.048 5.244-2.049 1.556-4.916 1.556-2.95 0-4.998-1.556-2.049-1.64-2.049-5.244z" vector-effect="non-scaling-stroke"/>',
  ),

  // Brilliant move
  '!!': composeGlyph(
    '#168226',
    '<path fill="#fff" d="M71.967 62.349h-9.75l-2.049-39.083h13.847zM60.004 76.032q0-3.77 2.049-5.244 2.048-1.557 4.998-1.557 2.867 0 4.916 1.557 2.048 1.475 2.048 5.244 0 3.605-2.048 5.244-2.049 1.556-4.916 1.556-2.95 0-4.998-1.556-2.049-1.64-2.049-5.244zM37.967 62.349h-9.75l-2.049-39.083h13.847zM26.004 76.032q0-3.77 2.049-5.244 2.048-1.557 4.998-1.557 2.867 0 4.916 1.557 2.048 1.475 2.048 5.244 0 3.605-2.048 5.244-2.049 1.556-4.916 1.556-2.95 0-4.998-1.556-2.049-1.64-2.049-5.244z" vector-effect="non-scaling-stroke"/>',
  ),

  // Correct move in a puzzle
  '✓': composeGlyph(
    '#22ac38',
    '<path fill="#fff" d="M87 32.8q0 2-1.4 3.2L51 70.6 44.6 77q-1.7 1.3-3.4 1.3-1.8 0-3.1-1.3L14.3 53.3Q13 52 13 50q0-2 1.3-3.2l6.4-6.5Q22.4 39 24 39q1.9 0 3.2 1.3l14 14L72.7 23q1.3-1.3 3.2-1.3 1.6 0 3.3 1.3l6.4 6.5q1.3 1.4 1.3 3.4z"/>',
  ),

  // Incorrect move in a puzzle
  '✗': composeGlyph(
    '#df5353',
    '<path fill="#fff" d="M79.4 68q0 1.8-1.4 3.2l-6.7 6.7q-1.4 1.4-3.5 1.4-1.9 0-3.3-1.4L50 63.4 35.5 78q-1.4 1.4-3.3 1.4-2 0-3.5-1.4L22 71.2q-1.4-1.4-1.4-3.3 0-1.7 1.4-3.5L36.5 50 22 35.4Q20.6 34 20.6 32q0-1.7 1.4-3.5l6.7-6.5q1.2-1.4 3.5-1.4 2 0 3.3 1.4L50 36.6 64.5 22q1.2-1.4 3.3-1.4 2.3 0 3.5 1.4l6.7 6.5q1.4 1.8 1.4 3.5 0 2-1.4 3.3L63.5 49.9 78 64.4q1.4 1.8 1.4 3.5z"/>',
  ),

  // Only move
  '□': composeGlyph('#a04048', '<path stroke="#fff" stroke-width="7" fill="none" d="M30,30 H70 V70 H30 z"/>'),

  // Zugzwang
  '⨀': composeGlyph(
    '#9171f2',
    '<circle stroke="#fff" stroke-width="7" fill="none" cx="50" cy="50" r="45"/><circle stroke="#fff" stroke-width="7" fill="none" cx="50" cy="50" r="4"/>',
  ),

  // Equal position
  '=': composeGlyph(
    '#82c2ef',
    '<path stroke="#fff" stroke-width="7" fill="none" d="M 27,40 h 46 M 27,60 h 46"/>',
  ),

  // Unclear position
  '∞': composeGlyph(
    '#f5918f',
    '<path stroke="#fff" stroke-width="7" fill="none" d="M 40,40 A 14.14 14.14 0 1 0 40,60 L 60,40 A 14.14 14.14 0 1 1 60,60 L 40,40"/>',
  ),

  // White is slightly better
  '⩲': composeGlyph(
    '#999',
    '<path d="M 50,51 L 50,5 M 27,28 L 73,28" stroke="#fff" stroke-width="7" fill="none"/><path stroke="#fff" stroke-width="7" fill="none" d="M 27,64 L 73,64"/><path stroke="#fff" stroke-width="7" fill="none" d="M 27,78 L 73,78"/>',
  ),

  // Black is slightly better
  '⩱': composeGlyph(
    '#555',
    '<path d="M 50,49 L 50,95 M 27,72 L 73,72" stroke="#fff" stroke-width="7" fill="none"/><path stroke="#fff" stroke-width="7" fill="none" d="M 27,36 L 73,36"/><path stroke="#fff" stroke-width="7" fill="none" d="M 27,22 L 73,22"/>',
  ),

  // White is better
  '±': composeGlyph(
    '#aaa',
    '<path d="M 50,59 L 50,13 M 27,36 L 73,36" stroke="#fff" stroke-width="7" fill="none"/><path stroke="#fff" stroke-width="7" fill="none" d="M 27,72 L 73,72"/>',
  ),

  // Black is better
  '∓': composeGlyph(
    '#444',
    '<path d="M 50,41 L 50,87 M 27,64 L 73,64" stroke="#fff" stroke-width="7" fill="none"/><path stroke="#fff" stroke-width="7" fill="none" d="M 27,28 L 73,28"/>',
  ),

  // White is winning
  '+−': whiteIsWinning,
  '+-': whiteIsWinning,

  // Black is winning
  '−+': blackIsWinning,
  '-+': blackIsWinning,

  // Novelty
  N: composeGlyph(
    '#90c290',
    '<path fill="#fff" d="M 21.70,85.70 L 21.70,14.30 L 32.10,14.30 L 70.20,73.40 L 70.60,73.40 Q 70.50,71.80 70.35,68.60 Q 70.20,65.40 70.05,61.60 Q 69.90,57.80 69.90,54.60 L 69.90,14.30 L 78.30,14.30 L 78.30,85.70 L 67.80,85.70 L 29.60,26.40 L 29.20,26.40 Q 29.50,29.90 29.75,35.10 Q 30.00,40.30 30.00,45.80 L 30.00,85.70 L 21.70,85.70"/>',
  ),

  // Development
  '↑↑': composeGlyph(
    '#c87e9d',
    '<path fill="#fff" d="M 32,29.20 Q 25.40,32.70 17.20,36.50 L 17.20,32.10 Q 26.50,24.10 30.90,15.40 L 33.10,15.40 Q 37.50,24.10 46.80,32.10 L 46.80,36.50 Q 38.60,32.70 32,29.20 L 32,84.60"/><path fill="#fff" d="M 68,29.20 Q 61.40,32.70 53.20,36.50 L 53.20,32.10 Q 62.50,24.10 66.90,15.40 L 69.10,15.40 Q 73.50,24.10 82.80,32.10 L 82.80,36.50 Q 74.60,32.70 68,29.20 L 68,84.60"/><path stroke="#fff" stroke-width="7" fill="none" d="M 32,29.2 L 32,84.6"/><path stroke="#fff" stroke-width="7" fill="none" d="M 68,29.2 L 68,84.6"/>',
  ),

  // Initiative
  '↑': composeGlyph(
    '#2660a4',
    '<path fill="#fff" d="M 50,29.20 Q 43.40,32.70 35.20,36.50 L 35.20,32.10 Q 44.50,24.10 48.90,15.40 L 51.10,15.40 Q 55.50,24.10 64.80,32.10 L 64.80,36.50 Q 56.60,32.70 50,29.20"/><path stroke="#fff" stroke-width="7" fill="none" d="M 50,29.2 L 50,84.6"/>',
  ),

  // Attack
  '→': composeGlyph(
    '#fb0e3d',
    '<path fill="#fff" d="M 70.80,50 Q 67.30,56.60 63.50,64.80 L 67.90,64.80 Q 75.90,55.50 84.60,51.10 L 84.60,48.90 Q 75.90,44.50 67.90,35.20 L 63.50,35.20 Q 67.30,43.40 70.80,50"/><path stroke="#fff" stroke-width="7" fill="none" d="M 15.4,50 L 70.8,50"/>',
  ),

  // Counterplay
  '⇆': composeGlyph(
    '#ff784f',
    '<path fill="#fff" d="M 32.10,48.40 Q 24.10,39.10 15.40,33.6 Q 24.10,28.10 32.10,18.80 L 36.50,18.80 Q 32.70,27.00 29.20,33.6 Q 32.70,40.20 36.50,48.40 L 32.10,48.40 M 70.8,66.4 Q 67.30,59.80 63.50,51.60 L 67.90,51.60 Q 75.90,60.90 84.60,65.30 L 84.60,67.50 Q 75.90,71.90 67.90,81.20 L 63.50,81.20 Q 67.30,73.00 70.80,66.4"/><path stroke="#fff" stroke-width="7" fill="none" d="M 29.2,33.6 L 80,33.6"/><path stroke="#fff" stroke-width="7" fill="none" d="M 20,66.4 L 70.8,66.4"/>',
  ),

  // Time trouble
  '⊕': composeGlyph(
    '#c2095a',
    '<circle stroke="#fff" stroke-width="7" fill="none" cx="50" cy="50" r="25"/><path stroke="#fff" stroke-width="7" fill="none" d="M 50,25 L 50,75"/><path stroke="#fff" stroke-width="7" fill="none" d="M 25,50 L 75,50"/>',
  ),

  // With compensation
  '=∞': composeGlyph(
    '#180aae',
    '<path stroke="#fff" stroke-width="7" fill="none" d="M 10,42 h 36 M 10,58 h 36"/><path stroke="#fff" stroke-width="7" fill="none" d="M 70,42.95 A 10 10 0 1 0 70,57.05 L 75,42.95 A 10 10 0 1 1 75,57.05 L 70,42.95"/>',
  ),

  // With the idea
  '∆': composeGlyph(
    '#c8c831',
    '<path fill="#fff" d="M 22.95,85.70 L 22.95,80.20 L 45.45,14.30 L 54.45,14.30 L 77.05,80.30 L 77.05,85.70 L 22.95,85.70 M 32.55,77.80 L 67.15,77.80 L 54.65,40.60 Q 51.35,30.70 49.85,24.10 Q 48.55,29.00 47.45,33.00 Q 46.35,37.00 45.25,40.20 L 32.55,77.80"/>',
  ),
};
