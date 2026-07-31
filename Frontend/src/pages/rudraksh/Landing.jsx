import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ArrowRight,
  Activity,
  ShieldAlert,
  Brain,
  Sparkles,
  AlertCircle,
  Quote,
  MapPin,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  ClipboardList,
  Map,
  Truck
} from "lucide-react";
import Navbar from "../../components/rudraksh/Navbar";
import Footer from "../../components/rudraksh/Footer";
import SectionHeader from "../../components/rudraksh/SectionHeader";
import { submitForm } from "../../components/rudraksh/submitForm";

const stats = [
  { value: "120+", label: "Health Camps Held", desc: "Across remote villages" },
  { value: "45,000+", label: "Patients Treated", desc: "Free diagnostics & medicine" },
  { value: "15+", label: "Districts Covered", desc: "Throughout West Bengal" },
  { value: "100%", label: "Transparency", desc: "Audited financial logs" },
];

const pillars = [
  {
    icon: Activity,
    title: "Mobile Health Camps",
    desc: "Bringing doctors, clinical diagnostics, and free treatments straight to isolated communities.",
    color: "from-brand-teal-800 to-brand-teal-600",
  },
  {
    icon: ShieldAlert,
    title: "Cancer Screenings",
    desc: "Early detection drives for oral, breast, and cervical cancers to save lives before it is too late.",
    color: "from-brand-saffron-500 to-brand-saffron-600",
  },
  {
    icon: Brain,
    title: "Counseling & Mental Wellness",
    desc: "Individual counseling and therapy sessions designed to break the psychological stigma in rural Bengal.",
    color: "from-brand-teal-700 to-brand-teal-500",
  },
  {
    icon: Sparkles,
    title: "Preventive Healthcare",
    desc: "Educating families about sanitation, basic hygiene, and nutrition to prevent diseases long-term.",
    color: "from-brand-saffron-600 to-brand-saffron-400",
  },
];

const timelineSteps = [
  {
    icon: Map,
    title: "1. Geographic Selection",
    desc: "Our operations desk maps village clusters located more than 15km away from active state medical clinics."
  },
  {
    icon: Truck,
    title: "2. Camp Coordination",
    desc: "Transporting mobile diagnostic equipment (ECG, vitals monitors), medical staff, and free medicines to site coordinates."
  },
  {
    icon: ClipboardList,
    title: "3. Diagnostic Consult",
    desc: "Conducting multi-specialty clinical examinations and distributing generic drugs under certified physician supervision."
  },
  {
    icon: ShieldCheck,
    title: "4. Rapid Hospital Referral",
    desc: "Transferring patients with critical oncology or cardiac anomalies directly to tertiary partner facilities in Kolkata, including Narayana Health, Manipal, KPC, NCRI, Medica, and Netrapedia."
  }
];

const stories = [
  {
    id: 1,
    name: "Lakshmi Mondal",
    village: "Sunderbans",
    age: "42",
    quote: "I had been suffering from constant pain for two years. The local pharmacy gave me generic painkillers, but it only grew worse. When Rudraksh's mobile camp came to Sunderbans, their oncologists diagnosed me early with cervical stage 1 anomalies. They funded my biopsy and referral. Today, I am cancer-free.",
    impact: "Saved from advanced stage cervical cancer through early diagnostic screening.",
  },
  {
    id: 2,
    name: "Raju Bauri",
    village: "Purulia",
    age: "11",
    quote: "Raju was severely malnourished and lagging behind in school due to recurrent gastrointestinal infections. The preventive health team at Rudraksh Foundation installed clean water filtration in our community and treated Raju for chronic parasites. The change is night and day—he is back to running around.",
    impact: "Treated for chronic malnutrition and recurrent infections.",
  },
];

const testimonials = [
  {
    name: "Dr. Sumit Sen",
    role: "Chief Medical Officer",
    quote: "Volunteer healthcare outreach isn't just about charity; it's about closing structural gaps. Seeing a patient get diagnosed with Stage 1 cancer instead of Stage 4 is what drives our medical advisory board.",
    initials: "SS"
  },
  {
    name: "Bikash Mahato",
    role: "Purulia Camp Coordinator",
    quote: "The villagers trust Rudraksh Foundation because we stay until the last patient is seen. The free diagnostic cards and medicine logs build transparency and hope.",
    initials: "BM"
  }
];

