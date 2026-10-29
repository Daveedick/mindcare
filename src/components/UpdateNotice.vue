<script setup lang="ts">
import { ref } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

defineProps<{ safeToUpdate: boolean }>();
const deferred = ref(false);
const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
</script>

<template>
  <aside v-if="needRefresh && safeToUpdate && !deferred" class="update-notice" aria-label="Обновление MindCare">
    <p>Готова новая версия. При обновлении текущий результат сбросится — сначала скопируйте его, если хотите сохранить.</p>
    <div>
      <button class="button primary" @click="updateServiceWorker(true)">Обновить</button>
      <button class="button secondary" @click="deferred = true">Позже</button>
    </div>
  </aside>
</template>
