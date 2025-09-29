<template>
  <header class="bg-indigo-700 text-white shadow-md">
    <div class="container mx-auto flex justify-between items-center py-4 px-6">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-2xl font-extrabold tracking-wide hover:text-indigo-200 transition"
      >
        <img
          src="/PharmaNow.png"
          alt="PharmaNow logo"
          class="h-12 w-12 object-contain rounded-full border-2 border-white shadow-md"
        />

        <span>PharmaNow</span>
      </NuxtLink>

      <nav class="flex gap-6">
        <NuxtLink
          to="/inventario"
          class="px-3 py-2 font-medium rounded-md transition hover:text-gray-200"
          active-class="bg-indigo-800 shadow-lg scale-105"
        >
          Inventario
        </NuxtLink>

        <NuxtLink
          to="/configuration"
          class="px-3 py-2 font-medium rounded-md transition hover:text-gray-200"
          active-class="bg-indigo-800 shadow-lg scale-105"
        >
          Configuración
        </NuxtLink>
        <NuxtLink
          to="/bodega"
          class="px-3 py-2 font-medium rounded-md transition hover:text-gray-200"
          active-class="bg-indigo-800 shadow-lg scale-105"
        >
          Bodegas
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