const donationTiers = [
  { amount: 500, label: "₹500 ($6)", desc: "General medicine & diagnostic card for 1 child." },
  { amount: 1500, label: "₹1,500 ($18)", desc: "Diagnostics panel & medicine for an elderly patient." },
  { amount: 5000, label: "₹5,000 ($60)", desc: "Cancer diagnostic screenings panel for 10 women." },
  { amount: 25000, label: "₹25,000 ($300)", desc: "Sponsor a complete diagnostics camp for a village cluster." },
];

const newsArticles = [
  {
    category: "Camp Schedule",
    title: "Upcoming Camp: Midnapore District Outpost",
    date: "Sunday, August 2, 2026",
    summary: "Our medical team will set up a diagnostic outreach point in Midnapore, focusing on diabetic clinics and blood pressure diagnostics.",
    link: "/initiatives#health-camps"
  },
  {
    category: "Oncology Care",
    title: "Expanding Early Cervical Cancer Screenings",
    date: "July 18, 2026",
    summary: "New mobile cancer screening diagnostic modules are being integrated to double cervical checks in rural South Bengal.",
    link: "/initiatives#cancer-care"
  },
  {
    category: "Transparency",
    title: "Annual Activity & Financial Audits Released",
    date: "July 12, 2026",
    summary: "Our independent auditor filings and operations reports for the fiscal year have been officially published to our database.",
    link: "/impact#reports"
  }
];

