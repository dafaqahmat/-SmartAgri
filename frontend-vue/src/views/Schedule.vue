<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { toast } from 'vue3-toastify';

const schedules = ref([]);
const crops = ref([]);
const isModalOpen = ref(false);
const currentUser = ref(null);

const tableSearchQuery = ref('');

const filteredSchedules = computed(() => {
  if (!tableSearchQuery.value) return schedules.value;
  const q = tableSearchQuery.value.toLowerCase();
  return schedules.value.filter(s => {
    const searchString = `
      ${s.user?.name || ''} 
      ${s.crop?.name || ''} 
      ${s.areaSizeInHa || ''} 
      ${new Date(s.plantDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      ${new Date(s.estHarvestDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      ${s.estYieldInKg || ''}
      ${s.estRevenueRupiah || ''}
    `.toLowerCase();
    return searchString.includes(q);
  });
});
const form = ref({
  cropId: '',
  areaSizeInHa: '',
  plantDate: ''
});

const isModalUpdateOpen = ref(false);
const formUpdate = ref({
  id: '',
  estYieldInKg: '',
  realPricePerKg: ''
});

const openUpdateModal = (sched) => {
  formUpdate.value.id = sched.id;
  formUpdate.value.estYieldInKg = sched.estYieldInKg;
  formUpdate.value.realPricePerKg = sched.currentPriceRef || '';
  isModalUpdateOpen.value = true;
};

const submitUpdate = async () => {
  try {
    await api.put(`/schedules/${formUpdate.value.id}`, {
      estYieldInKg: formUpdate.value.estYieldInKg,
      realPricePerKg: formUpdate.value.realPricePerKg,
      status: 'HARVESTED'
    });
    isModalUpdateOpen.value = false;
    fetchSchedules();
    toast.success('Hasil panen nyata berhasil disimpan!');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menyimpan hasil panen');
  }
};

const cropSearch = ref('');
const isCropDropdownOpen = ref(false);

const filteredCrops = computed(() => {
  if (!cropSearch.value) return crops.value;
  return crops.value.filter(c => c.name.toLowerCase().includes(cropSearch.value.toLowerCase()));
});

const selectCrop = (crop) => {
  form.value.cropId = crop.id;
  cropSearch.value = crop.name;
  isCropDropdownOpen.value = false;
};

const closeDropdown = () => {
  setTimeout(() => isCropDropdownOpen.value = false, 200);
};

const handleSearchInput = () => {
  form.value.cropId = '';
  isCropDropdownOpen.value = true;
};

onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    currentUser.value = JSON.parse(userData);
  }
  fetchSchedules();
  fetchCrops();
});

const fetchSchedules = async () => {
  try {
    const res = await api.get('/schedules');
    schedules.value = res.data.data;
  } catch (err) {
    console.error(err);
  }
};

const fetchCrops = async () => {
  try {
    const res = await api.get('/crops');
    crops.value = res.data.data;
  } catch (err) {
    console.error(err);
  }
};

