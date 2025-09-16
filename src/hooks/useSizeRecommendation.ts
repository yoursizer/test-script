import { useState } from 'react';
import { analytics } from '../action/analytics';

interface SizeRecommendationRequest {
  gender: "male" | "female";
  measurements: {
    chest: number;
    waist: number;
    hip: number;  // Changed from 'hips' to 'hip'
    height: number;
    weight: number;
  };
  fit_preference: "slim" | "regular" | "relaxed";
  clothing_type: string;
  use_ai: boolean;
  brand_id: string;  // Changed from 'brand' to 'brand_id'
  product_id: string;  // Added product_id field
  license_key?: string; // Added license_key for analytics tracking
}

// AI Response Type
interface AIRecommendationResponse {
  method: "ai";
  source: string;
  recommendation: {
    recommended_size: string;
    confidence_score: number;
    explanation: string;
    alternative_sizes: Array<{
      size: string;
      confidence: number;
      reason: string;
    }>;
    fit_notes: string;
  };
}

// Algorithm Response Type (keeping for backward compatibility)
interface AlgorithmRecommendationResponse {
  method: "algorithm";
  recommended_size: string;
  match_percentage: number;
  all_sizes: {
    [key: string]: number;
  };
}

type SizeRecommendationResponse = AIRecommendationResponse | AlgorithmRecommendationResponse;

interface ProcessedSizeRecommendation {
  size: string;
  confidence: number;
  method: string;
  explanation?: string;
  fit_notes?: string;
  alternative_sizes?: Array<{
    size: string;
    confidence: number;
    reason?: string;
  }>;
}

export const useSizeRecommendation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSizeRecommendation = async (requestData: SizeRecommendationRequest): Promise<ProcessedSizeRecommendation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Log the request data
      console.log('🚀 Size Recommendation API Request:', {
        url: 'https://algo2.yoursizer.com/calculate-size',
        data: requestData
      });

      const response = await fetch('https://algo2.yoursizer.com/calculate-size', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // Log the response status
      console.log('📡 API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: SizeRecommendationResponse = await response.json();
      
      // Log the successful response
      console.log('✅ Size Recommendation API Response:', data);

      // Process the response based on method type
      if (data.method === "ai") {
        const aiData = data as AIRecommendationResponse;
        const result = {
          size: aiData.recommendation.recommended_size,
          confidence: aiData.recommendation.confidence_score,
          method: "ai",
          explanation: aiData.recommendation.explanation,
          fit_notes: aiData.recommendation.fit_notes,
          alternative_sizes: aiData.recommendation.alternative_sizes.map(alt => ({
            size: alt.size,
            confidence: alt.confidence,
            reason: alt.reason
          }))
        };

        // Track the recommended size result to analytics
        if (requestData.license_key) {
          try {
            await analytics.trackRecommendedSizeResult(
              requestData.license_key,
              requestData.product_id,
              requestData.brand_id,
              requestData.clothing_type,
              requestData.gender,
              requestData.measurements,
              requestData.fit_preference,
              result.size,
              result.confidence,
              result.method,
              result.explanation,
              result.fit_notes,
              result.alternative_sizes
            );
          } catch (analyticsError) {
            console.error('Failed to track recommended size result:', analyticsError);
            // Don't fail the main request if analytics tracking fails
          }
        }

        return result;
      } else if (data.method === "algorithm") {
        const algoData = data as AlgorithmRecommendationResponse;
        const result = {
          size: algoData.recommended_size,
          confidence: algoData.match_percentage,
          method: "algorithm"
        };

        // Track the recommended size result to analytics
        if (requestData.license_key) {
          try {
            await analytics.trackRecommendedSizeResult(
              requestData.license_key,
              requestData.product_id,
              requestData.brand_id,
              requestData.clothing_type,
              requestData.gender,
              requestData.measurements,
              requestData.fit_preference,
              result.size,
              result.confidence,
              result.method
            );
          } catch (analyticsError) {
            console.error('Failed to track recommended size result:', analyticsError);
            // Don't fail the main request if analytics tracking fails
          }
        }

        return result;
      } else {
        throw new Error('Unknown response method type');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Size Recommendation API Error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getSizeRecommendation,
    isLoading,
    error,
  };
}; 