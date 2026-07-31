import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, FileText, CheckCircle2, Send, Activity } from "lucide-react";
import Navbar from "../../components/rudraksh/Navbar";
import Footer from "../../components/rudraksh/Footer";
import SectionHeader from "../../components/rudraksh/SectionHeader";
import { submitForm } from "../../components/rudraksh/submitForm";

export default function Volunteer() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "General Volunteer",
    district: "Kolkata",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const data = await submitForm({
        formType: "volunteer",
        ...formData,
      });
      if (data.success) {
        setFormSubmitted(true);
      } else {
        setErrorMessage(data.error || "Failed to submit application. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Get Involved
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold font-serif text-brand-cream-50"
          >
            Join Our Mission
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-brand-teal-100 max-w-2xl mx-auto leading-relaxed"
          >
            Whether you want to offer professional medical expertise, coordinate field logistics, or align your corporate CSR objectives, we welcome your support.
          </motion.p>
        </div>
      </section>

      {/* Volunteer Roles & Registration Form */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Info Side (Roles) */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-8"
          >
            <SectionHeader
              tagline="Volunteer Program"
              title="How You Can Assist in the Field"
              description="Our mobile health camps are successful because of the hands-on dedication of our medical and coordinate volunteer cohorts."
            />

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-teal-50 text-brand-teal-800 flex items-center justify-center shrink-0 shadow-sm">
                  <Activity size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-brand-teal-800">Medical Professionals</h4>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                    General physicians, oncologists, pediatricians, clinical counselors, and nurses are needed to carry out free diagnoses, screenings, and counseling.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-saffron-50 text-brand-saffron-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Users size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-brand-teal-800">Field Coordinators</h4>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                    Help organize patient queues, manage medicine inventories, handle check-ins, and assist doctors with registration files during Sunday camps.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-teal-50 text-brand-teal-800 flex items-center justify-center shrink-0 shadow-sm">
                  <FileText size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-brand-teal-800">Media & Content Volunteers</h4>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                    Help document beneficiary stories, photograph camp activities respectfully, and create digital awareness campaigns to expand our reach.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <div className="bg-white border border-brand-cream-100 rounded-2xl p-6 sm:p-8 shadow-md">
              {formSubmitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-brand-teal-50 text-brand-teal-800 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-brand-teal-800">Application Received!</h3>
                  <p className="text-xs text-brand-charcoal/70 max-w-sm mx-auto leading-relaxed">
                    Thank you for applying to volunteer with Rudraksh Foundation. Our coordination desk will review your details and email you upcoming camp schedules.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        role: "General Volunteer",
                        district: "Kolkata",
                        message: "",
                      });
                      setErrorMessage("");
                    }}
                    className="inline-flex items-center justify-center px-6 py-2 rounded-full text-xs font-bold text-white bg-brand-teal-800 hover:bg-brand-teal-900 transition-colors duration-150"
                  >
                    Submit Another Application
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-lg font-serif font-bold text-brand-teal-800 border-b border-brand-cream-50 pb-2">
                    Volunteer Application Form
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Preferred Role</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 bg-white focus:outline-none focus:border-brand-teal-800 font-medium"
                      >
                        <option>General Volunteer</option>
                        <option>Medical Practitioner (Doctor)</option>
                        <option>Nursing Practitioner</option>
                        <option>Mental Health Counselor</option>
                        <option>Media Coordinator</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Base District</label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 bg-white focus:outline-none focus:border-brand-teal-800 font-medium"
                      >
                        <option>Kolkata</option>
                        <option>South 24 Parganas</option>
                        <option>Purulia</option>
                        <option>Bankura</option>
                        <option>Birbhum</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Why do you want to join us?</label>
                    <textarea
                      name="message"
                      rows={3}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Briefly tell us about your experience or motivation..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium resize-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full text-xs font-bold text-white shadow transition-all duration-150 ${
                      isSubmitting
                        ? "bg-brand-teal-800/60 cursor-not-allowed"
                        : "bg-brand-teal-800 hover:bg-brand-teal-900"
                    }`}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                    <Send size={12} className={isSubmitting ? "animate-pulse" : ""} />
                  </button>
                </form>
              )}
            </div>
          </motion.div>

        </div>
      </section>

      {/* Corporate CSR Partnerships Section */}
      <section id="csr" className="py-20 bg-brand-cream-100/50 border-y border-brand-cream-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tagline="Corporate Collaboration"
            title="CSR Partnerships & Camp Sponsorship"
            description="We support corporate institutions looking to allocate CSR capital under Section 135 of the Companies Act, providing end-to-end transparent reporting."
            centered
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -3 }}
              className="bg-white border border-brand-cream-100 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-teal-50 text-brand-teal-800 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <h4 className="text-base font-serif font-bold text-brand-teal-800">Fully Compliant Form CSR-1</h4>
              <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                Rudraksh Foundation is registered with the Ministry of Corporate Affairs (MCA) under CSR Registration Number <strong className="font-bold">CSR0003295</strong>. We provide 80G tax benefit files and audited expense receipts for corporate audits.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -3 }}
              className="bg-white border border-brand-cream-100 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-saffron-50 text-brand-saffron-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h4 className="text-base font-serif font-bold text-brand-teal-800">Impact Analysis Reports</h4>
              <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                Our operations team tracks and publishes full impact logs of each camp, including statistics on diagnoses made, medicines provided, patient demographics, and subsequent hospital referrals.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community Fundraising Section */}
      <section id="fundraise" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <SectionHeader
            tagline="Individual Advocacy"
            title="Fundraise for Rudraksh Foundation"
            description="You don't need a medical degree or corporate capital to support community health. You can host digital or physical fundraisers in your schools, colleges, or neighborhoods."
            centered
          />
          <p className="text-xs text-brand-charcoal/80 max-w-xl mx-auto leading-relaxed">
            Interested in organizing a health awareness drive, setting up a community birthday fundraiser, or coordinating donation collection desks? Contact our support coordinators directly at <a href="mailto:kundumoumita2020@gmail.com" className="text-brand-saffron-500 hover:underline">kundumoumita2020@gmail.com</a> or <a href="mailto:rudraksh.kundu2011@gmail.com" className="text-brand-saffron-500 hover:underline">rudraksh.kundu2011@gmail.com</a> for media guides, flyers, and templates.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
