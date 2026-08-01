<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

// Custom Icon for existing fields
const existingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const route = useRoute();
const router = useRouter();
const isEditing = ref(false);

const form = ref({
  id: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  fields: []
});

const newField = ref({
  name: '',
  address: 'Dsn Watuduwur Wangkal, Ds Tengger Lor',
  latitude: -7.6745678,
  longitude: 112.1714602
});

let map = null;
let newMarker = null;
let existingMarkers = [];

onMounted(() => {
  if (route.params.id) {
    isEditing.value = true;
    form.value.id = route.params.id;
    fetchUserDetails();
  }
});

const fetchUserDetails = async () => {
  try {
    const res = await api.get(`/users/${form.value.id}`);
    const user = res.data.data;
    form.value = {
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      fields: user.fields || []
    };
    
    setTimeout(() => {
      initMap();
    }, 300);
  } catch (err) {
    toast.error('Gagal memuat detail petani');
    router.push('/admin/users');
  }
};

const initMap = () => {
  if (map) {
    map.remove();
    existingMarkers = [];
  }
  
  // Batas wilayah presisi Dusun Watuduwur Wangkal
  const bounds = [
    [-7.6850, 112.1600], // South-West
    [-7.6600, 112.1850]  // North-East
  ];

  map = L.map('map', {
    maxBounds: bounds,
    maxBoundsViscosity: 1.0, 
    minZoom: 15 
  }).setView([newField.value.latitude, newField.value.longitude], 16); 
  
  // Menggunakan Google Satellite Hybrid (Satelit + Label Jalan)
  L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: '© Google Maps'
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 100);

  // Plot existing fields
  form.value.fields.forEach(f => {
    const m = L.marker([f.latitude, f.longitude], { icon: existingIcon }).addTo(map);
    m.bindPopup(`<b>${f.name}</b><br>${f.address}`);
    existingMarkers.push(m);
  });

  // Draggable marker for NEW field
  newMarker = L.marker([newField.value.latitude, newField.value.longitude], { draggable: true }).addTo(map);
  newMarker.bindPopup("<b>Sawah Baru</b><br>Geser saya untuk menentukan lokasi").openPopup();
  
  newMarker.on('dragend', function (e) {
    const latlng = newMarker.getLatLng();
    newField.value.latitude = latlng.lat;
    newField.value.longitude = latlng.lng;
  });

  map.on('click', function(e) {
    newMarker.setLatLng(e.latlng);
    newField.value.latitude = e.latlng.lat;
    newField.value.longitude = e.latlng.lng;
  });
};

