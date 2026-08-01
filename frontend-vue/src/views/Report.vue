<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import { toast } from 'vue3-toastify';

const reports = ref([]);
const reportType = ref('');
const isLoading = ref(true);

const fetchReports = async () => {
  try {
    const res = await api.get('/report');
    reports.value = res.data.data;
    reportType.value = res.data.type;
  } catch (err) {
    toast.error('Gagal memuat data laporan');
  } finally {
    isLoading.value = false;
  }
};

const exportCSV = () => {
  if (reports.value.length === 0) {
    toast.warning('Tidak ada data untuk diekspor');
    return;
  }

  let headers = [];
  let rows = [];

  if (reportType.value === 'PETANI_REPORT') {
    headers = ['Komoditas', 'Total Luas Tanam (Ha)', 'Total Estimasi Panen (Kg)'];
    rows = reports.value.map(r => [
      r.cropName,
      r.totalArea.toFixed(2),
      r.totalYieldKg
    ]);
  } else {
    headers = ['Nama Petani', 'Email', 'Jumlah Sawah', 'Frekuensi Irigasi Selesai', 'Total Estimasi Panen (Kg)'];
    rows = reports.value.map(r => [
      r.name,
      r.email,
      r.totalFields,
      r.totalWaterings,
      r.totalYieldKg
    ]);
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Aktivitas_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast.success('Laporan berhasil diekspor!');
};

onMounted(() => {
  fetchReports();
});
</script>

<template>
  <div class="report-page">
    <div class="page-header">
      <div>
        <h2>Laporan Aktivitas Petani</h2>
        <p v-if="reportType === 'ADMIN_REPORT'" class="text-muted">Rekapitulasi kepemilikan sawah, riwayat irigasi, dan panen desa.</p>
        <p v-else class="text-muted">Rekapitulasi total tanam dan panen Anda berdasarkan komoditas.</p>
      </div>
      <button @click="exportCSV" class="btn btn-primary export-btn">
        <span>📥</span> Eksport Report (CSV)
      </button>
    </div>

    <div class="glass-panel" v-if="!isLoading">
      <div v-if="reports.length === 0" class="empty-state">
        <p>Belum ada data laporan.</p>
      </div>
      
      <div class="table-responsive" v-else>
        <!-- TABEL ADMIN -->
        <table class="data-table" v-if="reportType === 'ADMIN_REPORT'">
          <thead>
            <tr>
              <th>Nama Petani</th>
              <th>Total Sawah</th>
              <th>Total Irigasi (Selesai)</th>
              <th>Estimasi Panen (Kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in reports" :key="r.id">
              <td>
                <div style="font-weight: 500;">{{ r.name }}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">{{ r.email }}</div>
              </td>
              <td>{{ r.totalFields }} Blok</td>
              <td>{{ r.totalWaterings }} Kali</td>
              <td>{{ r.totalYieldKg }} Kg</td>
            </tr>
          </tbody>
        </table>

        <!-- TABEL PETANI -->
        <table class="data-table" v-else>
          <thead>
            <tr>
              <th>Komoditas (Tanaman)</th>
              <th>Total Luas Tanam (Ha)</th>
              <th>Total Estimasi Panen (Kg)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, index) in reports" :key="index">
              <td>
                <div style="font-weight: 600; color: var(--primary-color);">{{ r.cropName }}</div>
              </td>
              <td>{{ r.totalArea.toFixed(2) }} Hektar</td>
              <td>{{ r.totalYieldKg }} Kg</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-else class="loading-state">
      <p>Memuat laporan...</p>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 1.25rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  background-color: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.empty-state, .loading-state {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted);
}
</style>
