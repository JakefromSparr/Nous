import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
import { JSDOM } from 'jsdom';

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
    const mod = p => fs.readFileSync(path.join(__dirname, p), 'utf8')
      .replace(/export const (\w+) =/g, 'window.$1 =');
    inject(mod('../src/engine/constants.js'));
    inject(mod('../src/engine/traitLoadings.js'));
    inject(mod('../src/state.js'));
    inject(mod('../src/ui.js'));
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
