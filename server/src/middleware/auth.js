import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Unauthenticated' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { id, role, name, email? }
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
