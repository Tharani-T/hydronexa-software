import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ArrowRight, CheckCircle2, BarChart3, Droplet, FileSearch, Info, Building, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import slider1 from "@/assets/gov-slider-1.png";
import slider2 from "@/assets/gov-slider-2.png";
import slider3 from "@/assets/gov-slider-3.png";
import slider4 from "@/assets/gov-slider-4.png";
import { GovLanguageProvider } from "@/government/utils/GovLanguageContext";
import { GovLanguageSelector } from "@/government/dashboard/components/GovLanguageSelector";

const backgroundImages = [slider1, slider2, slider3, slider4];

export const Route = createFileRoute("/government/")({
  component: GovernmentLanding,
});

function GovernmentLanding() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 8000); // 8 seconds per image
    return () => clearInterval(interval);
  }, []);

  return (
    <GovLanguageProvider>
      <div className="min-h-screen flex flex-col font-sans bg-white text-slate-900">
      {/* Official Top Bar */}
      <div className="bg-slate-900 text-white py-1.5 px-6 text-xs flex justify-between items-center">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="opacity-90">Official Portal of the Environmental Regulatory Authority</span>
          <div className="flex gap-5 opacity-90">
            <a href="#main-content" className="hover:underline focus:underline focus:outline-none">Skip to main content</a>
            <div className="flex gap-2 border-l border-slate-700 pl-4">
              <button aria-label="Decrease font size" className="hover:text-blue-300 font-bold">A-</button>
              <button aria-label="Normal font size" className="hover:text-blue-300 font-bold">A</button>
              <button aria-label="Increase font size" className="hover:text-blue-300 font-bold">A+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Emblem Placeholder */}
            {/* <div className="h-14 w-12 border-2 border-slate-800 rounded-b-full flex flex-col items-center justify-center p-1 bg-slate-50 shadow-inner">
               <Building className="h-6 w-6 text-slate-800" />
            </div> */}
            <div className="flex flex-col border-l-2 border-amber-500 pl-4 py-1">
              <span className="text-2xl font-extrabold text-slate-900 leading-none tracking-tight">HydroNexa</span>
              <span className="text-sm font-bold text-slate-600 tracking-wider uppercase mt-1">Government Portal</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 font-medium text-slate-700">
            <a href="#about" className="hover:text-blue-700 transition-colors focus:outline-none focus:text-blue-700">About Portal</a>
            <a href="#features" className="hover:text-blue-700 transition-colors focus:outline-none focus:text-blue-700">Services</a>
            <a href="#contact" className="hover:text-blue-700 transition-colors focus:outline-none focus:text-blue-700">Contact</a>
            <Link 
              to="/government/login" 
              className="text-sm font-bold px-6 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded transition-colors shadow focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            >
              Government Login
            </Link>
            <GovLanguageSelector />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        
        {/* Hero Section with Background */}
        <section className="relative w-full py-28 md:py-36 flex items-center justify-center border-b-4 border-amber-500 overflow-hidden">
          {/* Background Image Slider & Overlay */}
          <div className="absolute inset-0 z-0 bg-slate-900">
            {backgroundImages.map((img, index) => (
              <img
                key={img}
                src={img}
                alt={`Background ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                  index === currentImageIndex ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            {/* Very light overlay (20%) */}
            <div className="absolute inset-0 bg-slate-900/20 mix-blend-multiply transition-opacity duration-1000"></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-900/80 backdrop-blur-sm border border-blue-400/30 text-white text-xs font-bold uppercase tracking-widest mb-8 rounded shadow-sm">
              <Shield className="h-4 w-4 text-amber-500" />
              Secure Regulatory Environment
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 drop-shadow-lg">
              HydroNexa Government Portal
            </h1>
            
            <h2 className="text-xl md:text-2xl font-semibold text-blue-100 mb-8 drop-shadow max-w-4xl mx-auto leading-snug">
              Intelligent Water Reuse & CTO Compliance Monitoring Platform
            </h2>
            
            <p className="text-lg md:text-xl text-slate-200 max-w-4xl mx-auto leading-relaxed mb-12 drop-shadow">
              A secure digital platform for authorized regulatory officers to monitor HydroNexa-enabled industries, review CTO compliance, analyze water reuse performance, and support environmental regulatory decisions.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center">
              <Link 
                to="/government/login" 
                className="w-full sm:w-auto inline-flex justify-center items-center gap-3 px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-lg rounded transition-colors shadow-xl focus:ring-4 focus:ring-blue-500/50 focus:outline-none"
              >
                Government Login <ArrowRight className="h-5 w-5" />
              </Link>
              <a 
                href="#about"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-lg rounded transition-colors shadow-xl focus:ring-4 focus:ring-white/50 focus:outline-none"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900 uppercase tracking-wide inline-block relative">
                Platform Capabilities
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-amber-500 rounded-full"></div>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              <FeatureCard 
                icon={CheckCircle2}
                title="Industry Compliance Monitoring"
                description="Monitor registered HydroNexa industries and their compliance status."
              />
              
              <FeatureCard 
                icon={BarChart3}
                title="CTO Compliance Analytics"
                description="Analyze daily and monthly CTO usage against approved limits."
              />
              
              <FeatureCard 
                icon={Droplet}
                title="Water Reuse Intelligence"
                description="Review fresh water vs reused water performance and sustainability indicators."
              />
              
              <FeatureCard 
                icon={FileSearch}
                title="Regulatory Decision Support"
                description="Receive compliance insights to prioritize inspections and review industry performance."
              />

            </div>
          </div>
        </section>

        {/* About the Portal Banner */}
        <section id="about" className="py-20 px-6 bg-white border-t border-slate-200">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-8 bg-blue-50/50 border-2 border-blue-100 p-10 rounded shadow-sm">
            <div className="flex-shrink-0 h-20 w-20 bg-blue-800 text-white rounded-full flex items-center justify-center shadow-md border-4 border-white">
              <Info className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 border-b border-blue-200 pb-2">About the Portal</h3>
              <p className="text-slate-700 leading-relaxed text-lg">
                This portal is exclusively intended for authorized Government officers and environmental regulators. It provides unified visibility into industrial water consumption, treatment efficacy, and Consent to Operate (CTO) compliance across all HydroNexa-enabled industries. Access is strictly audited and logged.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-slate-300 pt-16 pb-8 px-6 border-t-4 border-amber-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-10 border border-slate-500 rounded-b-full flex flex-col items-center justify-center bg-slate-800">
                 <Building className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white tracking-wide">HydroNexa</h4>
                <p className="text-sm font-semibold text-amber-500 uppercase tracking-widest">Government Portal</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering regulatory authorities with data-driven insights for sustainable industrial water management and environmental compliance.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-16">
            <div>
              <h5 className="font-bold text-white uppercase tracking-wider mb-5 border-b border-slate-700 pb-2">Important Links</h5>
              <ul className="space-y-3 text-sm font-medium">
                <li><a href="#" className="hover:text-amber-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-amber-500 transition-colors">Terms of Use</a></li>
                <li><a href="#" className="hover:text-amber-500 transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 font-medium">&copy; 2026 HydroNexa Government Portal. All rights reserved.</p>
          <div className="flex items-center gap-2 text-slate-400 font-semibold bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
            <Lock className="h-4 w-4 text-amber-500" /> Secure Government Access
          </div>
        </div>
      </footer>
    </div>
    </GovLanguageProvider>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-white p-8 border border-slate-200 rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-blue-600 transition-colors"></div>
      <div className="h-16 w-16 bg-slate-50 border border-slate-200 rounded flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
        <Icon className="h-8 w-8 text-blue-800" />
      </div>
      <h3 className="font-bold text-slate-900 text-xl mb-3 leading-snug group-hover:text-blue-800 transition-colors">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
