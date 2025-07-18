const fs = require('fs');
const path = require('path');


let Fate;
const cards = require('../fate-cards.json');

beforeAll(() => {
  let code = fs.readFileSync(path.join(__dirname, '../src/fate/fateEngine.js'), 'utf8');
  code = code.replace("import { z } from 'zod';", "const { z } = require('zod');")
             .replace("import { FateCard } from './schema.js';", "const { FateCard } = require('../src/fate/schema.js');")
             .replace(/import deckData from '\.\.\/\.\.\/fate-cards.json' assert { type: 'json' };/, "const deckData = require('../fate-cards.json');")
             .replace(/export function /g, 'function ');
  code += '\nmodule.exports = { draw, getButtonLabels, choose, resolveRound };';
  const mod = { exports: {} };
  const func = new Function('require','module','exports', code);
  func(require, mod, mod.exports);
  Fate = mod.exports;
});

test('DYN001 wager adds score per C answer', () => {
  let card;
  do { card = Fate.draw(); } while (card.id !== 'DYN001');
  // choose Wait option (index 1)
  Fate.choose(1);
  const res = Fate.resolveRound({ A: 0, B: 0, C: 2 }, true);
  expect(res.roundScoreDelta).toBe(2);
});

test('DYN004 tally table doubles round score when no Cs', () => {
  let card;
  do { card = Fate.draw(); } while (card.id !== 'DYN004');
  Fate.choose(0);
  const res = Fate.resolveRound({ A: 2, B: 1, C: 0 }, true);
  expect(res.roundScoreMultiplier).toBe(2);
});
