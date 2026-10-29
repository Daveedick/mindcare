<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue';
import QuizView from './components/QuizView.vue';
import ResultView from './components/ResultView.vue';
import UpdateNotice from './components/UpdateNotice.vue';
import type { Content, Question } from './domain/content';
import { buildResult, startSession, type ChoiceMap, type ResultItem } from './domain/questionnaire';

type Screen = 'loading' | 'error' | 'start' | 'quiz' | 'result';
const screen = ref<Screen>('loading');
const content = shallowRef<Content>();
const questions = shallowRef<Question[]>([]);
const result = shallowRef<ResultItem[]>([]);
const main = ref<HTMLElement>();
const introSummary = computed(() => content.value?.intro.paragraphs[2] ?? content.value?.intro.paragraphs[0]);
const introDetails = computed(() => content.value?.intro.paragraphs.filter(p => p !== introSummary.value) ?? []);

async function focusScreen() {
  await nextTick();
  main.value?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}
async function load() {
  screen.value = 'loading';
  try {
    const { loadContent } = await import('./content');
    content.value = loadContent();
    screen.value = 'start';
  } catch {
    screen.value = 'error';
  }
}
function start() {
  if (!content.value) return;
  try {
    questions.value = startSession(content.value);
    result.value = [];
    screen.value = 'quiz';
  } catch { screen.value = 'error'; }
  void focusScreen();
}
function complete(choices: ChoiceMap) {
  if (!content.value) return;
  try {
    result.value = buildResult(content.value, questions.value, choices);
    screen.value = 'result';
  } catch { screen.value = 'error'; }
  void focusScreen();
}
function restart() {
  questions.value = [];
  result.value = [];
  screen.value = 'start';
  void focusScreen();
}
onMounted(load);
</script>

<template>
  <a class="skip-link" href="#main">К содержимому</a>
  <header class="site-header">
    <div class="brand">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 25C7 14 13 6 26 3c2 12-5 21-18 23M9 24 23 7" /></svg>
      <span>MindCare</span>
    </div>
    <span class="header-caption">Личный план</span>
  </header>
  <main id="main" ref="main">
    <section v-if="screen === 'loading'" class="panel status" role="status" aria-live="polite">
      <p>Открываем MindCare…</p>
    </section>
    <section v-else-if="screen === 'error'" class="panel status" role="alert">
      <h1 tabindex="-1">Не удалось открыть опрос</h1>
      <p>Обновите страницу и попробуйте ещё раз. При первом открытии нужно подключение к интернету.</p>
      <button class="button primary" @click="load">Повторить</button>
      <a class="text-link" href="/">Обновить страницу</a>
    </section>
    <section v-else-if="screen === 'start' && content" class="panel start" aria-labelledby="start-title">
      <svg class="start-leaf" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 46c-1-17 9-31 29-35 3 19-8 34-28 36M21 43c8-6 15-14 21-25" /></svg>
      <h1 id="start-title" tabindex="-1">Как вы себя чувствуете<br class="desktop-break" /> прямо сейчас?</h1>
      <p class="start-description">{{ introSummary }}</p>
      <div class="start-meta"><span>{{ content.categories.length }} вопроса</span><span>Около 2 минут</span><span>Без регистрации</span></div>
      <button class="button primary start-button" @click="start">
        Начать проверку
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </button>
      <p class="disclaimer">{{ content.intro.disclaimer }}</p>
      <details class="about">
        <summary>Подробнее о самопроверке</summary>
        <div><p v-for="paragraph in introDetails" :key="paragraph">{{ paragraph }}</p></div>
      </details>
    </section>
    <QuizView v-else-if="screen === 'quiz' && content" :questions="questions" :categories="content.categories" @complete="complete" />
    <ResultView v-else-if="screen === 'result'" :items="result" @restart="restart" />
    <footer class="site-footer">
      <p>Ответы остаются только в этой сессии и никуда не отправляются.</p>
      <p>При закрытии или обновлении страницы результат сбросится.</p>
    </footer>
  </main>
  <UpdateNotice :safe-to-update="screen !== 'quiz'" />
</template>
