const WA_NUMBER = "237694176642";
const WA_MESSAGE = encodeURIComponent("Bonjour, je voudrais plus d'informations sur vos produits Smart Life.");

export default function WhatsAppButton() {
  return (
    <>
      <a
        href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter sur WhatsApp"
        className="whatsapp-fab"
      >
        {/* WhatsApp icon SVG officiel */}
        <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
          <path d="M16.003 2.667C8.639 2.667 2.667 8.639 2.667 16c0 2.339.632 4.624 1.833 6.624L2.667 29.333l6.896-1.808A13.28 13.28 0 0 0 16.003 29.333c7.364 0 13.33-5.972 13.33-13.333S23.367 2.667 16.003 2.667zm0 24.267a11 11 0 0 1-5.614-1.537l-.402-.24-4.094 1.074 1.092-3.984-.263-.41A10.96 10.96 0 0 1 5.003 16c0-6.065 4.935-11 11-11s11 4.935 11 11-4.935 11-11 11zm6.033-8.237c-.33-.165-1.953-.964-2.256-1.073-.302-.11-.523-.165-.743.165-.22.33-.853 1.073-1.046 1.293-.193.22-.385.247-.715.082-.33-.165-1.395-.514-2.658-1.64-.982-.875-1.645-1.956-1.838-2.286-.193-.33-.02-.508.145-.673.149-.148.33-.385.495-.578.165-.193.22-.33.33-.55.11-.22.055-.413-.027-.578-.082-.165-.743-1.793-1.018-2.455-.268-.644-.54-.556-.743-.567l-.633-.011c-.22 0-.578.082-.88.413-.302.33-1.155 1.128-1.155 2.751s1.183 3.191 1.348 3.411c.165.22 2.328 3.554 5.643 4.985.79.34 1.405.543 1.885.695.792.252 1.512.216 2.082.131.635-.095 1.953-.799 2.228-1.57.275-.77.275-1.43.193-1.57-.082-.138-.303-.22-.633-.385z"/>
        </svg>
        <span className="whatsapp-fab-label">WhatsApp</span>
      </a>

      <style>{`
        .whatsapp-fab {
          display: none;
          position: fixed;
          bottom: 24px;
          right: 20px;
          z-index: 9999;
          align-items: center;
          gap: 8px;
          background: #25D366;
          color: #fff;
          border-radius: 50px;
          padding: 12px 18px 12px 14px;
          box-shadow: 0 4px 20px rgba(37,211,102,0.45);
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          line-height: 1;
          animation: wa-pulse 2.5s ease-in-out infinite;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .whatsapp-fab:active {
          transform: scale(0.95);
        }
        @media (max-width: 768px) {
          .whatsapp-fab {
            display: flex;
          }
        }
        @keyframes wa-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.45); }
          50%       { box-shadow: 0 4px 32px rgba(37,211,102,0.75), 0 0 0 6px rgba(37,211,102,0.15); }
        }
      `}</style>
    </>
  );
}
