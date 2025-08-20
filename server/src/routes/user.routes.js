import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import bcrypt from 'bcrypt';

const router = Router();

// List users (ADMIN)
router.get('/users', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    const users = await User.find().select('name email role status createdAt');
    res.json({ users });
});

// Create user (ADMIN)
router.post('/users', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'Missing fields' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, role, passwordHash });

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
});

// Update role/status (ADMIN)
router.patch('/users/:id', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    const { id } = req.params;
    const { role, status, password } = req.body;

    const updates = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (password) updates.passwordHash = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
});

// Update own profile (any authenticated user)
router.patch('/users/profile', requireAuth, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const userId = req.user.id;

        const updates = {};
        if (name) updates.name = name;

        // Update user info
        const user = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update patient phone if user is a patient
        if (phone !== undefined && user.role === 'PATIENT') {
            const patient = await Patient.findOne({ userRef: userId });
            if (patient) {
                patient.phone = phone;
                await patient.save();
            }
        }

        res.json({ 
            message: 'Profile updated successfully',
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                status: user.status 
            } 
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// Link patient <-> patient user (ADMIN)
router.post('/users/:id/link-patient', requireAuth, allowRoles('ADMIN'), async (req, res) => {
    const { id } = req.params;                // user id
    const { patientId } = req.body;           // patient id

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'PATIENT') return res.status(400).json({ message: 'User must have PATIENT role to link' });

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    patient.userRef = user._id;
    await patient.save();

    res.json({ message: 'Linked', patientId: patient._id, userId: user._id });
});

export default router;
