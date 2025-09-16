import { useCallback } from 'react';
import { analytics } from '../components/analytics';

// Shopify product and variant types
interface ShopifyVariant {
  id: string | number;
  title: string;
  price: number;
  available: boolean;
  options: string[];
}

interface ShopifyProduct {
  id: string | number;
  title: string;
  handle: string;
  variants: ShopifyVariant[];
  options: Array<{ name: string; values: string[] }>;
}

interface ShopifyWindow extends Window {
  Shopify?: {
    onCartUpdate?: () => void;
  };
}

interface UseCartIntegrationParams {
  productId?: string;
  onClose: () => void;
  onSizeRecommended: (size: string) => void;
  gender: "male" | "female" | null;
  licenseKey?: string;
  isMobile?: boolean;
  measurements?: {
    height?: number;
    weight?: number;
    chest?: number;
    waist?: number;
    hips?: number;
  };
  apiSizeResult?: {
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
  } | null;
}

interface UseCartIntegrationReturn {
  handleAddToBag: (size: string) => Promise<void>;
}

export function useCartIntegration({
  productId,
  onClose,
  onSizeRecommended,
  gender,
  licenseKey,
  isMobile,
  measurements,
  apiSizeResult
}: UseCartIntegrationParams): UseCartIntegrationReturn {

  const handleAddToBag = useCallback(async (size: string) => {
    try {
      let product: ShopifyProduct | null = null;
      let actualProductId = productId;

      // Try to get product from URL path
      if (window.location.pathname.includes('/products/')) {
        try {
          const urlParts = window.location.pathname.split('/products/');
          const productHandle = urlParts[1]?.split('?')[0]?.split('/')[0];

          if (productHandle) {
            const handleResponse = await fetch(`/products/${productHandle}.js`);
            if (handleResponse.ok) {
              product = await handleResponse.json();
              actualProductId = product?.id.toString() || '';
            }
          }
        } catch (handleError) {
          // Handle extraction failed silently
        }
      }

      // Try to get product from page scripts
      if (!product) {
        try {
          const scripts = Array.from(document.querySelectorAll('script'));
          for (const script of scripts) {
            const content = script.textContent || script.innerHTML;

            if (content.includes('"product"') && (content.includes('"variants"') || content.includes('"id"'))) {
              try {
                const matches = content.match(/(?:product["\s]*:[\s]*|var[\s]+product[\s]*=[\s]*|window\.product[\s]*=[\s]*|"product"[\s]*:[\s]*)(\{[^}]+\}|\{[\s\S]*?\})/);
                if (matches && matches[1]) {
                  const productData = JSON.parse(matches[1]);
                  if (productData.id && productData.variants) {
                    product = productData;
                    actualProductId = product?.id.toString() || '';
                    break;
                  }
                }
              } catch (parseError) { }
            }
          }
        } catch (scriptError) {
          // Script extraction failed silently
        }
      }

      // Try API endpoints as fallback
      if (!product && productId) {
        try {
          const urlsToTry = [
            `/products/${productId}.js`,
            `/products/${productId}`,
            `/admin/api/2023-10/products/${productId}.json`
          ];

          for (const url of urlsToTry) {
            try {
              const response = await fetch(url);
              if (response.ok) {
                const data = await response.json();
                product = data.product || data;
                if (product && product.variants) {
                  actualProductId = product.id.toString();
                  break;
                }
              }
            } catch (urlError) { }
          }
        } catch (apiError) {
          // API calls failed silently
        }
      }

      if (!product) {
        // Instead of showing alert, just return the size to parent component
        onSizeRecommended(size);
        return;
      }

      // Find variant that matches the recommended size
      let selectedVariant: ShopifyVariant | null = null;
      const sizeOptionNames = ['Size', 'size', 'SIZE', 'Sizes', 'sizes'];

      for (const variant of product.variants) {
        for (let i = 0; i < variant.options.length; i++) {
          const optionName = product.options[i]?.name;
          const optionValue = variant.options[i];

          if (sizeOptionNames.includes(optionName) &&
            optionValue?.toLowerCase() === size.toLowerCase()) {
            selectedVariant = variant;
            break;
          }
        }
        if (selectedVariant) break;
      }

      // Handle case where recommended size is not available
      if (!selectedVariant) {
        const availableSizes = product.variants
          .map((v: ShopifyVariant) => {
            for (let i = 0; i < v.options.length; i++) {
              const optionName = product.options[i]?.name;
              if (sizeOptionNames.includes(optionName)) {
                return v.options[i];
              }
            }
            return null;
          })
          .filter(Boolean)
          .filter((value: string | null, index: number, self: (string | null)[]) => 
            value !== null && self.indexOf(value) === index) as string[];

        const useFirstVariant = window.confirm(`Recommended size "${size}" not found. Available: ${availableSizes.join(', ')}. Use first available variant?`);

        if (useFirstVariant) {
          selectedVariant = product.variants.find((v: ShopifyVariant) => v.available) || product.variants[0];
        } else {
          // Instead of alert, return the size to parent component
          onSizeRecommended(size);
          onClose();
          return;
        }
      }

      if (!selectedVariant) {
        throw new Error("No available variants found for this product");
      }

      // Add to cart
      const variantId = selectedVariant.id as number;

      const cartData = {
        id: variantId,
        quantity: 1,
        properties: {
          'Recommended by': 'YourSizer',
          'Recommended Size': size,
          'Actual Variant': selectedVariant.title,
          'Gender': gender
        }
      };

      const cartResponse = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(cartData)
      });

      if (!cartResponse.ok) {
        const errorText = await cartResponse.text();
        const status = cartResponse.status;
        throw new Error(`Failed to add to cart (${status}): ${errorText}`);
      }

      const cartResult = await cartResponse.json();

      // Track add to cart event with time spent
      if (licenseKey && gender && actualProductId) {
        const finalStepId = isMobile ? 'step_7' : 'step_4';
        const timeSpentMs = analytics.getTimeSpent(finalStepId);
        
        // Use actual API response data for recommended sizes instead of undefined
        const recommendedSizes = apiSizeResult ? {
          primary: apiSizeResult.size,
          smaller: apiSizeResult.smaller_size || undefined,
          larger: apiSizeResult.larger_size || undefined
        } : undefined;
        
        analytics.trackAddToCart(licenseKey, actualProductId, size, gender, timeSpentMs, undefined, measurements, recommendedSizes).catch(error => {
          console.warn('Failed to track add to cart:', error);
        });
      }

      // Update cart and reload page
      try {
        if ((window as ShopifyWindow).Shopify && (window as ShopifyWindow).Shopify?.onCartUpdate) {
          (window as ShopifyWindow).Shopify?.onCartUpdate?.();
        }

        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cartResult } }));

        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (refreshError) {
        window.location.reload();
      }

      onClose();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`❌ Failed to add to cart: ${errorMessage}\n\n📏 Your recommended size: ${size}`);
      onSizeRecommended(size);
    }
  }, [productId, onClose, onSizeRecommended, gender]);

  return {
    handleAddToBag
  };
}
