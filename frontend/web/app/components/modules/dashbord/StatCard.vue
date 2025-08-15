<template>
  <Card class="bg-card text-card-foreground h-full w-full">
    <div class="flex flex-col gap-4 items-center p-6 h-full">
      <p class="text-xs font-mono text-text-light flex items-center gap-1">
        {{ title }} <Icon :icon="icon" class="text-sm" />
      </p>
      <p class="text-3xl sm:text-4xl font-mono text-center">{{ value }}</p>
      <p class="text-xs font-mono flex items-center gap-1">
        <span class="text-text-secondary">Trend:</span>
        <span :class="trendClass" class="flex items-center gap-1">
          <Icon :icon="trendIcon" class="text-sm" /> 
          {{ trendText }}
        </span>
      </p>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';

defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  trendText: {
    type: String,
    required: true
  },
  trendIcon: {
    type: String,
    default: 'dashicons:arrow-up'
  },
  trendClass: {
    type: String,
    default: 'text-success'
  }
});
</script>