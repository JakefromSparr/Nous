import fateDeck from '../src/data/fateDeck.js';

 test('all Fate IDs start with DYN', () => {
   expect(fateDeck.every(c => c.id.startsWith('DYN'))).toBe(true);
 });
