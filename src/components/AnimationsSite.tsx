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
  // Style Galerie : cartes en grille, listes et photos arrivent l'une après l'autre
  "main .grid > *",
  "main ul > li",
  "main figure",
  "footer > div > *",
].join(",");

// Les bandes qui défilent sur le côté n'entrent jamais « dans l'écran » : elles ne doivent pas être cachées.
const SANS_ANIM = "[data-sans-anim], .animate-marquee-left, .animate-marquee-right, .defile-gauche, .defile-droite, .animate-defilement-garanties";

const DECORATIVES = [
  ".cta-clignote", ".cta-respire", ".bouton-reflet", ".texte-brillant", ".fleche-cta", ".accueil-flotte",
  ".garantie-boutique", ".btn-postuler", ".defile-gauche", ".defile-droite", ".animate-marquee-left",
  ".animate-marquee-right", ".animate-defilement-garanties", ".accueil-bulle", ".animate-pulse",
  ".hero-tache", ".photo-lente", ".point-vivant", ".hero-avenir",
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

    // Les animations décoratives en boucle s'arrêtent hors de l'écran : le téléphone ne travaille que pour ce qu'on voit.
    const enPause = new Set<HTMLElement>();
    const obsPause = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) (e.target as HTMLElement).classList.toggle("anim-pause", !e.isIntersecting);
      },
      { rootMargin: "100px 0px" },
    );

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
      // Le bloc apparaît dès qu'il touche le bas de l'écran : on voit l'animation sans attendre.
      { threshold: 0, rootMargin: "0px 0px 0px 0px" },
    );

    // Une page arrivée par l'écran d'attente (loading.tsx) est mise dans le document avant que React
    // l'ait prise en main. La modifier à ce moment-là oblige React à la redessiner entièrement :
    // on attend donc que chaque bloc soit « pris en main », puis on repasse.
    let enAttente = false;
    let essais = 0;
    const estPret = (el: HTMLElement): boolean => {
      for (let n: HTMLElement | null = el; n; n = n.parentElement) {
        const cle = Object.keys(n).find((k) => k.startsWith("__reactProps$"));
        if (!cle) continue;
        // Bloc géré par React, ou texte HTML libre inséré par un bloc React (descriptions) : prêt.
        if (n === el) return true;
        const props = (n as unknown as Record<string, { dangerouslySetInnerHTML?: unknown } | undefined>)[cle];
        return !!props?.dangerouslySetInnerHTML;
      }
      return false;
    };

    const preparer = () => {
      const hauteur = window.innerHeight;
      enAttente = false;
      document.querySelectorAll<HTMLElement>(CIBLES).forEach((el) => {
        if (el.dataset.animPrete || el.closest(SANS_ANIM) || el.closest(".anim-avant")) return;
        if (!estPret(el)) { enAttente = true; return; }
        // Une section qui contient une grille, une liste ou une photo ne s'anime pas en bloc :
        // ses éléments arrivent un par un (effet cascade).
        if (el.tagName === "SECTION" && el.querySelector(":scope .grid, :scope ul, :scope figure")) return;
        el.dataset.animPrete = "1";
        if (el.getBoundingClientRect().top < hauteur) return;
        const rang = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        // Effet cascade : chaque élément d'une rangée arrive un peu après le précédent
        el.style.transitionDelay = `${Math.min(rang % 6, 5) * 70}ms`;
        el.classList.add("anim-avant");
        suivis.add(el);
        obs.observe(el);
      });
      document.querySelectorAll<HTMLElement>(DECORATIVES).forEach((el) => {
        if (enPause.has(el)) return;
        if (!estPret(el)) { enAttente = true; return; }
        enPause.add(el);
        obsPause.observe(el);
      });
      document.querySelectorAll<HTMLElement>("[data-compteur]").forEach((el) => {
        if (el.dataset.animPrete) return;
        if (!estPret(el)) { enAttente = true; return; }
        el.dataset.animPrete = "1";
        suivis.add(el);
        obs.observe(el);
      });
      if (!enAttente) essais = 0;
      else if (essais++ < 40) setTimeout(preparer, 120);
    };

    // Sécurité : après un saut (sommaire, lien d'ancre, défilement très rapide), l'observateur peut ne rien signaler.
    // On révèle alors tout bloc déjà passé ou sur le point d'apparaître.
    let prevu = false;
    const verifierDefilement = () => {
      if (prevu) return;
      prevu = true;
      setTimeout(() => {
        prevu = false;
        const limite = window.innerHeight + 120;
        suivis.forEach((el) => {
          if (el.dataset.compteur || el.getBoundingClientRect().top >= limite) return;
          suivis.delete(el);
          obs.unobserve(el);
          el.classList.add("anim-visible");
          setTimeout(() => el.classList.remove("anim-avant", "anim-visible"), 1200);
        });
      }, 120);
    };
    window.addEventListener("scroll", verifierDefilement, { passive: true });
    window.addEventListener("hashchange", verifierDefilement);

    let attente: ReturnType<typeof setTimeout> | null = null;
    const mut = new MutationObserver(() => {
      if (attente) return;
      attente = setTimeout(() => {
        attente = null;
        preparer();
      }, 150);
    });

    // Premier passage seulement quand la page est entièrement installée par React
    // (chargement fini, puis un moment de calme) : sinon la page arrivée par l'écran
    // d'attente est modifiée trop tôt et React doit la redessiner.
    let annule = false;
    let idCalme: number | null = null;
    const demarrer = () => {
      if (annule) return;
      preparer();
      mut.observe(document.body, { childList: true, subtree: true });
    };
    const quandCalme = () => {
      if (annule) return;
      if ("requestIdleCallback" in window) idCalme = window.requestIdleCallback(demarrer, { timeout: 1500 });
      else attente = setTimeout(demarrer, 300);
    };
    // Pas d'attente du chargement complet des photos (trop long sur une connexion lente) :
    // React installe la page en priorité, le « moment de calme » arrive juste après.
    quandCalme();

    return () => {
      annule = true;
      if (idCalme !== null && "cancelIdleCallback" in window) window.cancelIdleCallback(idCalme);
      obsPause.disconnect();
      enPause.forEach((el) => el.classList.remove("anim-pause"));
      window.removeEventListener("scroll", verifierDefilement);
      window.removeEventListener("hashchange", verifierDefilement);
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
