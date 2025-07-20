import '../src/state.js';

test('corrupted save data is rejected', async () => {
  localStorage.setItem('nous-save', '{"bad":true}');
  const before = window.State.getState();
  const result = await window.State.loadGame();
  expect(result).toBe(false);
  expect(window.State.getState()).toEqual(before);
});
