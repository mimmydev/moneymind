<script setup lang="ts">
import { ref } from 'vue';
import ModeToggle from './ModeToggle.vue';
import { Icon } from '@iconify/vue';

const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const links = [
  { to: '/', label: 'Dashboard', icon: 'prime:objects-column' },
  { to: '/expenses', label: 'Expenses', icon: 'prime:credit-card' },
  { to: '/analytics', label: 'Analytics', icon: 'prime:chart-line' },
];
</script>

<template>
  <div class="lg:hidden">
    <div
      class="flex items-center justify-between bg-background/95 backdrop-blur-sm z-50 pl-4 pr-8 py-2 shadow-sm shadow-black/10 border-b border-border/10"
    >
      <img src="/images/Logo.webp" alt="MoneyMind Logo" class="w-20 rounded-sm dark:invert" />
      <div class="flex gap-4">
        <ModeToggle />
        <button @click="toggleMobileMenu">
          <Icon icon="prime:bars" :ssr="true" />
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
        @click="isMobileMenuOpen = false"
      ></div>
    </Transition>

    <Transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 -translate-y-6 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-6 scale-95"
    >
      <nav
        v-if="isMobileMenuOpen"
        class="absolute top-[72px] left-4 right-4 backdrop-blur-sm border border-border rounded-lg shadow-lg z-50 lg:hidden"
      >
        <div class="p-3 space-y-1 bg-background rounded-lg">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            @click="isMobileMenuOpen = false"
            class="flex items-center px-4 py-2 text-primary hover:text-primary hover:bg-accent/60 rounded-xl transition-all duration-300"
            active-class="text-white font-semibold bg-primary [&>i]:text-white [&>span]:text-white hover:text-white"
          >
            <div
              class="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20 group-hover:bg-accent/40 mr-3"
            >
              <Icon :icon="link.icon" :ssr="true" />
            </div>
            <span class="font-medium">{{ link.label }}</span>
          </NuxtLink>
        </div>
      </nav>
    </Transition>
  </div>

  <aside class="hidden lg:flex h-screen bg-background pr-8 flex-col lg:w-[240px] pt-6">
    <div class="flex justify-center px-4 mb-4">
      <img
        src="/images/Logo.webp"
        alt="MoneyMind Logo"
        class="max-w-full w-[160px] object-contain dark:invert"
      />
    </div>

    <nav class="flex-1 p-4">
      <div class="space-y-2">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="flex items-center px-3 py-2 text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
          active-class="text-white font-semibold bg-[#12CE90] [&>i]:text-white hover:text-white"
        >
          <Icon :icon="link.icon" :ssr="true" class="w-6 h-6 mr-2" />
          {{ link.label }}
        </NuxtLink>
      </div>
    </nav>

    <div class="p-3 border-t border-border">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground">Theme</span>
        <ModeToggle />
      </div>
    </div>
  </aside>
</template>
