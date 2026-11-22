"use client";

import Link from "next/link";
import { Star, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

function FloatingShape({ color, size, top, left, delay, shape }: { color: string; size: number; top: string; left: string; delay: number; shape: "circle" | "square" | "triangle" }) {
  const borderRadius = shape === "circle" ? "50%" : shape === "square" ? "20%" : "0";
  const clipPath = shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.15, scale: 1, y: [-8, 8, -8], rotate: [0, shape === "square" ? 45 : 0, 0] }}
      transition={{
        opacity: { duration: 1, delay },
        scale: { duration: 1, delay },
        y: { duration: 5 + delay, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
      }}
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        background: color,
        borderRadius,
        clipPath,
        zIndex: 0,
      }}
    />
  );
}

export default function AnimatedHero() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-20 relative z-10">

      {/* Formes géométriques décoratives */}
      <div className="hidden sm:block">
        <FloatingShape color="#E8B800" size={80} top="10%" left="65%" delay={0.5} shape="circle" />
        <FloatingShape color="#27A827" size={60} top="60%" left="75%" delay={1} shape="square" />
        <FloatingShape color="#E8B800" size={40} top="30%" left="85%" delay={1.5} shape="triangle" />
        <FloatingShape color="#27A827" size={50} top="80%" left="60%" delay={0.8} shape="circle" />
        <FloatingShape color="#E8B800" size={35} top="15%" left="90%" delay={1.2} shape="square" />
      </div>

      <div className="max-w-2xl relative z-10">

        {/* Preuve sociale */}
        <motion.div {...fadeUp(0.2)} className="flex items-center gap-3 mb-5">
          <div className="flex -space-x-2">
            {["MN", "PK", "SF", "AK"].map((a) => (
              <motion.div
                key={a}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 + Math.random() * 0.3 }}
                className="w-8 h-8 rounded-full bg-[#27A827] border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm"
              >
                {a[0]}
              </motion.div>
            ))}
          </div>
          <div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                </motion.div>
              ))}
            </div>
            <p className="text-gray-500 text-xs">Rejoint par <strong className="text-gray-900">15 000+</strong> lecteurs</p>
          </div>
        </motion.div>

        {/* Titre principal */}
        <motion.h1
          {...fadeUp(0.4)}
          className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.1] mb-4"
        >
          <span className="text-gray-900">Créez de la</span>{" "}
          <motion.span
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
            style={{ color: "#E8B800", display: "inline-block", perspective: 600 }}
          >
            valeur
          </motion.span>
          <br />
          <span className="text-gray-900">avec votre</span>{" "}
          <motion.span
            initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
            style={{ color: "#27A827", display: "inline-block", perspective: 600 }}
          >
            expertise.
          </motion.span>
        </motion.h1>

        {/* Sous-titre */}
        <motion.p
          {...fadeUp(0.6)}
          className="text-base sm:text-lg leading-relaxed mb-6 max-w-md text-gray-600"
        >
          Contribuez à votre communauté et bâtissez votre avenir.
        </motion.p>

        {/* Boutons */}
        <motion.div {...fadeUp(0.8)} className="flex flex-col gap-3 mb-6">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href="/ebooks"
              className="cta-shimmer cta-pulse w-full sm:w-auto px-6 py-4 text-black font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
            >
              Acheter un Ebook <ArrowRight size={18} />
            </Link>
          </motion.div>
          <div className="flex gap-3">
            <motion.div className="flex-1" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/accompagnement"
                className="block px-4 py-3 border-2 border-[#E8B800]/40 hover:bg-[#E8B800]/10 hover:border-[#E8B800] font-bold rounded-xl transition-all duration-300 text-center text-sm"
                style={{ color: "#C49A00" }}
              >
                Accompagnement
              </Link>
            </motion.div>
            <motion.div className="flex-1" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/devenir-consultant"
                className="block px-4 py-3 border-2 border-[#27A827]/40 hover:bg-[#27A827]/10 hover:border-[#27A827] font-bold rounded-xl transition-all duration-300 text-center text-sm"
                style={{ color: "#1e8c1e" }}
              >
                Devenir Consultant
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Réassurance */}
        <motion.div {...fadeUp(1.0)} className="flex flex-wrap gap-x-5 gap-y-2">
          {["Paiement sécurisé", "Accès immédiat", "Support WhatsApp"].map((b, i) => (
            <motion.div
              key={b}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.15 }}
              className="flex items-center gap-1.5 text-xs text-gray-500"
            >
              <CheckCircle size={12} style={{ color: "#27A827" }} />
              {b}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
