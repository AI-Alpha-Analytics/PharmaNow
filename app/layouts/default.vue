<template>
  <div class="min-h-screen flex flex-col bg-gray-100 text-gray-900">
    <Header />

    <main class="flex-1 container mx-auto p-6 mt-24">
      <slot />
    </main>

    <Footer />
  </div>
</template>
