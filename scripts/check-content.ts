import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadContent } from '../src/content';

const content = loadContent();
for (const question of content.questions) {
  for (const option of question.options) {
    if (option.image && !existsSync(resolve('public', '.' + option.image))) {
      throw new Error(`Missing image: ${option.image}`);
    }
  }
}
console.log(`Content valid: ${content.categories.length} categories, ${content.questions.length} questions, ${content.recommendations.length} recommendations.`);
