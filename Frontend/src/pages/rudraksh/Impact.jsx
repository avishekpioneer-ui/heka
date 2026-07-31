import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, FileText, Download, Building, Users, Activity, ArrowRight, ShieldCheck } from "lucide-react";
import Navbar from "../../components/rudraksh/Navbar";
import Footer from "../../components/rudraksh/Footer";
import SectionHeader from "../../components/rudraksh/SectionHeader";

const districts = [
  {
    name: "Sundarbans (South 24 Parganas)",
    camps: 42,
    patients: 16800,
    highlights: "Focus on oncological diagnostic screenings and waterborne disease preventive care.",
    coordinator: "Dr. B. K. Halder",
  },
  {
    name: "Purulia",
    camps: 35,
    patients: 12400,
    highlights: "Focus on childhood malnutrition, anemia screening, and basic health hygiene.",
    coordinator: "Dr. Sumit Sen",
  },
  {
    name: "Bankura",
    camps: 28,
    patients: 9100,
    highlights: "Primary diagnostics, diabetes checkups, and free generic medicine camps.",
    coordinator: "Dr. M. K. Banerjee",
  },
  {
    name: "Birbhum",
    camps: 15,
    patients: 6700,
    highlights: "Focus on mental wellness, group counseling sessions, and adolescent guidance.",
    coordinator: "A. Roy Chowdhury",
  },
];

const careCategories = [
  { label: "General Diagnostics & Medicine", percentage: 65, count: "29,250 patients", color: "bg-brand-teal-800" },
  { label: "Oncological / Cancer Screenings", percentage: 18, count: "8,100 patients", color: "bg-brand-saffron-500" },
  { label: "Mental Health Counseling", percentage: 12, count: "5,400 patients", color: "bg-brand-teal-500" },
  { label: "Emergency Surgical Referrals", percentage: 5, count: "2,250 patients", color: "bg-brand-saffron-400" },
];

const auditVault = [
  {
    year: "FY 2025 - 2026",
    docs: [
      { name: "Annual Activity Outreach Report", size: "2.4 MB", type: "PDF" },
      { name: "Audited Financial Statements & Balance Sheet", size: "1.8 MB", type: "PDF" },
      { name: "Income Tax ITR-7 Return Acknowledgement", size: "1.1 MB", type: "PDF" },
    ],
  },
  {
    year: "FY 2024 - 2025",
    docs: [
      { name: "Annual Activity Outreach Report", size: "3.1 MB", type: "PDF" },
      { name: "Audited Financial Statements & Balance Sheet", size: "2.0 MB", type: "PDF" },
      { name: "Income Tax ITR-7 Return Acknowledgement", size: "1.3 MB", type: "PDF" },
    ],
  },
];

