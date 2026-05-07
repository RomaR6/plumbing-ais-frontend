<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const roleName = computed(() => authStore.role || 'Гість');

const formatDate = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const getRoleSeverity = (role: string) => {
    switch (role) {
        case 'Admin': return 'danger';
        case 'Manager': return 'warn';
        case 'User': return 'info';
        default: return 'secondary';
    }
};

onMounted(() => {
    if (!authStore.user) {
        authStore.fetchProfile();
    }
});
</script>

<template>
    <div class="profile-container">
        <Card class="profile-card">
            <template #content>
                <div class="profile-header">
                    <div class="avatar-circle">
                        {{ user?.firstName?.[0] }}{{ user?.lastName?.[0] }}
                    </div>
                    <div class="header-text">
                        <h2 class="full-name">{{ user?.firstName }} {{ user?.lastName }}</h2>
                        <div class="handle-row">
                            <span class="username-tag">@{{ user?.username }}</span>
                            <Tag :value="roleName" :severity="getRoleSeverity(roleName)" />
                        </div>
                    </div>
                </div>

                <Divider class="custom-divider" />

                <div class="info-sections">
                    <div class="status-box">
                        <div class="info-item">
                            <span class="label">Статус акаунта</span>
                            <span class="value active-status">
                                <span class="pulse-dot"></span>
                                Активний
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="label">Дата реєстрації</span>
                            <span class="value">{{ formatDate(user?.createdAt) }}</span>
                        </div>
                    </div>

                    <div class="details-grid">
                        <div class="detail-card">
                            <i class="pi pi-id-card"></i>
                            <div class="detail-content">
                                <span class="detail-label">ID Користувача</span>
                                <span class="detail-value">#{{ user?.id }}</span>
                            </div>
                        </div>
                        <div class="detail-card">
                            <i class="pi pi-bolt"></i>
                            <div class="detail-content">
                                <span class="detail-label">Остання активність</span>
                                <span class="detail-value">Сьогодні</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="profile-footer">
                    <Divider />
                    <p class="version-text">AIS Plumbing Cloud v1.0</p>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.profile-container {
    padding: 2rem;
    width: 100%;
}

.profile-card {
    width: 100%;
    border-radius: 1.25rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.05);
    text-align: left;
}

.profile-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.avatar-circle {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    font-weight: 800;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.header-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.full-name {
    font-size: 1.75rem;
    font-weight: 900;
    color: #1e293b;
    margin: 0;
    letter-spacing: -0.025em;
}

.handle-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.username-tag {
    color: #64748b;
    font-weight: 600;
    font-size: 1rem;
}

.custom-divider {
    margin: 2rem 0;
}

.info-sections {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.status-box {
    background: #f8fafc;
    padding: 1.25rem;
    border-radius: 1rem;
    border: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.label {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.05em;
}

.value {
    font-weight: 700;
    color: #1e293b;
}

.active-status {
    color: #10b981;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.pulse-dot {
    width: 8px;
    height: 8px;
    background-color: #10b981;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.details-grid {
    display: grid;
    grid-template-cols: 1fr 1fr;
    gap: 1rem;
}

.detail-card {
    background: white;
    padding: 1.25rem;
    border-radius: 1rem;
    border: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s;
}

.detail-card i {
    font-size: 1.25rem;
    color: #64748b;
}

.detail-content {
    display: flex;
    flex-direction: column;
}

.detail-label {
    font-size: 0.65rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
}

.detail-value {
    font-weight: 800;
    color: #334155;
    font-size: 1rem;
}

.version-text {
    text-align: center;
    color: #cbd5e1;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 1rem;
}

@media (max-width: 768px) {
    .profile-container { padding: 1rem; }
    .status-box { flex-direction: column; gap: 1rem; }
    .details-grid { grid-template-cols: 1fr; }
    .profile-header { flex-direction: column; text-align: center; }
}
</style>