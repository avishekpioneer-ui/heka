import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Award, CheckCircle2, ShieldCheck } from "lucide-react";
import Navbar from "../../components/rudraksh/Navbar";
import Footer from "../../components/rudraksh/Footer";
import SectionHeader from "../../components/rudraksh/SectionHeader";
import { submitForm } from "../../components/rudraksh/submitForm";

const tiers = [
  { amount: 500, label: "₹500 ($6)", desc: "Sponsors diagnostic cards & general medicine for 1 child." },
  { amount: 1500, label: "₹1,500 ($18)", desc: "Sponsors diagnostic screening cards & medicine for a senior." },
  { amount: 5000, label: "₹5,000 ($60)", desc: "Sponsors specialized cancer screenings for 10 women." },
  { amount: 25000, label: "₹25,000 ($300)", desc: "Sponsors a complete mobile health camp for an entire village." },
];

export default function Donate() {
  const [frequency, setFrequency] = useState("One-Time");
  const [selectedTier, setSelectedTier] = useState(1500);
  const [customAmount, setCustomAmount] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [donorDetails, setDonorDetails] = useState({ name: "", email: "", phone: "" });
  const [pledged, setPledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getPledgeAmount = () => {
    if (selectedTier === "custom") {
      return parseFloat(customAmount) || 0;
    }
    return selectedTier;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDonorDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePledge = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const data = await submitForm({
        formType: "pledge",
        amount: getPledgeAmount(),
        frequency,
        panNumber,
        ...donorDetails,
      });
      if (data.success) {
        setPledged(true);
      } else {
        setErrorMessage(data.error || "Failed to register donation pledge. Please try again.");
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
            Support Our Outreach
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold font-serif text-brand-cream-50"
          >
            Empower Rural Communities
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-brand-teal-100 max-w-2xl mx-auto leading-relaxed"
          >
            Your contributions buy diagnostics, clinical medicines, and coordinate patient transfers. All donations are 80G tax-exempt under Income Tax laws.
          </motion.p>
        </div>
      </section>

      {/* Donate Widget & Bank Coordinates */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Widget Column */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="bg-white border border-brand-cream-100 rounded-2xl p-6 sm:p-8 shadow-md">
              {pledged ? (
                <div className="py-8 text-center space-y-5">
                  <div className="w-14 h-14 rounded-full bg-brand-saffron-50 text-brand-saffron-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif font-bold text-brand-teal-800">Donation Pledge Registered!</h3>
                    <p className="text-xs text-brand-charcoal/70 max-w-md mx-auto leading-relaxed">
                      Thank you, <strong className="font-bold">{donorDetails.name}</strong>, for pledging <strong className="font-bold">₹{getPledgeAmount().toLocaleString()}</strong> ({frequency}).
                    </p>
                    <p className="text-[10px] text-brand-charcoal/50 max-w-xs mx-auto leading-relaxed">
                      We have sent direct payment transfer instructions and direct gateway details to <strong className="font-bold">{donorDetails.email}</strong>. An 80G tax exemption receipt will be issued once the transfer is finalized.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPledged(false);
                      setCustomAmount("");
                      setPanNumber("");
                      setDonorDetails({ name: "", email: "", phone: "" });
                      setErrorMessage("");
                    }}
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-bold text-white bg-brand-teal-800 hover:bg-brand-teal-900 transition-colors duration-150"
                  >
                    Back to Pledge Screen
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePledge} className="space-y-6">

                  {/* Step 1: Frequency */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal-800/80">
                      1. Donation Frequency
                    </h3>
                    <div className="flex gap-2 bg-brand-cream-100/50 p-1.5 rounded-xl border border-brand-cream-100">
                      {["One-Time", "Monthly Pledge"].map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setFrequency(freq)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                            frequency === freq
                              ? "bg-brand-teal-800 text-white shadow-sm"
                              : "text-brand-charcoal hover:bg-white"
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Sponsoring Tiers */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal-800/80">
                      2. Sponsoring Tier (INR)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tiers.map((t) => (
                        <button
                          key={t.amount}
                          type="button"
                          onClick={() => setSelectedTier(t.amount)}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 ${
                            selectedTier === t.amount
                              ? "border-brand-saffron-500 bg-brand-saffron-50/30"
                              : "border-brand-cream-150 bg-white hover:border-brand-teal-200"
                          }`}
                        >
                          <span className="text-sm font-serif font-bold text-brand-teal-800">
                            {t.label}
                          </span>
                          <p className="text-[10px] text-brand-charcoal/70 leading-normal mt-1.5 font-medium">
                            {t.desc}
                          </p>
                        </button>
                      ))}

                      {/* Custom Amount Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedTier("custom")}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 ${
                          selectedTier === "custom"
                            ? "border-brand-saffron-500 bg-brand-saffron-50/30"
                            : "border-brand-cream-150 bg-white hover:border-brand-teal-200"
                        }`}
                      >
                        <span className="text-sm font-serif font-bold text-brand-teal-800">Custom Contribution</span>
                        <p className="text-[10px] text-brand-charcoal/70 mt-1.5 font-medium">Specify a custom support amount.</p>
                      </button>
                    </div>

                    {selectedTier === "custom" && (
                      <div className="pt-2">
                        <input
                          type="number"
                          required
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount (e.g. 10000)"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                          min="100"
                        />
                      </div>
                    )}
                  </div>

                  {/* Step 3: Donor Details */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal-800/80">
                      3. Donor Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={donorDetails.name}
                          onChange={handleInputChange}
                          placeholder="Bikash Roy"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={donorDetails.phone}
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
                          value={donorDetails.email}
                          onChange={handleInputChange}
                          placeholder="bikash@example.com"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-brand-charcoal/60">
                          PAN Card Number <span className="text-[9px] text-brand-charcoal/45">(Optional, for 80G tax receipt)</span>
                        </label>
                        <input
                          type="text"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value)}
                          placeholder="ABCDE1234F"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-brand-cream-200 focus:outline-none focus:border-brand-teal-800 font-medium uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission */}
                  {errorMessage && (
                    <div className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-100">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-full text-sm font-bold text-white shadow transition-all duration-150 ${
                      isSubmitting
                        ? "bg-brand-saffron-500/60 cursor-not-allowed"
                        : "bg-brand-saffron-500 hover:bg-brand-saffron-600"
                    }`}
                  >
                    {isSubmitting ? "Processing Pledge..." : "Proceed with Pledge"}
                    <Heart size={14} className={`fill-white ${isSubmitting ? "animate-pulse" : ""}`} />
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Bank Coordinates & Exemption details */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-8"
          >

            {/* Direct Bank coordinates (NGO trust) */}
            <div className="bg-brand-teal-900 text-white rounded-2xl p-6 sm:p-8 border border-brand-teal-850 shadow-xl space-y-5">
              <h3 className="text-lg font-serif font-bold text-brand-saffron-300 border-b border-brand-teal-800 pb-2">
                Direct Bank Transfer (NEFT/RTGS/IMPS)
              </h3>
              <p className="text-xs text-brand-teal-100 leading-relaxed font-medium">
                For major camp sponsorships or direct donations without intermediate gateways, please transfer to the trust's official banking account:
              </p>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-brand-teal-800/40 pb-1.5">
                  <span className="text-brand-teal-300">Account Name</span>
                  <span className="font-bold text-brand-cream-50">Rudraksh Foundation Trust</span>
                </div>
                <div className="flex justify-between border-b border-brand-teal-800/40 pb-1.5">
                  <span className="text-brand-teal-300">Account Number</span>
                  <span className="font-mono font-bold text-brand-cream-50">50200087654321</span>
                </div>
                <div className="flex justify-between border-b border-brand-teal-800/40 pb-1.5">
                  <span className="text-brand-teal-300">Bank Name</span>
                  <span className="font-bold text-brand-cream-50">HDFC Bank Ltd.</span>
                </div>
                <div className="flex justify-between border-b border-brand-teal-800/40 pb-1.5">
                  <span className="text-brand-teal-300">IFSC Code</span>
                  <span className="font-mono font-bold text-brand-cream-50">HDFC0000224</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-brand-teal-300">Branch Location</span>
                  <span className="font-bold text-brand-cream-50">Sarat Bose Road, Kolkata</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-brand-teal-200 leading-normal border-t border-brand-teal-850">
                Please email transfer receipt copies to <a href="mailto:receipts@rudrakshfoundation.org" className="underline text-brand-saffron-300">receipts@rudrakshfoundation.org</a> along with your name, phone, and PAN details for direct 80G tax benefit certificate issues.
              </div>
            </div>

            {/* 80G Exemption Box */}
            <div className="p-6 bg-white border border-brand-cream-100 rounded-2xl space-y-4 shadow-sm">
              <div className="flex gap-3">
                <Award size={24} className="text-brand-saffron-500 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-brand-teal-800 uppercase tracking-wider">
                    80G Tax Deductions
                  </h4>
                  <p className="text-xs text-brand-charcoal/70 leading-relaxed font-medium">
                    As a registered Public Charitable Trust under the Income Tax Act, 1961, all contributions to Rudraksh Foundation qualify for a 50% tax deduction under Section 80G. Receipt issues are automated.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>

        </div>
      </section>

      {/* Trust Shield Footer */}
      <section className="bg-brand-teal-950 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-3">
          <ShieldCheck size={28} className="text-brand-saffron-400" />
          <p className="text-xs text-brand-teal-200 text-center font-medium">
            Payments are securely encrypted. Rudraksh Foundation strictly protects donor data confidentiality.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
