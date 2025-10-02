import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Patient from '../models/Patient.js';

const router = Router();

const setAuthCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

router.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        console.log('Registration attempt:', { name, email, role });
        
        if (!name || !email || !password || !role) {
            console.log('Missing fields in registration');
            return res.status(400).json({ message: 'Missing fields' });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            console.log('Email already exists:', email);
            return res.status(409).json({ message: 'Email already in use' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, role, passwordHash });
        console.log('User created successfully:', user.email);

        const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
        setAuthCookie(res, token);

        res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (e) {
        console.error('Registration error:', e);
        res.status(500).json({ message: 'Server error', error: e.message });
    }
});

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);
        
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email, status: 'ACTIVE' });
        if (!user) {
            console.log('User not found or inactive:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const ok = await user.comparePassword(password);
        if (!ok) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('Login successful for:', email);
        const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
        setAuthCookie(res, token);
        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (e) {
        console.error('Login error:', e);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Patient login via PatientID + NIC
router.post('/auth/login/patient', async (req, res) => {
    try {
        const { patientId, nic } = req.body;
        if (!patientId || !nic) return res.status(400).json({ message: 'PatientID and NIC are required' });

        const p = await Patient.findOne({ patientId, nic });
        if (!p) return res.status(401).json({ message: 'Invalid credentials' });

        // Create a lightweight token for patient session without separate User
        const token = jwt.sign({ id: p.userRef?.toString() || p._id.toString(), role: 'PATIENT', name: `${p.firstName} ${p.lastName}`, email: p.email || null }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
        setAuthCookie(res, token);
        res.json({ user: { id: p._id, name: `${p.firstName} ${p.lastName}`, role: 'PATIENT' } });
    } catch (e) {
        console.error('Patient login error:', e);
        res.status(500).json({ message: 'Server error during patient login' });
    }
});

router.post('/auth/logout', (req, res) => {
    console.log('Logout request');
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true' });
    res.json({ message: 'Logged out' });
});

router.get('/auth/me', async (req, res) => {
    const token = req.cookies?.token;
    if (!token) {
        console.log('No token found in cookies');
        return res.status(200).json({ user: null });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified for user:', payload.name);
        let userData = { ...payload };

        if (!userData.email) {
            if (userData.role === 'PATIENT') {
                let patient = await Patient.findOne({ userRef: userData.id }).lean();
                if (!patient) {
                    patient = await Patient.findById(userData.id).lean();
                }
                if (patient && patient.email) {
                    userData.email = patient.email;
                }
            } else {
                const user = await User.findById(userData.id).lean();
                if (user) {
                    userData = {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: user.status
                    };
                }
            }
        }

        res.json({ user: userData });
    } catch (e) {
        console.log('Invalid token:', e.message);
        res.json({ user: null });
    }
});

export default router;

