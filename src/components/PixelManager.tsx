"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useUserStore } from "@/lib/user-store";

type PixelsConfig = {
  facebook: { enabled: boolean; pixelId: string };
  tiktok: { enabled: boolean; pixelId: string };
  googleAds: { enabled: boolean; conversionId: string; conversionLabel: string };
};

export default function PixelManager() {
  const pathname = usePathname();
  const [config, setConfig] = useState<PixelsConfig | null>(null);
  const currentUser = useUserStore((s) => s.currentUser);

  useEffect(() => {
    fetch("/api/pixels")
      .then((r) => r.json())
      .then((c: PixelsConfig) => {
        setConfig(c);
        // Expose config globalement pour pixel-events.ts
        if (typeof window !== "undefined") window._pixelConfig = c;
      })
      .catch(() => {});
  }, []);

  // PageView à chaque changement de route (hors premier chargement géré par les scripts)
  useEffect(() => {
    if (!config) return;
    if (config.facebook.enabled && typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
    if (config.tiktok.enabled && typeof window !== "undefined" && window.ttq) {
      window.ttq.page();
    }
  }, [pathname, config]);

  if (!config) return null;

  // Validation stricte des IDs avant injection dans les scripts inline
  const validFbPixelId   = /^\d{1,20}$/.test(config.facebook.pixelId ?? "");
  const validTtPixelId   = /^[A-Z0-9]{1,30}$/i.test(config.tiktok.pixelId ?? "");
  const validGaConvId    = /^AW-\d{1,15}$/.test(config.googleAds.conversionId ?? "");
  const validGaConvLabel = /^[A-Za-z0-9_\-]{1,50}$/.test(config.googleAds.conversionLabel ?? "");

  const advancedMatching = currentUser
    ? JSON.stringify({
        ...(currentUser.email ? { em: currentUser.email.toLowerCase().trim() } : {}),
        ...(currentUser.phone ? { ph: currentUser.phone.replace(/\D/g, "") } : {}),
        ...(currentUser.firstName ? { fn: currentUser.firstName.toLowerCase().trim() } : {}),
        ...(currentUser.lastName ? { ln: currentUser.lastName.toLowerCase().trim() } : {}),
      })
    : "{}";

  const fbEnabled = config.facebook.enabled && validFbPixelId;
  const ttEnabled = config.tiktok.enabled && validTtPixelId;
  const gaEnabled = config.googleAds.enabled && validGaConvId && validGaConvLabel;

  return (
    <>
      {fbEnabled && (
        <>
          <Script id="fb-pixel" strategy="lazyOnload">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${config.facebook.pixelId}',${advancedMatching});fbq('track','PageView');
          `}</Script>
          {/* Fallback noscript pour utilisateurs sans JavaScript */}
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: "none" }} alt=""
              src={`https://www.facebook.com/tr?id=${config.facebook.pixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}

      {ttEnabled && (
        <Script id="tiktok-pixel" strategy="lazyOnload">{`
          !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
          ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
          ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");
          o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
          var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${config.tiktok.pixelId}');ttq.page();
          }(window,document,'ttq');
        `}</Script>
      )}

      {gaEnabled && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAds.conversionId}`}
            strategy="lazyOnload"
          />
          <Script id="google-ads-init" strategy="lazyOnload">{`
            window.dataLayer=window.dataLayer||[];
            function gtag(){dataLayer.push(arguments);}
            gtag('js',new Date());
            gtag('config','${config.googleAds.conversionId}');
          `}</Script>
        </>
      )}
    </>
  );
}
