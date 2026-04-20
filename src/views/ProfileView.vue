<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import Card from 'primevue/card';
import Tag from 'primevue/tag';

const authStore = useAuthStore();

const roleName = computed(() => authStore.role || 'Гість');
const userName = computed(() => authStore.user || 'Неавторизований користувач');

const getRoleSeverity = (role: string) => {
    switch (role) {
        case 'Admin': return 'danger';
        case 'Manager': return 'warn';
        case 'User': return 'info';
        default: return 'secondary';
    }
};
</script>

<template>
    <div class="p-6 flex justify-center">
        <Card class="w-full max-w-md shadow-lg border border-slate-200">
            <template #header>
                <div class="flex justify-center p-8 bg-slate-50 border-b">
                    <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner border border-slate-200">
                        <i class="pi pi-user text-4xl text-slate-400"></i>
                    </div>
                </div>
            </template>
            <template #title>
                <div class="text-center text-xl font-bold text-slate-800">Профіль користувача</div>
            </template>
            <template #subtitle>
                <div class="flex justify-center mt-2">
                    <Tag :value="roleName" :severity="getRoleSeverity(roleName)" class="px-4" />
                </div>
            </template>
            <template #content>
                <div class="flex flex-col gap-4 mt-4">
                    <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span class="text-slate-500 font-medium text-sm">Логін:</span>
                        <span class="text-slate-800 font-bold">{{ userName }}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span class="text-slate-500 font-medium text-sm">Статус доступу:</span>
                        <span class="text-emerald-600 font-bold flex items-center gap-2">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Активний
                        </span>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
:deep(.p-card) {
    background: white !important;
}
</style>