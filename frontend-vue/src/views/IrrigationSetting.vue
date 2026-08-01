<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import { toast } from 'vue3-toastify';
import Swal from 'sweetalert2';

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const settings = ref([]);
const isModalOpen = ref(false);
const form = ref({
  dayOfWeek: 1,
  startTime: '',
  endTime: '',
  description: ''
});

const startH = ref('06');
const startM = ref('00');
const endH = ref('18');
const endM = ref('00');

onMounted(() => {
  fetchSettings();
});

const fetchSettings = async () => {
  try {
    const res = await api.get('/irrigation-settings');
    settings.value = res.data.data;
  } catch (err) {
    toast.error('Gagal memuat pengaturan jadwal');
  }
};

const submitSetting = async () => {
  try {
    form.value.startTime = `${startH.value}:${startM.value}`;
    form.value.endTime = `${endH.value}:${endM.value}`;
    
    await api.post('/irrigation-settings', form.value);
    toast.success('Slot jadwal berhasil ditambahkan');
    isModalOpen.value = false;
    fetchSettings();
    form.value = { dayOfWeek: 1, startTime: '', endTime: '', description: '' };
    startH.value = '06'; startM.value = '00';
    endH.value = '18'; endM.value = '00';
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menyimpan');
  }
};

const deleteSetting = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Slot Jadwal?',
    text: 'Slot ini akan dihapus permanen dari jadwal irigasi.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Hapus',
    cancelButtonText: 'Batal',
    background: '#0f172a',
    color: '#fff'
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/irrigation-settings/${id}`);
      toast.success('Slot berhasil dihapus');
      fetchSettings();
    } catch (err) {
      toast.error('Gagal menghapus slot');
    }
  }
};

// Kelompokkan berdasarkan hari
const groupedByDay = (day) => settings.value.filter(s => s.dayOfWeek === day);
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>⚙️ Jadwal Irigasi Master</h2>
        <p class="text-muted">Atur hari dan jam yang diizinkan untuk booking air. Petani hanya bisa booking sesuai slot ini.</p>
      </div>
      <button class="btn btn-primary" @click="isModalOpen = true">+ Tambah Slot</button>
    </div>

    <!-- Grid Hari -->
    <div class="days-grid">
      <div v-for="day in 7" :key="day - 1" class="day-card glass-panel">
        <div class="day-header" :class="{ 'day-has-slots': groupedByDay(day - 1).length > 0 }">
          <span class="day-name">{{ HARI[day - 1] }}</span>
          <span class="slot-count" v-if="groupedByDay(day - 1).length > 0">{{ groupedByDay(day - 1).length }} Slot</span>
        </div>

        <div v-if="groupedByDay(day - 1).length === 0" class="no-slot text-muted">
          Tidak ada slot
        </div>

        <div v-for="slot in groupedByDay(day - 1)" :key="slot.id" class="slot-item slot-active">
          <div class="slot-time">
            🕐 {{ slot.startTime }} WIB – {{ slot.endTime }} WIB
          </div>
          <div class="slot-desc text-muted" v-if="slot.description">{{ slot.description }}</div>
          <div class="slot-actions">
            <button @click="deleteSetting(slot.id)" class="btn-del">🗑 Hapus</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Tambah Slot -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal-content glass-panel">
        <h3>➕ Tambah Slot Jadwal Irigasi</h3>
        <form @submit.prevent="submitSetting">
          <div class="form-group">
            <label class="form-label">Hari</label>
            <select v-model="form.dayOfWeek" class="form-input">
              <option v-for="(nama, idx) in HARI" :key="idx" :value="idx">{{ nama }}</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Jam Mulai (WIB)</label>
              <div style="display: flex; gap: 5px; align-items: center;">
                <select v-model="startH" class="form-input" style="padding: 0.5rem;"><option v-for="h in 24" :key="'sh'+h" :value="String(h-1).padStart(2,'0')">{{String(h-1).padStart(2,'0')}}</option></select>
                <span>:</span>
                <select v-model="startM" class="form-input" style="padding: 0.5rem;"><option v-for="m in 60" :key="'sm'+m" :value="String(m-1).padStart(2,'0')">{{String(m-1).padStart(2,'0')}}</option></select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Jam Selesai (WIB)</label>
              <div style="display: flex; gap: 5px; align-items: center;">
                <select v-model="endH" class="form-input" style="padding: 0.5rem;"><option v-for="h in 24" :key="'eh'+h" :value="String(h-1).padStart(2,'0')">{{String(h-1).padStart(2,'0')}}</option></select>
                <span>:</span>
                <select v-model="endM" class="form-input" style="padding: 0.5rem;"><option v-for="m in 60" :key="'em'+m" :value="String(m-1).padStart(2,'0')">{{String(m-1).padStart(2,'0')}}</option></select>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Keterangan (Opsional)</label>
            <input type="text" v-model="form.description" class="form-input" placeholder="Contoh: Giliran Blok Timur" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="isModalOpen = false" style="border: 1px solid var(--text-muted); color: var(--text-muted); background: transparent; padding: 0.5rem 1.5rem; border-radius: var(--radius-md); cursor: pointer;">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Slot</button>
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

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.day-card {
  padding: 1.25rem;
  min-height: 120px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.day-name {
  font-weight: 700;
  font-size: 1.1rem;
}

.slot-count {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 20px;
}

.no-slot {
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem 0;
}

.slot-item {
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 3px solid;
}

.slot-active { 
  background: rgba(16, 185, 129, 0.08);
  border-left-color: #34d399;
}

.slot-inactive { 
  background: rgba(239, 68, 68, 0.05);
  border-left-color: #ef4444;
  opacity: 0.6;
}

.slot-time {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.slot-desc {
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.slot-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
}

.btn-del {
  background: transparent;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 20px;
  padding: 3px 10px;
  cursor: pointer;
  font-size: 0.75rem;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.btn-del:hover { 
  opacity: 1;
  background: rgba(239, 68, 68, 0.1);
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

.modal-content h3 { margin-bottom: 1.5rem; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
