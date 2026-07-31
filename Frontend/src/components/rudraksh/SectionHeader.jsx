import React from "react";

export default function SectionHeader({
  title,
  tagline,
  description,
  centered = false,
  dark = false,
}) {
  return (
    <div className={`max-w-3xl mb-10 ${centered ? "mx-auto text-center" : "text-left"}`}>
      {tagline && (
        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${dark ? "text-brand-saffron-300" : "text-brand-saffron-500"}`}>
          {tagline}
        </span>
      )}
      <h2 className={`text-3xl sm:text-4xl font-bold font-serif mt-2 tracking-tight leading-tight ${dark ? "text-white" : "text-brand-teal-800"}`}>
        {title}
      </h2>
      {description && (
        <p className={`text-xs sm:text-sm mt-4 leading-relaxed font-medium ${dark ? "text-brand-teal-100" : "text-brand-charcoal/70"}`}>
          {description}
        </p>
      )}
      <div className={`w-12 h-[3px] bg-brand-saffron-500 mt-5 ${centered ? "mx-auto" : ""}`} />
    </div>
  );
}
