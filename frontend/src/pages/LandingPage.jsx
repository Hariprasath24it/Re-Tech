import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  Truck,
  Wrench,
  Repeat,
  Recycle,
  ShieldCheck,
  Award,
  ArrowRight,
  CheckCircle,
  Leaf,
  Cpu,
  BarChart,
  Sparkles,
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative pt-12 pb-20 md:py-24 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Heading and CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Smart E-Waste Circular Economy Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Give Your <span className="text-emerald-700">E-Waste</span> a Better Future
              </h1>

              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                Collecting, repairing and reusing electronics for a cleaner, greener tomorrow.
                Track your device journey from doorstep collection to second-life reuse or certified eco-recycling.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-8 py-3.5 rounded-full text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-3.5 rounded-full text-base font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Learn More
                </a>
                <Link
                  to="/track"
                  className="px-6 py-3.5 rounded-full text-sm font-semibold border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition"
                >
                  Track Device
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 flex items-center space-x-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>100% Free Doorstep Pickup</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Certified Data Sanitization</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Earn Green Reward Points</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Graphic Banner matching the UI mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-100/60 via-slate-100 to-emerald-50 p-4 border border-emerald-100 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80"
                  alt="Refurbished Electronics and E-Waste Recycling"
                  className="rounded-2xl object-cover w-full h-[360px] shadow-sm"
                />

                {/* Floating Metric Pill */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-100 shadow-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Recycle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Landfill Diverted</p>
                      <p className="text-base font-bold text-slate-800">1,250+ Devices Saved</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    94.2% Saved
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Cards matching bottom of landing mockup */}
      <section id="services" className="py-16 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Collection */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition group text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Collection</h3>
              <p className="text-xs text-slate-500">Easy pickup from your location</p>
            </div>

            {/* Card 2: Repair */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition group text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Repair</h3>
              <p className="text-xs text-slate-500">Give devices a second life</p>
            </div>

            {/* Card 3: Reuse */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition group text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Repeat className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Reuse</h3>
              <p className="text-xs text-slate-500">Donate or resell working devices</p>
            </div>

            {/* Card 4: Recycle */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition group text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Recycle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Recycle</h3>
              <p className="text-xs text-slate-500">Eco-friendly material recovery</p>
            </div>
          </div>
        </div>
      </section>

      {/* How ReTech Works Workflow */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-bold tracking-widest text-emerald-600 mb-2">
              End-to-End Circular Process
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How ReTech Transforms E-Waste
            </h3>
            <p className="text-slate-500 text-sm mt-3">
              Every electronic device follows a strictly tracked lifecycle, preventing hazardous waste in landfills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-6">
                1
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Submit & Schedule Pickup</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Log device specs (Laptop, Phone, Monitor, etc.) and schedule a convenient doorstep pickup with our agent.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-6">
                2
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Technical Inspection & Triage</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Certified technicians examine motherboards, batteries, and chips to designate the best outcome: Repair, Reuse, or Recycle.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-6">
                3
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Second Life & Rewards</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Restored devices are donated to schools or resold affordably, while you earn redeemable Green Reward Points!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Impact Section */}
      <section id="impact" className="py-20 bg-[#0d382c] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Measurable Sustainability
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Our Real-Time Environmental Impact
              </h3>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                Electronic waste is one of the fastest growing domestic waste streams globally. ReTech actively monitors kilograms of metals recovered and carbon emissions offset.
              </p>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-3xl font-black text-emerald-400">1,845 kg</p>
                  <p className="text-xs text-slate-300 mt-1">CO₂ Emissions Prevented</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-3xl font-black text-emerald-400">640 kg</p>
                  <p className="text-xs text-slate-300 mt-1">Copper, Gold & Aluminum Recovered</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center items-center p-8 bg-emerald-950/40 rounded-3xl border border-emerald-500/20 text-center">
              <Sparkles className="w-12 h-12 text-emerald-400 mb-4" />
              <h4 className="text-2xl font-bold mb-2">Join 1,000+ Eco-Conscious Citizens</h4>
              <p className="text-xs text-emerald-200/80 max-w-md mb-6">
                Turn your unused electronic gadgets into community value and earn discount vouchers today.
              </p>
              <Link
                to="/register"
                className="px-8 py-3.5 rounded-full font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/30"
              >
                Start Recycling Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-white">ReTech</span>
            <span className="text-slate-500">© 2026 ReTech E-Waste Management. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/track" className="hover:text-emerald-400">Track Device</Link>
            <Link to="/login" className="hover:text-emerald-400">Staff & User Login</Link>
            <a href="#services" className="hover:text-emerald-400">Services</a>
            <a href="#impact" className="hover:text-emerald-400">Impact Metrics</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
