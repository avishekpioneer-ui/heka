import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Heart, Users, FileText, CheckCircle2, Award } from "lucide-react";
import Navbar from "../../components/rudraksh/Navbar";
import Footer from "../../components/rudraksh/Footer";
import SectionHeader from "../../components/rudraksh/SectionHeader";

const values = [
  {
    icon: Heart,
    title: "Compassion",
    desc: "Placing patient dignity and empathy at the forefront of every health camp and counseling session we run.",
  },
  {
    icon: ShieldCheck,
    title: "Transparency",
    desc: "Every rupee received is fully accounted for. We publish audited financials, tax logs, and camp metrics publicly.",
  },
  {
    icon: Users,
    title: "Equity",
    desc: "Ensuring that quality diagnostics and cancer awareness reach the most isolated tribes and villages in Bengal.",
  },
];

const trustees = [
  {
    name: "Moumita Kundu",
    role: "Founder & Managing Trustee",
    bio: "Visionary leader and advocate for public healthcare equity, driving the foundation's remote village outposts, doctor networks, and clinical alliances.",
  },
  {
    name: "Dr. Sumit Sen",
    role: "Founding Trustee & Chief Medical Advisor",
    bio: "Ex-Consultant Cardiologist at IPGME&R Kolkata, passionate about community health outreach and rural clinic access.",
  },
  {
    name: "Arundhati Roy Chowdhury",
    role: "Trustee & Lead Counselor",
    bio: "Clinical psychologist specializing in rural mental health wellness and rehabilitation programs.",
  },
  {
    name: "Sanjay Mukherjee",
    role: "Trustee & Operations Director",
    bio: "Over 15 years organizing field relief operations, logistics, and disaster medicine in Sundarbans.",
  },
];

const complianceDocs = [
  { name: "Charitable Trust Deed (Indian Trusts Act, 1882)", id: "Reg No. IV-1903024" },
  { name: "Income Tax Section 12A Registration", id: "Order No. CIT(E)/12A/2024-25" },
  { name: "Income Tax Section 80G Tax Exemption Approval", id: "Order No. CIT(E)/80G/2024-25 (Exemptions apply)" },
  { name: "Ministry of Corporate Affairs CSR Registration (Form CSR-1)", id: "Reg No. CSR0003295" },
];

