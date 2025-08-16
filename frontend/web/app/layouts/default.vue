<script setup></script>

<template>
  <div class="flex flex-col lg:flex-row h-screen overflow-hidden">
    <Sidebar />
    <main
      class="flex-1 overflow-y-auto mx-2 lg:ml-0 lg:mr-8 p-4 lg:p-6 lg:shadow-xl lg:shadow-black/20 lg:shadow-left bg-gray-50"
    >
      <slot />
    </main>
  </div>
</template>
