<script setup>
import { ref, onMounted, nextTick } from 'vue';
import api from '../api';
import { toast } from 'vue3-toastify';
import Swal from 'sweetalert2';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons issues in Vue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Selected Icon (Blue/Default) vs Unselected (Green)
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const unselectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const bookings = ref([]);
const isModalOpen = ref(false);
const editingBookingId = ref(null);

const form = ref({
  blockName: '',
  bookingDate: '',
  startTime: '',
  endTime: '',
  durationHours: 4,
  targetUserId: null
});

const todayDate = ref(new Date().toISOString().split('T')[0]);

const startH = ref('08');
const startM = ref('00');
const endH = ref('12');
const endM = ref('00');

const updateTimeForm = () => {
  form.value.startTime = `${startH.value}:${startM.value}`;
  form.value.endTime = `${endH.value}:${endM.value}`;
  onTimeChange();
};

const allowedDays = ref([]);     // [2, 5] = Selasa & Jumat
const allowedSlots = ref([]);    // seluruh data slot

const userRole = ref('');
const userId = ref(null);
const userFields = ref([]);

let map = null;
let markers = [];

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  userRole.value = user?.role;
  userId.value = user?.id;
  fetchBookings();
});

const fetchBookings = async () => {
  try {
    const res = await api.get('/water-bookings');
    bookings.value = res.data.data;
  } catch (err) {
    console.error(err);
  }
};

const preloadBookingData = async () => {
  // Ambil jadwal irigasi yang aktif
  try {
    const res = await api.get('/irrigation-settings');
    const active = res.data.data.filter(s => s.isActive);
    allowedSlots.value = active;
    allowedDays.value = [...new Set(active.map(s => s.dayOfWeek))];
  } catch (err) {
    console.error('Gagal memuat jadwal irigasi');
  }
  
  if (userRole.value === 'PETANI') {
    // Fetch only this farmer's fields
    try {
      const res = await api.get(`/users/${userId.value}`);
      userFields.value = res.data.data.fields || [];
    } catch (err) {
      console.error("Gagal memuat sawah petani");
    }
  } else if (userRole.value === 'ADMIN') {
    // Fetch all users and aggregate all fields
    try {
      const res = await api.get(`/users`);
      const allUsers = res.data.data;
      let allFields = [];
      allUsers.forEach(u => {
        if (u.fields) {
          u.fields.forEach(f => {
            f.ownerName = u.name;
            f.userId = u.id;
            allFields.push(f);
          });
        }
      });
      userFields.value = allFields;
    } catch (err) {
      console.error("Gagal memuat seluruh sawah");
    }
  }

  // Initialize Map
  nextTick(() => {
    setTimeout(() => {
      initMap();
    }, 300);
  });
};

const openBookingModal = async () => {
  editingBookingId.value = null;
  isModalOpen.value = true;
  startH.value = '08';
  startM.value = '00';
  endH.value = '12';
  endM.value = '00';
  form.value = { blockName: '', bookingDate: '', startTime: '08:00', endTime: '12:00', durationHours: 4, targetUserId: null };

  await preloadBookingData();
};

const openEditBookingModal = async (b) => {
  editingBookingId.value = b.id;
  isModalOpen.value = true;
  form.value = { 
    blockName: b.blockName, 
    bookingDate: new Date(b.bookingDate).toISOString().split('T')[0], 
    startTime: b.startTime, 
    endTime: b.endTime, 
    durationHours: b.durationHours, 
    targetUserId: b.userId 
  };
  
  const [sh, sm] = b.startTime.split(':');
  startH.value = sh; startM.value = sm;
  const [eh, em] = b.endTime.split(':');
  endH.value = eh; endM.value = em;

  await preloadBookingData();
};

const closeBookingModal = () => {
  isModalOpen.value = false;
  editingBookingId.value = null;
  if (map) {
    map.remove();
    map = null;
  }
};

