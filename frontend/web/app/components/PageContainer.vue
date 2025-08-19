<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3 sm:gap-4">
      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div class="flex flex-col">
          <h1 class="text-5xl font-extrabold text-gray-900 dark:text-white mb-1">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-sm ml-6 text-gray-600 dark:text-gray-300">
            {{ subtitle }}
          </p>
        </div>

        <div v-if="$slots.headerActions" class="flex-shrink-0">
          <slot name="headerActions" />
        </div>
      </div>

      <div v-if="$slots.headerContent">
        <slot name="headerContent" />
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
}

defineProps<Props>();
defineSlots<{
  default(): any;
  headerActions(): any;
  headerContent(): any;
}>();
</script>
