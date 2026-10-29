<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { formatResult, SMALL_STEP, type ResultItem } from '../domain/questionnaire';

const props = defineProps<{ items: ResultItem[]; copyText?: (text: string) => Promise<void> }>();
defineEmits<{ restart: [] }>();
const copied = ref(false);
const copyFailed = ref(false);
const copyArea = ref<HTMLTextAreaElement>();
const resultText = computed(() => formatResult(props.items));

async function copy() {
  copied.value = false;
  try {
    await (props.copyText ?? (text => navigator.clipboard.writeText(text)))(resultText.value);
    copied.value = true;
    copyFailed.value = false;
  } catch {
    copyFailed.value = true;
    await nextTick();
    copyArea.value?.focus();
    copyArea.value?.select();
  }
}
</script>

<template>
  <section class="panel result" aria-labelledby="result-title">
    <header class="result-header">
      <svg class="result-check" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" /><path d="m12 20 5 5 11-11" /></svg>
      <h1 id="result-title" tabindex="-1">Ваш ориентир на сегодня</h1>
      <p class="muted">Это не оценка и не диагноз — только четыре наблюдения, которые могут помочь лучше понять своё состояние сегодня.</p>
    </header>
    <div class="result-grid">
      <article v-for="item in items" :key="item.categoryId" class="result-item" :data-category="item.categoryId">
        <h2>{{ item.category }}</h2>
        <p>{{ item.text }}</p>
      </article>
    </div>
    <section class="small-step" aria-labelledby="small-step-title">
      <h2 id="small-step-title">Маленький шаг на сегодня</h2>
      <p>{{ SMALL_STEP }}</p>
    </section>
    <div class="result-actions">
      <button class="button primary" @click="copy">{{ copied ? 'Скопировано' : 'Скопировать рекомендации' }}</button>
      <button class="button secondary" @click="$emit('restart')">Начать сначала</button>
    </div>
    <p class="sr-only" role="status">{{ copied ? 'Рекомендации скопированы в буфер обмена.' : '' }}</p>
    <div v-if="copyFailed" class="copy-fallback">
      <p role="alert">Браузер не разрешил копирование. Выделите и скопируйте текст ниже.</p>
      <label for="copy-result">Ваши рекомендации</label>
      <textarea id="copy-result" ref="copyArea" :value="resultText" readonly rows="8" />
    </div>
  </section>
</template>
