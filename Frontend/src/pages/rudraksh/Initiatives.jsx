import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, Brain, Sparkles, PlusCircle, CheckCircle2, Heart } from "lucide-react";
import Navbar from "../../components/rudraksh/Navbar";
import Footer from "../../components/rudraksh/Footer";
import SectionHeader from "../../components/rudraksh/SectionHeader";

const initiatives = [
  {
    id: "health-camps",
    icon: Activity,
    title: "Mobile Health Camps",
    tagline: "Primary Healthcare at Doorsteps",
    desc: "We bring mobile clinics equipped with doctors, diagnostic devices (ECG, blood glucose, vitals), and free generic pharmacy cards to villages that have no access to active primary health centers.",
    stats: ["120+ camps completed", "30,000+ general consultations", "Free medicines provided to all"],
    microCTA: "₹1,500 ($18) finances diagnostic cards & general medicine for 10 elderly patients.",
    bg: "bg-white",
    image: "/images/health-camp-bp.jpg",
    imageAlt: "Doctor performing blood pressure checkup on an elderly patient at a mobile health camp",
  },
  {
    id: "cancer-care",
    icon: ShieldAlert,
    title: "Cancer Screenings",
    tagline: "Early Detection Saves Lives",
    desc: "Early-stage oncological diagnostics can be the difference between life and death. We organize specialized screenings for oral, breast, and cervical cancers in rural risk-clusters, helping patients get biopsies and rapid referrals.",
    stats: ["5,000+ cancer screenings done", "12 oncology referrals fully funded", "Dozens of rural awareness programs"],
    microCTA: "₹5,000 ($60) funds cervical cancer screening panels for 10 women in rural Sundarbans.",
    bg: "bg-brand-cream-100/30",
    image: "/images/cancer-screening.jpg",
    imageAlt: "Medical staff and volunteers registering and conducting health screening consultations for villagers at a table",
  },
  {
    id: "mental-health",
    icon: Brain,
    title: "Counseling & Mental Wellness",
    tagline: "Breaking Stigma & Psychological Support",
    desc: "Depression, anxiety, and post-traumatic stress often go completely untreated and highly stigmatized in agricultural communities. Our clinical counselors offer group therapy, individual sessions, and community awareness.",
    stats: ["800+ counseling cases registered", "Weekly group sessions held", "Student de-stress programs in schools"],
    microCTA: "₹2,500 ($30) sponsors 5 individual counseling sessions for young adults facing trauma.",
    bg: "bg-white",
    image: "/images/volunteer-vitals.jpg",
    imageAlt: "Healthcare volunteers and staff sitting at a table checking vitals and registering villagers in a welcoming space",
  },
  {
    id: "preventive-health",
    icon: Sparkles,
    title: "Preventive Healthcare",
    tagline: "Empowering Healthy Families",
    desc: "Long-term health begins with education. We teach rural schools and families about water purification, sanitary hygiene, maternal nutrition, and pediatric care to prevent recurrent waterborne diseases.",
    stats: ["50+ school sanitation drives", "10,000+ hygiene kits distributed", "Maternal nutrition workshops"],
    microCTA: "₹500 ($6) supplies comprehensive hygiene/sanitation kits to a family of four.",
    bg: "bg-brand-cream-100/30",
    image: "/images/medical-consultation-hall.jpg",
    imageAlt: "Health education session and primary checks in a large community hall filled with local families",
  },
  {
    id: "emergency-care",
    icon: PlusCircle,
    title: "Emergency Medical Support",
    tagline: "Standing by Families in Crisis",
    desc: "When severe illness strikes a family in extreme poverty, hospital transport and surgical deposits are impossible. We maintain an emergency fund to cover tertiary referral support and critical surgeries.",
    stats: ["₹2.5L+ emergency fund distributed", "15 critical surgeries financed", "Emergency ambulance referrals"],
    microCTA: "Any contribution goes directly to our Emergency Patient Referral Fund to sponsor hospital transportation.",
    bg: "bg-white",
    image: "/images/camp-inauguration.jpg",
    imageAlt: "Trustees and volunteers cutting the ribbon to inaugurate a new rural medical outpost and emergency station",
  },
];

