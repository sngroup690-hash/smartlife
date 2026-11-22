export type CertificateRecord = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  formationId: string;
  formationTitle: string;
  level: string;
  completedAt: string;
  issuedAt: string;
  valid: boolean;
};

export type CertificateConfig = {
  signatoryName: string;
  signatoryTitle: string;
  organizationName: string;
  footerText: string;
  websiteUrl: string;
};

export const DEFAULT_CERT_CONFIG: CertificateConfig = {
  signatoryName: "Smart Life",
  signatoryTitle: "Fondateur & Directeur Pédagogique",
  organizationName: "SMART LIFE",
  footerText: "Ce certificat atteste de la complétion officielle de la formation sur la plateforme SmartLife.",
  websiteUrl: "https://smartlifecm.com",
};
