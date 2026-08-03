<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const user = ref(null);
const sidebarOpen = ref(false);

onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) user.value = JSON.parse(userData);
});

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

const closeSidebar = () => { sidebarOpen.value = false; };
</script>

<template>
  <div class="dashboard-layout">
    <!-- Mobile Overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>

    <!-- Sidebar -->
    <aside class="sidebar glass-panel" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-header">
        <h2>🌾 SmartAgri</h2>
        <span class="role-badge">{{ user?.role || 'PETANI' }}</span>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" :class="{ active: route.path === '/dashboard' }" @click="closeSidebar">
          <span class="icon">📊</span> Dashboard
        </router-link>

        <!-- Data Master (Admin Only) -->
        <div v-if="user?.role === 'ADMIN'" class="nav-section-label">Data Master</div>
        <router-link v-if="user?.role === 'ADMIN'" to="/admin/users" class="nav-item" :class="{ active: route.path === '/admin/users' }" @click="closeSidebar">
          <span class="icon">👥</span> Data Petani
        </router-link>
        <router-link v-if="user?.role === 'ADMIN'" to="/admin/crops" class="nav-item" :class="{ active: route.path === '/admin/crops' }" @click="closeSidebar">
          <span class="icon">💰</span> Harga Pasar
        </router-link>
        <router-link v-if="user?.role === 'ADMIN'" to="/admin/irrigation-settings" class="nav-item" :class="{ active: route.path === '/admin/irrigation-settings' }" @click="closeSidebar">
          <span class="icon">⚙️</span> Jadwal Irigasi
        </router-link>

        <!-- Transaksi -->
        <div class="nav-section-label">Transaksi</div>
        <router-link to="/schedules" class="nav-item" :class="{ active: route.path === '/schedules' }" @click="closeSidebar">
          <span class="icon">🌱</span> Jadwal Tanam
        </router-link>
        <router-link to="/water-bookings" class="nav-item" :class="{ active: route.path === '/water-bookings' }" @click="closeSidebar">
          <span class="icon">💧</span> Irigasi Sawah
        </router-link>

        <!-- Laporan -->
        <div class="nav-section-label">Laporan</div>
        <router-link to="/reports" class="nav-item" :class="{ active: route.path === '/reports' }" @click="closeSidebar">
          <span class="icon">📑</span> Laporan Aktivitas
        </router-link>

        <!-- Pengaturan -->
        <div class="nav-section-label">Pengaturan</div>
        <router-link to="/profile" class="nav-item" :class="{ active: route.path === '/profile' }" @click="closeSidebar">
          <span class="icon">⚙️</span> Profil Saya
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <p class="user-name">{{ user?.name || 'User' }}</p>
          <p class="user-email">{{ user?.email || 'user@email.com' }}</p>
        </div>
        <button @click="handleLogout" class="btn-logout">Logout 🚪</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Top Bar -->
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" @click="sidebarOpen = !sidebarOpen">☰</button>
          <div>
            <h1>{{ route.name }} 👋</h1>
            <p class="subtitle">Kelola pertanian dan irigasi desa dengan mudah.</p>
          </div>
        </div>
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
  position: relative;
}

/* ---- Sidebar ---- */
.sidebar {
  width: 280px;
  min-width: 280px;
  border-radius: 0;
  border-left: none;
  border-top: none;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.98);
  transition: transform 0.3s ease;
  z-index: 50;
  flex-shrink: 0;
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

.sidebar-nav { padding: 1.5rem 1rem; flex: 1; overflow-y: auto; }

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.85rem 1rem;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  margin-bottom: 0.4rem;
  transition: var(--transition);
  font-weight: 500;
  font-size: 0.95rem;
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

.nav-item .icon { margin-right: 1rem; font-size: 1.1rem; }

.nav-item:hover { background-color: rgba(255,255,255,0.05); color: white; }

.nav-item.active {
  background-color: rgba(16,185,129,0.15);
  color: var(--primary-color);
  border-left: 3px solid var(--primary-color);
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.user-info { margin-bottom: 1rem; }
.user-name { font-weight: 600; font-size: 0.95rem; }
.user-email { font-size: 0.8rem; color: var(--text-muted); }

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
  font-family: 'Outfit', sans-serif;
}
.btn-logout:hover { background: rgba(239,68,68,0.1); }

/* ---- Main ---- */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-y: auto;
}

.topbar {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
  background: rgba(15,23,42,0.5);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.topbar h1 { font-size: 1.6rem; font-weight: 600; }
.subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.2rem; }

.hamburger-btn {
  display: none;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  font-size: 1.3rem;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
}
.hamburger-btn:hover { background: rgba(255,255,255,0.07); }

.content-wrapper {
  padding: 2rem 2rem;
  flex: 1;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(2,6,23,0.7);
  z-index: 40;
  backdrop-filter: blur(2px);
}

/* ==================== MOBILE ==================== */
@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    transform: translateX(-100%);
  }

  .sidebar.sidebar-open { transform: translateX(0); }

  .sidebar-overlay { display: block; }

  .hamburger-btn { display: flex; }

  .content-wrapper { padding: 1.25rem 1rem; }

  .topbar { padding: 1rem 1.25rem; }

  .topbar h1 { font-size: 1.25rem; }
}
</style>
