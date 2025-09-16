import { useState } from 'react';

interface SizeRecommendationRequest {
  gender: "male" | "female";
  measurements: {
    chest: number;
    waist: number;
    hip: number;  // Changed from 'hips' to 'hip'
    height: number;
    weight: number;
  };
  clothing_type: string;
  brand_id: string;  // Changed from 'brand' to 'brand_id'
  product_id: string;  // Added product_id field
}

// API Response Type - Only New Format
interface SizeRecommendationResponse {
  recommended_size: string;
  smaller_size: string | null;
  larger_size: string | null;
  user_score: number;
  range_type: "ideal" | "upper_range" | "lower_range";
  comments: {
    main: string;
    smaller: string | null;
    larger: string | null;
  };
}

interface ProcessedSizeRecommendation {
  size: string;
  confidence: number;
  explanation?: string;
  smaller_size?: string | null;
  larger_size?: string | null;
  smaller_reason?: string | null;
  larger_reason?: string | null;
  range_type?: string;
}

export const useSizeRecommendation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSizeRecommendation = async (requestData: SizeRecommendationRequest): Promise<ProcessedSizeRecommendation | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Direct call to production API instead of local route
      const apiUrl = 'https://algo2.yoursizer.com/getrecommendation';
      
      // Log the request data and stack trace
      console.log('🚀 Size Recommendation API Request:', {
        url: apiUrl,
        data: requestData
      });
      console.trace('🔍 API Call Stack Trace:');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender: requestData.gender,
          measurements: {
            height: requestData.measurements.height,
            weight: requestData.measurements.weight,
            chest: requestData.measurements.chest,
            waist: requestData.measurements.waist,
            hip: requestData.measurements.hip
          },
          clothing_type: requestData.clothing_type,
          brand_id: requestData.brand_id,
          product_id: requestData.product_id
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: SizeRecommendationResponse = await response.json();
      
      // Log the successful response
      console.log('✅ Size Recommendation API Response:', data);

      return {
        size: data.recommended_size,
        confidence: data.user_score,
        explanation: data.comments.main,
        smaller_size: data.smaller_size,
        larger_size: data.larger_size,
        smaller_reason: data.comments.smaller,
        larger_reason: data.comments.larger,
        range_type: data.range_type
      };
    } catch (err) {
      console.error('❌ Size Recommendation API Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
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