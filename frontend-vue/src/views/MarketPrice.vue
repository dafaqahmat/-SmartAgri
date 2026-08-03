<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { toast } from 'vue3-toastify';
import Swal from 'sweetalert2';

const crops = ref([]);
const searchQuery = ref('');

// Pagination
const currentPage = ref(1);
const perPage = 10;

const filteredCrops = computed(() => {
  let list = [...crops.value].sort((a, b) => b.id - a.id);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(c => `${c.id} ${c.name} ${c.durationDays} ${c.yieldPerHaInTon}`.toLowerCase().includes(q));
  }
  return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCrops.value.length / perPage)));

const paginatedCrops = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredCrops.value.slice(start, start + perPage);
});

const pageRange = computed(() => {
  const total = totalPages.value;
  const cur = currentPage.value;
  let pages = [];
  for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
  return pages;
});

const goToPage = (p) => { if (p >= 1 && p <= totalPages.value) currentPage.value = p; };

// Modal update
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

// Modal tambah tanaman
const isModalCropOpen = ref(false);
const formCrop = ref({ name: '', durationDays: '', yieldPerHaInTon: '', pricePerKg: '' });

onMounted(() => { fetchCrops(); });

const fetchCrops = async () => {
  try {
    const res = await api.get('/crops');
    crops.value = res.data.data;
  } catch (err) { console.error(err); }
};

const deleteCrop = async (id) => {
  const result = await Swal.fire({
    title: 'Nonaktifkan Tanaman?',
    text: "Tanaman akan disembunyikan dan tidak bisa dipilih petani.",
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Nonaktifkan!', cancelButtonText: 'Batal',
    background: '#0f172a', color: '#fff'
  });
  if (result.isConfirmed) {
    try {
      await api.delete(`/crops/${id}`);
      Swal.fire({ title: 'Nonaktif!', text: 'Data tanaman berhasil dinonaktifkan.', icon: 'success', background: '#0f172a', color: '#fff' });
      fetchCrops();
    } catch (err) { toast.error('Gagal menonaktifkan tanaman'); }
  }
};

const restoreCrop = async (id) => {
  try {
    await api.put(`/crops/${id}/restore`);
    toast.success('Tanaman berhasil diaktifkan kembali!');
    fetchCrops();
  } catch (err) { toast.error('Gagal mengaktifkan tanaman'); }
};

const submitUpdate = async () => {
  try {
    await api.put(`/crops/${formUpdate.value.id}`, formUpdate.value);
    isModalUpdateOpen.value = false;
    fetchCrops();
    toast.success('Data komoditas & harga berhasil diupdate!');
    formUpdate.value = { id: '', name: '', durationDays: '', yieldPerHaInTon: '', pricePerKg: '' };
  } catch (err) { toast.error(err.response?.data?.message || 'Gagal mengupdate komoditas'); }
};

const submitCrop = async () => {
  try {
    await api.post('/crops', formCrop.value);
    isModalCropOpen.value = false;
    fetchCrops();
    toast.success('Tanaman baru berhasil ditambahkan!');
    formCrop.value = { name: '', durationDays: '', yieldPerHaInTon: '', pricePerKg: '' };
  } catch (err) { toast.error(err.response?.data?.message || 'Gagal menambah tanaman'); }
};
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Kelola Harga Pasar & Tanaman</h2>
        <p class="text-muted">Khusus Admin: Update harga acuan & tambah komoditas desa.</p>
      </div>
      <div class="action-buttons">
        <input type="text" v-model="searchQuery" class="form-input" placeholder="🔍 Cari..." @input="currentPage = 1" />
        <button class="btn btn-secondary" @click="isModalCropOpen = true">+ Tambah Tanaman</button>
      </div>
    </div>

    <!-- Table -->
    <div class="glass-panel overflow-hidden">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Komoditas</th>
              <th>Masa Tanam</th>
              <th>Panen/Ha</th>
              <th>Harga (Per Kg)</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredCrops.length === 0">
              <td colspan="7" class="text-center py-4">Tidak ada data tanaman yang cocok.</td>
            </tr>
            <tr v-for="c in paginatedCrops" :key="c.id">
              <td>#{{ c.id }}</td>
              <td><strong>{{ c.name }}</strong></td>
              <td>{{ c.durationDays }} Hari</td>
              <td>{{ c.yieldPerHaInTon }} Ton</td>
              <td class="text-emerald">
                <span v-if="c.prices && c.prices.length > 0">Rp {{ new Intl.NumberFormat('id-ID').format(c.prices[0].pricePerKg) }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span v-if="!c.deletedAt" class="badge-status active">Aktif</span>
                <span v-else class="badge-status inactive">Nonaktif</span>
              </td>
              <td>
                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                  <button class="btn-action" style="background:transparent;border:1px solid var(--secondary-color);color:var(--secondary-color);" @click="openUpdateModal(c)">Update</button>
                  <button v-if="!c.deletedAt" class="btn-action danger" style="background:transparent;" @click="deleteCrop(c.id)">Nonaktifkan</button>
                  <button v-else class="btn-action" style="background:transparent;border:1px solid var(--warning-color);color:var(--warning-color);" @click="restoreCrop(c.id)">Aktifkan</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <span class="pagination-info">
          Menampilkan {{ (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, filteredCrops.length) }} dari {{ filteredCrops.length }} data
        </span>
        <div class="pagination-controls">
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">‹</button>
          <button v-if="pageRange[0] > 1" class="page-btn" @click="goToPage(1)">1</button>
          <span v-if="pageRange[0] > 2" class="text-muted" style="padding:0 4px;">…</span>
          <button v-for="p in pageRange" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
          <span v-if="pageRange[pageRange.length-1] < totalPages - 1" class="text-muted" style="padding:0 4px;">…</span>
          <button v-if="pageRange[pageRange.length-1] < totalPages" class="page-btn" @click="goToPage(totalPages)">{{ totalPages }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">›</button>
        </div>
      </div>
    </div>

    <!-- Modal: UPDATE KOMODITAS -->
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
            <button type="button" class="btn-secondary-outline" @click="isModalUpdateOpen = false">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Data</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: TAMBAH TANAMAN BARU -->
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
            <button type="button" class="btn-secondary-outline" @click="isModalCropOpen = false">Batal</button>
            <button type="submit" class="btn btn-secondary">Simpan Tanaman</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.badge-status {
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.badge-status.active   { background: rgba(52,211,153,0.15); color: #34d399; }
.badge-status.inactive { background: rgba(239,68,68,0.15); color: #f87171; }
</style>
