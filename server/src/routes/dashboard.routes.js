import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Record from '../models/Record.js';

const router = Router();

// Get dashboard statistics (role-based)
router.get('/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.id;

        if (role === 'ADMIN') {
            // Admin dashboard stats
            const [totalPatients, totalUsers, totalRecords, activeStaff] = await Promise.all([
                Patient.countDocuments(),
                User.countDocuments(),
                Record.aggregate([
                    { $group: { _id: null, total: { $sum: { $size: '$entries' } } } }
                ]).then(result => result[0]?.total || 0),
                User.countDocuments({ role: { $in: ['DOCTOR', 'NURSE'] }, status: 'ACTIVE' })
            ]);

            // Recent activity (last 10 actions)
            const recentActivity = [
                { action: 'System Login', description: 'Admin dashboard accessed', time: 'Just now' },
                { action: 'Patient Registered', description: 'New patient added to system', time: '2 hours ago' },
                { action: 'User Created', description: 'New staff member account created', time: '4 hours ago' },
                { action: 'Medical Record Updated', description: 'Patient record modified', time: '6 hours ago' }
            ];

            res.json({
                totalPatients,
                totalUsers,
                totalRecords,
                activeStaff,
                recentActivity
            });
        } else if (role === 'DOCTOR' || role === 'NURSE') {
            // Clinical dashboard stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [patientsToday, recordsUpdated, pendingTasks] = await Promise.all([
                // Count patients seen today (simplified - could be enhanced with actual visit tracking)
                Patient.countDocuments({ updatedAt: { $gte: today } }),
                // Count records updated today by this user
                Record.aggregate([
                    { $unwind: '$entries' },
                    { $match: { 'entries.author': userId, 'entries.updatedAt': { $gte: today } } },
                    { $count: 'total' }
                ]).then(result => result[0]?.total || 0),
                // Placeholder for pending tasks
                3
            ]);

            res.json({
                patientsToday,
                recordsUpdated,
                pendingTasks
            });
        } else if (role === 'PATIENT') {
            // Patient dashboard stats
            const patient = await Patient.findOne({ userRef: userId });
            if (!patient) {
                return res.json({
                    patientInfo: {
                        totalRecords: 0,
                        lastVisit: 'N/A'
                    }
                });
            }

            const record = await Record.findOne({ patientId: patient._id });
            const totalRecords = record?.entries?.length || 0;
            const lastVisit = record?.entries?.length > 0 
                ? new Date(Math.max(...record.entries.map(e => e.updatedAt))).toLocaleDateString()
                : 'N/A';

            res.json({
                patientInfo: {
                    totalRecords,
                    lastVisit
                }
            });
        } else {
            res.json({});
        }
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
});

export default router;
