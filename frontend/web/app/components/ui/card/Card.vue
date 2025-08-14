<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    padding?: string
    hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    padding: 'p-3',
    hoverable: false
})

const cardClass = computed(() => [
  'rounded-lg bg-card/95 text-card-foreground shadow-lg inline-block w-fit',
  'backdrop-blur-sm',
  props.padding,
  props.hoverable
    ? 'hover:shadow-xl hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5'
    : '',
]);
</script>

<template>
    <div :class="cardClass">
        <slot />
    </div>
</template>