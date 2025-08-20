import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css';  // <-- make sure this line exists

import App from './App.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Protected from './routes/Protected.jsx'
import PatientRegister from './pages/Admin/PatientRegister.jsx'
import Scan from './pages/Scan.jsx'
import PatientView from './pages/PatientView.jsx'
import Users from './pages/Admin/Users.jsx'
import MyRecords from './pages/Patient/MyRecords.jsx'
import AdminPatients from './pages/Admin/Patients.jsx';
import Profile from './pages/Patient/Profile.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  {
    path: '/app',
    element: <Protected><App /></Protected>,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'admin/patients/new', element: <PatientRegister /> },
      { path: 'admin/patients', element: <AdminPatients /> },
      { path: 'admin/users', element: <Users /> },
      { path: 'scan', element: <Scan /> },
      { path: 'patients/:id', element: <PatientView /> },
      { path: 'my/records', element: <MyRecords /> },
      { path: 'profile', element: <Profile /> }
    ]
  }
])

const qc = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </ErrorBoundary>
)
