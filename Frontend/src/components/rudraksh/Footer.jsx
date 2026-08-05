import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-brand-teal-950 text-white pt-16 pb-8 border-t border-brand-teal-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Column 1: Brand & Tagline */}
          <div className="space-y-4">
            <Link to="/" className="flex flex-col group">
              <span className="text-2xl font-bold font-serif text-brand-cream-50 tracking-tight">
                Rudraksh
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-saffron-400 font-sans -mt-1">
                Foundation
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-brand-teal-100 font-medium max-w-sm">
              Healthcare for Every Section of Society. Providing accessible healthcare, cancer awareness screenings, and mental wellness to underserved communities in West Bengal.
            </p>
            <p className="text-[10px] text-brand-teal-300 font-sans font-medium">
              Registered Public Charitable Trust.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2.5 rounded-full bg-brand-teal-900 hover:bg-brand-saffron-500 text-brand-cream-50 hover:text-white transition-all duration-200">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2.5 rounded-full bg-brand-teal-900 hover:bg-brand-saffron-500 text-brand-cream-50 hover:text-white transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2.5 rounded-full bg-brand-teal-900 hover:bg-brand-saffron-500 text-brand-cream-50 hover:text-white transition-all duration-200">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Initiatives */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-saffron-400 mb-6 font-sans">
              Our Initiatives
            </h3>
            <ul className="space-y-3.5 text-xs text-brand-teal-100">
              <li>
                <Link to="/initiatives#health-camps" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  Mobile Health Camps
                </Link>
              </li>
              <li>
                <Link to="/initiatives#cancer-care" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  Cancer Screening Drives
                </Link>
              </li>
              <li>
                <Link to="/initiatives#mental-health" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  Counseling & Mental Health
                </Link>
              </li>
              <li>
                <Link to="/initiatives#preventive-health" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  Preventive Healthcare Education
                </Link>
              </li>
              <li>
                <Link to="/initiatives#emergency-care" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  Emergency Medical Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Transparency & Trust */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-saffron-400 mb-6 font-sans">
              Trust & Compliance
            </h3>
            <ul className="space-y-3.5 text-xs text-brand-teal-100">
              <li>
                <Link to="/about#transparency" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  NGO Registration Details
                </Link>
              </li>
              <li>
                <Link to="/about#transparency" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  12A & 80G Exemption Status
                </Link>
              </li>
              <li>
                <Link to="/impact#reports" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  Annual Audit Reports (PDFs)
                </Link>
              </li>
              <li>
                <Link to="/about#transparency" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  FCRA Compliance Info
                </Link>
              </li>
              <li>
                <Link to="/about#transparency" className="hover:text-brand-saffron-400 hover:underline transition-all duration-150">
                  Whistleblower & Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-saffron-400 mb-6 font-sans">
              Reach Us
            </h3>
            <ul className="space-y-3.5 text-xs text-brand-teal-100">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-brand-saffron-400 shrink-0 mt-0.5" />
                <span>Bamanpukur, North 24 Parganas, West Bengal, India, 743425</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-brand-saffron-400 shrink-0" />
                <a href="tel:+916289924753" className="hover:underline hover:text-brand-saffron-400">+91 62899 24753</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-brand-saffron-400 shrink-0" />
                <a href="mailto:kundumoumita2020@gmail.com" className="hover:underline hover:text-brand-saffron-400">kundumoumita2020@gmail.com</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-brand-saffron-400 shrink-0" />
                <a href="mailto:rudraksh.kundu2011@gmail.com" className="hover:underline hover:text-brand-saffron-400">rudraksh.kundu2011@gmail.com</a>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                to="/donate"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full text-xs font-bold text-white bg-brand-saffron-500 hover:bg-brand-saffron-600 transition-all duration-150"
              >
                <Heart size={12} className="fill-white" />
                Make a Contribution
              </Link>
            </div>
          </div>
        </div>

        <hr className="border-brand-teal-900 my-8" />

        {/* Bottom Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-brand-teal-300 gap-4">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} Rudraksh Foundation. All rights reserved.</p>
            <p className="mt-0.5">Registered under the Indian Trusts Act, 1882. All donations are tax-deductible under Section 80G of the Income Tax Act.</p>
          </div>
          <div className="flex space-x-4">
            <Link to="/about#transparency" className="hover:text-white transition-colors duration-150">Privacy Policy</Link>
            <Link to="/about#transparency" className="hover:text-white transition-colors duration-150">Terms & Conditions</Link>
            <Link to="/about#transparency" className="hover:text-white transition-colors duration-150">80G Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
