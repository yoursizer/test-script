# YourSizer Widget - AI-Powered updates

The `FindYourSizerWidget` is a customizable React component that provides AI-powered size recommendations for clothing items. It integrates with user profiles and provides a seamless sizing experience with license verification and dynamic API integration.

## Features

- 🤖 AI-powered size recommendations
- 👤 User profile integration with fast-track mode
- 📱 Mobile-responsive design
- 🎨 Customizable styling and positioning
- 🔄 Real-time profile updates
- 📊 Measurement-based sizing
- 🔐 License verification system
- 🌐 Dynamic API integration with product/brand data
- 🎯 Size recommendation callbacks
- 🎨 Customizable button backgrounds and animations

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `buttonText` | `string` | `'Find Your Size'` | Custom button text. If not provided, uses dynamic text based on user profile |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'center'` | `'center'` | Position of the button within its container |
| `className` | `string` | `''` | Additional CSS classes for styling |
| `buttonBg` | `string` | `undefined` | Custom background color/gradient for the button. If not provided, uses default animated gradient |
| `licenseKey` | `string` | `'demo-key'` | License key for widget verification |
| `onSizeRecommended` | `(size: string) => void` | `undefined` | Callback function called when a size is recommended |
| `productId` | `string` | `'default-product'` | Product ID for API size recommendations |
| `brandId` | `string` | `'generic'` | Brand ID for API size recommendations |
| `clothingType` | `string` | `'tshirt'` | Clothing type for API size recommendations |

## Usage Examples

### Basic Usage
```tsx
import { FindYourSizerWidget } from './widget'

function ProductPage() {
  const handleSizeRecommended = (size: string) => {
    console.log('Recommended size:', size)
    // Handle the size recommendation
  }

  return (
    <FindYourSizerWidget 
      onSizeRecommended={handleSizeRecommended}
    />
  )
}
```

### Custom Button Text and Styling
```tsx
<FindYourSizerWidget 
  buttonText="Get My Perfect Size"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
/>
```

### Product-Specific Configuration
```tsx
<FindYourSizerWidget 
  buttonText="Find My Size"
  productId="tshirt-classic-001"
  brandId="demo-store"
  clothingType="upperwear"
  onSizeRecommended={(size) => setSelectedSize(size)}
/>
```

### Complete E-commerce Integration
```tsx
import React, { useState } from 'react'
import { FindYourSizerWidget } from './widget'

export function ProductPage() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  const handleSizeRecommended = (size: string) => {
    console.log('📦 Size recommended:', size)
    setSelectedSize(size)
  }

  return (
    <div className="product-page">
      <div className="product-info">
        <h1>Classic T-Shirt</h1>
        <p>$29.99</p>
        
        {/* Size Selection */}
        <div className="size-buttons">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
            <button
              key={size}
              className={`size-button ${selectedSize === size ? 'selected' : ''}`}
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </button>
          ))}
        </div>
        
        {/* YourSizer Widget */}
        <FindYourSizerWidget 
          buttonText="Find My Perfect Size"
          position="center"
          className="w-full flex"
          buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          licenseKey="your-license-key"
          productId="tshirt-classic-001"
          brandId="demo-store"
          clothingType="upperwear"
          onSizeRecommended={handleSizeRecommended}
        />
        
        {/* Add to Cart Button */}
        <button 
          className="add-to-cart"
          disabled={!selectedSize}
        >
          {selectedSize ? `Add to Cart - Size ${selectedSize}` : 'Select Size First'}
        </button>
      </div>
    </div>
  )
}
```

## License Verification

The widget includes built-in license verification. When an invalid license is detected, a user-friendly overlay appears with:

- Clear error messages
- Retry functionality
- Support contact information
- Common troubleshooting tips

### License States

1. **Valid License**: Widget opens normally, shows sizing assistant
2. **Invalid License**: Shows license overlay with error message
3. **Network Error**: Shows license overlay with retry option
4. **Checking**: Shows loading state during verification

## API Integration

The widget dynamically sends the following data to the size recommendation API:

```typescript
{
  gender: "male" | "female",
  measurements: {
    chest: number,
    waist: number,
    hip: number,
    height: number,
    weight: number
  },
  clothing_type: string,    // From clothingType prop
  brand_id: string,         // From brandId prop
  product_id: string        // From productId prop
}
```

## Profile Integration

The widget automatically:

- Loads existing user profiles
- Handles profile creation and updates
- Provides fast-track mode for returning users
- Syncs measurements across sessions
- Maintains user preferences and settings

## Styling and Customization

### Button Positioning

```tsx
// Center (default)
<FindYourSizerWidget position="center" />

// Top
<FindYourSizerWidget position="top" />

// Bottom
<FindYourSizerWidget position="bottom" />

// Left
<FindYourSizerWidget position="left" />

// Right
<FindYourSizerWidget position="right" />
```

### Custom Backgrounds

```tsx
// Solid color
<FindYourSizerWidget buttonBg="#3B82F6" />

// Linear gradient
<FindYourSizerWidget 
  buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
/>

// Radial gradient
<FindYourSizerWidget 
  buttonBg="radial-gradient(circle, #667eea 0%, #764ba2 100%)" 
/>

// Default animated gradient (no buttonBg prop)
<FindYourSizerWidget />
```

### CSS Classes

```tsx
// Full width with custom spacing
<FindYourSizerWidget 
  className="w-full flex justify-center mb-4" 
/>

// Custom container styling
<FindYourSizerWidget 
  className="my-custom-class" 
/>
```

## Dependencies

- React 18+
- Framer Motion (for animations)
- Profile Service (for user management)
- Sizing Assistant (for AI recommendations)
- License verification system
- Three.js (for 3D model rendering)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Installation

```bash
npm install yoursizer-widget
# or
yarn add yoursizer-widget
```

## Development

```bash
npm run dev
npm run build
npm run test
```

## Support

For support, contact:
- Email: support@yoursizer.com
- Documentation: [docs.yoursizer.com](https://docs.yoursizer.com)
- GitHub Issues: [github.com/yoursizer/widget](https://github.com/yoursizer/widget)

# YourSizer Widget - Script Tag Integration
