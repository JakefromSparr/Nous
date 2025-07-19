const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
const { JSDOM } = require('jsdom');

describe('tempt fate and pull thread UI', () => {
  let dom;
  beforeEach(async () => {
    jest.useFakeTimers();

    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost' });
    const wnd = dom.window;
    const inject = (code, type = 'text/javascript') => {
      const s = wnd.document.createElement('script');
      s.textContent = code;
      s.type = type;
      wnd.document.body.appendChild(s);
    };
    inject(fs.readFileSync(path.join(__dirname, '../state.js'), 'utf8'));
    inject(fs.readFileSync(path.join(__dirname, '../ui.js'), 'utf8'));
    wnd.Fate = {
      draw: () => ({ id: 'F1', title: 'FateCard', text: 'Do it', choices: [{ label: 'A', effect: {} }] }),
      getButtonLabels: () => ['A', '', ''],
      choose: () => {},
      resolveRound: () => ({})
    };
    inject(fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8'));
    wnd.document.dispatchEvent(new wnd.Event('DOMContentLoaded'));
    jest.runAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
    if (dom) { dom.window.close(); dom = null; }
  });

  test('tempt-fate shows card title', () => {
    const h = dom.window.handleAction;
    h('welcome-select');
    h('participants-confirm');
    jest.advanceTimersByTime(2000);
    h('tempt-fate');
    jest.runAllTimers();
    const title = dom.window.document.getElementById('fate-card-title').textContent;
    expect(title).toBe('FateCard');
  });

  test('pull thread shows question text', () => {
    const h = dom.window.handleAction;
    h('welcome-select');
    h('participants-confirm');
    jest.advanceTimersByTime(2000);
    h('next-round');
    h('start-question');
    jest.runAllTimers();
    const qText = dom.window.document.getElementById('question-text').textContent;
    expect(qText).toBe('T1');
  });
});
