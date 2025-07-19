import { CLASS_SCORES, CLASS_TRAIT_BASE } from './constants.js';
import { TRAIT_LOADINGS } from './traitLoadings.js';

let defaultDeck = [];

export function setDefaultDeck(deck) {
  defaultDeck = Array.isArray(deck) ? deck : [];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class QuestionEngine {
  constructor(questionDeck = defaultDeck) {
    this.tier = 'Tier1';
    this.answered = new Set();
    this.drawnThisTier = 0;
    this.deck = Array.isArray(questionDeck) ? questionDeck : [];
    this.pools = {
      Tier1: this.deck.filter(q => q.difficultyTier === 'Tier1'),
      Tier2: this.deck.filter(q => q.difficultyTier === 'Tier2'),
      Tier3: this.deck.filter(q => q.difficultyTier === 'Tier3')
    };
  }

  nextQuestion() {
    const tierOrder = this.tier === 'Tier3'
      ? ['Tier3', 'Tier2', 'Tier1']
      : this.tier === 'Tier2'
      ? ['Tier2', 'Tier1']
      : ['Tier1'];

    for (const t of tierOrder) {
      const pool = this.pools[t].filter(q => !this.answered.has(q.questionId));
      if (pool.length) {
        const q = shuffle(pool)[0];
        this.randomizeAnswers(q);
        return q;
      }
    }
    return null; // everything answered
  }

  randomizeAnswers(q) { q.answers = shuffle([...q.answers]); }

  resolve(qId, answerIndex, state) {
    const q = this.deck.find(q => q.questionId === qId);
    const ans = q.answers[answerIndex];
    const { points, thread } = CLASS_SCORES[ans.answerClass];

    state.points  += points;
    state.thread  += thread;

    const base     = CLASS_TRAIT_BASE[ans.answerClass];
    const cfg      = TRAIT_LOADINGS[qId] || {};
    const weights  = cfg.axisWeight || {};
    const override = cfg.overrides?.[ans.answerClass] || {};

    ['X','Y','Z'].forEach(axis => {
      const delta = axis in override
        ? override[axis]
        : base[axis] * (weights[axis] ?? 1);

      state.traits[axis] = Math.max(-9, Math.min(9,
        (state.traits[axis] || 0) + delta));
    });

    this.answered.add(qId);
    this.drawnThisTier++;

    if ((this.drawnThisTier >= 4 ||
        !this.pools[this.tier].some(q => !this.answered.has(q.questionId)))
        && this.tier !== 'Tier3') {
      this.drawnThisTier = 0;
      this.tier = this.tier === 'Tier1' ? 'Tier2' : 'Tier3';
    }
    return ans; // for UI feedback
  }
}

if (typeof window !== 'undefined') {
  window.QuestionEngine = QuestionEngine;
}
