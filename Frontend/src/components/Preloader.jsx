import React, { useEffect, useRef, useState } from "react";

export default function Preloader({
  message = "HEKA - care that cares",
  onComplete = () => {},
  className = "",
}) {
  const alreadySeen = sessionStorage.getItem("hasSeenPreloader");
  const [visible, setVisible] = useState(!alreadySeen);
  const [displayed, setDisplayed] = useState("");
  const [fading, setFading] = useState(false);
  const timersRef = useRef([]);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (alreadySeen) {
      onComplete();
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    setDisplayed("");

    const messageLength = message.length;
    const typingSpeed = 100;
    const fadeDelay = 1000;

    for (let i = 0; i < messageLength; i++) {
      const t = setTimeout(() => {
        setDisplayed((s) => s + message.charAt(i));
      }, typingSpeed * i);
      timersRef.current.push(t);
    }

    const totalTypingTime = typingSpeed * messageLength;
    const hideTimeout = setTimeout(() => {
      setFading(true);
      const finishT = setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem("hasSeenPreloader", "true"); // ✅ Mark as shown
        if (!finishedRef.current) {
          finishedRef.current = true;
          onComplete();
        }
      }, 600);
      timersRef.current.push(finishT);
    }, totalTypingTime + fadeDelay);

    timersRef.current.push(hideTimeout);

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
      document.body.style.overflow = prevOverflow || "";
    };
  }, [message, alreadySeen, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black p-4 ${className}`}
      style={{ touchAction: "none" }}
    >
      <div
        className={`max-w-lg w-full text-center transition-all duration-500 ease-out transform ${
          fading ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="mx-auto w-full max-w-xs sm:max-w-sm">
          <div className="rounded-2xl p-6 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <h1 className="font-literata text-white font-semibold text-[22px] sm:text-2xl leading-tight break-words">
                <span aria-live="polite">{displayed}</span>
                <span
                  className="ml-1 inline-block align-middle h-6 w-1 rounded-sm animate-[blink_1s_steps(2,start)_infinite]"
                  style={{ backgroundColor: "#fff" }}
                />
              </h1>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-[blink_1s_steps(2,start)_infinite] {
          animation: blink 1s steps(2, start) infinite;
        }
      `}</style>
    </div>
  );
}
