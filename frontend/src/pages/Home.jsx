import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Droplet, Palette, Hammer, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { servicesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import { motion } from 'framer-motion';

const serviceIcons = {
  Electrician: { icon: Zap, gradient: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-50' },
  Plumbing: { icon: Droplet, gradient: 'from-blue-400 to-cyan-500', bg: 'bg-blue-50' },
  Painting: { icon: Palette, gradient: 'from-pink-400 to-purple-500', bg: 'bg-pink-50' },
  Carpenter: { icon: Hammer, gradient: 'from-amber-400 to-orange-600', bg: 'bg-amber-50' },
};

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getServices();
      setServices(response.data.data);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (category) => {
    navigate(`/service/${category}`);
  };

  if (loading) return <Loading fullScreen />;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAzLTRzMyAyIDMgNHYyYzAgMi0yIDQtMyA0cy0zLTItMy00di0yem0wLTMwYzAtMiAyLTQgMy00czMgMiAzIDR2MmMwIDItMiA0LTMgNHMtMy0yLTMtNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Professional Home Services</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-display mb-6 leading-tight">
              Welcome back,
              <br />
              <span className="text-orange-100">{user?.fullName?.split(' ')[0]}!</span>
            </h1>
            
            <p className="text-xl text-orange-100 max-w-2xl mx-auto mb-8">
              Book trusted professionals for all your home repair needs in just a few taps
            </p>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">500+</div>
                  <div className="text-orange-100 text-xs">Verified Experts</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">4.8★</div>
                  <div className="text-orange-100 text-xs">Average Rating</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">Same Day</div>
                  <div className="text-orange-100 text-xs">Service Available</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {services.map((service) => {
            const serviceConfig = serviceIcons[service.category];
            const Icon = serviceConfig.icon;

            return (
              <motion.div
                key={service.category}
                variants={item}
                whileHover={{ y: -8 }}
                onClick={() => handleServiceClick(service.category)}
                className="card card-hover group cursor-pointer relative"
              >
                <div className="p-8 text-center">
                  {/* Icon */}
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${serviceConfig.gradient} flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-display text-dark-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {service.category}
                  </h3>

                  {/* Description */}
                  <p className="text-dark-600 mb-4 text-sm">
                    {service.problemCount} services available
                  </p>

                  {/* CTA */}
                  <div className="flex items-center justify-center gap-2 text-orange-600 font-semibold group-hover:gap-3 transition-all">
                    <span>Book Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Decorative Corner */}
                <div className={`absolute top-4 right-4 w-16 h-16 ${serviceConfig.bg} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
        >
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h4 className="font-display text-lg mb-2">Verified Professionals</h4>
            <p className="text-sm text-dark-600">All workers are background verified and trained</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h4 className="font-display text-lg mb-2">Transparent Pricing</h4>
            <p className="text-sm text-dark-600">No hidden charges, pay only for actual hours</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h4 className="font-display text-lg mb-2">Quality Guaranteed</h4>
            <p className="text-sm text-dark-600">100% satisfaction or we'll make it right</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
