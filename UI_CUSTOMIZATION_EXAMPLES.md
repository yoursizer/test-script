# YourSizer Widget - UI Customization Examples

This document provides comprehensive examples for customizing the YourSizer widget to match your brand and design requirements.

## Table of Contents

1. [Basic Integration](#basic-integration)
2. [Button Styling](#button-styling)
3. [Positioning Examples](#positioning-examples)
4. [E-commerce Integration](#e-commerce-integration)
5. [Brand-Specific Themes](#brand-specific-themes)
6. [Advanced Customization](#advanced-customization)
7. [Responsive Design](#responsive-design)
8. [Animation Customization](#animation-customization)

## Basic Integration

### Minimal Setup
```tsx
import { FindYourSizerWidget } from './widget'

function ProductPage() {
  return (
    <div className="product-container">
      <FindYourSizerWidget />
    </div>
  )
}
```

### With Size Recommendation Handling
```tsx
import { FindYourSizerWidget } from './widget'

function ProductPage() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  const handleSizeRecommended = (size: string) => {
    setSelectedSize(size)
    // Additional logic like updating cart, showing confirmation, etc.
  }

  return (
    <div className="product-container">
      <FindYourSizerWidget 
        onSizeRecommended={handleSizeRecommended}
      />
    </div>
  )
}
```

## Button Styling

### Default Animated Gradient
```tsx
<FindYourSizerWidget />
// Uses the default animated gradient background
```

### Solid Color Background
```tsx
<FindYourSizerWidget 
  buttonBg="#3B82F6"
  buttonText="Find My Size"
/>
```

### Linear Gradient
```tsx
<FindYourSizerWidget 
  buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  buttonText="Get Perfect Fit"
/>
```

### Radial Gradient
```tsx
<FindYourSizerWidget 
  buttonBg="radial-gradient(circle, #667eea 0%, #764ba2 100%)"
  buttonText="Size Me Up"
/>
```

### Custom CSS with Tailwind
```tsx
<FindYourSizerWidget 
  className="w-full flex justify-center mb-4"
  buttonText="Find Your Perfect Size"
/>
```

### Custom CSS Classes
```tsx
<FindYourSizerWidget 
  className="my-custom-widget-container"
  buttonText="AI Size Finder"
/>

// CSS
.my-custom-widget-container {
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
```

## Positioning Examples

### Center Position (Default)
```tsx
<FindYourSizerWidget 
  position="center"
  buttonText="Find My Size"
/>
```

### Top Position
```tsx
<FindYourSizerWidget 
  position="top"
  buttonText="Get Size Recommendation"
/>
```

### Bottom Position
```tsx
<FindYourSizerWidget 
  position="bottom"
  buttonText="Find Perfect Fit"
/>
```

### Left Position
```tsx
<FindYourSizerWidget 
  position="left"
  buttonText="Size Me"
/>
```

### Right Position
```tsx
<FindYourSizerWidget 
  position="right"
  buttonText="Find Size"
/>
```

## E-commerce Integration

### Complete Product Page Integration
```tsx
import React, { useState } from 'react'
import { FindYourSizerWidget } from './widget'

export function ProductPage() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [product] = useState({
    id: "tshirt-classic-001",
    name: "Classic Cotton T-Shirt",
    price: 29.99,
    brand: "demo-store",
    type: "upperwear"
  })

  const handleSizeRecommended = (size: string) => {
    console.log('📦 Size recommended:', size)
    setSelectedSize(size)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <img 
              src="/product-image.jpg" 
              alt={product.name}
              className="w-full rounded-lg"
            />
          </div>
          
          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-2xl font-semibold text-gray-900 mt-2">${product.price}</p>
            </div>
            
            <p className="text-gray-600">
              Premium cotton t-shirt with a comfortable fit. Perfect for everyday wear.
            </p>
            
            <div className="space-y-4">
              {/* Size Selection */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Size</h3>
                <div className="flex gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <button
                      key={size}
                      className={`px-4 py-2 border rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        selectedSize === size 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300'
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSize && (
                  <p className="text-sm text-green-600 mt-2">
                    ✅ Recommended size: {selectedSize}
                  </p>
                )}
              </div>
              
              {/* YourSizer Widget */}
              <FindYourSizerWidget 
                buttonText="Find My Perfect Size"
                position="center"
                className="w-full flex"
                buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                licenseKey="your-license-key"
                productId={product.id}
                brandId={product.brand}
                clothingType={product.type}
                onSizeRecommended={handleSizeRecommended}
              />
              
              {/* Add to Cart Button */}
              <button 
                className={`w-full border text-gray-900 py-3 px-6 rounded-md transition-colors font-medium ${
                  selectedSize 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                disabled={!selectedSize}
              >
                {selectedSize ? `Add to Cart - Size ${selectedSize}` : 'Select Size First'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Shopify Integration
```tsx
import React, { useState, useEffect } from 'react'
import { FindYourSizerWidget } from './widget'

export function ShopifyProductPage() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [product, setProduct] = useState(null)

  useEffect(() => {
    // Get product data from Shopify
    const productHandle = window.location.pathname.split('/products/')[1]?.split('?')[0]
    if (productHandle) {
      fetch(`/products/${productHandle}.js`)
        .then(res => res.json())
        .then(data => setProduct(data))
    }
  }, [])

  const handleSizeRecommended = (size: string) => {
    setSelectedSize(size)
    // Update Shopify cart or form
  }

  if (!product) return <div>Loading...</div>

  return (
    <div className="product-page">
      <FindYourSizerWidget 
        buttonText="Find My Size"
        productId={product.id.toString()}
        brandId={product.vendor}
        clothingType="upperwear"
        onSizeRecommended={handleSizeRecommended}
      />
    </div>
  )
}
```

## Brand-Specific Themes

### Modern Minimal Theme
```tsx
<FindYourSizerWidget 
  buttonText="Find Size"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
/>
```

### Bold Brand Theme
```tsx
<FindYourSizerWidget 
  buttonText="AI Size Finder"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
/>
```

### Elegant Theme
```tsx
<FindYourSizerWidget 
  buttonText="Get Perfect Fit"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(135deg, #2c3e50 0%, #34495e 100%)"
/>
```

### Playful Theme
```tsx
<FindYourSizerWidget 
  buttonText="Size Me Up!"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
/>
```

## Advanced Customization

### Custom Container Styling
```tsx
<div className="custom-widget-container">
  <FindYourSizerWidget 
    buttonText="Find My Size"
    className="my-custom-class"
  />
</div>

// CSS
.custom-widget-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.my-custom-class {
  /* Custom styles */
}
```

### Multiple Widgets on Same Page
```tsx
function ProductComparisonPage() {
  const handleSizeRecommended = (productId: string, size: string) => {
    console.log(`Product ${productId}: ${size}`)
  }

  return (
    <div className="product-comparison">
      <div className="product-card">
        <h3>T-Shirt</h3>
        <FindYourSizerWidget 
          buttonText="Find T-Shirt Size"
          productId="tshirt-001"
          brandId="brand-a"
          clothingType="upperwear"
          onSizeRecommended={(size) => handleSizeRecommended('tshirt', size)}
        />
      </div>
      
      <div className="product-card">
        <h3>Jeans</h3>
        <FindYourSizerWidget 
          buttonText="Find Jeans Size"
          productId="jeans-001"
          brandId="brand-b"
          clothingType="lowerwear"
          onSizeRecommended={(size) => handleSizeRecommended('jeans', size)}
        />
      </div>
    </div>
  )
}
```

### Conditional Rendering
```tsx
function ProductPage({ product }) {
  const [showWidget, setShowWidget] = useState(true)

  return (
    <div>
      {showWidget && (
        <FindYourSizerWidget 
          buttonText="Find My Size"
          productId={product.id}
          brandId={product.brand}
          clothingType={product.type}
        />
      )}
      
      <button onClick={() => setShowWidget(!showWidget)}>
        {showWidget ? 'Hide Widget' : 'Show Widget'}
      </button>
    </div>
  )
}
```

## Responsive Design

### Mobile-First Approach
```tsx
<FindYourSizerWidget 
  buttonText="Find My Size"
  position="center"
  className="w-full flex justify-center md:w-auto md:inline-flex"
/>
```

### Responsive Positioning
```tsx
<FindYourSizerWidget 
  buttonText="Find My Size"
  position="center"
  className="w-full flex justify-center sm:justify-start md:justify-center lg:justify-end"
/>
```

### Responsive Text
```tsx
<FindYourSizerWidget 
  buttonText="Find My Size"
  className="text-sm md:text-base lg:text-lg"
/>
```

## Animation Customization

### Custom Animation Timing
```tsx
// The widget uses Framer Motion internally
// You can customize animations by wrapping the widget

import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
>
  <FindYourSizerWidget 
    buttonText="Find My Size"
  />
</motion.div>
```

### Staggered Animation
```tsx
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  <motion.div variants={itemVariants}>
    <FindYourSizerWidget 
      buttonText="Find My Size"
    />
  </motion.div>
</motion.div>
```

## CSS Customization Examples

### Custom Button Styles
```css
/* Custom button container */
.custom-widget-button {
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.custom-widget-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

/* Custom text styles */
.custom-widget-text {
  font-weight: 600;
  letter-spacing: 0.5px;
}
```

### Dark Theme
```css
.dark-theme .widget-container {
  background: #1a1a1a;
  color: #ffffff;
}

.dark-theme .widget-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}
```

### Glass Morphism Effect
```css
.glass-widget {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
}
```

## Integration Patterns

### Form Integration
```tsx
function CheckoutForm() {
  const [size, setSize] = useState('')
  
  return (
    <form>
      <div className="form-group">
        <label>Size</label>
        <input 
          type="text" 
          value={size} 
          onChange={(e) => setSize(e.target.value)}
        />
        <FindYourSizerWidget 
          onSizeRecommended={setSize}
        />
      </div>
    </form>
  )
}
```

### Cart Integration
```tsx
function CartItem({ item }) {
  const [size, setSize] = useState(item.size)
  
  return (
    <div className="cart-item">
      <img src={item.image} alt={item.name} />
      <div>
        <h3>{item.name}</h3>
        <p>Size: {size}</p>
        <FindYourSizerWidget 
          onSizeRecommended={setSize}
        />
      </div>
    </div>
  )
}
```

### Wishlist Integration
```tsx
function WishlistItem({ product }) {
  const [recommendedSize, setRecommendedSize] = useState(null)
  
  return (
    <div className="wishlist-item">
      <h3>{product.name}</h3>
      {recommendedSize && (
        <p>Recommended: {recommendedSize}</p>
      )}
      <FindYourSizerWidget 
        productId={product.id}
        onSizeRecommended={setRecommendedSize}
      />
    </div>
  )
}
```

## Best Practices

1. **Always handle size recommendations**: Use the `onSizeRecommended` callback
2. **Provide meaningful product data**: Use specific `productId`, `brandId`, and `clothingType`
3. **Test on mobile**: Ensure the widget works well on all screen sizes
4. **Use appropriate license keys**: Use valid license keys for production
5. **Handle loading states**: Show appropriate loading indicators
6. **Accessibility**: Ensure the widget is accessible to all users
7. **Performance**: Don't render multiple widgets unnecessarily

## Troubleshooting

### Common Issues

1. **Widget not showing**: Check license key validity
2. **Size not updating**: Ensure `onSizeRecommended` callback is properly implemented
3. **Styling issues**: Check CSS conflicts and specificity
4. **Mobile issues**: Test on actual mobile devices
5. **API errors**: Check network connectivity and API endpoints

### Debug Mode
```tsx
// Add console logs for debugging
<FindYourSizerWidget 
  onSizeRecommended={(size) => {
    console.log('Size recommended:', size)
    // Your logic here
  }}
/>
```

For more help, contact support@yoursizer.com 