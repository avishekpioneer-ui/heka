import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Heart } from "lucide-react";

const navLinks = [
  {
    label: "About Us",
    children: [
      { label: "Our Story", href: "/about#story" },
      { label: "Mission & Values", href: "/about#mission" },
      { label: "Leadership", href: "/about#team" },
      { label: "Compliance & Trust", href: "/about#transparency" },
      { label: "Hospital Partners", href: "/about#partners" },
    ],
  },
  {
    label: "Initiatives",
    children: [
      { label: "Mobile Health Camps", href: "/initiatives#health-camps" },
      { label: "Cancer Care & Screenings", href: "/initiatives#cancer-care" },
      { label: "Counseling & Mental Health", href: "/initiatives#mental-health" },
      { label: "Preventive Healthcare", href: "/initiatives#preventive-health" },
    ],
  },
  { label: "Our Impact", href: "/impact" },
  { label: "Stories of Change", href: "/stories" },
  {
    label: "Get Involved",
    children: [
      { label: "Volunteer Program", href: "/volunteer" },
      { label: "CSR Partnerships", href: "/volunteer#csr" },
      { label: "Fundraise for Us", href: "/volunteer#fundraise" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // The Next.js reference styled <body> and the scrollbar globally. This Navbar
  // renders on every landing page, so it owns the flag that scopes those rules
  // away from the rest of the HekaOS app.
  useEffect(() => {
    document.documentElement.classList.add("rudraksh-theme");
    return () => document.documentElement.classList.remove("rudraksh-theme");
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-brand-cream-50/95 backdrop-blur-md shadow-sm border-b border-brand-cream-100/50 py-3"
          : "bg-transparent py-5"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex flex-col group">
            <span className={`text-xl sm:text-2xl font-bold font-serif tracking-tight transition-colors duration-200 ${scrolled
                ? "text-brand-teal-800 group-hover:text-brand-teal-900"
                : "text-white group-hover:text-brand-saffron-300"
              }`}>
              Rudraksh
            </span>
            <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest font-sans -mt-1 transition-colors duration-200 ${scrolled ? "text-brand-saffron-500" : "text-brand-saffron-300"
              }`}>
              Foundation
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              if (link.children) {
                return (
                  <div
                    key={link.label}
                    className="relative px-3 py-2"
                    onMouseEnter={() => setActiveDropdown(link.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button className={`flex items-center text-sm font-semibold transition-colors duration-200 gap-1 ${scrolled
                        ? "text-brand-charcoal hover:text-brand-teal-900"
                        : "text-brand-cream-50 hover:text-brand-saffron-300 drop-shadow-sm"
                      }`}>
                      {link.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${activeDropdown === link.label ? "rotate-180" : ""
                          }`}
                      />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-2 w-56 rounded-xl bg-white border border-brand-cream-100/80 shadow-lg py-2 z-50 overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-teal-800" />
                          {link.children.map((item) => (
                            <Link
                              key={item.label}
                              to={item.href}
                              className="block px-4 py-2.5 text-xs font-semibold text-brand-charcoal hover:bg-brand-cream-50 hover:text-brand-teal-800 transition-all duration-150"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  to={link.href || "#"}
                  className={`px-3 py-2 text-sm font-semibold transition-colors duration-200 ${scrolled
                      ? "text-brand-charcoal hover:text-brand-teal-900"
                      : "text-brand-cream-50 hover:text-brand-saffron-300 drop-shadow-sm"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/donate"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-brand-saffron-500 hover:bg-brand-saffron-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <Heart size={14} className="fill-white group-hover:scale-110 transition-transform duration-200" />
              Donate Now
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center space-x-3">
            <Link
              to="/donate"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold text-white bg-brand-saffron-500 hover:bg-brand-saffron-600 shadow-md"
            >
              Donate
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-1.5 rounded-lg transition-colors duration-200 ${scrolled
                  ? "text-brand-charcoal hover:bg-brand-cream-100/50"
                  : "text-white hover:bg-white/10"
                }`}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-brand-cream-50 border-b border-brand-cream-100/80 shadow-inner overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2 max-h-[80vh] overflow-y-auto">
              {navLinks.map((link) => {
                if (link.children) {
                  return (
                    <div key={link.label} className="py-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-brand-teal-800/80 px-3 py-1.5">
                        {link.label}
                      </div>
                      <div className="pl-4 border-l-2 border-brand-cream-200 space-y-1 mt-1 ml-3">
                        {link.children.map((item) => (
                          <Link
                            key={item.label}
                            to={item.href}
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 text-sm font-medium text-brand-charcoal hover:text-brand-teal-800 transition-colors duration-200"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.label}
                    to={link.href || "#"}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-brand-charcoal hover:bg-brand-cream-100/50 hover:text-brand-teal-800 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
