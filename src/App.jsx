import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
    import Login from '@/pages/Login';
    import Register from '@/pages/Register';
    import ForgotPassword from '@/pages/ForgotPassword';
    import Dashboard from '@/pages/Dashboard';
    import MyPhotos from '@/pages/MyPhotos';
    import MyAds from '@/pages/MyAds';
    import Subscription from '@/pages/Subscription';
    import Settings from '@/pages/Settings';
    import NewProject from '@/pages/NewProject';
    import PhotoUploader from '@/pages/PhotoUploader';
import FotoGenerator from '@/pages/FotoGenerator';
import PhotoEditor from '@/pages/PhotoEditor';

import MockupCreator from '@/pages/MockupCreator';
import MockupTutorial from '@/pages/MockupTutorial';
import RetouchTools from '@/pages/RetouchTools';
import Tutorial from '@/pages/Tutorial';
import LandingPage from '@/pages/LandingPage';

    // Protected Route Component
    const ProtectedRoute = ({ children }) => {
      const { user, loading } = useAuth();
      
      if (loading) {
        return <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>;
      }
      
      if (!user) {
        return <Navigate to="/login" replace />;
      }
      
      return children;
    };
    
    // Public Route Component (redirects to dashboard if logged in)
    const PublicRoute = ({ children }) => {
      const { user, loading } = useAuth();
      
      if (loading) {
        return <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>;
      }
      
      if (user) {
        return <Navigate to="/dashboard" replace />;
      }
      
      return children;
    };

    function App() {
    return (
      <AuthProvider>
        <Router>
          <Helmet>
            <title>Phixo - AI-Powered Photo Transformation</title>
            <meta name="description" content="Transform your photos with AI-powered optimization for e-commerce and real estate. Professional photo enhancement and ad creation made simple with Phixo." />
            <meta property="og:title" content="Phixo - AI-Powered Photo Transformation" />
            <meta property="og:description" content="Transform your photos with AI-powered optimization for e-commerce and real estate. Professional photo enhancement and ad creation made simple with Phixo." />
          </Helmet>
          
          <div className="min-h-screen">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/my-photos" element={<ProtectedRoute><MyPhotos /></ProtectedRoute>} />
              <Route path="/tutorial" element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
              <Route path="/my-ads" element={<ProtectedRoute><MyAds /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/new-project" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
              <Route path="/upload-photos" element={<ProtectedRoute><PhotoUploader /></ProtectedRoute>} />
              <Route path="/foto-generator" element={<ProtectedRoute><FotoGenerator /></ProtectedRoute>} />

              <Route path="/edit-photo/:photoId" element={<ProtectedRoute><PhotoEditor /></ProtectedRoute>} />

              <Route path="/mockup-creator" element={<ProtectedRoute><MockupCreator /></ProtectedRoute>} />
              <Route path="/mockup-tutorial" element={<ProtectedRoute><MockupTutorial /></ProtectedRoute>} />
              <Route path="/retouch-tools" element={<ProtectedRoute><RetouchTools /></ProtectedRoute>} />
            </Routes>
          </div>
          
          <Toaster />
      </Router>
    </AuthProvider>
    );
    }

    export default App;