const initMap = () => {
  if (map) {
    map.remove();
    markers = [];
  }
  
  // Default to Watuduwur Wangkal
  let centerLat = -7.6745678;
  let centerLng = 112.1714602;

  // If user has fields, center on the first one
  if (userFields.value.length > 0) {
    centerLat = userFields.value[0].latitude;
    centerLng = userFields.value[0].longitude;
  }

  const bounds = [
    [-7.6850, 112.1600], // South-West
    [-7.6600, 112.1850]  // North-East
  ];

  map = L.map('booking-map', {
    maxBounds: bounds,
    maxBoundsViscosity: 1.0, 
    minZoom: 15 
  }).setView([centerLat, centerLng], 16); 
  
  L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: '© Google Maps'
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 100);

  // Plot User's Fields
  userFields.value.forEach(field => {
    const m = L.marker([field.latitude, field.longitude], { icon: unselectedIcon }).addTo(map);
    
    // Beda popup untuk Admin dan Petani
    const popupText = userRole.value === 'ADMIN' 
      ? `<b>${field.name}</b><br>Milik: ${field.ownerName}<br>Klik untuk pilih`
      : `<b>${field.name}</b><br>Klik untuk memilih sawah ini`;

    m.bindPopup(popupText);
    
    m.on('click', () => {
      // Set form value
      form.value.blockName = field.name;
      form.value.targetUserId = field.userId || userId.value;
      
      // Reset all markers to green
      markers.forEach(markerObj => markerObj.marker.setIcon(unselectedIcon));
      // Set this one to blue
      m.setIcon(selectedIcon);
      
      toast.info(`Sawah "${field.name}" terpilih!`, { autoClose: 2000 });
    });
    
    markers.push({ id: field.id, marker: m });
  });
};

const submitBooking = async () => {
  if (!form.value.blockName) {
    await Swal.fire({
      title: 'Pilih Sawah Dulu!',
      text: 'Silakan pilih titik sawah Anda dari peta di sebelah kanan sebelum mengajukan booking.',
      icon: 'warning',
      confirmButtonText: 'Oke Mengerti',
      confirmButtonColor: '#3b82f6',
      background: '#0f172a',
      color: '#fff'
    });
    return;
  }
  
  if (!form.value.startTime || !form.value.endTime) {
    toast.error('Jam mulai dan jam selesai harus diisi!');
    return;
  }

  try {
    // Hitung durationHours dari start dan end time untuk keperluan backend database
    const [sH, sM] = form.value.startTime.split(':');
    const [eH, eM] = form.value.endTime.split(':');
    const startMins = parseInt(sH) * 60 + parseInt(sM);
    const endMins = parseInt(eH) * 60 + parseInt(eM);
    const diffMins = endMins - startMins;
    
    if (diffMins <= 0) {
      toast.error('Jam selesai harus lebih besar dari jam mulai!');
      return;
    }
    
    // Validasi jam untuk HARI INI
    if (form.value.bookingDate === todayDate.value) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      if (startMins <= currentMins) {
        await Swal.fire({
          title: 'Jam Sudah Lewat',
          text: 'Anda tidak bisa mem-booking jam yang sudah berlalu untuk hari ini.',
          icon: 'error',
          confirmButtonText: 'Oke',
          confirmButtonColor: '#3b82f6',
          background: '#0f172a',
          color: '#fff'
        });
        return;
      }
    }
    
    // Validasi Slot Irigasi
    const slots = slotsForSelectedDay();
    if (slots.length > 0) {
      const isAllowed = slots.some(slot => {
        return startMins >= toMins(slot.startTime) && endMins <= toMins(slot.endTime);
      });

      if (!isAllowed) {
        const slotList = slots.map(s =>
          `<li><strong>${s.startTime} – ${s.endTime} WIB</strong>${s.description ? ' (' + s.description + ')' : ''}</li>`
        ).join('');
        await Swal.fire({
          title: '⏰ Jam Di Luar Slot Irigasi',
          html: `Jam yang dipilih tidak masuk dalam slot yang diizinkan.<br><br>Slot tersedia hari ini:<ul style="text-align:left;margin-top:8px;color:#34d399;">${slotList}</ul>`,
          icon: 'error',
          confirmButtonText: 'Pilih Lagi',
          confirmButtonColor: '#3b82f6',
          background: '#0f172a',
          color: '#fff'
        });
        return;
      }
    }
    
    form.value.durationHours = Math.ceil(diffMins / 60);

    if (editingBookingId.value) {
      await api.put(`/water-bookings/${editingBookingId.value}`, form.value);
      toast.success('Booking berhasil diupdate!');
    } else {
      await api.post('/water-bookings', form.value);
      toast.success('Booking berhasil diajukan!');
    }
    
    closeBookingModal();
    if (map) { map.remove(); map = null; }
    
    fetchBookings();
    toast.success('Booking berhasil diajukan!');
  } catch (err) {
    const errMsg = err.response?.data?.message || 'Gagal booking';
    await Swal.fire({
      title: 'Booking Ditolak',
      text: errMsg,
      icon: 'error',
      confirmButtonText: 'Oke',
      confirmButtonColor: '#3b82f6',
      background: '#0f172a',
      color: '#fff'
    });
  }
};

