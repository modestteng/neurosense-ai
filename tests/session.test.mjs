import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSessionTurns } from '../lib/session.ts';

test('scene history keeps earlier turns in chronological order', () => {
  const learning = { id: 'learning-1', scene: '学习' };
  const driving = { id: 'driving-1', scene: '驾驶' };
  assert.deepEqual(mergeSessionTurns([learning], [driving]), [learning, driving]);
});

test('archiving a turn twice does not duplicate it and latest feedback wins', () => {
  const original = { id: 'one', feedback: undefined };
  const updated = { id: 'one', feedback: 'yes' };
  assert.deepEqual(mergeSessionTurns([original], [updated]), [updated]);
});

test('session history is bounded and a cleared session has no retained entries', () => {
  const history = Array.from({ length: 45 }, (_, i) => ({ id: String(i) }));
  const result = mergeSessionTurns(history, [{ id: '45' }]);
  assert.equal(result.length, 40);
  assert.equal(result[0].id, '6');
  assert.equal(result.at(-1).id, '45');
  assert.deepEqual(mergeSessionTurns([], []), []);
});
