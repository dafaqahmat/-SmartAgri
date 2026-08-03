<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { toast } from 'vue3-toastify';

const schedules = ref([]);
const crops = ref([]);
const isModalOpen = ref(false);
const currentUser = ref(null);

const tableSearchQuery = ref('');
const schedCurrentPage = ref(1);
const schedPerPage = 10;

const filteredSchedules = computed(() => {
  let list = [...schedules.value].sort((a, b) => b.id - a.id);
  if (tableSearchQuery.value) {
    const q = tableSearchQuery.value.toLowerCase();
    list = list.filter(s => {
      const searchString = `
        ${s.user?.name || ''} 
        ${s.crop?.name || ''} 
        ${s.areaSizeInHa || ''} 
        ${s.estYieldInKg || ''}
        ${s.estRevenueRupiah || ''}
      `.toLowerCase();
      return searchString.includes(q);
    });
  }
  return list;
});

const totalSchedPages = computed(() => Math.max(1, Math.ceil(filteredSchedules.value.length / schedPerPage)));

const paginatedSchedules = computed(() => {
  const start = (schedCurrentPage.value - 1) * schedPerPage;
  return filteredSchedules.value.slice(start, start + schedPerPage);
});

const schedPageRange = computed(() => {
  const total = totalSchedPages.value;
  const cur = schedCurrentPage.value;
  let pages = [];
  for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
  return pages;
});

const goToSchedPage = (p) => { if (p >= 1 && p <= totalSchedPages.value) schedCurrentPage.value = p; };
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

import Swal from 'sweetalert2';

// Edit Base Schedule
const isModalEditBaseOpen = ref(false);
const formEditBase = ref({ id: '', cropId: '', areaSizeInHa: '', plantDate: '' });
const editCropSearch = ref('');

const openEditBaseModal = (sched) => {
  formEditBase.value.id = sched.id;
  formEditBase.value.cropId = sched.cropId;
  formEditBase.value.areaSizeInHa = sched.areaSizeInHa;
  formEditBase.value.plantDate = new Date(sched.plantDate).toISOString().split('T')[0];
  editCropSearch.value = sched.crop?.name || '';
  isModalEditBaseOpen.value = true;
};

const submitEditBase = async () => {
  try {
    await api.put(`/schedules/${formEditBase.value.id}`, formEditBase.value);
    isModalEditBaseOpen.value = false;
    fetchSchedules();
    toast.success('Jadwal berhasil diperbarui!');
  } catch (err) {
    toast.error('Gagal memperbarui jadwal');
  }
};

const deleteSchedule = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Jadwal?',
    text: "Data jadwal dan pengeluarannya akan terhapus permanen.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus',
    background: '#0f172a',
    color: '#fff'
  });
  if (result.isConfirmed) {
    try {
      await api.delete(`/schedules/${id}`);
      fetchSchedules();
      Swal.fire({ title: 'Terhapus', icon: 'success', background: '#0f172a', color: '#fff' });
    } catch(err) { toast.error('Gagal menghapus jadwal'); }
  }
};

// --- EXPENSE LOGIC ---
const isModalExpenseOpen = ref(false);
const activeExpenseSchedule = ref(null);
const formExpense = ref({
  description: '',
  amountRupiah: ''
});
const editingExpenseId = ref(null);

const openExpenseModal = (sched) => {
  activeExpenseSchedule.value = sched;
  formExpense.value.description = '';
  formExpense.value.amountRupiah = '';
  editingExpenseId.value = null;
  isModalExpenseOpen.value = true;
};

const startEditExpense = (exp) => {
  editingExpenseId.value = exp.id;
  formExpense.value.description = exp.description;
  formExpense.value.amountRupiah = exp.amountRupiah;
};

const cancelEditExpense = () => {
  editingExpenseId.value = null;
  formExpense.value.description = '';
  formExpense.value.amountRupiah = '';
};

const deleteExpense = async (expenseId) => {
  if (!confirm('Hapus pengeluaran ini?')) return;
  try {
    await api.delete(`/schedules/expenses/${expenseId}`);
    toast.success('Pengeluaran dihapus');
    const updatedRes = await api.get('/schedules');
    schedules.value = updatedRes.data.data;
    activeExpenseSchedule.value = schedules.value.find(s => s.id === activeExpenseSchedule.value.id);
  } catch(err) { toast.error('Gagal hapus pengeluaran'); }
};

