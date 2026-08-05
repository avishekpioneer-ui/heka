import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock } from "lucide-react";
import Navbar from "../../components/rudraksh/Navbar";
import Footer from "../../components/rudraksh/Footer";
import SectionHeader from "../../components/rudraksh/SectionHeader";
import { submitForm } from "../../components/rudraksh/submitForm";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "General Inquiry",
    subject: "",
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
        formType: "contact",
        ...formData,
      });
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMessage(data.error || "Failed to submit your message. Please try again.");
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
            Connect
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold font-serif text-brand-cream-50"
          >
            Contact Our Team
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-brand-teal-100 max-w-2xl mx-auto leading-relaxed"
          >
            Reach out for general inquiries, camp sponsorships, corporate CSR partnerships, or to request a mobile health camp in your village.
          </motion.p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Details Column */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-8"
          >
            <SectionHeader
              tagline="Get In Touch"
              title="Office Coordinates & Helpdesks"
              description="Our administrative center is located in Kolkata, with field coordinators based in rural clinics across Purulia and Sunderbans."
            />

            <div className="space-y-6 text-xs text-brand-charcoal">

              {/* Kolkata Head Office */}
              <div className="p-6 bg-white border border-brand-cream-100 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-sm font-serif font-bold text-brand-teal-800 flex items-center gap-2">
                  <MapPin size={16} className="text-brand-saffron-500" />
                  Kolkata Head Office (Admin)
                </h3>
                <p className="text-brand-charcoal/70 leading-relaxed font-medium pl-6">
                  Bamanpukur, North 24 Parganas, <br />
                  West Bengal, India, 743425
                </p>
                <div className="pl-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-brand-saffron-500" />
                    <a href="tel:+916289924753" className="hover:underline hover:text-brand-saffron-500 font-medium">+91 62899 24753</a>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail size={14} className="text-brand-saffron-500 mt-0.5" />
                    <div className="flex flex-col">
                      <a href="mailto:kundumoumita2020@gmail.com" className="hover:underline hover:text-brand-saffron-500 font-medium">kundumoumita2020@gmail.com</a>
                      <a href="mailto:rudraksh.kundu2011@gmail.com" className="hover:underline hover:text-brand-saffron-500 font-medium">rudraksh.kundu2011@gmail.com</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* District Coordination Desks */}
              <div className="p-6 bg-white border border-brand-cream-100 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-sm font-serif font-bold text-brand-teal-800 flex items-center gap-2">
                  <Clock size={16} className="text-brand-saffron-500" />
                  Field Office Timings
                </h3>
                <p className="text-brand-charcoal/70 leading-relaxed font-medium pl-6">
                  Our admin office is open Monday to Saturday, 10:00 AM to 6:00 PM. <br />
                  Medical field coordinators are on duty during Sunday health camps.
                </p>
              </div>

            </div>
          </motion.div>

          {/* Form Column */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="bg-white border border-brand-cream-100 rounded-2xl p-6 sm:p-8 shadow-md">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-brand-teal-50 text-brand-teal-800 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-brand-teal-800">Message Transmitted!</h3>
                  <p className="text-xs text-brand-charcoal/70 max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out to Rudraksh Foundation. Our team will review your message and get back to you within 2 business days.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        type: "General Inquiry",
                        subject: "",
                        message: "",
                      });
                      setErrorMessage("");
                    }}
                    className="inline-flex items-center justify-center px-6 py-2 rounded-full text-xs font-bold text-white bg-brand-teal-800 hover:bg-brand-teal-900 transition-colors duration-150"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="text-lg font-serif font-bold text-brand-teal-800 border-b border-brand-cream-50 pb-2">
                    Send Us an Inquiry
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Your Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Amit Roy"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="amit@example.com"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Inquiry Type</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 bg-white focus:outline-none focus:border-brand-teal-800 font-medium"
                      >
                        <option>General Inquiry</option>
                        <option>Sponsor a Camp</option>
                        <option>CSR Partnership</option>
                        <option>Request a Health Camp</option>
                        <option>Patient Referral</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="e.g. Sponsoring a camp in Purulia"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Your Message</label>
                    <textarea
                      name="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="How can we assist you?"
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
                    {isSubmitting ? "Transmitting..." : "Transmit Message"}
                    <Send size={12} className={isSubmitting ? "animate-pulse" : ""} />
                  </button>
                </form>
              )}
            </div>
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
