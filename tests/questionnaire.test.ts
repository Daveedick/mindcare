import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../src/content';
import { parseContent } from '../src/domain/content';
import { buildResult, formatResult, startSession } from '../src/domain/questionnaire';

const content = loadContent();
const first = () => 0;

test('complete imported content and category coverage', () => {
  assert.equal(content.questions.length, 95);
  assert.equal(content.recommendations.length, 81);
  const questions = startSession(content, first);
  assert.deepEqual(questions.map(q => q.categoryId), content.categories.map(c => c.id));
});

test('every imported option has a reachable result with its explicit group', () => {
  for (const question of content.questions) {
    for (const option of question.options) {
      const session = startSession(content, first).map(q => q.categoryId === question.categoryId ? question : q);
      const choices = Object.fromEntries(session.map(q => [q.id, q.id === question.id ? option.id : q.options[0]!.id]));
      const item = buildResult(content, session, choices, first).find(r => r.categoryId === question.categoryId)!;
      assert.equal(content.recommendations.find(r => r.id === item.recommendationId)!.groupId, option.recommendationGroupId);
      assert.ok(item.text.trim());
    }
  }
});

test('reordering arrays cannot change option meaning', () => {
  const questions = startSession(content, first);
  const choices = Object.fromEntries(questions.map(q => [q.id, q.options[2]!.id]));
  const reordered = { ...content, questions: [...content.questions].reverse() };
  const result = buildResult(reordered, questions.map(q => ({ ...q, options: [...q.options].reverse() })).reverse(), choices, first);
  assert.deepEqual(result, buildResult(content, questions, choices, first));
});

test('incomplete or cross-question choice cannot produce a result', () => {
  const session = startSession(content, first);
  assert.throws(() => buildResult(content, session, {}, first), /choice/);
  const choices = Object.fromEntries(session.map(q => [q.id, q.options[0]!.id]));
  choices[session[0]!.id] = session[1]!.options[0]!.id;
  assert.throws(() => buildResult(content, session, choices, first), /choice/);
});

test('empty category, missing group, duplicate ID and blank text fail validation', () => {
  const empty = structuredClone(content);
  empty.questions.filter(q => q.categoryId === 'emotion').forEach(q => q.active = false);
  assert.throws(() => parseContent(empty), /No active questions/);
  const missing = structuredClone(content);
  missing.recommendations.filter(r => r.groupId === 'emotion-1').forEach(r => r.active = false);
  assert.throws(() => parseContent(missing), /No active recommendation/);
  const duplicate = structuredClone(content);
  duplicate.questions.push(duplicate.questions[0]!);
  assert.throws(() => parseContent(duplicate), /Duplicate question/);
  const blank = structuredClone(content);
  blank.questions[0]!.text = ' ';
  assert.throws(() => parseContent(blank), /blank/);
});

test('image questions retain four images and accessible descriptions', () => {
  const question = content.questions.find(q => q.type === 'image')!;
  assert.equal(question.options.length, 4);
  for (const option of question.options) { assert.ok(option.image); assert.ok(option.imageAlt); }
  const invalid = structuredClone(content);
  delete invalid.questions.find(q => q.type === 'image')!.options[0]!.imageAlt;
  assert.throws(() => parseContent(invalid), /accessible image/);
});

test('copy includes all four category labels, recommendations and small step', () => {
  const session = startSession(content, first);
  const result = buildResult(content, session, Object.fromEntries(session.map(q => [q.id, q.options[0]!.id])), first);
  const text = formatResult(result);
  for (const item of result) { assert.ok(text.includes(item.category)); assert.ok(text.includes(item.text)); }
  assert.ok(text.includes('Маленький шаг на сегодня:'));
  assert.ok(!text.includes('undefined'));
});

test('random bounds select first and last candidates; invalid randomness fails clearly', () => {
  const last = startSession(content, () => 0.999999);
  last.forEach(q => assert.equal(q.id, content.questions.filter(item => item.categoryId === q.categoryId && item.active).at(-1)!.id));
  assert.throws(() => startSession(content, () => 1), /Random/);
});
