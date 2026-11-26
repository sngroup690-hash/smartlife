"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Anime le site : blocs qui apparaissent en glissant au défilement, compteurs animés.
// Version allégée : un seul IntersectionObserver, pas de scan React, pas de MutationObserver.
const CIBLES = [
  "main section",
  "main article",
  "main h1",
  "main h2",
  "main [class*='rounded-2xl']",
  "main [class*='rounded-xl'] img",
  "main .grid > *",
  "main ul > li",
  "main figure",
  "footer > div > *",
].join(",");

const SANS_ANIM = "[data-sans-anim], .animate-marquee-left, .animate-marquee-right, .defile-gauche, .defile-droite, .animate-defilement-garanties";

const DECORATIVES = [
  ".cta-clignote", ".cta-respire", ".bouton-reflet", ".texte-brillant", ".fleche-cta", ".accueil-flotte",
  ".garantie-boutique", ".btn-postuler", ".defile-gauche", ".defile-droite", ".animate-marquee-left",
  ".animate-marquee-right", ".animate-defilement-garanties", ".accueil-bulle", ".animate-pulse",
  ".hero-tache", ".photo-lente", ".point-vivant", ".hero-avenir", ".bande-wax", ".g-btn",
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
    el.textContent = v.toLocaleString("fr-FR").replace(/ | /g, " ") + suffixe;
    if (p < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

export default function AnimationsSite() {
  const chemin = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const suivis = new Set<HTMLElement>();

    // Pause les animations décoratives hors écran
    const obsPause = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) (e.target as HTMLElement).classList.toggle("anim-pause", !e.isIntersecting);
      },
      { rootMargin: "100px 0px" },
    );

    // Apparition des blocs
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
          const el = e.target as HTMLElement;
          suivis.delete(el);
          obs.unobserve(el);
          if (el.dataset.compteur) { animerCompteur(el); continue; }
          el.classList.add("anim-visible");
          setTimeout(() => el.classList.remove("anim-avant", "anim-visible"), 1200);
        }
      },
      { threshold: 0, rootMargin: "0px 0px 0px 0px" },
    );

    const decoresSuivis = new Set<HTMLElement>();

    function preparer() {
      const hauteur = window.innerHeight;
      document.querySelectorAll<HTMLElement>(CIBLES).forEach((el) => {
        if (el.dataset.animPrete || el.closest(SANS_ANIM) || el.closest(".anim-avant")) return;
        if (el.tagName === "SECTION" && el.querySelector(":scope .grid, :scope ul, :scope figure")) return;
        el.dataset.animPrete = "1";
        if (el.getBoundingClientRect().top < hauteur) return;
        const rang = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = `${Math.min(rang % 6, 5) * 70}ms`;
        el.classList.add("anim-avant");
        suivis.add(el);
        obs.observe(el);
      });
      document.querySelectorAll<HTMLElement>(DECORATIVES).forEach((el) => {
        if (decoresSuivis.has(el)) return;
        decoresSuivis.add(el);
        obsPause.observe(el);
      });
      document.querySelectorAll<HTMLElement>("[data-compteur]").forEach((el) => {
        if (el.dataset.animPrete) return;
        el.dataset.animPrete = "1";
        suivis.add(el);
        obs.observe(el);
      });
    }

    // Premier passage après que React ait monté la page (un court délai suffit)
    let annule = false;
    const id1 = setTimeout(() => { if (!annule) preparer(); }, 200);
    // Second passage pour les éléments chargés en différé
    const id2 = setTimeout(() => { if (!annule) preparer(); }, 1500);

    return () => {
      annule = true;
      clearTimeout(id1);
      clearTimeout(id2);
      obsPause.disconnect();
      obs.disconnect();
      decoresSuivis.forEach((el) => el.classList.remove("anim-pause"));
      suivis.forEach((el) => {
        el.classList.remove("anim-avant", "anim-visible");
        delete el.dataset.animPrete;
      });
    };
  }, [chemin]);

  return null;
}
