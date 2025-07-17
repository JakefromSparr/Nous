const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
const { JSDOM } = require('jsdom');

describe('basic playthrough', () => {
  let dom;
  beforeEach(async () => {
    jest.useFakeTimers();

    global.fetch = jest.fn((url) => {
      if (url.includes('questions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { questionId: 1, category: 'Mind', title: 'Q1', text: 'T1', answers: [
            { text: 'A', answerClass: 'Typical', explanation: '' },
            { text: 'B', answerClass: 'Wrong', explanation: '' },
            { text: 'C', answerClass: 'Wrong', explanation: '' }
          ] }
        ]) });
      }
      if (url.includes('fate-cards')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([
          { id: 'F1', title: 'Fate', text: 'Choose', choices: [
            { label: 'A', effect: {} },
            { label: 'B', effect: {} },
            { label: 'C', effect: {} }
          ] }
        ]) });
      }
      if (url.includes('divinations')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(['One']) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
    const wnd = dom.window;
    const inject = (code) => {
      const s = wnd.document.createElement('script');
      s.textContent = code;
      wnd.document.body.appendChild(s);
    };
    inject(fs.readFileSync(path.join(__dirname, '../state.js'), 'utf8'));
    inject(fs.readFileSync(path.join(__dirname, '../ui.js'), 'utf8'));
    inject(fs.readFileSync(path.join(__dirname, '../src/fate/fateEngine.js'), 'utf8'));
    inject(fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8'));
    wnd.document.dispatchEvent(new wnd.Event('DOMContentLoaded'));
    jest.runAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
    if (dom) {
      dom.window.close();
      dom = null;
    }
  });

  test('full flow does not crash', () => {
    const h = dom.window.handleAction;
    const run = (action, time = 0) => {
      h(action);
      jest.advanceTimersByTime(time);
    };

    run('welcome-select');
    run('participants-confirm', 2000);

    run('next-round');
    run('start-question');
    run('answer-a');
    run('accept-result');
    run('end-round');
    run('next-round');
    run('start-question');
    run('answer-b');
    run('accept-result');
    run('end-round');
    jest.runAllTimers();

    expect(dom.window.document.getElementById('app-container').dataset.gameState).toBe('game-lobby');
  });
});
