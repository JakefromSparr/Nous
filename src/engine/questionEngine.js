import { CLASS_SCORES, TRAIT_MAP } from './constants.js';
import raw from '../data/questions.json' assert { type: 'json' };

const pools = {
  Tier1: raw.questions.filter(q => q.difficultyTier === 'Tier1'),
  Tier2: raw.questions.filter(q => q.difficultyTier === 'Tier2'),
  Tier3: raw.questions.filter(q => q.difficultyTier === 'Tier3')
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class QuestionEngine {
  constructor() {
    this.tier = 'Tier1';
    this.answered = new Set();
    this.drawnThisTier = 0;
  }

  nextQuestion() {
    const tierOrder = this.tier === 'Tier3'
      ? ['Tier3', 'Tier2', 'Tier1']
      : this.tier === 'Tier2'
      ? ['Tier2', 'Tier1']
      : ['Tier1'];

    for (const t of tierOrder) {
      const pool = pools[t].filter(q => !this.answered.has(q.questionId));
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
    const q = raw.questions.find(q => q.questionId === qId);
    const ans = q.answers[answerIndex];
    const { points, thread } = CLASS_SCORES[ans.answerClass];

    state.points  += points;
    state.thread  += thread;

    const traitDelta = ans.traits || TRAIT_MAP[ans.answerClass];
    Object.keys(traitDelta).forEach(k => {
      state.traits[k] = (state.traits[k] || 0) + traitDelta[k];
    });

    this.answered.add(qId);
    this.drawnThisTier++;

    if ((this.drawnThisTier >= 4 ||
        !pools[this.tier].some(q => !this.answered.has(q.questionId)))
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
