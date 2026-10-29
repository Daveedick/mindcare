import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().refine(value => value.trim().length > 0, 'Text must not be blank');
const optionSchema = z.object({
  id, label: text, recommendationGroupId: id,
  image: z.string().regex(/^\/images\/answers\/[a-zA-Z0-9-]+\.(jpg|png|webp)$/).optional(),
  imageAlt: text.optional(),
}).strict();
const contentSchema = z.object({
  categories: z.array(z.object({ id, title: text }).strict()).length(4),
  intro: z.object({ paragraphs: z.array(text).min(1), disclaimer: text }).strict(),
  questions: z.array(z.object({
    id, categoryId: id, active: z.boolean(), text,
    type: z.enum(['text', 'image']), options: z.array(optionSchema).min(2),
  }).strict()).min(1),
  recommendations: z.array(z.object({
    id, groupId: id, active: z.boolean(), text,
  }).strict()).min(1),
}).strict();

export type Content = z.infer<typeof contentSchema>;
export type Question = Content['questions'][number];
export type Option = Question['options'][number];

export function parseContent(input: unknown): Content {
  const content = contentSchema.parse(input);
  const unique = (values: string[], kind: string) => {
    if (new Set(values).size !== values.length) throw new Error(`Duplicate ${kind} ID`);
  };
  unique(content.categories.map(c => c.id), 'category');
  unique(content.questions.map(q => q.id), 'question');
  unique(content.questions.flatMap(q => q.options.map(o => o.id)), 'option');
  unique(content.recommendations.map(r => r.id), 'recommendation');
  const categories = new Set(content.categories.map(c => c.id));
  const availableGroups = new Set(content.recommendations.filter(r => r.active).map(r => r.groupId));
  const groupOwners = new Map<string, string>();
  const referencedGroups = new Set<string>();
  for (const question of content.questions) {
    if (!categories.has(question.categoryId)) throw new Error(`Unknown category in ${question.id}`);
    for (const option of question.options) {
      if (question.type === 'image' && (!option.image || !option.imageAlt)) {
        throw new Error(`Missing accessible image in ${option.id}`);
      }
      if (question.type === 'text' && (option.image || option.imageAlt)) {
        throw new Error(`Unexpected image in text option ${option.id}`);
      }
      const previousOwner = groupOwners.get(option.recommendationGroupId);
      if (previousOwner && previousOwner !== question.categoryId) throw new Error(`Cross-category group in ${option.id}`);
      groupOwners.set(option.recommendationGroupId, question.categoryId);
      referencedGroups.add(option.recommendationGroupId);
      if (question.active && !availableGroups.has(option.recommendationGroupId)) {
        throw new Error(`No active recommendation for ${option.id}`);
      }
    }
  }
  for (const category of content.categories) {
    if (!content.questions.some(q => q.active && q.categoryId === category.id)) {
      throw new Error(`No active questions in ${category.id}`);
    }
  }
  for (const recommendation of content.recommendations) {
    if (!referencedGroups.has(recommendation.groupId)) throw new Error(`Unreferenced group in ${recommendation.id}`);
  }
  return content;
}
