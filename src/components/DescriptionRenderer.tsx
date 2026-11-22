"use client";

import { useMemo } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function friendlyLabel(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (path.includes("accompagnement")) return "Accéder à l'accompagnement";
    if (path.includes("formation")) return "Voir la formation";
    if (path.includes("ebook")) return "Voir l'ebook";
    if (path.includes("service")) return "Voir le service";
    if (path.includes("contact")) return "Nous contacter";
    if (path.includes("download") || path.includes("telecharg")) return "Télécharger";
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "Voir le lien";
  }
}

function urlToElement(url: string): string {
  // YouTube → lecteur intégré
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return (
      `<div style="position:relative;padding-top:56.25%;width:100%;margin:16px 0;max-width:100%;">` +
      `<iframe src="https://www.youtube.com/embed/${ytId}?rel=0" ` +
      `style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px;" ` +
      `allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" ` +
      `allowfullscreen loading="lazy"></iframe></div>`
    );
  }

  // Vimeo → lecteur intégré
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return (
      `<div style="position:relative;padding-top:56.25%;width:100%;margin:16px 0;max-width:100%;">` +
      `<iframe src="https://player.vimeo.com/video/${vimeoId}" ` +
      `style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px;" ` +
      `allow="autoplay;fullscreen;picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
    );
  }

  // URL longue → bouton pilule avec label lisible
  if (url.length > 50) {
    const label = friendlyLabel(url);
    return (
      `<a href="${url}" target="_blank" rel="noopener noreferrer" ` +
      `style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;` +
      `background:#f0fdf4;border:1px solid #86efac;border-radius:999px;` +
      `color:#27A827;font-weight:600;font-size:0.875em;text-decoration:none;` +
      `max-width:100%;box-sizing:border-box;overflow-wrap:break-word;word-break:break-all;">` +
      `👉 ${label}</a>`
    );
  }

  // URL courte → lien inline classique
  return (
    `<a href="${url}" target="_blank" rel="noopener noreferrer" ` +
    `style="color:#27A827;font-weight:600;text-decoration:underline;` +
    `overflow-wrap:break-word;word-break:break-all;">${url}</a>`
  );
}

// ─── Nettoyage des styles copy-paste (Word, Google Docs, etc.) ───────────────

function sanitizeInlineStyle(style: string): string {
  return style
    // largeurs fixes → max-width responsive
    .replace(/\bwidth\s*:\s*\d+(\.\d+)?(px|pt|cm|mm|in)\b/gi, "max-width:100%")
    .replace(/\bmin-width\s*:\s*\d+(\.\d+)?(px|pt|cm|mm|in)\b/gi, "min-width:0")
    // hauteurs fixes supprimées (laisse le contenu s'étendre)
    .replace(/\bheight\s*:\s*\d+(\.\d+)?(px|pt|cm|mm|in)\b/gi, "")
    // white-space nowrap → normal pour que le texte revienne à la ligne
    .replace(/\bwhite-space\s*:\s*nowrap\b/gi, "white-space:normal")
    // overflow hidden peut masquer du contenu sur mobile
    .replace(/\boverflow\s*:\s*hidden\b/gi, "overflow:visible")
    // float sur images → désactivé (on centre tout)
    .replace(/\bfloat\s*:\s*(left|right)\b/gi, "float:none")
    // marges/padding négatifs qui font déborder
    .replace(/\bmargin(?:-left|-right)?\s*:\s*-\d[^;]*/gi, "")
    // polices inhabituelles collées depuis Word
    .replace(/\bfont-family\s*:[^;]+;?/gi, "");
}

function sanitizeTag(tag: string): string {
  // Sanitiser les attributs style inline
  tag = tag.replace(/\bstyle=["']([^"']*)["']/gi, (_, s) => `style="${sanitizeInlineStyle(s)}"`);
  // Supprimer width/height numériques explicites sur balises structurelles
  tag = tag.replace(/\s(?:width|height)=["']\d+[^"']*["']/gi, "");
  // Supprimer align= et float= sur images (anciens attributs HTML)
  if (/^<img/i.test(tag)) {
    tag = tag.replace(/\s(?:align|float)=["'][^"']*["']/gi, "");
  }
  return tag;
}

// ─── Traitement HTML ──────────────────────────────────────────────────────────

export function processDescription(html: string): string {
  if (!html) return "";

  const placeholders: string[] = [];
  let result = html;

  // 1. Protéger les blocs déjà traités (<a>, <iframe>, <video>, <script>, <style>)
  result = result.replace(/<(a|iframe|video|script|style)([\s>][\s\S]*?)<\/\1>/gi, (match) => {
    placeholders.push(match);
    return `\x00P${placeholders.length - 1}\x00`;
  });

  // 2. Protéger les balises auto-fermantes avec src (<img>, <source>, <embed>)
  result = result.replace(/<(img|source|embed|track)[^>]*\/?>/gi, (match) => {
    placeholders.push(match);
    return `\x00P${placeholders.length - 1}\x00`;
  });

  // 3. Détecter et transformer les URLs nues restantes
  result = result.replace(/https?:\/\/[^\s<>"'&\x00]+/g, (rawUrl) => {
    const url = rawUrl.replace(/[.,;:!?)\]>'"]+$/, "");
    const trailing = rawUrl.slice(url.length);
    return urlToElement(url) + trailing;
  });

  // 4. Restaurer les placeholders
  result = result.replace(/\x00P(\d+)\x00/g, (_, i) => placeholders[parseInt(i, 10)]);

  // 5. Nettoyer les styles problématiques copiés-collés (Word, GDocs…)
  result = result.replace(/<([a-z][a-z0-9]*)[^>]*>/gi, sanitizeTag);

  return result;
}

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  html: string;
  className?: string;
}

export function DescriptionRenderer({ html, className = "" }: Props) {
  const processed = useMemo(() => processDescription(html), [html]);

  return (
    <div
      className={[
        // Conteneur : jamais de débordement horizontal
        "overflow-x-hidden max-w-full w-full",
        // Force max-width sur TOUS les descendants (écrase les styles inline Word/GDocs)
        "[&_*]:!max-w-full [&_*]:!min-w-0 [&_*]:!box-border",
        // Texte : retour à la ligne automatique partout
        "break-words [&_*]:break-words [&_p]:break-words [&_span]:break-words [&_li]:break-words",
        // Pas de white-space nowrap qui fait déborder
        "[&_*]:!whitespace-normal",
        // Liens : coupure sur les URLs très longues
        "[&_a]:break-all [&_a]:!whitespace-normal",
        // Images responsive + centrées + espace vertical
        "[&_img]:!max-w-full [&_img]:h-auto [&_img]:block [&_img]:mx-auto [&_img]:my-4 [&_img]:!float-none [&_img]:rounded-lg",
        // Paragraphe qui ne contient qu'une image → centré
        "[&_p:has(>img)]:text-center [&_p:has(>img)]:block",
        // iframes (vidéos) : s'adaptent au conteneur
        "[&_iframe]:!max-w-full [&_iframe]:w-full",
        // Tableaux : scroll interne si nécessaire
        "[&_table]:!max-w-full [&_table]:w-full [&_table]:block [&_table]:overflow-x-auto",
        "[&_td]:!whitespace-normal [&_th]:!whitespace-normal",
        // Code / pre : scroll interne (exception: on garde nowrap pour le code)
        "[&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all",
        // Divs et sections avec largeur fixe collés depuis Word
        "[&_div]:!max-w-full [&_section]:!max-w-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      dangerouslySetInnerHTML={{ __html: processed }}
    />
  );
}
