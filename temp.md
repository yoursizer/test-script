# @yoursizer/widget-package

## Installation

```bash
npm install @yoursizer/widget-package
```

## Usage

### Import the Components

There are two main widget components available:

```jsx
import { FindYourSizeWidget, FindYourSizeWidgetWithoutSlider } from '@yoursizer/widget-package';
```

### Import the CSS

There are two ways to import the CSS:

1. **Direct Import in your CSS/SCSS file:**
```css
@import '@yoursizer/widget-package/dist/styles.css';
```

2. **Import in your JavaScript/TypeScript file:**
```javascript
import '@yoursizer/widget-package/dist/styles.css';
```

### Component Props

Both widgets accept the following props:

```typescript
interface FindYourSizeWidgetProps {
  className?: string;        // Optional CSS class for styling
  licenseKey: string;        // Required: Your YourSizer license key
  productId?: string;        // Optional: Product ID for size recommendations
  brandId?: string;          // Optional: Brand ID for size recommendations
  clothingType?: string;     // Optional: Type of clothing (e.g., "Trousers", "Shirts")
  onAddToBag?: (size: string) => void;  // Optional: Callback when user clicks "Add to Bag"
}
```

### Examples

#### Basic Usage with Popup Widget

```jsx
import { FindYourSizeWidget } from '@yoursizer/widget-package';
import '@yoursizer/widget-package/dist/styles.css';

function App() {
  return (
    <div>
      <FindYourSizeWidget 
        licenseKey="your-license-key-here"
        className="my-custom-class"
      />
    </div>
  );
}
```

#### Advanced Usage with Product Context

```jsx
import { FindYourSizeWidget } from '@yoursizer/widget-package';
import '@yoursizer/widget-package/dist/styles.css';

function ProductPage() {
  return (
    <div>
      <FindYourSizeWidget 
        licenseKey="your-license-key-here"
        productId="12345"
        brandId="brand-123"
        clothingType="Trousers"
        className="product-size-widget"
      />
    </div>
  );
}
```

#### Usage with Add to Bag Callback

```jsx
import { FindYourSizeWidget } from '@yoursizer/widget-package';
import '@yoursizer/widget-package/dist/styles.css';

function ProductPage() {
  const handleAddToBag = (size: string) => {
    console.log('User wants to add size:', size);
    
    // Example: Set the size in your cart/checkout system
    // setSelectedSize(size);
    // addToCart(productId, size);
    
    // Example: Update a form field
    // document.getElementById('size-select').value = size;
    
    // Example: Show a notification
    // showNotification(`Size ${size} selected!`);
  };

  return (
    <div>
      <FindYourSizeWidget 
        licenseKey="your-license-key-here"
        productId="12345"
        brandId="brand-123"
        clothingType="Trousers"
        onAddToBag={handleAddToBag}
        className="product-size-widget"
      />
    </div>
  );
}
```

#### Real-world Integration Examples

**E-commerce Integration:**
```jsx
const handleAddToBag = (size: string) => {
  // Find and select the size option in your dropdown
  const sizeSelect = document.querySelector('select[name="size"]');
  if (sizeSelect) {
    sizeSelect.value = size;
    sizeSelect.dispatchEvent(new Event('change'));
  }
  
  // Or trigger your add to cart function
  addToCart(productId, size);
};
```

**Form Integration:**
```jsx
const handleAddToBag = (size: string) => {
  // Pre-fill size field in a form
  const sizeInput = document.getElementById('size-input');
  if (sizeInput) {
    sizeInput.value = size;
  }
  
  // Show success message
  alert(`Size ${size} selected! Please complete your order.`);
};
```

**React State Management:**
```jsx
const [selectedSize, setSelectedSize] = useState('');

const handleAddToBag = (size: string) => {
  setSelectedSize(size);
  // Trigger any additional actions
  setShowCheckout(true);
};
```

#### Popup Without Slider Widget

```jsx
import { FindYourSizeWidgetWithoutSlider } from '@yoursizer/widget-package';
import '@yoursizer/widget-package/dist/styles.css';

function App() {
  return (
    <div>
      <FindYourSizeWidgetWithoutSlider 
        licenseKey="your-license-key-here"
        productId="12345"
        brandId="brand-123"
        clothingType="Shirts"
        className="no-slider-widget"
      />
    </div>
  );
}
```

### Widget Features

- **License Validation**: Automatic license verification before opening the sizing assistant
- **3D Model Visualization**: Interactive 3D body model for accurate measurements
- **AI-Powered Recommendations**: Advanced size recommendations using YourSizer AI
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Measurement Guides**: Built-in guides for accurate body measurements
- **Multiple Clothing Types**: Support for different clothing categories
- **Brand-Specific Sizing**: Brand-aware size recommendations
- **Add to Bag Integration**: Seamless integration with your cart/checkout system via callback

### Add to Bag Functionality

The widget includes an "Add to Bag" button in the final step that provides the recommended size to your application. When users click this button, the `onAddToBag` callback is triggered with the recommended size as a parameter.

#### How it works:

1. **User completes the sizing process** and receives a size recommendation
2. **User clicks "Add to Bag"** button in the final step
3. **Your callback function is called** with the recommended size
4. **You handle the size** in your application (set form fields, add to cart, etc.)

#### Example use cases:

- **E-commerce**: Automatically select the recommended size in your size dropdown
- **Form Integration**: Pre-fill size fields in your checkout process
- **Cart Management**: Add the product with the recommended size to the cart
- **User Experience**: Show confirmation messages or proceed to checkout

#### Size Values:

The size parameter will be one of the standard size values:
- `"XS"`, `"S"`, `"M"`, `"L"`, `"XL"` (for most clothing)
- Or specific size values based on your product's size options

### License Requirements

A valid YourSizer license key is required to use these widgets. The license will be automatically verified when the widget is opened.

## CSS Modules

The package uses CSS Modules for scoped styling. When importing components, the styles will be automatically scoped to prevent conflicts with your application's styles.

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Generate type declarations
npm run build:types
``` 