import React, { useEffect, useRef } from 'react';
import { PopunderAdConfig, MonetagAdConfig } from '../types';

interface PopunderHandlerProps {
  popunderConfig: PopunderAdConfig;
  monetagConfig: MonetagAdConfig;
  onPopunderTriggered?: () => void;
}

export const PopunderHandler: React.FC<PopunderHandlerProps> = ({
  popunderConfig,
  monetagConfig,
  onPopunderTriggered
}) => {
  const lastTriggerTime = useRef<number>(0);

  useEffect(() => {
    // Inject Monetag multitag scripts if enabled
    if (monetagConfig.enabled && monetagConfig.multiTagCode) {
      const scriptMatch = monetagConfig.multiTagCode.match(/src="([^"]+)"/);
      const zoneMatch = monetagConfig.multiTagCode.match(/data-zone="([^"]+)"/);

      if (scriptMatch && scriptMatch[1]) {
        const existingScript = document.querySelector(`script[src="${scriptMatch[1]}"]`);
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = scriptMatch[1];
          if (zoneMatch && zoneMatch[1]) {
            script.setAttribute('data-zone', zoneMatch[1]);
          }
          script.async = true;
          document.head.appendChild(script);
        }
      }
    }
  }, [monetagConfig]);

  useEffect(() => {
    if (!popunderConfig.enabled && !monetagConfig.enabled) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // Don't trigger if clicked inside admin inputs or buttons
      const target = e.target as HTMLElement;
      if (
        target.closest('#admin-panel') || 
        target.closest('input') || 
        target.closest('textarea') || 
        target.closest('select') ||
        target.closest('#midroll-ad-gate-modal')
      ) {
        return;
      }

      const now = Date.now();
      const intervalMs = (popunderConfig.frequencyLimitMinutes || 5) * 60 * 1000;

      if (now - lastTriggerTime.current > intervalMs) {
        lastTriggerTime.current = now;

        const targetUrl = popunderConfig.targetUrl || monetagConfig.directLinkUrl;
        if (targetUrl && targetUrl.startsWith('http')) {
          try {
            const popunderWindow = window.open(targetUrl, '_blank');
            if (popunderWindow) {
              popunderWindow.blur();
              window.focus();
            }
          } catch (err) {
            console.log('Popunder handled');
          }
          if (onPopunderTriggered) {
            onPopunderTriggered();
          }
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [popunderConfig, monetagConfig, onPopunderTriggered]);

  return null;
};
