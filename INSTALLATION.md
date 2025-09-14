# YourSizer Widget - Installation Guide

## Quick Start

### 1. Install the Package

```bash
npm install yoursizer-widget
# or
yarn add yoursizer-widget
# or
pnpm add yoursizer-widget
```

### 2. Import and Use

```tsx
import { FindYourSizerWidget } from 'yoursizer-widget'

function ProductPage() {
  const handleSizeRecommended = (size: string) => {
    console.log('Recommended size:', size)
    // Handle the size recommendation
  }

  return (
    <div className="product-page">
      <FindYourSizerWidget 
        onSizeRecommended={handleSizeRecommended}
        productId="your-product-id"
        brandId="your-brand-id"
        clothingType="upperwear"
        licenseKey="your-license-key"
      />
    </div>
  )
}
```

## Requirements

### Dependencies
- React 18+
- React DOM 18+
- Node.js 16+

### Optional Dependencies
- Tailwind CSS (for styling)
- Framer Motion (included in package)

## Configuration

### 1. License Key Setup

Get your license key from [YourSizer Dashboard](https://dashboard.yoursizer.com)

```tsx
<FindYourSizerWidget 
  licenseKey="your-license-key-here"
/>
```

### 2. Product Configuration

```tsx
<FindYourSizerWidget 
  productId="tshirt-classic-001"
  brandId="demo-store"
  clothingType="upperwear"
/>
```

### 3. Size Recommendation Handling

```tsx
const handleSizeRecommended = (size: string) => {
  // Update your UI with the recommended size
  setSelectedSize(size)
  
  // Update cart
  updateCart({ size })
  
  // Show confirmation
  showNotification(`Size ${size} recommended!`)
}
```

## Styling

### With Tailwind CSS

```tsx
<FindYourSizerWidget 
  className="w-full flex justify-center mb-4"
  buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
/>
```

### With Custom CSS

```css
/* Your custom styles */
.custom-widget {
  margin: 20px 0;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
}
```

```tsx
<FindYourSizerWidget 
  className="custom-widget"
/>
```

## E-commerce Integration

### Shopify

```tsx
import { FindYourSizerWidget } from 'yoursizer-widget'

function ShopifyProductPage() {
  const [selectedSize, setSelectedSize] = useState(null)
  
  return (
    <div className="product-page">
      <FindYourSizerWidget 
        productId={product.id}
        brandId={product.vendor}
        clothingType="upperwear"
        onSizeRecommended={setSelectedSize}
      />
      
      {selectedSize && (
        <button onClick={() => addToCart({ size: selectedSize })}>
          Add to Cart - Size {selectedSize}
        </button>
      )}
    </div>
  )
}
```

### WooCommerce

```tsx
function WooCommerceProductPage() {
  const [selectedSize, setSelectedSize] = useState(null)
  
  return (
    <div className="product-page">
      <FindYourSizerWidget 
        productId={product.id}
        brandId={product.brand}
        clothingType="upperwear"
        onSizeRecommended={setSelectedSize}
      />
    </div>
  )
}
```

## Advanced Usage

### Multiple Widgets

```tsx
function ProductComparisonPage() {
  return (
    <div className="product-comparison">
      <div className="product-card">
        <h3>T-Shirt</h3>
        <FindYourSizerWidget 
          productId="tshirt-001"
          brandId="brand-a"
          clothingType="upperwear"
          onSizeRecommended={(size) => console.log('T-shirt:', size)}
        />
      </div>
      
      <div className="product-card">
        <h3>Jeans</h3>
        <FindYourSizerWidget 
          productId="jeans-001"
          brandId="brand-b"
          clothingType="lowerwear"
          onSizeRecommended={(size) => console.log('Jeans:', size)}
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

## Troubleshooting

### Common Issues

1. **Widget not showing**
   - Check license key validity
   - Ensure React 18+ is installed
   - Check browser console for errors

2. **Size not updating**
   - Verify `onSizeRecommended` callback is implemented
   - Check for JavaScript errors

3. **Styling issues**
   - Ensure CSS is properly loaded
   - Check for CSS conflicts

4. **Mobile issues**
   - Test on actual mobile devices
   - Check viewport meta tag

### Debug Mode

```tsx
<FindYourSizerWidget 
  onSizeRecommended={(size) => {
    console.log('Size recommended:', size)
    // Your logic here
  }}
/>
```

## Support

- **Documentation**: [docs.yoursizer.com](https://docs.yoursizer.com)
- **Email**: support@yoursizer.com
- **GitHub**: [github.com/yoursizer/widget](https://github.com/yoursizer/widget)
- **Discord**: [discord.gg/yoursizer](https://discord.gg/yoursizer)

## License

MIT License - see [LICENSE](LICENSE) file for details. 