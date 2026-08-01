<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { toast } from 'vue3-toastify';

const crops = ref([]);
const searchQuery = ref('');

const filteredCrops = computed(() => {
  if (!searchQuery.value) return crops.value;
  const q = searchQuery.value.toLowerCase();
  return crops.value.filter(c => {
    const priceStr = c.prices && c.prices.length > 0 ? c.prices[0].pricePerKg : '';
    const searchString = `
      ${c.id}
      ${c.name}
      ${c.durationDays}
      ${c.yieldPerHaInTon}
      ${priceStr}
    `.toLowerCase();
    return searchString.includes(q);
  });
});

// State Modal Update Komoditas
const isModalUpdateOpen = ref(false);
const formUpdate = ref({ id: '', name: '', durationDays: '', yieldPerHaInTon: '', pricePerKg: '' });

const openUpdateModal = (crop) => {
  formUpdate.value.id = crop.id;
  formUpdate.value.name = crop.name;
  formUpdate.value.durationDays = crop.durationDays;
  formUpdate.value.yieldPerHaInTon = crop.yieldPerHaInTon;
  formUpdate.value.pricePerKg = crop.prices && crop.prices.length > 0 ? crop.prices[0].pricePerKg : '';
  isModalUpdateOpen.value = true;
};

// State Modal Tambah Tanaman (Baru)
const isModalCropOpen = ref(false);
const formCrop = ref({ name: '', durationDays: '', yieldPerHaInTon: '', pricePerKg: '' });

onMounted(() => {
  fetchCrops();
});

const fetchCrops = async () => {
  try {
    const res = await api.get('/crops');
    crops.value = res.data.data;
  } catch (err) {
    console.error(err);
  }
};

// Fungsi Update Komoditas
const submitUpdate = async () => {
  try {
    await api.put(`/crops/${formUpdate.value.id}`, formUpdate.value);
    isModalUpdateOpen.value = false;
    fetchCrops(); 
    toast.success('Data komoditas & harga berhasil diupdate!');
    formUpdate.value = { id: '', name: '', durationDays: '', yieldPerHaInTon: '', pricePerKg: '' };
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal mengupdate komoditas');
  }
};

// Fungsi Tambah Tanaman Baru
const submitCrop = async () => {
  try {
    await api.post('/crops', formCrop.value);
    isModalCropOpen.value = false;
    fetchCrops(); 
    toast.success('Tanaman baru berhasil ditambahkan!');
    formCrop.value = { name: '', durationDays: '', yieldPerHaInTon: '', pricePerKg: '' };
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menambah tanaman');
  }
};
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Kelola Harga Pasar & Tanaman</h2>
        <p class="text-muted">Khusus Admin: Update harga acuan & tambah komoditas desa.</p>
      </div>
      <div class="action-buttons" style="display: flex; gap: 1rem; align-items: center;">
        <input type="text" v-model="searchQuery" class="form-input" style="width: 250px; margin-bottom: 0;" placeholder="🔍 Cari..." />
        <button class="btn btn-secondary" @click="isModalCropOpen = true">+ Tambah Tanaman Baru</button>
      </div>
    </div>

    <!-- Table -->
    <div class="glass-panel overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama Komoditas</th>
            <th>Masa Tanam</th>
            <th>Standar Panen (Ha)</th>
            <th>Harga Terbaru (Per Kg)</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredCrops.length === 0">
            <td colspan="6" class="text-center py-4">Tidak ada data tanaman yang cocok.</td>
          </tr>
          <tr v-for="c in filteredCrops" :key="c.id">
            <td>#{{ c.id }}</td>
            <td><strong>{{ c.name }}</strong></td>
            <td>{{ c.durationDays }} Hari</td>
            <td>{{ c.yieldPerHaInTon }} Ton</td>
            <td class="text-emerald text-lg">
              <span v-if="c.prices && c.prices.length > 0">
                Rp {{ new Intl.NumberFormat('id-ID').format(c.prices[0].pricePerKg) }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <button class="btn btn-secondary-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" @click="openUpdateModal(c)">Update Data</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Form: UPDATE KOMODITAS -->
    <div v-if="isModalUpdateOpen" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h3>Update Komoditas & Harga</h3>
        <form @submit.prevent="submitUpdate">
          <div class="form-group">
            <label class="form-label">Nama Tanaman</label>
            <input type="text" v-model="formUpdate.name" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Estimasi Masa Tanam (Hari)</label>
            <input type="number" v-model="formUpdate.durationDays" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Standar Hasil Panen per Hektar (Ton)</label>
            <input type="number" step="0.1" v-model="formUpdate.yieldPerHaInTon" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Harga Terbaru (Per Kg)</label>
            <input type="number" v-model="formUpdate.pricePerKg" class="form-input" placeholder="Kosongkan jika tidak update harga" />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary-outline" @click="isModalUpdateOpen = false">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Data</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Form: TAMBAH TANAMAN BARU -->
    <div v-if="isModalCropOpen" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h3>Tambah Komoditas / Tanaman Baru</h3>
        <form @submit.prevent="submitCrop">
          <div class="form-group">
            <label class="form-label">Nama Tanaman</label>
            <input type="text" v-model="formCrop.name" class="form-input" placeholder="Contoh: Bawang Merah" required />
          </div>
          <div class="form-group">
            <label class="form-label">Estimasi Masa Tanam (Hari)</label>
            <input type="number" v-model="formCrop.durationDays" class="form-input" placeholder="Contoh: 60" required />
          </div>
          <div class="form-group">
            <label class="form-label">Standar Hasil Panen per Hektar (Ton)</label>
            <input type="number" step="0.1" v-model="formCrop.yieldPerHaInTon" class="form-input" placeholder="Contoh: 5.5" required />
          </div>
          <div class="form-group">
            <label class="form-label">Harga Acuan (Per Kg)</label>
            <input type="number" v-model="formCrop.pricePerKg" class="form-input" placeholder="Contoh: 8500" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary-outline" @click="isModalCropOpen = false">Batal</button>
            <button type="submit" class="btn btn-secondary">Simpan Tanaman</button>
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
.action-buttons {
  display: flex;
  gap: 1rem;
}
.text-muted { color: var(--text-muted); }
.py-4 { padding-top: 2rem; padding-bottom: 2rem; }
.text-center { text-align: center; }
.text-emerald { color: #34d399; font-weight: 600; }
.text-lg { font-size: 1.1rem; }

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

.btn-secondary-outline {
  background: transparent;
  border: 1px solid var(--text-muted);
  color: var(--text-muted);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
}
.btn-secondary-outline:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}
</style>
