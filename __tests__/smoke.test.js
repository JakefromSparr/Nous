import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
import { JSDOM } from 'jsdom';

describe('basic playthrough', () => {
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
    inject(fs.readFileSync(path.join(__dirname, '../src/fate/fateEngine.js'), 'utf8'), 'module');
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
