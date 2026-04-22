<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import Message from 'primevue/message';

const activeTab = ref('all');
</script>

<template>
    <div class="p-6 text-left">
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-slate-800">Транзакції</h1>
            <p class="text-slate-500">Журнал складських операцій: прихід, видаток, переміщення</p>
        </div>

        <div class="card bg-white p-8 rounded-lg shadow border border-slate-200 min-h-[400px] flex flex-col items-center justify-center">
            <i class="pi pi-arrow-h text-5xl text-slate-300 mb-4"></i>
            <h2 class="text-xl font-semibold text-slate-600 mb-2">Модуль транзакцій</h2>
            <p class="text-slate-400 mb-6 text-center max-w-sm">Тут будуть відображатися всі складські операції. Зараз ми налаштовуємо базу даних для обліку руху товарів.</p>
            <Message severity="info" variant="simple">Готуємо таблиці для 'Incoming', 'Outgoing' та 'Transfer'</Message>
        </div>
    </div>
</template>