const submitSchedule = async () => {
  if (!form.value.cropId) {
    toast.error('Silakan pilih tanaman dari daftar pencarian.');
    return;
  }
  try {
    await api.post('/schedules', form.value);
    isModalOpen.value = false;
    fetchSchedules();
    toast.success('Jadwal tanam berhasil dibuat!');
  } catch (err) {
    toast.error('Gagal menambah jadwal tanam');
  }
};
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Jadwal Tanam & Estimasi Panen</h2>
        <p class="text-muted">Kelola jadwal tanam dan pantau estimasi pendapatan secara real-time.</p>
      </div>
      <div class="action-buttons" style="display: flex; gap: 1rem; align-items: center;">
        <input type="text" v-model="tableSearchQuery" class="form-input" style="width: 250px; margin-bottom: 0;" placeholder="🔍 Cari..." />
        <button class="btn btn-primary" @click="isModalOpen = true">+ Tambah Jadwal</button>
      </div>
    </div>

    <!-- Table -->
    <div class="glass-panel overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Petani</th>
            <th>Tanaman</th>
            <th>Luas Lahan</th>
            <th>Tgl Tanam</th>
            <th>Tgl Panen (Est)</th>
            <th>Tonase (Kg)</th>
            <th>Nilai (Rp)</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredSchedules.length === 0">
            <td colspan="8" class="text-center py-4">Belum ada data atau jadwal tidak ditemukan.</td>
          </tr>
          <tr v-for="s in filteredSchedules" :key="s.id">
            <td>{{ s.user?.name }}</td>
            <td>{{ s.crop?.name }}</td>
            <td>{{ s.areaSizeInHa }} Ha</td>
            <td>{{ new Date(s.plantDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</td>
            <td>{{ new Date(s.estHarvestDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</td>
            <td><strong>{{ s.estYieldInKg }} kg</strong></td>
            <td class="text-emerald">
              Rp {{ new Intl.NumberFormat('id-ID').format(s.estRevenueRupiah) }}
            </td>
            <td>
              <button v-if="s.status !== 'HARVESTED' && currentUser && s.userId === currentUser.id" class="btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border: 1px solid var(--primary-color); color: var(--primary-color); background: transparent;" @click="openUpdateModal(s)">Update Panen</button>
              <span v-else-if="s.status !== 'HARVESTED'" class="text-muted" style="font-size: 0.85rem;">⏳ Menunggu</span>
              <span v-else class="text-emerald" style="font-size: 0.85rem; font-weight: bold;">✅ Selesai</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Form: UPDATE PANEN -->
    <div v-if="isModalUpdateOpen" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h3>Update Hasil Panen Nyata</h3>
        <form @submit.prevent="submitUpdate">
          <div class="form-group">
            <label class="form-label">Total Hasil Panen (Kg)</label>
            <input type="number" step="0.1" v-model="formUpdate.estYieldInKg" class="form-input" placeholder="Masukkan angka real panen..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Harga Jual Riil (Per Kg)</label>
            <input type="number" v-model="formUpdate.realPricePerKg" class="form-input" placeholder="Misal: 8500" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary-outline" style="border: 1px solid var(--text-muted); padding: 0.5rem 1rem; border-radius: var(--radius-md); color: white; cursor: pointer; background: transparent;" @click="isModalUpdateOpen = false">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Panen</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Form: TAMBAH JADWAL -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h3>Form Jadwal Tanam</h3>
        <form @submit.prevent="submitSchedule">
          <div class="form-group">
            <label class="form-label">Komoditas / Tanaman</label>
            <div style="position: relative;">
              <input type="text" v-model="cropSearch" @input="handleSearchInput" @focus="isCropDropdownOpen = true" @blur="closeDropdown" class="form-input" placeholder="🔍 Ketik nama tanaman..." required />
              <div v-if="isCropDropdownOpen" class="dropdown-menu glass-panel">
                <div v-for="c in filteredCrops" :key="c.id" @click="selectCrop(c)" class="dropdown-item">
                  {{ c.name }}
                </div>
                <div v-if="filteredCrops.length === 0" class="dropdown-item text-muted">Tidak ditemukan</div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Luas Lahan (Ha)</label>
            <input type="number" step="0.1" v-model="form.areaSizeInHa" class="form-input" placeholder="Contoh: 0.5" required />
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Tanam</label>
            <input type="date" v-model="form.plantDate" class="form-input" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="isModalOpen = false">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Jadwal</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.text-muted { color: var(--text-muted); }
.py-4 { padding-top: 2rem; padding-bottom: 2rem; }
.text-center { text-align: center; }
.text-emerald { color: #34d399; font-weight: 600; }

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

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(2, 6, 23, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  width: 100%;
  max-width: 450px;
  padding: 2rem;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Custom Dropdown */
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  z-index: 60;
  margin-top: 0.5rem;
  padding: 0.5rem 0;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