export default function Landing() {
  const [activeStory, setActiveStory] = useState(0);
  const [volunteerSubmitted, setVolunteerSubmitted] = useState(false);
  const [isVolunteerSubmitting, setIsVolunteerSubmitting] = useState(false);
  const [volunteerError, setVolunteerError] = useState("");
  const [volunteerForm, setVolunteerForm] = useState({ name: "", email: "", phone: "", role: "General Volunteer" });

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();
    setIsVolunteerSubmitting(true);
    setVolunteerError("");
    try {
      const data = await submitForm({
        formType: "volunteer_quick",
        ...volunteerForm,
      });
      if (data.success) {
        setVolunteerSubmitted(true);
      } else {
        setVolunteerError(data.error || "Failed to submit application. Please try again.");
      }
    } catch {
      setVolunteerError("Network error. Please check your connection and try again.");
    } finally {
      setIsVolunteerSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream-50 selection:bg-brand-saffron-200 font-sans antialiased">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden bg-gradient-to-br from-brand-teal-900 via-brand-teal-800 to-brand-teal-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(243,162,97,0.15),transparent_40%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-brand-cream-50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-saffron-500/20 text-brand-saffron-300 border border-brand-saffron-400/20"
            >
              <AlertCircle size={12} className="fill-brand-saffron-500/10" />
              Registered Charitable Trust of West Bengal
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif leading-tight tracking-tight text-brand-cream-50"
            >
              Dignified Healthcare is a Right, <br />
              <span className="text-brand-saffron-400 font-serif">Not a Privilege.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-brand-teal-50 max-w-2xl leading-relaxed"
            >
              We bring specialized doctors, diagnostic screenings, free medicine distribution, and mental health counseling straight to the doorsteps of West Bengal’s most underserved and remote communities.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link
                to="/donate"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white bg-brand-saffron-500 hover:bg-brand-saffron-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                Sponsor a Health Camp
                <Heart size={16} className="fill-white" />
              </Link>
              <a
                href="#initiatives"
                className="inline-flex items-center justify-center gap-1 px-8 py-3.5 rounded-full text-sm font-bold text-brand-teal-100 hover:text-white border border-brand-teal-600 hover:border-white transition-all duration-200"
              >
                Explore Focus Areas
                <ArrowRight size={14} />
              </a>
            </motion.div>
          </div>

          {/* Emotional Side Card */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-3 bg-brand-saffron-500/10 rounded-tr-2xl rounded-bl-2xl">
                <Quote size={20} className="text-brand-saffron-400 rotate-180" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-brand-saffron-300">
                Direct Impact Highlight
              </h3>
              <p className="text-xs sm:text-sm text-brand-teal-50 italic leading-relaxed">
                &ldquo;Rudraksh Foundation didn't just give us medicines; they gave us our health back. When my daughter was ill, they arranged for clinical screening and transport to Kolkata. They stood by us.&rdquo;
              </p>
              <hr className="border-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-teal-900 border border-brand-teal-700 flex items-center justify-center font-bold text-xs text-brand-saffron-400 font-serif">
                  BM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Bikash Mahato</h4>
                  <p className="text-[10px] text-brand-teal-200">Father of beneficiary, Purulia District</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Impact Ticker Section */}
      <section className="-mt-12 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-brand-cream-100 shadow-xl p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-center divide-x-0 lg:divide-x divide-brand-cream-100">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-center px-4"
            >
              <span className="block text-3xl sm:text-4xl font-extrabold font-serif text-brand-teal-800">
                {stat.value}
              </span>
              <span className="block text-xs font-bold text-brand-charcoal/90 mt-1 font-sans">
                {stat.label}
              </span>
              <span className="block text-[10px] text-brand-charcoal/50 mt-0.5">
                {stat.desc}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission Section (Added Section 2) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <SectionHeader
              tagline="Our Calling"
              title="Restoring Dignity to Community Healthcare"
              description="Rudraksh Foundation operates on the front lines, ensuring that basic diagnostics and counseling are accessible to every section of society."
            />
            <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed font-medium">
              Many chronic conditions like hypertension, diabetes, and local oncology cluster symptoms remain undetected due to isolation. We set up mobile checkup kiosks directly in village markets, schools, and temples, ensuring early medical checks.
            </p>
            <div className="flex gap-4 pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal-800 hover:text-brand-saffron-500 transition-colors duration-150"
              >
                Learn about our values
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-6">
            <div className="p-6 bg-white border border-brand-cream-100 rounded-2xl shadow-sm space-y-3">
              <h4 className="text-sm font-serif font-bold text-brand-teal-800 flex items-center gap-2">
                <CheckCircle size={16} className="text-brand-saffron-500" />
                100% Audited Transparency
              </h4>
              <p className="text-xs text-brand-charcoal/70 leading-relaxed">
                All donations are tracked, matched to diagnostic reports, and audit statements are uploaded to our database.
              </p>
            </div>
            <div className="p-6 bg-white border border-brand-cream-100 rounded-2xl shadow-sm space-y-3">
              <h4 className="text-sm font-serif font-bold text-brand-teal-800 flex items-center gap-2">
                <CheckCircle size={16} className="text-brand-saffron-500" />
                Direct Medical Excellence
              </h4>
              <p className="text-xs text-brand-charcoal/70 leading-relaxed">
                Camps are run under certified doctors and specialists with free diagnostics cards provided to all attendees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder's Corner Section */}
      <section className="py-20 bg-brand-teal-900 text-white overflow-hidden relative border-y border-brand-teal-850">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(243,162,97,0.08),transparent_45%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Visual Column - Photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="relative rounded-2xl overflow-hidden max-w-sm border-2 border-white/20 shadow-2xl group bg-brand-teal-950">
                <img
                  src="/images/founder-moumita-kundu.jpg"
                  alt="Moumita Kundu, Founder of Rudraksh Foundation"
                  className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-center">
                  <h4 className="text-base font-bold text-white font-serif">Moumita Kundu</h4>
                  <p className="text-xs text-brand-saffron-400 font-semibold uppercase tracking-wider mt-0.5">Founder & Managing Trustee</p>
                </div>
              </div>
            </motion.div>

            {/* Content Column */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7 space-y-6"
            >
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-saffron-400 font-sans">
                Founder's Corner
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-brand-cream-50 leading-tight">
                Empowering Rural Bengal Through Empathetic Healthcare
              </h2>
              <div className="space-y-4 text-xs sm:text-sm text-brand-teal-50 leading-relaxed font-medium">
                <p>
                  &ldquo;Healthcare is a basic human necessity, not a commodity. When we set out to build the Rudraksh Foundation, our vision was simple: to make sure that no family in West Bengal's remotest corners has to suffer in silence due to a lack of primary diagnosis or financial distress.&rdquo;
                </p>
                <p>
                  &ldquo;Every health camp we run, every patient we diagnose early, and every life-saving referral we secure alongside our partner network brings us closer to a society where medical care is treated as a fundamental right. We are immensely grateful to our dedicated doctors, volunteer staff, and corporate CSR supporters who walk with us on this journey.&rdquo;
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-saffron-500/10 border border-brand-saffron-400 flex items-center justify-center font-bold text-xs text-brand-saffron-400 font-serif">
                    MK
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Moumita Kundu</h4>
                    <p className="text-[10px] text-brand-saffron-400 font-semibold uppercase tracking-wider">Founder, Rudraksh Foundation</p>
                  </div>
                </div>
                <Link
                  to="/about#story"
                  className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full text-xs font-bold text-brand-teal-950 bg-brand-saffron-400 hover:bg-brand-saffron-500 hover:text-white shadow transition-all duration-200"
                >
                  Read Our Full Story
                  <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Focus Areas Section */}
      <section id="initiatives" className="py-20 bg-brand-cream-100/30 border-y border-brand-cream-100/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tagline="Programs"
            title="Responsive and Empathetic Care Initiatives"
            description="We deliver community-based healthcare directly to the villages, breaking stigmas, and saving lives through early diagnosis."
            centered
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group relative bg-white border border-brand-cream-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} text-white flex items-center justify-center`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-brand-teal-800 group-hover:text-brand-saffron-500 transition-colors duration-200">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                      {pillar.desc}
                    </p>
                  </div>
                  <div className="pt-6">
                    <Link
                      to={`/initiatives#${pillar.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-teal-800 hover:text-brand-saffron-500 transition-colors duration-150"
                    >
                      Learn more
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-150" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Healthcare Initiatives & Health Camps Timeline (Added Section 5) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          tagline="Health Camps"
          title="Our Structured Camp Execution Model"
          description="How we coordinate, execute, and track follow-up operations for rural checkup clusters."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {timelineSteps.map((step) => {
            const StepIcon = step.icon;
            return (
              <div key={step.title} className="bg-white border border-brand-cream-100 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal-50 text-brand-teal-800 flex items-center justify-center">
                    <StepIcon size={20} />
                  </div>
                  <h4 className="text-sm font-serif font-bold text-brand-teal-800">
                    {step.title}
                  </h4>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Storytelling Section (Success Stories) */}
      <section className="py-20 bg-brand-cream-100/50 border-y border-brand-cream-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tagline="Success Stories"
            title="Voices from the Communities We Serve"
            description="The real impact of our health camps goes beyond numbers—it is written in the restored hopes and rebuilt lives of our beneficiaries."
            centered
          />

          <div className="relative max-w-4xl mx-auto bg-white border border-brand-cream-100 shadow-lg rounded-2xl p-6 sm:p-10 md:p-12 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-brand-saffron-500" />
            <div className="absolute bottom-0 right-0 p-8 opacity-5">
              <Quote size={180} className="text-brand-teal-800 rotate-180" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStory}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 relative z-10"
              >
                <div className="flex items-center gap-1.5 text-brand-saffron-500 text-xs font-bold uppercase tracking-wider">
                  <MapPin size={12} />
                  <span>District: {stories[activeStory].village}, West Bengal</span>
                </div>

                <p className="text-sm sm:text-base leading-relaxed text-brand-charcoal italic font-medium">
                  &ldquo;{stories[activeStory].quote}&rdquo;
                </p>

                <hr className="border-brand-cream-100" />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-brand-teal-800">
                      {stories[activeStory].name}, {stories[activeStory].age} years
                    </h4>
                    <p className="text-xs text-brand-charcoal/50">Beneficiary Case #{stories[activeStory].id * 1234}</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-teal-50 text-brand-teal-800 border border-brand-teal-100">
                    <CheckCircle size={12} />
                    <span>{stories[activeStory].impact}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel Navigation */}
            <div className="flex justify-center gap-2 mt-8">
              {stories.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveStory(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    activeStory === idx ? "bg-brand-saffron-500 w-6" : "bg-brand-cream-300 hover:bg-brand-cream-400"
                  }`}
                  aria-label={`Go to story ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section (Added Section 7) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          tagline="Visual Grid"
          title="Outreach Camps Gallery"
          description="Documenting diagnostics distribution and health counseling camps across rural Bengal."
          centered
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-brand-teal-800 to-brand-teal-950 text-white rounded-2xl p-6 min-h-[200px] flex flex-col justify-between border border-brand-teal-900 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-saffron-300">Diagnostics Setup</span>
            <p className="text-xs text-brand-teal-50 leading-relaxed">Medical officers calibrating blood vital screening kits before patients register at the outpost.</p>
            <span className="text-[9px] text-brand-teal-300">Sundarbans Camp Outpost</span>
          </div>
          <div className="bg-gradient-to-br from-brand-saffron-500 to-brand-saffron-600 text-white rounded-2xl p-6 min-h-[200px] flex flex-col justify-between border border-brand-saffron-400 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal-900">Child Wellness Drive</span>
            <p className="text-xs text-brand-saffron-50 leading-relaxed">Counseling families about child sanitary hygiene, clean drinking water systems, and nutrition.</p>
            <span className="text-[9px] text-brand-saffron-200">Purulia Village School</span>
          </div>
          <div className="bg-gradient-to-br from-brand-teal-900 to-brand-teal-800 text-white rounded-2xl p-6 min-h-[200px] flex flex-col justify-between border border-brand-teal-800/80 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-saffron-300">Oncology Screening Kiosk</span>
            <p className="text-xs text-brand-teal-50 leading-relaxed">Providing specialized diagnostics and diagnostic referrals to women in rural Midnapore.</p>
            <span className="text-[9px] text-brand-teal-300">Midnapore ClinicCamp</span>
          </div>
        </div>
      </section>

      {/* Testimonials Section (Added Section 8) */}
      <section className="py-20 bg-brand-cream-100/50 border-y border-brand-cream-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tagline="Coordinators Reflections"
            title="Credibility & Medical Advisory Voices"
            description="Our physicians and camp coordinators explain why they volunteer for the health clinics."
            centered
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white border border-brand-cream-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[200px]">
                <p className="text-xs text-brand-charcoal/80 leading-relaxed italic font-medium">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-brand-cream-50 mt-4">
                  <div className="w-8 h-8 rounded-full bg-brand-teal-50 text-brand-teal-800 font-bold flex items-center justify-center text-xs">
                    {t.initials}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-brand-teal-800">{t.name}</h5>
                    <p className="text-[10px] text-brand-charcoal/50">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer CTA Section (Forms & Application details) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Volunteer Info */}
          <div className="lg:col-span-6 space-y-6">
            <SectionHeader
              tagline="Volunteer CTA"
              title="Apply to Join Our Camp Outposts"
              description="Whether you are a certified physician willing to offer consultation, or a student ready to log patient check-ins, your hands make these health camps run."
            />
            <ul className="space-y-3.5 text-xs text-brand-charcoal font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-brand-saffron-500 shrink-0" />
                <span>Free logistics, coordination transfers, and operations training.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-brand-saffron-500 shrink-0" />
                <span>Gain exposure to rural community healthcare metrics directly.</span>
              </li>
            </ul>
          </div>

          {/* Volunteer Form */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-brand-cream-100 rounded-2xl p-6 sm:p-8 shadow-md">
              {volunteerSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-brand-teal-50 text-brand-teal-800 flex items-center justify-center mx-auto">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="text-base font-serif font-bold text-brand-teal-800">Application Received</h4>
                  <p className="text-xs text-brand-charcoal/60 max-w-xs mx-auto">Thank you. Our coordination desk will email you upcoming camp schedules.</p>
                </div>
              ) : (
                <form onSubmit={handleVolunteerSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-brand-charcoal/60">Full Name</label>
                      <input
                        type="text"
                        required
                        value={volunteerForm.name}
                        onChange={(e) => setVolunteerForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-brand-charcoal/60">Phone</label>
                      <input
                        type="tel"
                        required
                        value={volunteerForm.phone}
                        onChange={(e) => setVolunteerForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-brand-charcoal/60">Email Address</label>
                    <input
                      type="email"
                      required
                      value={volunteerForm.email}
                      onChange={(e) => setVolunteerForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-brand-charcoal/60">Desired Role</label>
                    <select
                      value={volunteerForm.role}
                      onChange={(e) => setVolunteerForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 bg-white focus:outline-none focus:border-brand-teal-800 font-medium"
                    >
                      <option>General Volunteer</option>
                      <option>Medical Practitioner (Doctor)</option>
                      <option>Nursing Practitioner</option>
                      <option>Mental Health Counselor</option>
                    </select>
                  </div>
                  {volunteerError && (
                    <div className="text-[10px] text-red-600 font-semibold bg-red-50 p-2 rounded-lg border border-red-100">
                      {volunteerError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isVolunteerSubmitting}
                    className={`w-full py-2.5 rounded-full text-xs font-bold text-white transition-colors duration-150 ${
                      isVolunteerSubmitting
                        ? "bg-brand-teal-800/60 cursor-not-allowed"
                        : "bg-brand-teal-800 hover:bg-brand-teal-900"
                    }`}
                  >
                    {isVolunteerSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Donation CTA Tiers Section (Added Section 10) */}
      <section className="py-20 bg-brand-cream-100/50 border-t border-brand-cream-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tagline="Donation CTA"
            title="Finance a Health Camp Initiative"
            description="Choose a contribution level. Your funding directly purchases medicines, diagnostic checks, and coordinates emergency referrals."
            centered
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {donationTiers.map((tier) => (
              <div key={tier.amount} className="bg-white border border-brand-cream-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[160px] hover:border-brand-saffron-300 transition-colors duration-200">
                <div className="space-y-2">
                  <span className="block text-lg font-serif font-bold text-brand-teal-800">{tier.label}</span>
                  <p className="text-[11px] text-brand-charcoal/70 leading-normal font-medium">{tier.desc}</p>
                </div>
                <div className="pt-4">
                  <Link
                    to="/donate"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-saffron-500 hover:text-brand-saffron-600"
                  >
                    Donate this amount
                    <Heart size={10} className="fill-brand-saffron-500" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section (Added Section 11) */}
      <section className="py-12 bg-white border-y border-brand-cream-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-saffron-500">Our Hospital & Clinical Network Partners</span>
          <p className="text-xs text-brand-charcoal/70 max-w-2xl mx-auto leading-relaxed font-medium">
            We collaborate with leading tertiary healthcare providers and super-specialty hospitals to ensure that patients diagnosed with critical conditions at our rural camps receive immediate referral consultations, subsidised surgeries, and quality post-camp care.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 pt-2">
            {[
              "Netrapedia",
              "NCRI Hospital",
              "KPC Medical College",
              "Narayana Health",
              "Manipal Hospital",
              "Medica Superspeciality"
            ].map((p) => (
              <div key={p} className="px-5 py-2.5 rounded-xl bg-brand-cream-50/50 border border-brand-cream-100/60 shadow-sm hover:border-brand-teal-200 hover:shadow transition-all duration-200 text-xs font-serif font-bold text-brand-teal-900 select-none">
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News / Bulletins Section (Added Section 12) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          tagline="Latest News"
          title="Camp Announcements & Trust Bulletins"
          description="Stay updated with our upcoming mobile outposts and tax auditing uploads."
          centered
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsArticles.map((art) => (
            <div key={art.title} className="bg-white border border-brand-cream-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[260px] hover:shadow-md transition-shadow duration-200">
              <div className="space-y-3">
                <span className="inline-block text-[9px] font-bold uppercase text-brand-saffron-500 bg-brand-saffron-50 border border-brand-saffron-100 px-2 py-0.5 rounded-full">
                  {art.category}
                </span>
                <h4 className="text-sm font-serif font-bold text-brand-teal-800 leading-tight">
                  {art.title}
                </h4>
                <p className="text-xs text-brand-charcoal/70 leading-relaxed">
                  {art.summary}
                </p>
              </div>
              <div className="pt-4 border-t border-brand-cream-50 mt-4 flex items-center justify-between">
                <span className="text-[9px] text-brand-charcoal/40">{art.date}</span>
                <Link
                  to={art.link}
                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-teal-800 hover:text-brand-saffron-500"
                >
                  Details
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="bg-brand-teal-900 text-white py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,250,247,0.05),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 z-10">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight leading-tight">
            Bring Healthcare to West Bengal's Remote Villages
          </h2>
          <p className="text-xs sm:text-sm text-brand-teal-100 max-w-xl mx-auto leading-relaxed">
            Your generous contribution finances essential diagnostic kits, life-saving medicines, and critical patient transfer operations.
          </p>
          <div className="pt-4">
            <Link
              to="/donate"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-bold text-white bg-brand-saffron-500 hover:bg-brand-saffron-600 hover:shadow-lg transition-all duration-200"
            >
              Finance a Diagnostic Camp (Donate Now)
              <Heart size={14} className="fill-white" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
