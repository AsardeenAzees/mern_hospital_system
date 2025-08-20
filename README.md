# MERN Hospital System

A comprehensive hospital management system built with MERN stack (MongoDB, Express, React, Node.js) featuring patient registration, QR code generation, medical records management, and role-based access control.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with httpOnly cookies
- Role-based access control (ADMIN, DOCTOR, NURSE, PATIENT)
- User status management (ACTIVE/SUSPENDED)

### 👥 User Management
- Admin can create, update, and manage users
- Role assignment and status updates
- Password reset functionality
- Link patient users to patient records

### 🏥 Patient Management
- Patient registration with demographics, allergies, and medical history
- QR code generation for patient identification
- QR token rotation for security
- Patient search and pagination
- Downloadable QR codes for printing

### 📋 Medical Records
- Add medical entries (DIAGNOSIS, TEST_RESULT, PRESCRIPTION, NOTE)
- Role-based permissions (Doctors/Nurses can add, Patients read-only)
- Audit trail with author information and timestamps
- Patient-specific record access

### 📱 QR Code System
- Webcam scanning for patient lookup
- Image upload fallback for QR decoding
- Secure token-based patient resolution
- No PII stored in QR codes

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Role-based navigation and dashboards
- Intuitive forms and data tables
- Real-time search and pagination

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Helmet** for security headers
- **Rate limiting** for DDoS protection
- **QR Code** generation and processing

### Frontend
- **React 19** with modern hooks
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling
- **Axios** for HTTP requests
- **HTML5 QR Scanner** and **ZXing** for QR processing

## Prerequisites

- Node.js 18+ 
- MongoDB 6+
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd mern-hospital
```

### 2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup
Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/mern_hospital
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRES=7d
COOKIE_SECURE=false
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Database Setup
```bash
cd server
npm run seed
```

This will create:
- Admin: `admin@h.com` / `Admin@123`
- Doctor: `doc@h.com` / `Doc@123`
- Patient: `patient@h.com` / `Patient@123`
- Demo patient with linked user account
- Sample medical record entry

## Running the Application

### Development Mode

1. **Start the server** (in one terminal):
```bash
cd server
npm run dev
```

2. **Start the client** (in another terminal):
```bash
cd client
npm run dev
```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

### Production Mode

1. **Build the client**:
```bash
cd client
npm run build
```

2. **Start the server**:
```bash
cd server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Patients
- `POST /api/patients` - Create patient (ADMIN)
- `GET /api/patients` - List patients (ADMIN)
- `GET /api/patients/admin/list` - Admin patient list with search/pagination
- `GET /api/patients/:id` - Get patient details
- `GET /api/patients/:id/qr.png` - Download QR code (ADMIN)
- `POST /api/patients/:id/rotate-token` - Rotate QR token (ADMIN)
- `GET /api/patients/resolve` - Resolve QR token to patient (DOCTOR/NURSE/ADMIN)

### Records
- `GET /api/records/:patientId` - Get patient records
- `POST /api/records/:patientId/entries` - Add record entry (DOCTOR/NURSE/ADMIN)

### Users
- `GET /api/users` - List users (ADMIN)
- `POST /api/users` - Create user (ADMIN)
- `PATCH /api/users/:id` - Update user (ADMIN)
- `POST /api/users/:id/link-patient` - Link patient to user (ADMIN)

### Patient Self-Service
- `GET /api/me/patient` - Get own patient record (PATIENT)
- `GET /api/me/records` - Get own medical records (PATIENT)

## Usage Guide

### For Administrators
1. **Login** with admin credentials
2. **Manage Users**: Create, update, and link users
3. **Register Patients**: Add new patients and generate QR codes
4. **Patient Management**: View, search, and manage patient records
5. **QR Management**: Download and rotate QR tokens

### For Doctors/Nurses
1. **Login** with clinical credentials
2. **Scan QR Codes**: Use webcam or upload images to identify patients
3. **View Patient Records**: Access patient demographics and medical history
4. **Add Medical Entries**: Document diagnoses, test results, prescriptions, and notes

### For Patients
1. **Login** with patient credentials
2. **View Records**: Access your own medical records
3. **Track History**: See all medical entries with timestamps and author information

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **httpOnly Cookies**: XSS-resistant cookie storage
- **Role-Based Access Control**: Granular permissions per endpoint
- **Input Validation**: Server-side validation for all inputs
- **Security Headers**: Helmet.js for comprehensive security
- **Rate Limiting**: DDoS protection with configurable limits
- **CORS Protection**: Origin validation for cross-origin requests

## QR Code System

The system generates secure QR codes containing only opaque tokens:
- **No PII**: QR codes contain only `{"t": "token"}` 
- **Token Resolution**: Tokens resolve to patient records on scan
- **Secure Rotation**: Admins can rotate compromised tokens
- **Multiple Formats**: Supports webcam scanning and image upload

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions, please open an issue in the repository.