export default function Initiatives() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream-50 selection:bg-brand-saffron-200 font-sans antialiased">
      <Navbar />

      {/* Page Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-brand-teal-900 to-brand-teal-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(243,162,97,0.1),transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-bold uppercase tracking-widest text-brand-saffron-300 font-sans"
          >
            Our Initiatives
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold font-serif text-brand-cream-50"
          >
            Dedicated Healthcare Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-brand-teal-100 max-w-2xl mx-auto leading-relaxed"
          >
            From mobile diagnostic camps to cancer screenings and mental health support, discover how we build healthy, resilient communities across West Bengal.
          </motion.p>
        </div>
      </section>

      {/* Initiatives List */}
      <section className="divide-y divide-brand-cream-100/50 overflow-hidden">
        {initiatives.map((init, idx) => {
          const Icon = init.icon;
          return (
            <div
              key={init.id}
              id={init.id}
              className={`py-20 ${init.bg}`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                {/* Visual Representation (Image, Icon + Stats) */}
                <motion.div
                  initial={{ opacity: 0, x: idx % 2 === 1 ? 35 : -35 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className={`lg:col-span-5 space-y-6 ${idx % 2 === 1 ? "lg:order-last" : ""}`}
                >
                  {init.image && (
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-brand-cream-200 shadow-md group">
                      <img
                        src={init.image}
                        alt={init.imageAlt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4 w-11 h-11 rounded-xl bg-white/95 backdrop-blur-sm text-brand-teal-900 flex items-center justify-center shadow-md">
                        <Icon size={20} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <h3 className="text-base font-serif font-bold text-brand-teal-800">
                      Program Metrics & Outreach
                    </h3>
                    <ul className="space-y-3">
                      {init.stats.map((stat) => (
                        <li key={stat} className="flex items-center gap-2.5 text-xs text-brand-charcoal font-medium">
                          <CheckCircle2 size={16} className="text-brand-saffron-500 shrink-0" />
                          <span>{stat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Content Details */}
                <motion.div
                  initial={{ opacity: 0, x: idx % 2 === 1 ? -35 : 35 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="lg:col-span-7 space-y-6"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-saffron-500 font-sans">
                    {init.tagline}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-teal-800">
                    {init.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed font-medium">
                    {init.desc}
                  </p>

                  {/* Micro-donation Card */}
                  <div className="p-5 rounded-xl border border-brand-saffron-200 bg-brand-saffron-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-brand-saffron-600 uppercase tracking-wider">
                        Sponsor this project
                      </h4>
                      <p className="text-xs text-brand-charcoal/80 font-medium">
                        {init.microCTA}
                      </p>
                    </div>
                    <Link
                      to="/donate"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-brand-saffron-500 hover:bg-brand-saffron-600 shadow transition-all duration-150 whitespace-nowrap"
                    >
                      Donate Now
                      <Heart size={12} className="fill-white" />
                    </Link>
                  </div>
                </motion.div>

              </div>
            </div>
          );
        })}
      </section>

      {/* CTA Footer */}
      <section className="bg-brand-teal-900 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
            Support Rural Health Outreach
          </h2>
          <p className="text-xs text-brand-teal-100 max-w-xl mx-auto">
            Choose to fund a general mobile camp, oncological diagnostic drives, or child hygiene kits today. Your support reaches directly to rural West Bengal.
          </p>
          <div className="pt-2">
            <Link
              to="/donate"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-bold text-white bg-brand-saffron-500 hover:bg-brand-saffron-600 transition-all duration-150"
            >
              Fund a Health Camp
              <Heart size={14} className="fill-white" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
