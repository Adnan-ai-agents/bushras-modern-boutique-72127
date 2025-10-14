import { useEffect } from 'react';

/**
 * ScriptLoader - Automatically loads external scripts from public/scripts/ folder
 * 
 * Usage:
 * 1. Drop your script files in public/scripts/ folder:
 *    - facebook-pixel.js
 *    - chatbot.js
 *    - custom-scripts.js
 * 
 * 2. Scripts will be automatically detected and loaded
 * 3. If scripts don't exist, app runs normally without errors
 */

const SCRIPT_FILES = [
  '/scripts/facebook-pixel.js',
  '/scripts/chatbot.js',
  '/scripts/custom-scripts.js',
];

export const ScriptLoader = () => {
  useEffect(() => {
    const loadedScripts: HTMLScriptElement[] = [];

    SCRIPT_FILES.forEach((scriptPath) => {
      const script = document.createElement('script');
      script.src = scriptPath;
      script.async = true;
      script.onload = () => {
        console.log(`✅ Loaded: ${scriptPath}`);
      };
      script.onerror = () => {
        // Script doesn't exist or failed to load, silently skip
      };
      document.body.appendChild(script);
      loadedScripts.push(script);
    });

    // Cleanup on unmount
    return () => {
      loadedScripts.forEach((script) => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, []);

  return null;
};
