# YourSizer Widget - Script Tag Integration

A powerful AI-powered size recommendation widget that can be easily embedded into any website using a simple script tag.

## 🚀 Quick Start

### 1. Include Dependencies
```html
<!-- Include React dependencies -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Include YourSizer Widget -->
<script src="https://shashank1623.github.io/yoursizer-widget-test/yoursizer-widget.umd.js"></script>
```

### 2. Add Widget Container
```html
<div 
    data-yoursizer
    data-product-id="your-product-id"
    data-brand-id="your-brand-id"
    data-clothing-type="tshirt"
    data-license-key="your-license-key"
    data-button-text="Find My Perfect Size"
    data-position="center"
></div>
```

### 3. Optional: Manual Initialization
```html
<script>
YourSizer.init({
    merchantId: 'your-merchant-id',
    onSizeRecommended: function(size) {
        console.log('Recommended size:', size);
        // Handle size recommendation
    }
});
</script>
```

## 📋 Configuration Options

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-product-id` | Unique product identifier | `demo-product` |
| `data-brand-id` | Brand identifier | `demo-brand` |
| `data-clothing-type` | Type of clothing | `tshirt` |
| `data-license-key` | Your license key | `demo-license-key` |
| `data-button-text` | Button text | `Find Your Size` |
| `data-position` | Button position | `center` |
| `data-class-name` | CSS classes | `''` |
| `data-button-bg` | Button background | `undefined` |

## 🧪 Testing

Visit the [test page](https://shashank1623.github.io/yoursizer-widget-test/test-embed.html) to see the widget in action.

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build widget
npm run build:widget

# Start development server
npm run dev
```

## 📦 Build Output

- `dist/yoursizer-widget.umd.js` - UMD bundle for script tag usage
- `dist/yoursizer-widget.es.js` - ES module for modern bundlers

## 🔗 Integration Examples

### E-commerce Product Page
```html
<!DOCTYPE html>
<html>
<head>
    <title>Product Page</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://shashank1623.github.io/yoursizer-widget-test/yoursizer-widget.umd.js"></script>
</head>
<body>
    <div class="product-page">
        <h1>Premium T-Shirt</h1>
        <div 
            data-yoursizer
            data-product-id="premium-tshirt-001"
            data-brand-id="your-brand"
            data-clothing-type="tshirt"
            data-license-key="your-license-key"
        ></div>
    </div>
</body>
</html>
```

## 🎯 Features

- ✅ **3D Body Visualization** - Interactive 3D model with real-time morphing
- ✅ **AI Size Recommendation** - Advanced algorithms for accurate sizing
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Easy Integration** - Just include a script tag
- ✅ **Customizable UI** - Flexible styling and positioning options
- ✅ **Profile Management** - Save and reuse user measurements
- ✅ **Analytics Ready** - Built-in tracking and analytics

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Support

For support and questions, please contact [support@yoursizer.com](mailto:support@yoursizer.com)