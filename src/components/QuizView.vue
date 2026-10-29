<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { Content, Question } from '../domain/content';
import type { ChoiceMap } from '../domain/questionnaire';

const props = defineProps<{ questions: Question[]; categories: Content['categories'] }>();
const emit = defineEmits<{ complete: [choices: ChoiceMap] }>();
const index = ref(0);
const choices = ref<ChoiceMap>({});
const heading = ref<HTMLHeadingElement>();
const question = computed(() => props.questions[index.value]!);
const category = computed(() => props.categories.find(c => c.id === question.value.categoryId)!);
const selected = computed(() => choices.value[question.value.id]);
const isLast = computed(() => index.value === props.questions.length - 1);
const answered = computed(() => Object.keys(choices.value).length);

async function focusQuestion() {
  await nextTick();
  heading.value?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function next() {
  if (!selected.value) return;
  if (isLast.value) emit('complete', { ...choices.value });
  else { index.value++; void focusQuestion(); }
}
function back() {
  if (index.value > 0) { index.value--; void focusQuestion(); }
}
</script>

<template>
  <section class="panel quiz" :data-category="category.id" aria-labelledby="question-title">
    <div class="quiz-meta">
      <span>Вопрос {{ index + 1 }} из {{ questions.length }}</span>
      <span>{{ category.title }}</span>
    </div>
    <progress :value="answered" :max="questions.length" :aria-label="`Вы ответили на ${answered} из ${questions.length} вопросов`" />
    <form @submit.prevent="next">
      <h1 id="question-title" ref="heading" tabindex="-1">{{ question.text }}</h1>
      <p class="muted quiz-hint">Выберите ответ, который сейчас кажется вам наиболее точным.</p>
      <fieldset :key="question.id" class="options" :class="{ 'options-images': question.type === 'image' }">
        <legend class="sr-only">{{ question.text }}</legend>
        <label v-for="option in question.options" :key="option.id" class="option" :class="{ selected: selected === option.id }">
          <input v-model="choices[question.id]" type="radio" :name="question.id" :value="option.id" />
          <template v-if="option.image">
            <img :src="option.image" :alt="option.imageAlt" width="800" height="550" />
            <span class="image-label">{{ option.label }}</span>
          </template>
          <span v-else>{{ option.label }}</span>
        </label>
      </fieldset>
      <div class="quiz-actions">
        <button v-if="index > 0" type="button" class="button secondary" @click="back">Назад</button>
        <button class="button primary" type="submit" :disabled="!selected">
          {{ isLast ? 'Посмотреть результат' : 'Продолжить' }}
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </button>
      </div>
    </form>
  </section>
</template>
