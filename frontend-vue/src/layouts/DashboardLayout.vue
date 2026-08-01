<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const user = ref(null);

onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    user.value = JSON.parse(userData);
  }
});

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};
</script>

<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="sidebar glass-panel">
      <div class="sidebar-header">
        <h2>🌾 SmartAgri</h2>
        <span class="role-badge">{{ user?.role || 'PETANI' }}</span>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" :class="{ active: route.path === '/dashboard' }">
          <span class="icon">📊</span> Dashboard
        </router-link>

        <!-- Seksi Data Master (Admin Only) -->
        <div v-if="user?.role === 'ADMIN'" class="nav-section-label">Data Master</div>
        <router-link v-if="user?.role === 'ADMIN'" to="/admin/users" class="nav-item" :class="{ active: route.path === '/admin/users' }">
          <span class="icon">👥</span> Data Petani
        </router-link>
        <router-link v-if="user?.role === 'ADMIN'" to="/admin/crops" class="nav-item" :class="{ active: route.path === '/admin/crops' }">
          <span class="icon">💰</span> Harga Pasar
        </router-link>
        <router-link v-if="user?.role === 'ADMIN'" to="/admin/irrigation-settings" class="nav-item" :class="{ active: route.path === '/admin/irrigation-settings' }">
          <span class="icon">⚙️</span> Jadwal Irigasi
        </router-link>

        <!-- Seksi Transaksi -->
        <div class="nav-section-label">Transaksi</div>
        <router-link to="/schedules" class="nav-item" :class="{ active: route.path === '/schedules' }">
          <span class="icon">🌱</span> Jadwal Tanam
        </router-link>
        <router-link to="/water-bookings" class="nav-item" :class="{ active: route.path === '/water-bookings' }">
          <span class="icon">💧</span> Irigasi Sawah
        </router-link>

        <!-- Laporan -->
        <div class="nav-section-label">Laporan</div>
        <router-link to="/reports" class="nav-item" :class="{ active: route.path === '/reports' }">
          <span class="icon">📑</span> Laporan Aktivitas
        </router-link>

        <!-- Pengaturan -->
        <div class="nav-section-label">Pengaturan</div>
        <router-link to="/profile" class="nav-item" :class="{ active: route.path === '/profile' }">
          <span class="icon">⚙️</span> Profil Saya
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <p class="user-name">{{ user?.name || 'User' }}</p>
          <p class="user-email">{{ user?.email || 'user@email.com' }}</p>
        </div>
        <button @click="handleLogout" class="btn-logout">
          Logout 🚪
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="topbar">
        <h1>{{ route.name }} 👋</h1>
        <p class="subtitle">Kelola pertanian dan irigasi desa dengan mudah.</p>
      </header>

      <div class="content-wrapper animate-fade-in">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
}

.sidebar {
  width: 280px;
  border-radius: 0;
  border-left: none;
  border-top: none;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.95);
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.role-badge {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.sidebar-nav {
  padding: 1.5rem 1rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  margin-bottom: 0.5rem;
  transition: var(--transition);
  font-weight: 500;
}

.nav-section-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.5);
  padding: 0.75rem 1rem 0.25rem;
  margin-top: 0.5rem;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.nav-item .icon {
  margin-right: 1rem;
  font-size: 1.2rem;
}

.nav-item:hover, .nav-item.active {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-item.active {
  background-color: rgba(16, 185, 129, 0.15);
  color: var(--primary-color);
  border-left: 3px solid var(--primary-color);
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.user-info {
  margin-bottom: 1rem;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.user-email {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.btn-logout {
  width: 100%;
  background: transparent;
  border: 1px solid var(--danger-color);
  color: #fca5a5;
  padding: 0.6rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  font-weight: 500;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.1);
}

.main-content {
  flex: 1;
  padding: 2.5rem 3rem;
  overflow-y: auto;
}

.topbar {
  margin-bottom: 2.5rem;
}

.topbar h1 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1rem;
}
</style>