const submitExpense = async () => {
  try {
    if (editingExpenseId.value) {
      await api.put(`/schedules/expenses/${editingExpenseId.value}`, formExpense.value);
      toast.success('Pengeluaran diupdate');
      editingExpenseId.value = null;
    } else {
      await api.post(`/schedules/${activeExpenseSchedule.value.id}/expenses`, formExpense.value);
      toast.success('Pengeluaran dicatat!');
    }
    
    // Refresh table data
    const updatedRes = await api.get('/schedules');
    schedules.value = updatedRes.data.data;
    
    // Update local active schedule to refresh the list in modal
    activeExpenseSchedule.value = schedules.value.find(s => s.id === activeExpenseSchedule.value.id);
    
    // Clear form
    formExpense.value.description = '';
    formExpense.value.amountRupiah = '';
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menyimpan biaya');
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
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Petani</th>
              <th>Tanaman</th>
              <th>Luas</th>
              <th>Tgl Tanam</th>
              <th>Tgl Panen (Est)</th>
              <th>Tonase (Kg)</th>
              <th>Pendapatan (Rp)</th>
              <th>Total Biaya (Rp)</th>
              <th>Hasil Bersih (Rp)</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredSchedules.length === 0">
              <td colspan="10" class="text-center py-4">Belum ada data atau jadwal tidak ditemukan.</td>
            </tr>
            <tr v-for="s in paginatedSchedules" :key="s.id">
              <td>{{ s.user?.name }}</td>
              <td>{{ s.crop?.name }}</td>
              <td>{{ s.areaSizeInHa }} Ha</td>
              <td>{{ new Date(s.plantDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }}</td>
              <td>{{ new Date(s.estHarvestDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }}</td>
              <td><strong>{{ s.estYieldInKg }} kg</strong></td>
              <td class="text-emerald">Rp {{ new Intl.NumberFormat('id-ID').format(s.estRevenueRupiah) }}</td>
              <td style="color:#ef4444;">-Rp {{ new Intl.NumberFormat('id-ID').format(s.totalExpensesRupiah || 0) }}</td>
              <td style="color:#60a5fa;font-weight:600;">Rp {{ new Intl.NumberFormat('id-ID').format(s.estRevenueRupiah - (s.totalExpensesRupiah || 0)) }}</td>
              <td>
                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center;">
                  <button v-if="currentUser && s.userId === currentUser.id" class="btn-action" style="background:transparent;border:1px solid var(--warning-color);color:var(--warning-color);" @click="openExpenseModal(s)">💰 Biaya</button>
                  <button v-if="s.status !== 'HARVESTED' && currentUser && s.userId === currentUser.id" class="btn-action" style="background:transparent;border:1px solid var(--primary-color);color:var(--primary-color);" @click="openUpdateModal(s)">Panen</button>
                  <button v-if="s.status !== 'HARVESTED' && currentUser && s.userId === currentUser.id" class="btn-action" style="background:transparent;border:1px solid var(--text-muted);color:var(--text-muted);" @click="openEditBaseModal(s)">Edit</button>
                  <button v-if="currentUser && s.userId === currentUser.id" class="btn-action danger" style="background:transparent;" @click="deleteSchedule(s.id)">Hapus</button>
                  <span v-else-if="s.status !== 'HARVESTED' && (!currentUser || s.userId !== currentUser.id)" class="text-muted" style="font-size:0.85rem;">⏳ Menunggu</span>
                  <span v-if="s.status === 'HARVESTED'" class="text-emerald" style="font-size:0.85rem;font-weight:bold;">✅ Selesai</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalSchedPages > 1">
        <span class="pagination-info">
          Menampilkan {{ (schedCurrentPage - 1) * schedPerPage + 1 }}–{{ Math.min(schedCurrentPage * schedPerPage, filteredSchedules.length) }} dari {{ filteredSchedules.length }} jadwal
        </span>
        <div class="pagination-controls">
          <button class="page-btn" :disabled="schedCurrentPage === 1" @click="goToSchedPage(schedCurrentPage - 1)">‹</button>
          <button v-if="schedPageRange[0] > 1" class="page-btn" @click="goToSchedPage(1)">1</button>
          <span v-if="schedPageRange[0] > 2" class="text-muted" style="padding:0 4px;">…</span>
          <button v-for="p in schedPageRange" :key="p" class="page-btn" :class="{ active: p === schedCurrentPage }" @click="goToSchedPage(p)">{{ p }}</button>
          <span v-if="schedPageRange[schedPageRange.length-1] < totalSchedPages - 1" class="text-muted" style="padding:0 4px;">…</span>
          <button v-if="schedPageRange[schedPageRange.length-1] < totalSchedPages" class="page-btn" @click="goToSchedPage(totalSchedPages)">{{ totalSchedPages }}</button>
          <button class="page-btn" :disabled="schedCurrentPage === totalSchedPages" @click="goToSchedPage(schedCurrentPage + 1)">›</button>
        </div>
      </div>
    </div>

    <!-- Modal Form: PENGELUARAN (EXPENSES) -->
    <div v-if="isModalExpenseOpen" class="modal-overlay">
      <div class="modal-content glass-panel" style="max-width: 500px;">
        <h3>Catat Pengeluaran: {{ activeExpenseSchedule?.crop?.name }}</h3>
        
        <!-- List Pengeluaran Sebelumnya -->
        <div v-if="activeExpenseSchedule?.expenses?.length > 0" style="margin-bottom: 1.5rem; max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: var(--radius-md);">
          <div v-for="e in activeExpenseSchedule.expenses" :key="e.id" style="display: flex; flex-direction: column; padding-bottom: 0.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>{{ e.description }}</span>
              <span style="color: #fca5a5; font-weight: bold;">Rp {{ new Intl.NumberFormat('id-ID').format(e.amountRupiah) }}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.3rem;">
              <button style="background: none; border: none; color: #60a5fa; cursor: pointer; font-size: 0.8rem; padding: 0;" @click="startEditExpense(e)">✏️ Edit</button>
              <button style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem; padding: 0;" @click="deleteExpense(e.id)">🗑️ Hapus</button>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 0.5rem;">
            <span>Total Pengeluaran:</span>
            <span style="color: #ef4444;">Rp {{ new Intl.NumberFormat('id-ID').format(activeExpenseSchedule.totalExpensesRupiah) }}</span>
          </div>
        </div>
        <p v-else class="text-muted" style="margin-bottom: 1.5rem; font-size: 0.9rem;">Belum ada pengeluaran tercatat.</p>

        <form @submit.prevent="submitExpense">
          <div class="form-group">
            <label class="form-label">Deskripsi Pengeluaran</label>
            <input type="text" v-model="formExpense.description" class="form-input" placeholder="Contoh: Beli Benih, Obat Hama..." required />
          </div>
          <div class="form-group">
            <label class="form-label">Nominal (Rp)</label>
            <input type="number" v-model="formExpense.amountRupiah" class="form-input" placeholder="Contoh: 150000" required />
          </div>
          <div class="modal-actions" style="justify-content: space-between; display: flex;">
            <div>
              <button v-if="editingExpenseId" type="button" class="btn btn-secondary-outline" style="border: 1px solid var(--text-muted); padding: 0.5rem 1rem; border-radius: var(--radius-md); color: white; cursor: pointer; background: transparent;" @click="cancelEditExpense">Batal Edit</button>
            </div>
            <div style="display: flex; gap: 1rem;">
              <button type="button" class="btn btn-secondary-outline" style="border: 1px solid var(--text-muted); padding: 0.5rem 1rem; border-radius: var(--radius-md); color: white; cursor: pointer; background: transparent;" @click="isModalExpenseOpen = false">Tutup</button>
              <button type="submit" class="btn" style="background: var(--warning-color); color: #1e293b; font-weight: bold;">{{ editingExpenseId ? 'Update Biaya' : 'Tambah Biaya' }}</button>
            </div>
          </div>
        </form>
      </div>
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

    <!-- Modal Form: EDIT JADWAL AWAL -->
    <div v-if="isModalEditBaseOpen" class="modal-overlay" @click="closeDropdown">
      <div class="modal-content glass-panel" @click.stop>
        <h3>Edit Jadwal Tanam</h3>
        <form @submit.prevent="submitEditBase">
          <div class="form-group" style="position: relative;">
            <label class="form-label">Pilih Tanaman (Komoditas)</label>
            <input 
              type="text" 
              v-model="editCropSearch" 
              @focus="isCropDropdownOpen = true"
              @input="handleSearchInput"
              class="form-input" 
              placeholder="Ketik nama tanaman..." 
              required 
            />
            <ul v-if="isCropDropdownOpen && filteredCrops.length > 0" class="dropdown-list">
              <li v-for="c in filteredCrops" :key="c.id" @click="formEditBase.cropId = c.id; editCropSearch = c.name; isCropDropdownOpen = false">
                {{ c.name }} <span class="text-muted" style="font-size: 0.8rem;">(Panen: {{ c.durationDays }}hr)</span>
              </li>
            </ul>
          </div>

          <div class="form-group">
            <label class="form-label">Luas Lahan (Hektar)</label>
            <input type="number" step="0.01" v-model="formEditBase.areaSizeInHa" class="form-input" placeholder="Misal: 0.5" required />
          </div>

          <div class="form-group">
            <label class="form-label">Tanggal Tanam</label>
            <input type="date" v-model="formEditBase.plantDate" class="form-input" required />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary-outline" @click="isModalEditBaseOpen = false">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
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
