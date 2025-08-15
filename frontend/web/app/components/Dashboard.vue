<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 h-[163px]"
  >
    <div class="flex items-center justify-center gap-2 mb-8">
      <div class="pi text-gray-700 dark:text-gray-300" :class="iconClass"></div>
      <p class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ title }}</p>
    </div>
    <p class="text-2xl font-extrabold text-gray-900 dark:text-white flex justify-center">
      {{ value }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  value: string | number;
  iconClass: string;
}

defineProps<Props>();
</script>
