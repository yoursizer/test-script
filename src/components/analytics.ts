import { v4 as uuidv4 } from 'uuid';

// Mobile detection utility
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

// Location interface
interface LocationData {
  country?: string;
  city?: string;
  region?: string;
  ip?: string;
}

// Location detection service
class LocationService {
  private static instance: LocationService;
  private cachedLocation: LocationData | null = null;
  private isDetecting = false;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Detect user location using IP geolocation
  public async detectLocation(): Promise<LocationData> {
    if (this.cachedLocation) {
      return this.cachedLocation;
    }

    if (this.isDetecting) {
      // Wait for ongoing detection to complete
      return new Promise((resolve) => {
        const checkLocation = () => {
          if (this.cachedLocation) {
            resolve(this.cachedLocation);
          } else {
            setTimeout(checkLocation, 100);
          }
        };
        checkLocation();
      });
    }

    this.isDetecting = true;

    try {
      // Try multiple IP geolocation services for better reliability
      const location = await this.detectLocationFromServices();
      this.cachedLocation = location;
      return location;
    } catch (error) {
      console.warn('Location detection failed:', error);
      return {};
    } finally {
      this.isDetecting = false;
    }
  }

  private async detectLocationFromServices(): Promise<LocationData> {
    const services = [
      'https://ipapi.co/json/',
      'https://ipapi.com/json/',
      'https://api.ipify.org?format=json',
      'https://httpbin.org/ip' // Simple IP service as fallback
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(3000) // Reduced timeout for faster fallback
        });

        if (response.ok) {
          const data = await response.json();
          
          // Parse different response formats
          if (data.country_code || data.country || data.origin) {
            return {
              country: data.country_name || data.country,
              city: data.city,
              region: data.region || data.region_name,
              ip: data.ip || data.origin
            };
          }
        }
      } catch (error) {
        console.warn(`Location service ${service} failed:`, error);
        continue;
      }
    }

    // Fallback: try to get basic location from browser
    return this.getBasicLocation();
  }

  private async getBasicLocation(): Promise<LocationData> {
    try {
      // Try to get location from browser's geolocation API
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false
          });
        });

        // Reverse geocode the coordinates
        const { latitude, longitude } = position.coords;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000)
          }
        );

        if (response.ok) {
          const data = await response.json();
          return {
            country: data.address?.country,
            city: data.address?.city || data.address?.town,
            region: data.address?.state || data.address?.region
          };
        }
      }
    } catch (error) {
      console.warn('Browser geolocation failed:', error);
    }

    return {};
  }

  // Reset cached location (for testing)
  public resetLocation(): void {
    this.cachedLocation = null;
  }
}

// Event types for analytics tracking
export type EventType = 
  | 'popup_opened'
  | 'gender_selected'
  | 'measurement_entered'
  | 'step_completed'
  | 'popup_completed'
  | 'popup_closed'
  | 'size_recommended'
  | 'size_viewed'
  | 'add_to_cart'
  | 'measurement_guide_opened'
  | 'step_started'
  | 'measurement_step_completed'
  | 'recommended_sizes_shown';

// Analytics event interface
export interface AnalyticsEvent {
  event_type: EventType;
  license_key: string;
  product_id?: string;
  gender?: 'male' | 'female';
  step?: string;
  step_id?: string;
  step_completed?: boolean;
  time_spent_ms?: number;
  size?: string;
  location?: LocationData;
  timestamp: string;
  session_id: string;
  // New fields for measurement tracking and additional data
  step_values?: Record<string, any>;
  // New fields for recommended sizes
  recommended_sizes?: {
    primary?: string;
    smaller?: string;
    larger?: string;
  };
  selected_size?: string;
  // New fields for add to cart
  user_inputs?: {
    gender?: 'male' | 'female';
    measurements?: {
      height?: number;
      weight?: number;
      chest?: number;
      waist?: number;
      hips?: number;
    };
    step_progression?: {
      step_1_completed?: boolean;
      step_2_completed?: boolean;
      step_3_completed?: boolean;
      step_4_completed?: boolean;
      step_5_completed?: boolean;
      step_6_completed?: boolean;
      step_7_completed?: boolean;
    };
  };
  // Device detection
  is_mobile?: boolean;
  // Current page URL
  current_url?: string;
}