const finishEarly = async (id) => {
  const result = await Swal.fire({
    title: 'Selesai Lebih Awal?',
    text: 'Yakin ingin menyelesaikan pengairan lebih awal? Slot akan bebas kembali untuk orang lain.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Selesai',
    cancelButtonText: 'Batal',
    background: '#0f172a',
    color: '#fff'
  });

  if (result.isConfirmed) {
    try {
      await api.put(`/water-bookings/${id}/finish`);
      fetchBookings();
      toast.info('Pengairan selesai lebih awal.');
    } catch(err) {
      toast.error('Gagal menyelesaikan pengairan');
    }
  }
};

const deleteBooking = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Booking?',
    text: "Data booking ini akan dihapus permanen.",
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
      await api.delete(`/water-bookings/${id}`);
      fetchBookings();
      Swal.fire({ title: 'Terhapus', icon: 'success', background: '#0f172a', color: '#fff' });
    } catch(err) { 
      toast.error(err.response?.data?.message || 'Gagal menghapus booking'); 
    }
  }
};

const updateStatus = async (id, status) => {
  try {
    let reason = '';
    if (status === 'REJECTED') {
      const result = await Swal.fire({
        title: 'Tolak Booking',
        input: 'text',
        inputLabel: 'Alasan penolakan',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Tolak',
        cancelButtonText: 'Batal',
        background: '#0f172a',
        color: '#fff'
      });
      if (!result.isConfirmed) return;
      reason = result.value;
    } else {
      const result = await Swal.fire({
        title: 'Setujui Booking?',
        text: 'Booking air ini akan disetujui.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Setujui',
        cancelButtonText: 'Batal',
        background: '#0f172a',
        color: '#fff'
      });
      if (!result.isConfirmed) return;
    }

    await api.put(`/water-bookings/${id}/status`, { status, reason });
    toast.success(`Booking berhasil di${status === 'APPROVED' ? 'setujui' : 'tolak'}`);
    fetchBookings();
  } catch (err) {
    const errMsg = err.response?.data?.message || 'Gagal memperbarui status';
    await Swal.fire({
      title: 'Persetujuan Dibatalkan',
      text: errMsg,
      icon: 'error',
      confirmButtonText: 'Oke Mengerti',
      confirmButtonColor: '#3b82f6',
      background: '#0f172a',
      color: '#fff'
    });
    fetchBookings(); // Refresh untuk melihat perubahan otomatis (seperti auto-reject)
  }
};

const showRejectReason = (reason) => {
  Swal.fire({
    title: 'Alasan Penolakan',
    text: reason,
    icon: 'info',
    confirmButtonText: 'Tutup',
    confirmButtonColor: '#3b82f6',
    background: '#0f172a',
    color: '#fff'
  });
};

// Validasi hari saat tanggal dipilih
const onDateChange = async () => {
  if (!form.value.bookingDate) return;

  const selected = new Date(form.value.bookingDate + 'T00:00:00');
  const dayOfWeek = selected.getDay();

  // Jika tidak ada slot aktif sama sekali
  if (allowedDays.value.length === 0) {
    await Swal.fire({
      title: 'Belum Ada Jadwal Irigasi',
      text: 'Admin belum menetapkan jadwal irigasi. Silakan hubungi petugas desa.',
      icon: 'warning',
      confirmButtonText: 'Oke',
      background: '#0f172a',
      color: '#fff'
    });
    form.value.bookingDate = '';
    return;
  }

  if (!allowedDays.value.includes(dayOfWeek)) {
    const namaHariDiizinkan = allowedDays.value.map(d => HARI[d]).join(', ');
    await Swal.fire({
      title: `❌ Hari ${HARI[dayOfWeek]} Tidak Diizinkan`,
      html: `Booking irigasi hanya bisa dilakukan pada:<br><br><strong style="color:#34d399; font-size:1.1rem;">${namaHariDiizinkan}</strong><br><br>Silakan pilih tanggal yang sesuai.`,
      icon: 'error',
      confirmButtonText: 'Pilih Lagi',
      confirmButtonColor: '#3b82f6',
      background: '#0f172a',
      color: '#fff'
    });
    form.value.bookingDate = '';
    // Reset jam juga saat tanggal tidak valid
    form.value.startTime = '';
    form.value.endTime = '';
  }
};

