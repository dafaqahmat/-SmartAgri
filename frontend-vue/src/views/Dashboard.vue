<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import TablePagination from '../components/TablePagination.vue';

const dashboardData = ref({
  panen: { title: 'Memuat...', value: '-', desc: '' },
  irigasi: { title: 'Memuat...', value: '-', desc: '' },
  harga: { title: 'Memuat...', value: '-', desc: '' },
  recentBookings: []
});
const isLoading = ref(true);

// Pagination
const currentPage = ref(1);
const perPage = ref(10);

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return dashboardData.value.recentBookings.slice(start, start + perPage.value);
});

const fetchDashboard = async () => {
  try {
    const res = await api.get('/dashboard');
    dashboardData.value = res.data.data;
  } catch (err) {
    console.error('Gagal mengambil data dashboard', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDashboard();
});
</script>

<template>
  <div>
    <!-- Stats Grid -->
    <div class="stats-grid" v-if="!isLoading">
      <div class="stat-card glass-panel">
        <div class="stat-icon emerald">🌾</div>
        <div class="stat-details">
          <h3>{{ dashboardData.panen.title }}</h3>
          <p class="stat-value">{{ dashboardData.panen.value }}</p>
          <p class="stat-desc">{{ dashboardData.panen.desc }}</p>
        </div>
      </div>
      
      <div class="stat-card glass-panel">
        <div class="stat-icon blue">💧</div>
        <div class="stat-details">
          <h3>{{ dashboardData.irigasi.title }}</h3>
          <p class="stat-value">{{ dashboardData.irigasi.value }}</p>
          <p class="stat-desc">{{ dashboardData.irigasi.desc }}</p>
        </div>
      </div>
      
      <div class="stat-card glass-panel">
        <div class="stat-icon amber">📈</div>
        <div class="stat-details">
          <h3>{{ dashboardData.harga.title }}</h3>
          <p class="stat-value">{{ dashboardData.harga.value }}</p>
          <p class="stat-desc">{{ dashboardData.harga.desc }}</p>
        </div>
      </div>
    </div>

    <!-- Feature Section -->
    <div class="feature-section glass-panel">
      <div class="section-header">
        <h2>Jadwal Air Irigasi Terbaru</h2>
        <router-link to="/water-bookings" class="btn btn-secondary btn-sm">+ Booking Air</router-link>
      </div>
      
      <div class="empty-state" v-if="dashboardData.recentBookings.length === 0 && !isLoading">
        <p>Belum ada jadwal irigasi air dalam waktu dekat.</p>
      </div>

      <div class="overflow-hidden" v-else-if="!isLoading">
        <table class="data-table">
          <thead>
            <tr>
              <th>Petani</th>
              <th>Blok Sawah</th>
              <th>Tanggal</th>
              <th>Jam</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in paginatedBookings" :key="b.id">
              <td>{{ b.user?.name || '-' }}</td>
              <td>{{ b.blockName }}</td>
              <td>{{ new Date(b.bookingDate).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) }}</td>
              <td>{{ b.startTime }} WIB - {{ b.endTime }} WIB</td>
              <td>
                <span :class="['badge', b.status.toLowerCase()]">{{ b.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Pagination -->
        <TablePagination
          v-model:current-page="currentPage"
          v-model:per-page="perPage"
          :total-items="dashboardData.recentBookings.length"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  padding: 1.5rem;
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin-right: 1.25rem;
}

.stat-icon.emerald { background: rgba(16, 185, 129, 0.15); }
.stat-icon.blue { background: rgba(59, 130, 246, 0.15); }
.stat-icon.amber { background: rgba(245, 158, 11, 0.15); }

.stat-details h3 {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.stat-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.feature-section {
  padding: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  text-decoration: none;
}

.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-color);
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  background-color: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: var(--text-muted);
}

.data-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

/* Badges */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge.pending { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.badge.approved { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.badge.rejected { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.badge.finished { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
</style>
