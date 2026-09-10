import { useState, useEffect, useRef } from 'react';
import { useInView } from "framer-motion";

interface TypewriterProps {
  text: string;
  delay?: number;
  className?: string;
  startOnView?: boolean;
  multiline?: boolean;
}

export function Typewriter({ text, delay = 50, className = "", startOnView = true, multiline = false }: TypewriterProps) {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (startOnView && !isInView) return;

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
  
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text, startOnView, isInView]);

  const layoutClass = multiline
    ? "block whitespace-pre min-h-[1em]"
    : "inline";

  return (
    <span ref={ref} className={`${layoutClass} ${className}`.trim()}>
      {currentText}
    </span>
  );
}
