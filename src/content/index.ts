import categories from './categories.json';
import intro from './intro.json';
import questions from './questions.json';
import recommendations from './recommendations.json';
import { parseContent } from '../domain/content';

export const loadContent = () => parseContent({ categories, intro, questions, recommendations });
