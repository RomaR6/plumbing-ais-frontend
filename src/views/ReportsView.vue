<script setup lang="ts">
import { ref } from 'vue';
import Message from 'primevue/message';
</script>

<template>
    <div class="p-6 text-left">
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-slate-800">Аналітика та звіти</h1>
            <p class="text-slate-500">Статистика складу, залишки та фінансові показники</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span class="text-emerald-600 text-sm font-bold uppercase">Загальна вартість</span>
                <div class="text-2xl font-black text-emerald-900 mt-1">--- грн</div>
            </div>
            <div class="p-6 bg-amber-50 border border-amber-100 rounded-xl">
                <span class="text-amber-600 text-sm font-bold uppercase">Критичні залишки</span>
                <div class="text-2xl font-black text-amber-900 mt-1">-- од.</div>
            </div>
            <div class="p-6 bg-blue-50 border border-blue-100 rounded-xl">
                <span class="text-blue-600 text-sm font-bold uppercase">Операцій за місяць</span>
                <div class="text-2xl font-black text-blue-900 mt-1">--</div>
            </div>
        </div>

        <div class="card bg-white p-12 rounded-lg shadow border border-slate-200 text-center">
            <i class="pi pi-chart-bar text-5xl text-slate-300 mb-4"></i>
            <h2 class="text-xl font-semibold text-slate-600 mb-2">Генерація звітів</h2>
            <p class="text-slate-400 mb-4">Візуалізація даних буде доступна після налаштування логіки складських запасів.</p>
            <div class="flex justify-center">
                 <Message severity="warn" variant="simple">Очікуємо підключення Chart.js</Message>
            </div>
        </div>
    </div>
</template>