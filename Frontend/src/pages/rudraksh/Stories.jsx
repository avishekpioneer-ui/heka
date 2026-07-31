import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MapPin, Heart } from "lucide-react";
import Navbar from "../../components/rudraksh/Navbar";
import Footer from "../../components/rudraksh/Footer";
import SectionHeader from "../../components/rudraksh/SectionHeader";

const allStories = [
  {
    id: 1,
    title: "Sujata's Journey: Defeating Stage 1 Cancer in Sunderbans",
    category: "Patient Case Study",
    author: "Operations Desk",
    date: "July 12, 2026",
    summary: "How a mobile screening camp in a remote island village identified early cervical anomalies and coordinated her full treatment path to recovery in Kolkata.",
    district: "Sunderbans",
    readTime: "4 min read",
    highlight: true,
  },
  {
    id: 2,
    title: "Gaurab's Return to School: Reversing Chronic Malnutrition",
    category: "Patient Case Study",
    author: "Nutrition Coordinator",
    date: "June 28, 2026",
    summary: "Gaurab was lagging behind in studies due to severe parasitosis and anemia. Our preventive healthcare team intervened with diagnostic tests and medication.",
    district: "Purulia",
    readTime: "3 min read",
    highlight: false,
  },
  {
    id: 3,
    title: "Volunteer Log: Why I Spend My Weekends at Mobile Camps",
    category: "Volunteer Diary",
    author: "Dr. Debashis Roy (Oncologist)",
    date: "June 14, 2026",
    summary: "One of our volunteer cancer surgeons shares his personal reflection after screening 120 patients in a single Sunday marathon health camp.",
    district: "Bankura",
    readTime: "5 min read",
    highlight: false,
  },
  {
    id: 4,
    title: "Eradicating Stigma: Counseling the Farming Communities",
    category: "Counselor Diary",
    author: "A. Roy Chowdhury (Lead Counselor)",
    date: "May 22, 2026",
    summary: "Breaking down the isolation and agricultural anxiety barriers in rural Bengal. A look inside our weekly group psychological wellness initiatives.",
    district: "Birbhum",
    readTime: "4 min read",
    highlight: false,
  },
];

export default function Stories() {
  const [filter, setFilter] = useState("All");

  const categories = ["All", "Patient Case Study", "Volunteer Diary", "Counselor Diary"];

  const filteredStories = filter === "All"
    ? allStories
    : allStories.filter(s => s.category === filter);

  const featuredStory = allStories.find(s => s.highlight);

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
            Stories of Change
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold font-serif text-brand-cream-50"
          >
            Voices from the Field
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-brand-teal-100 max-w-2xl mx-auto leading-relaxed"
          >
            Read first-hand accounts from the patients who received diagnostics and the medical volunteers who coordinate the camps.
          </motion.p>
        </div>
      </section>

      {/* Featured Story Banner */}
      {featuredStory && (
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border border-brand-cream-100 shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12"
          >

            {/* Featured Visual Accent */}
            <div className="lg:col-span-5 bg-gradient-to-br from-brand-teal-800 to-brand-teal-950 text-white p-8 sm:p-12 flex flex-col justify-between relative min-h-[300px]">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <BookOpen size={160} />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-saffron-500/20 text-brand-saffron-300 border border-brand-saffron-400/20 w-fit">
                Featured Narrative
              </span>
              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-1 text-xs text-brand-teal-200">
                  <MapPin size={12} />
                  <span>District: {featuredStory.district}</span>
                </div>
                <h3 className="text-2xl font-serif font-bold leading-tight">
                  {featuredStory.title}
                </h3>
              </div>
              <span className="text-[10px] text-brand-teal-300 font-semibold">
                Published on {featuredStory.date}
              </span>
            </div>

            {/* Featured Summary */}
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-saffron-500">
                  {featuredStory.category}
                </span>
                <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed font-medium">
                  {featuredStory.summary}
                </p>
                <p className="text-xs text-brand-charcoal/70 leading-relaxed">
                  We coordinate with state-run oncology facilities in Kolkata to ensure that rural screenings that result in clinical findings are given rapid biopsy checks. Sujata Mondal represents one of many stories made possible through timely screening access.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-brand-cream-100 pt-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-teal-50 flex items-center justify-center font-bold text-xs text-brand-teal-800">
                    OD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brand-teal-800">{featuredStory.author}</h4>
                    <p className="text-[9px] text-brand-charcoal/40">{featuredStory.readTime}</p>
                  </div>
                </div>
                <Link
                  to="/donate"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-brand-saffron-500 hover:bg-brand-saffron-600 shadow transition-all duration-150"
                >
                  Sponsor a Screening
                  <Heart size={12} className="fill-white" />
                </Link>
              </div>
            </div>

          </motion.div>
        </section>
      )}

      {/* Category Filter & Grid */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-brand-cream-100/50">

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2.5 justify-center mb-12">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all duration-150 ${
                filter === c
                  ? "bg-brand-teal-800 text-white shadow-sm"
                  : "bg-white text-brand-charcoal border border-brand-cream-100 hover:border-brand-teal-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Stories Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredStories.filter(s => !s.highlight || filter !== "All").map((story) => (
              <motion.div
                layout
                key={story.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
                className="bg-white border border-brand-cream-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 min-h-[280px]"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-brand-charcoal/40 uppercase">
                    <span>{story.category}</span>
                    <span>{story.readTime}</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-brand-teal-800 leading-tight">
                    {story.title}
                  </h3>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                    {story.summary}
                  </p>
                </div>

                <div className="border-t border-brand-cream-50 pt-4 mt-6 flex items-center justify-between">
                  <span className="text-[10px] text-brand-charcoal/40 font-medium">
                    By {story.author}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-brand-saffron-500">
                    <MapPin size={10} />
                    <span>{story.district}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* CTA Footer */}
      <section className="bg-brand-teal-900 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
            Enable More Stories of Survival
          </h2>
          <p className="text-xs text-brand-teal-100 max-w-xl mx-auto">
            Each story represents a life saved, a family supported, and a community empowered. Help us continue this mission.
          </p>
          <div className="pt-2">
            <Link
              to="/donate"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-xs font-bold text-white bg-brand-saffron-500 hover:bg-brand-saffron-600 transition-all duration-150"
            >
              Support a Patient Case
              <Heart size={14} className="fill-white" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