// Helper
const toMins = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':');
  return parseInt(h) * 60 + parseInt(m);
};

// Slot yang aktif untuk hari yang dipilih
const slotsForSelectedDay = () => {
  if (!form.value.bookingDate) return [];
  const day = new Date(form.value.bookingDate + 'T00:00:00').getDay();
  return allowedSlots.value.filter(s => s.dayOfWeek === day);
};

// Validasi jam saat dipilih dihapus (dipindah ke submitBooking agar tidak mengganggu UI)
const onTimeChange = async () => {
  // Biarkan kosong agar tidak muncul popup saat dropdown berubah
};
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Jadwal Irigasi Sawah</h2>
        <p class="text-muted">Pantau dan kelola jadwal giliran aliran air.</p>
      </div>
      <button class="btn btn-primary" @click="openBookingModal">+ Booking Air</button>
    </div>

    <!-- Table -->
    <div class="glass-panel overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Petani</th>
            <th>Blok Sawah</th>
            <th>Tanggal</th>
            <th>Jam</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="bookings.length === 0">
            <td colspan="6" class="text-center py-4">Belum ada data booking.</td>
          </tr>
          <tr v-for="b in bookings" :key="b.id">
            <td>{{ b.user?.name }}</td>
            <td>{{ b.blockName }}</td>
            <td>{{ new Date(b.bookingDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</td>
            <td>{{ b.startTime }} WIB - {{ b.endTime }} WIB</td>
            <td>
              <span :class="['badge', b.status.toLowerCase()]">{{ b.status }}</span>
            </td>
            <td>
              <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                <button 
                  v-if="userRole === 'ADMIN' && b.status === 'PENDING'" 
                  @click="updateStatus(b.id, 'APPROVED')" 
                  class="btn-action success">
                  Setujui
                </button>
                <button 
                  v-if="userRole === 'ADMIN' && b.status === 'PENDING'" 
                  @click="updateStatus(b.id, 'REJECTED')" 
                  class="btn-action danger" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid #ef4444;">
                  Tolak
                </button>
                
                <button 
                  v-if="b.status === 'APPROVED'" 
                  @click="finishEarly(b.id)" 
                  class="btn-action success">
                  Selesai
                </button>

                <!-- EDIT / HAPUS -->
                <template v-if="(userRole === 'ADMIN' && b.status !== 'FINISHED') || (userRole === 'PETANI' && b.status !== 'APPROVED' && b.status !== 'FINISHED' && b.status !== 'REJECTED' && userId === b.userId)">
                  <button 
                    @click="openEditBookingModal(b)" 
                    class="btn-action" style="background: transparent; color: var(--text-muted); border: 1px solid var(--text-muted);">
                    Edit
                  </button>
                  <button 
                    @click="deleteBooking(b.id)" 
                    class="btn-action danger" style="background: transparent; color: #ef4444; border: 1px solid #ef4444;">
                    Hapus
                  </button>
                </template>

                <button 
                  v-if="b.status === 'REJECTED' && b.reason" 
                  @click="showRejectReason(b.reason)" 
                  class="btn-action" style="background: transparent; color: #fca5a5; border: 1px solid #fca5a5;">
                  ℹ️ Info Tolak
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Booking -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal-content glass-panel" style="max-width: 900px;">
        <h3>Form Booking Air Sawah</h3>
        
        <form @submit.prevent="submitBooking">
          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem;">
            
            <!-- Kolom Kiri: Input Jam -->
            <div>
              <div class="form-group">
                <label class="form-label">Sawah Terpilih</label>
                <input type="text" v-model="form.blockName" class="form-input" placeholder="Pilih dari peta di sebelah kanan ➡️" disabled required style="background: rgba(255,255,255,0.05); color: #34d399; font-weight: bold;" />
              </div>

              <div class="form-group">
                <label class="form-label">Tanggal Pengairan</label>
                <input type="date" v-model="form.bookingDate" :min="todayDate" @change="onDateChange" class="form-input" required />
                <!-- Info hari yang diizinkan -->
                <div v-if="allowedDays.length > 0" style="margin-top: 6px; font-size: 0.8rem;">
                  <span style="color: #34d399;">✅ Hari diizinkan: </span>
                  <span v-for="(day, idx) in allowedDays" :key="day" style="color: #94a3b8;">
                    {{ HARI[day] }}{{ idx < allowedDays.length - 1 ? ', ' : '' }}
                  </span>
                </div>
                <div v-if="allowedDays.length === 0" style="margin-top: 6px; font-size: 0.8rem; color: #f87171;">
                  ⚠️ Belum ada jadwal irigasi aktif. Hubungi Admin.
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Jam Mulai (WIB)</label>
                <div style="display: flex; gap: 5px; align-items: center;">
                  <select v-model="startH" @change="updateTimeForm" class="form-input" style="padding: 0.5rem;"><option v-for="h in 24" :key="'sh'+h" :value="String(h-1).padStart(2,'0')">{{String(h-1).padStart(2,'0')}}</option></select>
                  <span>:</span>
                  <select v-model="startM" @change="updateTimeForm" class="form-input" style="padding: 0.5rem;"><option v-for="m in 60" :key="'sm'+m" :value="String(m-1).padStart(2,'0')">{{String(m-1).padStart(2,'0')}}</option></select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Jam Selesai (WIB)</label>
                <div style="display: flex; gap: 5px; align-items: center;">
                  <select v-model="endH" @change="updateTimeForm" class="form-input" style="padding: 0.5rem;"><option v-for="h in 24" :key="'eh'+h" :value="String(h-1).padStart(2,'0')">{{String(h-1).padStart(2,'0')}}</option></select>
                  <span>:</span>
                  <select v-model="endM" @change="updateTimeForm" class="form-input" style="padding: 0.5rem;"><option v-for="m in 60" :key="'em'+m" :value="String(m-1).padStart(2,'0')">{{String(m-1).padStart(2,'0')}}</option></select>
                </div>
                <!-- Info slot jam hari yang dipilih -->
                <div v-if="form.bookingDate && slotsForSelectedDay().length > 0" style="margin-top: 6px; font-size: 0.8rem;">
                  <span style="color: #34d399;">⏰ Slot tersedia: </span>
                  <span v-for="(slot, idx) in slotsForSelectedDay()" :key="slot.id" style="color: #94a3b8;">
                    {{ slot.startTime }}–{{ slot.endTime }} WIB{{ idx < slotsForSelectedDay().length - 1 ? ', ' : '' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Kolom Kanan: Peta -->
            <div>
              <label class="form-label">Pilih Sawah (Klik Pin)</label>
              <div v-if="userFields.length === 0" class="text-muted" style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;">
                Belum ada titik sawah yang terdaftar di sistem.
              </div>
              <div v-else id="booking-map" style="height: 350px; width: 100%; border-radius: 8px; border: 1px solid var(--border-color); z-index: 1;"></div>
            </div>

          </div>

          <div class="modal-actions" style="margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary-outline" style="border: 1px solid var(--text-muted); color: var(--text-muted); background: transparent;" @click="closeBookingModal">Batal</button>
            <button type="submit" class="btn btn-primary">Ajukan Booking</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-pane) { z-index: 1; }
:deep(.leaflet-top), :deep(.leaflet-bottom) { z-index: 10; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.text-muted { color: var(--text-muted); }
.py-4 { padding-top: 2rem; padding-bottom: 2rem; }
.text-center { text-align: center; }

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

/* Action Buttons */
.btn-action {
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-md);
  border: none;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}
.btn-action.success {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}
.btn-action.success:hover {
  background: rgba(16, 185, 129, 0.4);
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
  padding: 2rem;
  max-height: 95vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
