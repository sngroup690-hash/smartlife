"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Anime tout le site sans toucher chaque page :
// - chaque bloc sous l'écran apparaît en glissant quand on défile ;
// - chaque nombre marqué data-compteur monte depuis 0 quand il devient visible.
const CIBLES = [
  "main section",
  "main article",
  "main h1",
  "main h2",
  "main [class*='rounded-2xl']",
  "main [class*='rounded-xl'] img",
  "footer > div > *",
].join(",");

function animerCompteur(el: HTMLElement) {
  const fin = Number(el.dataset.compteur);
  if (!fin) return;
  const suffixe = el.dataset.suffixe ?? "";
  const debut = performance.now();
  const duree = 1600;
  const pas = (t: number) => {
    const p = Math.min(1, (t - debut) / duree);
    const v = Math.round(fin * (1 - Math.pow(1 - p, 3)));
    el.textContent = v.toLocaleString("fr-FR").replace(/ | /g, " ") + suffixe;
    if (p < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

export default function AnimationsSite() {
  const chemin = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const suivis = new Set<HTMLElement>();
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          // Un bloc déjà dépassé (défilement rapide) s'affiche aussi.
          if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
          const el = e.target as HTMLElement;
          suivis.delete(el);
          obs.unobserve(el);
          if (el.dataset.compteur) {
            animerCompteur(el);
            continue;
          }
          el.classList.add("anim-visible");
          setTimeout(() => el.classList.remove("anim-avant", "anim-visible"), 1200);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );

    const preparer = () => {
      const hauteur = window.innerHeight;
      document.querySelectorAll<HTMLElement>(CIBLES).forEach((el) => {
        if (el.dataset.animPrete || el.closest("[data-sans-anim]") || el.closest(".anim-avant")) return;
        el.dataset.animPrete = "1";
        if (el.getBoundingClientRect().top < hauteur) return;
        const rang = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = `${Math.min(rang, 5) * 70}ms`;
        el.classList.add("anim-avant");
        suivis.add(el);
        obs.observe(el);
      });
      document.querySelectorAll<HTMLElement>("[data-compteur]").forEach((el) => {
        if (el.dataset.animPrete) return;
        el.dataset.animPrete = "1";
        suivis.add(el);
        obs.observe(el);
      });
    };

    preparer();
    let attente: ReturnType<typeof setTimeout> | null = null;
    const mut = new MutationObserver(() => {
      if (attente) return;
      attente = setTimeout(() => {
        attente = null;
        preparer();
      }, 150);
    });
    mut.observe(document.body, { childList: true, subtree: true });

    return () => {
      obs.disconnect();
      mut.disconnect();
      if (attente) clearTimeout(attente);
      // Rien ne doit rester caché si l'animateur s'arrête.
      suivis.forEach((el) => {
        el.classList.remove("anim-avant", "anim-visible");
        delete el.dataset.animPrete;
      });
    };
  }, [chemin]);

  return null;
}