// Analytics service class
class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private stepStartTimes: Map<string, number>;
  private sentEvents: Set<string>;
  private readonly API_ENDPOINT = 'https://data.yoursizer.com/api/v1/npm/log-analytics';
  private locationService: LocationService;
  private popupOpenedPromise: Promise<void> | null = null;

  private constructor() {
    this.sessionId = uuidv4();
    this.stepStartTimes = new Map();
    this.sentEvents = new Set();
    this.locationService = LocationService.getInstance();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Generate unique event key to prevent duplicates
  private generateEventKey(eventType: EventType, stepId?: string, additionalData?: string): string {
    return `${eventType}_${stepId || 'no_step'}_${additionalData || 'no_data'}`;
  }

  // Check if event was already sent
  private isEventSent(eventKey: string): boolean {
    return this.sentEvents.has(eventKey);
  }

  // Mark event as sent
  private markEventSent(eventKey: string): void {
    this.sentEvents.add(eventKey);
  }

  // Clear sent events for a specific step to allow re-tracking
  public clearStepEvents(stepId: string): void {
    const eventsToRemove: string[] = [];
    this.sentEvents.forEach(eventKey => {
      if (eventKey.includes(stepId)) {
        eventsToRemove.push(eventKey);
      }
    });
    eventsToRemove.forEach(eventKey => {
      this.sentEvents.delete(eventKey);
    });
    console.log(`📊 Cleared ${eventsToRemove.length} events for step ${stepId}, allowing re-tracking:`, eventsToRemove);
  }

  // Start tracking time for a step
  public startStepTracking(stepId: string): void {
    this.stepStartTimes.set(stepId, Date.now());
  }

  // Get time spent on a step
  public getTimeSpent(stepId: string): number {
    const startTime = this.stepStartTimes.get(stepId);
    if (!startTime) return 0;
    return Date.now() - startTime;
  }

  // Ensure step tracking is started for a step (start if not already started)
  public ensureStepTracking(stepId: string): void {
    if (!this.stepStartTimes.has(stepId)) {
      this.startStepTracking(stepId);
    }
  }

  // Wait for popup opened event to complete
  public async waitForPopupOpened(): Promise<void> {
    if (this.popupOpenedPromise) {
      await this.popupOpenedPromise;
    }
  }

  // Track an event with location
  public async trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'session_id' | 'location'>): Promise<void> {
    try {
      const eventKey = this.generateEventKey(event.event_type, event.step_id, event.gender);
      
      console.log('📊 trackEvent called:', {
        event_type: event.event_type,
        eventKey,
        isDuplicate: this.isEventSent(eventKey)
      });
      
      // Prevent duplicate events
      if (this.isEventSent(eventKey)) {
        console.log(`Analytics: Skipping duplicate event ${event.event_type}`);
        return;
      }

      // Get location data for all events (cached after first detection)
      let location: LocationData = {};
      try {
        location = await this.locationService.detectLocation();
        console.log('Location detected for event:', event.event_type, location);
      } catch (error) {
        console.warn('Location detection failed for event:', event.event_type, error);
      }

      const analyticsEvent: AnalyticsEvent = {
        ...event,
        location,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
      };

      // Mark event as sent
      this.markEventSent(eventKey);

      console.log('📊 Sending analytics event:', analyticsEvent);

      // Send event to backend
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyticsEvent),
      });
      
      if (!response.ok) {
        console.error('❌ Analytics API response not ok:', response.status, response.statusText);
      } else {
        console.log('✅ Analytics event sent successfully:', event.event_type);
      }
    } catch (error) {
      // Implement retry logic or error handling as needed
      console.error('❌ Analytics tracking failed:', error);
    }
  }

  // Pre-detect location for popup opened event
  public async preDetectLocation(): Promise<void> {
    try {
      await this.locationService.detectLocation();
    } catch (error) {
      console.warn('Pre-location detection failed:', error);
    }
  }

  // Track step completion with time spent
  public async trackStepCompletion(
    stepId: string,
    event: Omit<AnalyticsEvent, 'timestamp' | 'session_id' | 'time_spent_ms'>
  ): Promise<void> {
    const timeSpent = this.getTimeSpent(stepId);
    await this.trackEvent({
      ...event,
      time_spent_ms: timeSpent,
    });
    
    // Don't clear step start time for final steps (step_4 and step_7) 
    // as they need to track time until add_to_cart event
    if (stepId !== 'step_4' && stepId !== 'step_7') {
      this.stepStartTimes.delete(stepId);
    }
  }

  // Track step started
  public async trackStepStarted(
    licenseKey: string,
    stepId: string,
    stepName: string,
    gender?: 'male' | 'female',
    isMobile?: boolean,
    userInputs?: {
      gender?: 'male' | 'female';
      measurements?: {
        height?: number;
        weight?: number;
        chest?: number;
        waist?: number;
        hips?: number;
      };
      step_progression?: {
        step_1_completed?: boolean;
        step_2_completed?: boolean;
        step_3_completed?: boolean;
        step_4_completed?: boolean;
        step_5_completed?: boolean;
        step_6_completed?: boolean;
        step_7_completed?: boolean;
      };
    },
    recommendedSizes?: {
      primary?: string;
      smaller?: string;
      larger?: string;
    },
    measurementsChanged?: boolean
  ): Promise<void> {
    // Wait for popup opened event to complete first
    await this.waitForPopupOpened();
    
    this.startStepTracking(stepId);
    
    // Prepare the base event data
    const eventData: Omit<AnalyticsEvent, 'timestamp' | 'session_id' | 'location'> = {
      event_type: 'step_started',
      license_key: licenseKey,
      step: stepName,
      step_id: stepId,
      gender,
      is_mobile: isMobileDevice(),
    };

    // Include user_inputs if they are provided (navigation logic handles the filtering)
    if (userInputs) {
      eventData.user_inputs = userInputs;
      console.log('📊 Including user_inputs in step_started event:', {
        stepId,
        isMobile: isMobileDevice(),
        measurementsChanged,
        userInputs
      });
    } else {
      console.log('📊 Not including user_inputs in step_started event:', {
        stepId,
        isMobile: isMobileDevice(),
        hasUserInputs: !!userInputs,
        measurementsChanged
      });
    }

    // Add recommended_sizes if provided
    if (recommendedSizes) {
      eventData.recommended_sizes = recommendedSizes;
      console.log('📊 Including recommended_sizes in step_started event:', {
        stepId,
        isMobile: isMobileDevice(),
        recommendedSizes
      });
    }

    await this.trackEvent(eventData);
  }

  // Track popup opened
  public async trackPopupOpened(licenseKey: string, productId?: string): Promise<void> {
    // Prevent duplicate popup opened events in the same session
    const eventKey = this.generateEventKey('popup_opened', undefined, licenseKey);
    if (this.isEventSent(eventKey)) {
      console.log('📊 Skipping duplicate popup_opened event');
      return;
    }
    
    // Get current page URL
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    // Store the promise so other events can wait for it
    this.popupOpenedPromise = this.trackEvent({
      event_type: 'popup_opened',
      license_key: licenseKey,
      product_id: productId,
      is_mobile: isMobileDevice(),
      current_url: currentUrl
    });
    
    await this.popupOpenedPromise;
  }

  // Track gender selection
  public async trackGenderSelected(licenseKey: string, gender: 'male' | 'female', isMobile?: boolean): Promise<void> {
    await this.trackEvent({
      event_type: 'gender_selected',
      license_key: licenseKey,
      gender,
      is_mobile: isMobileDevice(),
    });
  }

  // Track measurement entry
  public async trackMeasurementEntered(
    licenseKey: string,
    step: string,
    stepId: string
  ): Promise<void> {
    await this.trackStepCompletion(stepId, {
      event_type: 'measurement_entered',
      license_key: licenseKey,
      step,
      step_id: stepId,
      step_completed: true,
    });
  }

  // Track measurement step completion with values
  public async trackMeasurementStepCompleted(
    licenseKey: string,
    stepId: string,
    stepName: string,
    gender: 'male' | 'female',
    stepValues?: Record<string, any>,
    isMobile?: boolean
  ): Promise<void> {
    await this.trackStepCompletion(stepId, {
      event_type: 'measurement_step_completed',
      license_key: licenseKey,
      step: stepName,
      step_id: stepId,
      step_completed: true,
      gender,
      step_values: stepValues,
      is_mobile: isMobileDevice(),
    });
  }

  // Track step completion
  public async trackStepCompleted(
    licenseKey: string,
    step: string,
    stepId: string,
    isMobile?: boolean
  ): Promise<void> {
    await this.trackStepCompletion(stepId, {
      event_type: 'step_completed',
      license_key: licenseKey,
      step,
      step_id: stepId,
      step_completed: true,
      is_mobile: isMobileDevice(),
    });
  }

  // Track recommended sizes shown
  public async trackRecommendedSizesShown(
    licenseKey: string,
    gender: 'male' | 'female',
    recommendedSizes: {
      primary?: string;
      smaller?: string;
      larger?: string;
    },
    isMobile?: boolean
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'recommended_sizes_shown',
      license_key: licenseKey,
      gender,
      recommended_sizes: recommendedSizes,
      step: 'size_recommendation',
      is_mobile: isMobileDevice(),
    });
  }

  // Track size recommendation
  public async trackSizeRecommended(
    licenseKey: string,
    gender: 'male' | 'female',
    size: string,
    recommendedSizes?: {
      primary?: string;
      smaller?: string;
      larger?: string;
    },
    isMobile?: boolean
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'size_recommended',
      license_key: licenseKey,
      gender,
      size,
      step: 'size_recommendation',
      step_completed: true,
      recommended_sizes: recommendedSizes,
      is_mobile: isMobileDevice(),
    });
  }

  // Track add to cart
  public async trackAddToCart(
    licenseKey: string,
    productId: string,
    size: string,
    gender: 'male' | 'female',
    timeSpentMs?: number,
    stepProgression?: {
      step_1_completed?: boolean;
      step_2_completed?: boolean;
      step_3_completed?: boolean;
      step_4_completed?: boolean;
    },
    measurements?: {
      height?: number;
      weight?: number;
      chest?: number;
      waist?: number;
      hips?: number;
    },
    recommendedSizes?: {
      primary?: string;
      smaller?: string;
      larger?: string;
    },
    isMobile?: boolean
  ): Promise<void> {
    console.log('📊 trackAddToCart called with:', {
      licenseKey,
      productId,
      size,
      gender,
      timeSpentMs,
      stepProgression,
      measurements,
      recommendedSizes,
      isMobile
    });
    
    await this.trackEvent({
      event_type: 'add_to_cart',
      license_key: licenseKey,
      product_id: productId,
      size,
      selected_size: size, // User's chosen size
      gender,
      step: 'cart',
      step_completed: true,
      time_spent_ms: timeSpentMs,
      is_mobile: isMobileDevice(),
      recommended_sizes: recommendedSizes,
      user_inputs: {
        gender,
        measurements,
        step_progression: stepProgression
      }
    });
    
    // Clear step start time for final steps after add_to_cart event
    const stepId = isMobileDevice() ? 'step_7' : 'step_4';
    this.stepStartTimes.delete(stepId);
  }

  // Track popup completion
  public async trackPopupCompleted(licenseKey: string, details?: Record<string, unknown>): Promise<void> {
    await this.trackEvent({
      event_type: 'popup_completed',
      license_key: licenseKey,
      step_completed: true,
      ...details,
    });
  }

  // Track popup closed (when user closes popup on any step)
  public async trackPopupClosed(
    licenseKey: string,
    currentStep: number,
    stepName: string,
    gender?: 'male' | 'female',
    selectedSize?: string,
    hasSizeRecommendation?: boolean,
    timeSpentMs?: number,
    isMobile?: boolean
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'popup_closed',
      license_key: licenseKey,
      step: stepName,
      step_id: `step_${currentStep}`,
      gender,
      selected_size: selectedSize,
      step_completed: false,
      time_spent_ms: timeSpentMs,
      is_mobile: isMobileDevice(),
      // Additional context about the session
      step_values: {
        current_step: currentStep,
        has_size_recommendation: hasSizeRecommendation,
        popup_closed_on_step: stepName
      }
    });
  }

  // Track measurement guide opened
  public async trackMeasurementGuideOpened(
    licenseKey: string,
    measurementType: 'chest' | 'waist' | 'hips'
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'measurement_guide_opened',
      license_key: licenseKey,
      step: 'measurement_guide',
      step_id: measurementType,
    });
  }

  // Track size viewed (when user sees recommendation but doesn't add to cart)
  public async trackSizeViewed(
    licenseKey: string,
    gender: 'male' | 'female',
    size: string,
    timeSpentMs?: number,
    stepProgression?: {
      step_1_completed?: boolean;
      step_2_completed?: boolean;
      step_3_completed?: boolean;
      step_4_completed?: boolean;
    },
    isMobile?: boolean
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'size_viewed',
      license_key: licenseKey,
      gender,
      size,
      step: 'size_recommendation',
      step_completed: true,
      time_spent_ms: timeSpentMs,
      is_mobile: isMobileDevice(),
      user_inputs: {
        gender,
        step_progression: stepProgression
      }
    });
  }

  // Automatically track size recommendation when API results are received
  public async trackSizeRecommendationFromApiResult(
    licenseKey: string,
    apiResult: {
      size?: string;
      confidence?: number;
      method?: string;
      error?: string;
      explanation?: string;
      smaller_size?: string | null;
      larger_size?: string | null;
      smaller_reason?: string | null;
      larger_reason?: string | null;
      range_type?: string;
    },
    gender?: 'male' | 'female',
    measurements?: {
      height?: number;
      weight?: number;
      chest?: number;
      waist?: number;
      hips?: number;
    },
    stepProgression?: {
      step_1_completed?: boolean;
      step_2_completed?: boolean;
      step_3_completed?: boolean;
      step_4_completed?: boolean;
      step_5_completed?: boolean;
      step_6_completed?: boolean;
      step_7_completed?: boolean;
    },
    productId?: string
  ): Promise<void> {
    // Only track if we have a valid size result (not an error)
    if (apiResult && apiResult.size && !apiResult.error) {
      const recommendedSizes = {
        primary: apiResult.size,
        smaller: apiResult.smaller_size || undefined,
        larger: apiResult.larger_size || undefined
      };

      console.log('📊 Auto-tracking size_recommended from API result:', {
        size: apiResult.size,
        gender,
        recommendedSizes,
        confidence: apiResult.confidence
      });

      await this.trackSizeRecommended(
        licenseKey,
        gender || 'male', // fallback to male if gender not provided
        apiResult.size,
        recommendedSizes,
        isMobileDevice()
      );
    } else {
      console.log('📊 Skipping size_recommended tracking - no valid size result:', {
        hasResult: !!apiResult,
        hasSize: !!(apiResult?.size),
        hasError: !!(apiResult?.error),
        error: apiResult?.error
      });
    }
  }

  // Reset session (for testing or new sessions)
  public resetSession(): void {
    this.sessionId = uuidv4();
    this.stepStartTimes.clear();
    this.sentEvents.clear();
    this.locationService.resetLocation();
    this.popupOpenedPromise = null;
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();