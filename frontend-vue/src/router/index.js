import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import Dashboard from '../views/Dashboard.vue';
import Schedule from '../views/Schedule.vue';
import WaterBooking from '../views/WaterBooking.vue';
import MarketPrice from '../views/MarketPrice.vue';
import UserManagement from '../views/UserManagement.vue';
import UserForm from '../views/UserForm.vue';
import IrrigationSetting from '../views/IrrigationSetting.vue';

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { guestOnly: true }
    },
    {
        path: '/',
        component: DashboardLayout,
        meta: { requiresAuth: true },
        children: [
            { path: 'dashboard', name: 'Dashboard', component: Dashboard },
            { path: 'schedules', name: 'Jadwal Tanam', component: Schedule },
            { path: 'water-bookings', name: 'Irigasi Sawah', component: WaterBooking },
            { path: 'admin/crops', name: 'Harga Pasar', component: MarketPrice },
            { path: 'admin/users', name: 'Data Petani', component: UserManagement },
            { path: 'admin/users/create', name: 'Tambah Petani', component: UserForm },
            { path: 'admin/users/:id/edit', name: 'Edit Petani', component: UserForm },
            { path: 'admin/irrigation-settings', name: 'Jadwal Irigasi Master', component: IrrigationSetting },
            { path: 'reports', name: 'Laporan', component: () => import('../views/Report.vue') },
            { path: 'profile', name: 'Profil Saya', component: () => import('../views/Profile.vue') }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Route Guard
router.beforeEach((to, from) => {
    const token = localStorage.getItem('token');

    if (to.meta.requiresAuth && !token) {
        return '/login';
    } else if (to.meta.guestOnly && token) {
        return '/dashboard';
    }
});

export default router;
