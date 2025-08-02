import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { UserProvider, useUser } from '@/contexts/UserContext';
import UserInfoForm from '@/components/UserInfoForm';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Amenities from '@/pages/Amenities';
import BookingJobs from '@/pages/BookingJobs';
import Settings from '@/pages/Settings';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function AppContent() {
  const { userInfo, setUserInfo } = useUser();

  if (!userInfo) {
    return <UserInfoForm onSubmit={setUserInfo} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="amenities" element={<Amenities />} />
            <Route path="booking-jobs" element={<BookingJobs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#059669',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App; 