export default function Impact() {
  const [activeDistrict, setActiveDistrict] = useState(0);

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
            Our Metrics
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold font-serif text-brand-cream-50"
          >
            Impact & Transparency
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-brand-teal-100 max-w-2xl mx-auto leading-relaxed"
          >
            We operate with complete clarity. Read our regional diagnostics metrics, patient distributions, and download third-party audited statements.
          </motion.p>
        </div>
      </section>

      {/* Interactive Coverage Map / Selector */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6"
          >
            <SectionHeader
              tagline="Where We Work"
              title="Regional Healthcare Distribution in West Bengal"
              description="Click on any district to see specific health metrics, camp counts, and the coordinating medical officers on duty."
            />

            <div className="space-y-3.5">
              {districts.map((d, idx) => (
                <button
                  key={d.name}
                  onClick={() => setActiveDistrict(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                    activeDistrict === idx
                      ? "border-brand-saffron-500 bg-brand-saffron-50/50 shadow-sm"
                      : "border-brand-cream-100 bg-white hover:border-brand-teal-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className={activeDistrict === idx ? "text-brand-saffron-500" : "text-brand-teal-800"} />
                    <span className="text-xs sm:text-sm font-bold text-brand-teal-800">{d.name}</span>
                  </div>
                  <ArrowRight size={14} className={activeDistrict === idx ? "text-brand-saffron-500" : "text-brand-cream-300"} />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <div className="bg-brand-teal-900 text-white rounded-2xl p-6 sm:p-8 border border-brand-teal-850 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(243,162,97,0.08),transparent_40%)]" />

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-saffron-300">
                  Outreach Summary
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-brand-cream-50">
                  {districts[activeDistrict].name}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-brand-teal-950/40 rounded-xl border border-brand-teal-800/50">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-brand-teal-300">Camps Conducted</span>
                  <span className="block text-2xl font-serif font-bold text-brand-saffron-300 mt-1">
                    {districts[activeDistrict].camps}
                  </span>
                </div>
                <div className="p-4 bg-brand-teal-950/40 rounded-xl border border-brand-teal-800/50">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-brand-teal-300">Patients Treated</span>
                  <span className="block text-2xl font-serif font-bold text-brand-saffron-300 mt-1">
                    {districts[activeDistrict].patients.toLocaleString()}
                  </span>
                </div>
              </div>

              <hr className="border-brand-teal-800" />

              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-brand-saffron-300 uppercase tracking-wider">Key Regional Focus</h4>
                <p className="text-brand-teal-50 leading-relaxed font-medium">
                  {districts[activeDistrict].highlights}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-brand-teal-200 mt-2 font-sans font-semibold">
                <Building size={12} className="text-brand-saffron-300" />
                <span>Coordinator: {districts[activeDistrict].coordinator}</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Visual Analytics / Progress bars */}
      <section id="stats" className="py-20 bg-brand-cream-100/50 border-y border-brand-cream-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6"
          >
            <SectionHeader
              tagline="Resource Allocation"
              title="Distribution of Care & Patient Registrations"
              description="To ensure that funding is utilized optimally, we coordinate care across four major fields of humanitarian health."
            />

            <div className="space-y-5">
              {careCategories.map((c) => (
                <div key={c.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-brand-teal-900">
                    <span>{c.label}</span>
                    <span>{c.percentage}% ({c.count})</span>
                  </div>
                  <div className="w-full h-2.5 bg-brand-cream-200 rounded-full overflow-hidden">
                    <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <div className="p-6 bg-white border border-brand-cream-100 rounded-2xl space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-teal-50 text-brand-teal-800 flex items-center justify-center">
                <Users size={20} />
              </div>
              <h4 className="text-sm font-serif font-bold text-brand-teal-800">Age Demographics</h4>
              <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                40% Senior Citizens, 35% Children (diagnostics & nutrition), 25% Adults.
              </p>
            </div>
            <div className="p-6 bg-white border border-brand-cream-100 rounded-2xl space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-brand-saffron-50 text-brand-saffron-600 flex items-center justify-center">
                <Activity size={20} />
              </div>
              <h4 className="text-sm font-serif font-bold text-brand-teal-800">Diagnostics Performed</h4>
              <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                ECG, Hemoglobin checks, blood pressure audits, blood glucose levels, and visual cancer checks.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Audited Financial Vault */}
      <section id="reports" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          tagline="Audits & Transparency"
          title="Document Vault: Transparency Reports"
          description="We make our official regulatory filings, annual audit sheets, and compliance reports available to the public and corporate CSR donors."
          centered
        />

        <div className="max-w-4xl mx-auto space-y-10">
          {auditVault.map((vault) => (
            <div key={vault.year} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-saffron-500 border-b border-brand-cream-200 pb-2">
                Financial Year: {vault.year}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {vault.docs.map((doc, docIdx) => (
                  <motion.div
                    key={doc.name}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: docIdx * 0.08 }}
                    whileHover={{ y: -3 }}
                    className="p-4 bg-white border border-brand-cream-100 rounded-xl flex flex-col justify-between hover:border-brand-teal-300 hover:shadow-md transition-all duration-200 shadow-sm min-h-[140px]"
                  >
                    <div className="space-y-2">
                      <FileText size={18} className="text-brand-teal-800" />
                      <h4 className="text-xs font-bold text-brand-teal-800 leading-tight">
                        {doc.name}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-brand-cream-50 mt-2">
                      <span className="text-[9px] font-bold text-brand-charcoal/40 uppercase">
                        {doc.type} &bull; {doc.size}
                      </span>
                      <button aria-label="Download Document" className="p-1.5 rounded-lg text-brand-saffron-500 hover:bg-brand-saffron-50 hover:text-brand-saffron-600 transition-colors duration-150">
                        <Download size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance Box */}
      <section className="bg-brand-teal-950 text-white py-12 border-t border-brand-teal-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-brand-saffron-400 shrink-0" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Independent Auditor Certifications</h4>
              <p className="text-[10px] text-brand-teal-200">Our financial records are certified by M/S Mukherjee & Associates, Chartered Accountants, Kolkata.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase bg-brand-teal-900 border border-brand-teal-800 text-brand-saffron-300 px-3 py-1 rounded-full">
            ITR-7 Compliant
          </span>
        </div>
      </section>

      <Footer />
    </div>
  );
}
