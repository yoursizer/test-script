import { v4 as uuidv4 } from 'uuid';

// Event types for analytics tracking
export type EventType = 
  | 'popup_opened'
  | 'gender_selected'
  | 'measurement_entered'
  | 'step_completed'
  | 'popup_completed'
  | 'size_recommended'
  | 'add_to_cart'
  | 'measurement_guide_opened'
  | 'recommended_size_result';

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
  location?: {
    country?: string;
    city?: string;
  };
  timestamp: string;
  session_id: string;
}

// Analytics service class
class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private stepStartTimes: Map<string, number>;
  private readonly API_ENDPOINT = 'https://data.yoursizer.com/api/analytics';
  private cachedLocation: { country?: string; city?: string } | null = null;

  private constructor() {
    this.sessionId = uuidv4();
    this.stepStartTimes = new Map();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Get user location using geolocation API
  private async getUserLocation(): Promise<{ country?: string; city?: string }> {
    // Return cached location if available
    if (this.cachedLocation) {
      return this.cachedLocation;
    }

    try {
      // First try to get location from IP using a geolocation service
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        this.cachedLocation = {
          country: data.country_name,
          city: data.city
        };
        return this.cachedLocation;
      }
    } catch (error) {
      console.log('IP geolocation failed, trying browser geolocation...');
    }

    // Fallback to browser geolocation if IP geolocation fails
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        resolve({});
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            
            if (response.ok) {
              const data = await response.json();
              this.cachedLocation = {
                country: data.countryName,
                city: data.city || data.locality
              };
              resolve(this.cachedLocation);
            } else {
              resolve({});
            }
          } catch (error) {
            console.log('Reverse geocoding failed:', error);
            resolve({});
          }
        },
        (error) => {
          console.log('Browser geolocation failed:', error);
          resolve({});
        },
        {
          timeout: 5000,
          enableHighAccuracy: false
        }
      );
    });
  }

  // Start tracking time for a step
  public startStepTracking(stepId: string): void {
    this.stepStartTimes.set(stepId, Date.now());
  }

  // Get time spent on a step
  private getTimeSpent(stepId: string): number {
    const startTime = this.stepStartTimes.get(stepId);
    if (!startTime) return 0;
    return Date.now() - startTime;
  }

  // Track an event
  public async trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'session_id'>): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
      };

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
        const errorText = await response.text();
        console.error('❌ Analytics API error:', response.status, errorText);
        throw new Error(`Analytics API error: ${response.status} - ${errorText}`);
      }

      console.log('✅ Analytics event sent successfully');
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Implement retry logic or error handling as needed
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
    this.stepStartTimes.delete(stepId);
  }

  // Track popup opened with geolocation
  public async trackPopupOpened(licenseKey: string, productId?: string): Promise<void> {
    // Get user location
    const location = await this.getUserLocation();
    
    await this.trackEvent({
      event_type: 'popup_opened',
      license_key: licenseKey,
      product_id: productId,
      location,
    });
  }

  // Track gender selection
  public async trackGenderSelected(licenseKey: string, gender: 'male' | 'female'): Promise<void> {
    await this.trackEvent({
      event_type: 'gender_selected',
      license_key: licenseKey,
      gender,
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

  // Track step completion
  public async trackStepCompleted(
    licenseKey: string,
    step: string,
    stepId: string
  ): Promise<void> {
    await this.trackStepCompletion(stepId, {
      event_type: 'step_completed',
      license_key: licenseKey,
      step,
      step_id: stepId,
      step_completed: true,
    });
  }

  // Track popup completion
  public async trackPopupCompleted(licenseKey: string): Promise<void> {
    await this.trackEvent({
      event_type: 'popup_completed',
      license_key: licenseKey,
      step_completed: true,
    });
  }

  // Track size recommendation
  public async trackSizeRecommended(
    licenseKey: string,
    gender: 'male' | 'female',
    size: string
  ): Promise<void> {
    await this.trackEvent({
      event_type: 'size_recommended',
      license_key: licenseKey,
      gender,
      step: 'size_recommendation',
      step_completed: true,
    });
  }

  // Track add to cart
  public async trackAddToCart(
    licenseKey: string,
    productId: string,
    size: string
  ): Promise<void> {
    console.log('🛒 trackAddToCart called with:', { licenseKey, productId, size });
    await this.trackEvent({
      event_type: 'add_to_cart',
      license_key: licenseKey,
      product_id: productId,
      step: 'cart',
      step_completed: true,
      size: size,
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

  // Track recommended size result with detailed data
  public async trackRecommendedSizeResult(
    licenseKey: string,
    productId: string,
    brandId: string,
    clothingType: string,
    gender: 'male' | 'female',
    measurements: {
      chest: number;
      waist: number;
      hip: number;
      height: number;
      weight: number;
    },
    fitPreference: 'slim' | 'regular' | 'relaxed',
    recommendedSize: string,
    confidence: number,
    method: string,
    explanation?: string,
    fitNotes?: string,
    alternativeSizes?: Array<{
      size: string;
      confidence: number;
      reason?: string;
    }>
  ): Promise<void> {
    try {
      const recommendationData = {
        event_type: 'recommended_size_result' as EventType,
        license_key: licenseKey,
        product_id: productId,
        brand_id: brandId,
        clothing_type: clothingType,
        gender,
        measurements,
        fit_preference: fitPreference,
        recommended_size: recommendedSize,
        confidence_score: confidence,
        method,
        explanation,
        fit_notes: fitNotes,
        alternative_sizes: alternativeSizes,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
      };

      // Send recommendation data to analytics endpoint
      await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recommendationData),
      });

      console.log('📊 Recommended size result tracked:', recommendationData);
    } catch (error) {
      console.error('Failed to track recommended size result:', error);
    }
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance(); 