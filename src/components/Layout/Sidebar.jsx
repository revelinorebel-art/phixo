import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Image, 
  BookOpen, 
  CreditCard, 
  Settings, 
  Plus,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import PhixoLogo from '@/components/ui/PhixoLogo';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success !== false) {
      // Redirect naar landingspagina na succesvol uitloggen
      navigate('/', { replace: true });
    }
  };

      const navigationItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Mijn Foto\'s', href: '/my-photos', icon: Image },
        { name: 'Tutorial', href: '/tutorial', icon: BookOpen },
        { name: 'Abonnement/Credits', href: '/subscription', icon: CreditCard },
        { name: 'Instellingen', href: '/settings', icon: Settings },
      ];

      return (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed left-0 top-0 h-full w-72 glass-effect border-r border-white/10 p-6 z-50"
        >
          <div className="mb-8">
            <Link to="/dashboard">
              <PhixoLogo size="default" className="hover:opacity-80 transition-opacity" />
            </Link>
          </div>

          {userProfile && (
            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {userProfile?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userProfile?.email}</p>
                  <p className="text-xs text-white/60 capitalize">{userProfile?.subscription_type} Plan</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Credits</span>
                <span className="text-lg font-bold text-purple-400">{userProfile?.credits || 0}</span>
              </div>
            </div>
          )}

          <Link to="/new-project" className="block mb-6">
            <Button className="w-full button-glow h-12 text-base font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              Nieuw Project
            </Button>
          </Link>

          <nav className="space-y-2 mb-8">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-white/20 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Uitloggen
            </Button>
          </div>
        </motion.div>
      );
    };

    export default Sidebar;