const submitUserForm = async () => {
  try {
    if (isEditing.value) {
      await api.put(`/users/${form.value.id}`, form.value);
      toast.success('Profil petani berhasil diupdate');
      router.push('/admin/users');
    } else {
      const res = await api.post('/users', form.value);
      toast.success('Petani tersimpan! Silakan kelola lokasi sawahnya.');
      // Arahkan otomatis ke mode EDIT agar bisa tambah peta
      router.push(`/admin/users/${res.data.data.id}/edit`);
      
      // Update state manual karena Vue Router me-reuse komponen yang sama
      isEditing.value = true;
      form.value.id = res.data.data.id;
      fetchUserDetails();
      
      return;
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal menyimpan data');
  }
};

const submitNewField = async () => {
  if (!newField.value.name) {
    toast.error('Nama sawah harus diisi!');
    return;
  }
  try {
    await api.post(`/users/${form.value.id}/fields`, newField.value);
    toast.success('Sawah baru berhasil ditambahkan');
    
    // Refresh user fields
    fetchUserDetails();
    
    // Reset newField
    newField.value.name = '';
  } catch (err) {
    toast.error('Gagal menambahkan sawah');
  }
};

const deleteField = async (fieldId) => {
  const result = await Swal.fire({
    title: 'Hapus Sawah?',
    text: "Sawah ini akan dihapus dari daftar milik petani.",
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
      await api.delete(`/users/fields/${fieldId}`);
      toast.success('Sawah dihapus');
      fetchUserDetails();
    } catch (err) {
      toast.error('Gagal menghapus sawah');
    }
  }
};

const goBack = () => {
  router.push('/admin/users');
};
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>{{ isEditing ? 'Edit Data & Kelola Sawah' : 'Tambah Petani Baru' }}</h2>
        <p class="text-muted">Lengkapi profil pengguna dan identifikasi lahan sawah mereka.</p>
      </div>
      <button class="btn btn-secondary-outline" style="border: 1px solid var(--text-muted); color: var(--text-muted); background: transparent;" @click="goBack">← Kembali</button>
    </div>

    <div class="glass-panel" style="padding: 2rem;">
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 3rem;">
        
        <!-- Left Column: Data Diri -->
        <div>
          <form @submit.prevent="submitUserForm" autocomplete="off">
            <h4 style="margin-bottom: 1rem;">Informasi Petani</h4>
            <div class="form-group">
              <label class="form-label">Nama Lengkap</label>
              <input type="text" v-model="form.name" class="form-input" autocomplete="off" required />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" v-model="form.email" class="form-input" :disabled="isEditing" autocomplete="new-email" required />
            </div>
            <div class="form-group" v-if="!isEditing">
              <label class="form-label">Password</label>
              <input type="password" v-model="form.password" class="form-input" autocomplete="new-password" required />
            </div>
            <div class="form-group">
              <label class="form-label">No. Telepon / WhatsApp</label>
              <input type="text" v-model="form.phone" class="form-input" />
            </div>
            <div style="margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary" style="width: 100%;">{{ isEditing ? 'Update Profil & Kembali' : 'Simpan & Lanjut Kelola Sawah' }}</button>
            </div>
          </form>
        </div>

        <!-- Right Column: Maps & Fields (Only if Editing) -->
        <div v-if="isEditing" style="border-left: 1px solid var(--border-color); padding-left: 3rem;">
          <h4 style="margin-bottom: 1rem;">Daftar Sawah Milik {{ form.name }}</h4>
          
          <!-- List of existing fields -->
          <div v-if="form.fields.length > 0" style="margin-bottom: 2rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div v-for="field in form.fields" :key="field.id" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border-left: 4px solid #34d399; position: relative;">
                <strong style="font-size: 1.1rem; display: block; margin-bottom: 0.5rem;">📍 {{ field.name }}</strong>
                <span class="text-muted" style="font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">{{ field.address }}</span>
                <span class="text-muted" style="font-size: 0.75rem; font-family: monospace;">{{ field.latitude.toFixed(5) }}, {{ field.longitude.toFixed(5) }}</span>
                
                <button class="btn btn-secondary-outline" style="position: absolute; top: 15px; right: 15px; border: 1px solid var(--danger-color); color: var(--danger-color); background: transparent; font-size: 0.75rem; padding: 4px 8px;" @click="deleteField(field.id)">Hapus</button>
              </div>
            </div>
          </div>
          <div v-else class="text-muted" style="margin-bottom: 2rem; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 8px; text-align: center;">
            Petani ini belum memiliki sawah yang terdaftar.
          </div>

          <!-- Map and Add Field Form -->
          <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px;">
            <h5 style="margin-bottom: 1rem;">➕ Tambah Petak Sawah Baru</h5>
            <div id="map" style="height: 500px; width: 100%; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px; z-index: 1;"></div>
            
            <div style="display: flex; gap: 15px; align-items: flex-end;">
              <div class="form-group" style="flex: 2; margin-bottom: 0;">
                <label class="form-label">Nama Sawah (Misal: Blok Utara)</label>
                <input type="text" v-model="newField.name" class="form-input" placeholder="Ketik nama blok..." />
              </div>
              <div class="form-group" style="flex: 2; margin-bottom: 0;">
                <label class="form-label">Alamat / Dusun</label>
                <input type="text" v-model="newField.address" class="form-input" />
              </div>
              <button class="btn btn-secondary" style="height: 44px; flex: 1; padding: 0;" @click="submitNewField">Simpan Titik</button>
            </div>
          </div>

        </div>
        <div v-else style="display: flex; align-items: center; justify-content: center; height: 100%; border-left: 1px solid var(--border-color);">
          <div class="text-center text-muted" style="padding: 3rem;">
            <span style="font-size: 4rem; display: block; margin-bottom: 1rem; opacity: 0.5;">🗺️</span>
            <h3>Kelola Koordinat Sawah</h3>
            <p>Silakan isi dan simpan profil petani terlebih dahulu di sebelah kiri.<br>Setelah tersimpan, Peta Satelit akan otomatis terbuka di sini.</p>
          </div>
        </div>
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
.text-emerald { color: #34d399; font-weight: 600; }
.text-center { text-align: center; }
</style>
