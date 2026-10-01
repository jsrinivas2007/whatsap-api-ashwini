"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Add window.FB types
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

interface FacebookContextType {
  isSdkReady: boolean;
}

const FacebookContext = createContext<FacebookContextType>({
  isSdkReady: false,
});

export const useFacebook = () => useContext(FacebookContext);

export function FacebookProvider({ children }: { children: React.ReactNode }) {
  const [isSdkReady, setIsSdkReady] = useState(false);

  useEffect(() => {
    // If already loaded
    if (window.FB) {
      setIsSdkReady(true);
      return;
    }

    // Setup async init handler
    window.fbAsyncInit = function () {
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      if (!appId || appId === 'your_facebook_app_id_here') {
        console.warn("NEXT_PUBLIC_FACEBOOK_APP_ID is missing or not configured correctly.");
      }

      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });

      setIsSdkReady(true);
      console.log("Facebook SDK initialized successfully.");
    };

    // Load SDK script globally
    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      } else {
        d.head.appendChild(js);
      }
    })(document, "script", "facebook-jssdk");

  }, []);

  return (
    <FacebookContext.Provider value={{ isSdkReady }}>
      {children}
    </FacebookContext.Provider>
  );
}
