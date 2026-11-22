// Lien pour rejoindre le groupe WhatsApp des acheteurs :
// 1) le lien de groupe du guide (champ admin), 2) le lien général NEXT_PUBLIC_GROUPE_WHATSAPP,
// 3) à défaut, une conversation WhatsApp avec Smart Life, message déjà prêt (on ajoute la personne au groupe).
export const NUMERO_WHATSAPP = "237694176642";

export function lienGroupeWhatsApp(lienDuGuide: string | undefined, titreGuide: string): string {
  if (lienDuGuide) return lienDuGuide;
  if (process.env.NEXT_PUBLIC_GROUPE_WHATSAPP) return process.env.NEXT_PUBLIC_GROUPE_WHATSAPP;
  const message = `Bonjour Smart Life, je viens d'acheter « ${titreGuide} ». Je veux rejoindre le groupe WhatsApp des visionnaires.`;
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