export default function About() {
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
            Who We Are
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold font-serif text-brand-cream-50"
          >
            About Rudraksh Foundation
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-brand-teal-100 max-w-2xl mx-auto leading-relaxed"
          >
            A registered public charitable trust dedicated to making basic diagnostics, specialized cancer care, and mental healthcare accessible in rural West Bengal.
          </motion.p>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <SectionHeader
              tagline="Our Genesis"
              title="Bridging the Healthcare Divide in West Bengal"
            />
            <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed font-medium">
              Rudraksh Foundation was formed by a group of dedicated doctors and social workers who observed a critical gap during disaster medical camps in West Bengal. While urban centers offered advanced medical care, remote villages in Purulia, Bankura, and the Sundarbans lacked basic clinical diagnostics, early cancer detection, and simple counseling.
            </p>
            <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed font-medium">
              We realized that many chronic and critical conditions like heart diseases, diabetes, and oral/breast/cervical cancers went completely undiagnosed until they reached stage 3 or 4, causing preventable loss of life.
            </p>
            <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed font-medium">
              By launching dedicated <strong className="font-bold">mobile health clinics</strong>, conducting structured <strong className="font-bold">cancer screening drives</strong>, and organizing professional <strong className="font-bold">mental wellness sessions</strong>, we bring treatment to the patients, ensuring no village is left behind.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <div className="bg-brand-teal-900 text-white rounded-2xl p-8 border border-brand-teal-800 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(243,162,97,0.1),transparent_40%)]" />
              <h3 className="text-xl font-serif font-bold text-brand-saffron-300">
                Healthcare in Numbers
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-brand-saffron-300 shrink-0 mt-0.5" />
                  <span className="text-xs text-brand-teal-50">Providing free life-saving medicines during every mobile health camp.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-brand-saffron-300 shrink-0 mt-0.5" />
                  <span className="text-xs text-brand-teal-50">Early screening referrals for hundreds of women in rural oncology clusters.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-brand-saffron-300 shrink-0 mt-0.5" />
                  <span className="text-xs text-brand-teal-50">Fully compliant with the Income Tax Department and Ministry of Corporate Affairs regulations.</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision & Values */}
      <section id="mission" className="py-20 bg-brand-cream-100/50 border-y border-brand-cream-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tagline="Core Values"
            title="The Principles That Drive Our Mission"
            description="Our activities are founded on three fundamental pillars designed to build trust with local communities and global donors."
            centered
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <motion.div
                  key={val.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white border border-brand-cream-100 rounded-2xl p-6 shadow-sm space-y-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-teal-50 text-brand-teal-800 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-brand-teal-800">{val.title}</h3>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">{val.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leadership & Medical Board */}
      <section id="team" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          tagline="Our Leadership"
          title="The Team Behind the Initiatives"
          description="Meet the dedicated trustees and medical coordinators steering the health outreach programs."
          centered
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trustees.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white border border-brand-cream-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-brand-saffron-100 text-brand-saffron-600 flex items-center justify-center font-bold text-sm font-serif">
                  {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-teal-800">{t.name}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-brand-saffron-500 mt-0.5">{t.role}</p>
                </div>
                <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">{t.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Compliance & Trust */}
      <section id="transparency" className="py-20 bg-brand-teal-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <SectionHeader
              tagline="Transparency Matters"
              title="Registrations & Legal Compliance Documents"
              description="Rudraksh Foundation is built on absolute accountability. We adhere strictly to Indian regulatory protocols for Non-Governmental Organizations."
              dark
            />
            <p className="text-xs text-brand-teal-100 leading-relaxed font-medium">
              To guarantee that every rupee goes directly towards rural health camps, diagnostics, and patient support, we maintain legal compliance under the following sections of the Government of India Income Tax regulations.
            </p>
            <div className="flex gap-4 pt-2">
              <Link
                to="/impact#reports"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-brand-teal-950 bg-white hover:bg-brand-saffron-400 hover:text-white transition-all duration-150"
              >
                View Audited Financials
                <FileText size={14} />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            {complianceDocs.map((doc, idx) => (
              <motion.div
                key={doc.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="p-4 bg-brand-teal-900 border border-brand-teal-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{doc.name}</h4>
                  <p className="text-[10px] text-brand-teal-200 mt-0.5">{doc.id}</p>
                </div>
                <div className="p-1.5 bg-brand-teal-850 rounded-lg text-brand-saffron-300">
                  <Award size={16} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hospital Referral & Clinical Partners Section */}
      <section id="partners" className="py-20 bg-brand-cream-100/30 border-t border-brand-cream-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="max-w-3xl mx-auto text-center space-y-4">
            <SectionHeader
              tagline="Clinical Network"
              title="Our Healthcare & Hospital Partners"
              description="We collaborate with the region's leading super-specialty hospitals to bridge the gap between rural diagnostics and life-saving tertiary medical care."
              centered
            />
            <p className="text-xs sm:text-sm text-brand-charcoal/70 leading-relaxed font-medium">
              Discovering a heart anomaly, vision deterioration, or early-stage cancer in a remote village is only the first step. To ensure a complete path to recovery, the Rudraksh Foundation partners with state-of-the-art medical institutions in Kolkata to provide subsidized surgeries, priority bed scheduling, and specialist doctor follow-ups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Narayana Health",
                specialty: "Cardiac & Pediatric Cardiology",
                info: "NH partners with us on critical cardiac anomalies detected in our camps. They sponsor and facilitate subsidized open-heart procedures, pediatric surgeries, and advanced diagnostic echo tests for families below the poverty line.",
                accent: "border-t-4 border-t-brand-saffron-500",
              },
              {
                name: "NCRI Hospital",
                specialty: "Oncology & Cancer Care",
                info: "Our primary collaborator for oncology outposts. The National Cancer Research Institute supplies specialist oncologists, diagnostic biopsy assessments, and fast-tracks oncology ward entries for referred patients.",
                accent: "border-t-4 border-t-brand-teal-700",
              },
              {
                name: "KPC Medical College & Hospital",
                specialty: "Tertiary Diagnostics & Referrals",
                info: "KPC serves as our lab backup, providing priority access and trust-sponsored concessions for complex diagnostic procedures like MRIs, CT scans, and advanced blood panels at their Jadavpur campus.",
                accent: "border-t-4 border-t-brand-saffron-400",
              },
              {
                name: "Manipal Hospital",
                specialty: "Orthopedics & Advanced Surgery",
                info: "Coordinates emergency orthopedic, neurosurgical, and gastrointestinal consultations. Manipal offers subsidized surgical packages and priority clinical slots for patients referred by our foundation.",
                accent: "border-t-4 border-t-brand-teal-900",
              },
              {
                name: "Medica Superspeciality",
                specialty: "Emergency & Critical ICU Care",
                info: "Our designated emergency response partner. Medica coordinates rapid admissions for patients requiring immediate ICU care, ventilator support, or specialized emergency interventions.",
                accent: "border-t-4 border-t-brand-saffron-500",
              },
              {
                name: "Netrapedia",
                specialty: "Ophthalmology & Cataract Care",
                info: "Supports our rural eye clinics and vision restoration programs. Netrapedia funds diagnostic test lenses, supplies free corrective spectacles, and performs subsidized cataract surgeries for elderly villagers.",
                accent: "border-t-4 border-t-brand-teal-700",
              },
            ].map((partner, idx) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -5 }}
                className={`p-6 bg-white border border-brand-cream-100 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden ${partner.accent}`}
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-saffron-500">
                      {partner.specialty}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-brand-teal-900">
                      {partner.name}
                    </h3>
                  </div>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                    {partner.info}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
