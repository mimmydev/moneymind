<script setup></script>

<template>
  <div class="flex flex-col lg:flex-row h-screen overflow-hidden">
    <Sidebar />
    <main
      class="flex-1 overflow-y-auto mx-2 lg:ml-0 lg:mr-8 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 lg:shadow-xl lg:shadow-black/20 lg:shadow-left bg-gray-50 dark:bg-gray-900"
    >
      <slot />
    </main>
  </div>
</template>
