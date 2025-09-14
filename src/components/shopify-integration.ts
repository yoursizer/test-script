// Shopify integration utilities

// Define Shopify window interface
interface ShopifyWindow extends Window {
  Shopify?: {
    shop?: string;
    Checkout?: {
      isStorefrontCheckout?: boolean;
    };
  };
}

// Extract Shopify shop domain/name
export const extractShopDomain = (): string | null => {
  try {
    // Method 1: From Shopify object
    if ((window as ShopifyWindow).Shopify && (window as ShopifyWindow).Shopify?.shop) {
      const shop = (window as ShopifyWindow).Shopify?.shop;
      console.log('✅ Shop domain from Shopify object:', shop);
      return shop || null;
    }

    // Method 2: From current domain
    const currentDomain = window.location.hostname;
    if (currentDomain.includes('.myshopify.com')) {
      const shopName = currentDomain.split('.myshopify.com')[0];
      console.log('✅ Shop domain from URL:', shopName + '.myshopify.com');
      return shopName + '.myshopify.com';
    }

    // Method 3: Custom domain - try to extract from meta tags
    const shopifyDomain = document.querySelector('meta[name="shopify-domain"]');
    if (shopifyDomain) {
      const domain = shopifyDomain.getAttribute('content');
      if (domain) {
        console.log('✅ Shop domain from meta tag:', domain);
        return domain;
      }
    }

    // Method 4: Try to get from scripts
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || script.innerHTML;
      const shopMatch = content.match(/['""]shop['""]:\s*['""]([^'"]*\.myshopify\.com)['""]/) ||
                       content.match(/Shopify\.shop\s*=\s*['""]([^'"]*)['""]/) ||
                       content.match(/shop_domain['""]:\s*['""]([^'"]*)['""]/);;
      if (shopMatch && shopMatch[1]) {
        console.log('✅ Shop domain from script:', shopMatch[1]);
        return shopMatch[1];
      }
    }

    // Method 5: Custom domain fallback
    console.log('⚠️ Using current domain as shop domain:', currentDomain);
    return currentDomain;
  } catch (error) {
    console.error('Shop domain extraction error:', error);
    return null;
  }
}

// Fetch merchant ID from database using shop domain
export const fetchMerchantId = async (shop: string): Promise<string | null> => {
  try {
    console.log('🆔 Fetching merchant ID for shop:', shop);
    
    const response = await fetch('https://yoursizerbackend.vercel.app/get-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        shop: shop,
        domain: shop 
      }),
    });

    if (!response.ok) {
      throw new Error(`Merchant ID fetch failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.merchantId) {
      console.log('✅ Merchant ID fetched successfully');
      return data.merchantId;
    } else {
      console.warn('❌ No merchant ID found for shop:', shop);
      return null;
    }
  } catch (error) {
    console.error('❌ Merchant ID fetch error:', error);
    return null;
  }
}

// Initialize shop detection and merchant ID fetching
export const initializeShopMerchant = async (): Promise<{
  shopDomain: string | null;
  merchantId: string | null;
}> => {
  // Step 1: Extract shop domain
  const domain = extractShopDomain();
  
  if (!domain) {
    console.error('❌ Could not detect shop domain');
    return { shopDomain: null, merchantId: null };
  }
  
  // Step 2: Fetch merchant ID for this shop
  const merchantId = await fetchMerchantId(domain);
  
  return {
    shopDomain: domain,
    merchantId: merchantId
  };
} 