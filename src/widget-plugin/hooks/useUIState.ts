import { useState, useEffect, useMemo, useCallback } from 'react'

// Mobile detection utility (same as in analytics.ts)
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'iphone', 'ipad', 'ipod', 'android', 'blackberry', 'windows phone',
    'mobile', 'tablet', 'phone'
  ];
  
  const isMobileByUserAgent = mobileKeywords.some(keyword => 
    userAgent.includes(keyword)
  );
  
  // Check screen width
  const isMobileByWidth = window.innerWidth < 768;
  
  // Check touch capability (mobile devices typically have touch)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Return true if any mobile indicators are present
  return isMobileByUserAgent || (isMobileByWidth && hasTouch);
};

export function useUIState() {
  const [isMobile, setIsMobile] = useState(false)

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice())
    }
    checkMobile()
    
    // Add resize listener for responsive changes
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Safari detection
  const isSafari = useMemo(() => {
    if (typeof window === 'undefined') return false
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  }, [])

  // Modal height calculation
  const getModalHeight = useCallback(() => {
    if (!isMobile) return '600px'
    if (isSafari) return '85vh'
    return '92vh'
  }, [isMobile, isSafari])

  return {
    isMobile,
    setIsMobile,
    isSafari,
    getModalHeight
  }
}
