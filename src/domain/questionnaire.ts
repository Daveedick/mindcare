import type { Content, Question } from './content';

export type ChoiceMap = Record<string, string>;
export type ResultItem = { categoryId: string; category: string; recommendationId: string; text: string };
export type RandomSource = () => number;

function pick<T>(items: readonly T[], random: RandomSource): T {
  if (items.length === 0) throw new Error('Cannot choose from empty content');
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Random source must return [0, 1)');
  return items[Math.floor(value * items.length)]!;
}

export function startSession(content: Content, random: RandomSource = Math.random): Question[] {
  return content.categories.map(category =>
    pick(content.questions.filter(q => q.active && q.categoryId === category.id), random),
  );
}

export function buildResult(content: Content, questions: readonly Question[], choices: ChoiceMap, random: RandomSource = Math.random): ResultItem[] {
  if (questions.length !== content.categories.length || new Set(questions.map(q => q.categoryId)).size !== content.categories.length) {
    throw new Error('Session must contain one question per category');
  }
  return content.categories.map(category => {
    const question = questions.find(q => q.categoryId === category.id);
    if (!question || !content.questions.some(q => q.id === question.id && q.active)) throw new Error('Unknown session question');
    const option = question.options.find(o => o.id === choices[question.id]);
    if (!option) throw new Error(`Missing or invalid choice for ${question.id}`);
    const recommendation = pick(content.recommendations.filter(r => r.active && r.groupId === option.recommendationGroupId), random);
    return { categoryId: category.id, category: category.title, recommendationId: recommendation.id, text: recommendation.text };
  });
}

export const SMALL_STEP = 'Выберите одно наблюдение, которое отозвалось сильнее остальных, и дайте себе десять спокойных минут на него.';

export function formatResult(items: readonly ResultItem[]): string {
  return ['Мой ориентир MindCare', '', ...items.flatMap(item => [item.category + ':', item.text, '']), 'Маленький шаг на сегодня:', SMALL_STEP].join('\n');
}
