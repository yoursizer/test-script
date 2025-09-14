# FindYourSizerWidget Customization Guide

A comprehensive guide to customizing the AI-powered size recommendation widget for your e-commerce store.

## 🎨 Design Examples & Code Snippets

### 1. **Minimalist Design**
Clean and simple with subtle animations.

```tsx
<FindYourSizerWidget 
  buttonText="Find My Size"
  position="center"
  className="w-full flex justify-center"
/>
```

**Visual**: Centered button with default animated gradient background, clean typography.

---

### 2. **Branded Gradient**
Custom gradient matching your brand colors.

```tsx
<FindYourSizerWidget 
  buttonText="Get Perfect Fit"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
/>
```

**Visual**: Purple-to-blue gradient background, white text, no animated border.

---

### 3. **Solid Brand Color**
Single color approach for brand consistency.

```tsx
<FindYourSizerWidget 
  buttonText="AI Size Finder"
  position="center"
  className="w-full flex justify-center"
  buttonBg="#10B981"
/>
```

**Visual**: Emerald green background, white text, clean and modern.

---

### 4. **Right-Aligned Professional**
Perfect for product pages with existing CTAs.

```tsx
<FindYourSizerWidget 
  buttonText="Size Me"
  position="right"
  className="w-full flex justify-end"
  buttonBg="#3B82F6"
/>
```

**Visual**: Right-aligned blue button, compact design.

---

### 5. **Full-Width Prominent**
High-visibility design for conversion optimization.

```tsx
<FindYourSizerWidget 
  buttonText="Find Your Perfect Size"
  position="center"
  className="w-full flex justify-center mb-6"
  buttonBg="linear-gradient(90deg, #FF6B6B 0%, #FF8E53 100%)"
/>
```

**Visual**: Full-width coral gradient, prominent placement.

---

### 6. **Elegant Dark Theme**
Sophisticated dark design for premium brands.

```tsx
<FindYourSizerWidget 
  buttonText="Discover Your Size"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(135deg, #2D3748 0%, #4A5568 100%)"
/>
```

**Visual**: Dark gradient with white text, elegant appearance.

---

### 7. **Vibrant E-commerce**
Eye-catching design for fashion stores.

```tsx
<FindYourSizerWidget 
  buttonText="✨ Smart Size Finder"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(45deg, #FF6B9D 0%, #C44569 50%, #F093FB 100%)"
/>
```

**Visual**: Pink-to-purple gradient with emoji, vibrant and playful.

---

### 8. **Minimalist Left-Aligned**
Clean design for sidebar or product details.

```tsx
<FindYourSizerWidget 
  buttonText="Size Guide"
  position="left"
  className="w-full flex justify-start"
/>
```

**Visual**: Left-aligned with default animated gradient, minimal approach.

---

### 9. **Premium Gold Accent**
Luxury brand styling.

```tsx
<FindYourSizerWidget 
  buttonText="Get Your Size"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
/>
```

**Visual**: Gold gradient, premium feel, dark text for contrast.

---

### 10. **Modern Tech Style**
Contemporary design for tech-forward brands.

```tsx
<FindYourSizerWidget 
  buttonText="AI Size Assistant"
  position="center"
  className="w-full flex justify-center"
  buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
/>
```

**Visual**: Multi-color gradient, modern tech aesthetic.

---

## 🎯 Positioning Strategies

### **Center (Default)**
```tsx
position="center"
className="w-full flex justify-center"
```
*Best for: Main product pages, hero sections*

### **Right-Aligned**
```tsx
position="right"
className="w-full flex justify-end"
```
*Best for: Product pages with existing CTAs, checkout flows*

### **Left-Aligned**
```tsx
position="left"
className="w-full flex justify-start"
```
*Best for: Sidebars, product details sections*

### **Full-Width**
```tsx
position="center"
className="w-full flex justify-center"
```
*Best for: High-conversion pages, standalone sections*

---

## 🌈 Color Palette Examples

### **E-commerce Blues**
```tsx
buttonBg="#3B82F6"  // Blue
buttonBg="#1E40AF"  // Dark Blue
buttonBg="#60A5FA"  // Light Blue
```

### **Fashion Pinks**
```tsx
buttonBg="#EC4899"  // Pink
buttonBg="#BE185D"  // Dark Pink
buttonBg="#F472B6"  // Light Pink
```

### **Luxury Golds**
```tsx
buttonBg="#FFD700"  // Gold
buttonBg="#FFA500"  // Orange
buttonBg="#DAA520"  // Goldenrod
```

### **Modern Greens**
```tsx
buttonBg="#10B981"  // Emerald
buttonBg="#059669"  // Dark Green
buttonBg="#34D399"  // Light Green
```

---

## 📱 Responsive Design Tips

### **Mobile-First Approach**
```tsx
<FindYourSizerWidget 
  buttonText="Find Size"
  position="center"
  className="w-full flex justify-center md:justify-start"
/>
```

### **Tablet Optimization**
```tsx
<FindYourSizerWidget 
  buttonText="Get My Size"
  position="center"
  className="w-full flex justify-center lg:w-auto lg:flex-none"
/>
```

---

## 🎨 Advanced Styling

### **Custom Border Radius**
```tsx
className="w-full flex justify-center [&_button]:rounded-lg"
```

### **Custom Shadows**
```tsx
className="w-full flex justify-center [&_button]:shadow-lg"
```

### **Hover Effects**
```tsx
className="w-full flex justify-center [&_button:hover]:scale-105"
```

---

## 🚀 Implementation Examples

### **Product Page Integration**
```tsx
<div className="product-details">
  <h1>Premium T-Shirt</h1>
  <p>$49.99</p>
  
  {/* Size Widget */}
  <FindYourSizerWidget 
    buttonText="Find My Perfect Fit"
    position="center"
    className="w-full flex justify-center my-6"
    buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  />
  
  <button className="add-to-cart">Add to Cart</button>
</div>
```

### **Checkout Page Integration**
```tsx
<div className="checkout-sidebar">
  <h3>Need Help with Sizing?</h3>
  
  <FindYourSizerWidget 
    buttonText="Size Assistant"
    position="center"
    className="w-full flex justify-center"
    buttonBg="#10B981"
  />
</div>
```

### **Landing Page Hero**
```tsx
<div className="hero-section">
  <h1>Find Your Perfect Size</h1>
  <p>AI-powered size recommendations</p>
  
  <FindYourSizerWidget 
    buttonText="Start Sizing"
    position="center"
    className="w-full flex justify-center"
    buttonBg="linear-gradient(45deg, #FF6B9D 0%, #C44569 100%)"
  />
</div>
```

---

## 📋 Best Practices

### **Button Text Guidelines**
- Keep it concise (2-4 words)
- Use action-oriented language
- Match your brand voice
- Consider user intent

### **Color Selection**
- Ensure sufficient contrast (WCAG compliant)
- Match your brand palette
- Consider cultural color meanings
- Test on different backgrounds

### **Positioning Strategy**
- Center: High visibility, main actions
- Right: Secondary actions, product pages
- Left: Supporting features, sidebars
- Full-width: Conversion optimization

### **Responsive Considerations**
- Test on mobile devices
- Ensure touch targets are adequate
- Consider loading states
- Optimize for different screen sizes

---

## 🔧 Troubleshooting

### **Common Issues**

**Button not visible?**
- Check `className` for conflicting styles
- Ensure container has proper width
- Verify `position` prop is correct

**Custom background not working?**
- Check CSS gradient syntax
- Ensure color values are valid
- Test with solid colors first

**Text not updating?**
- Verify `buttonText` prop is passed
- Check for JavaScript errors
- Ensure component is re-rendering

**Position not working?**
- Check parent container styles
- Verify flexbox classes
- Test with different `position` values

---

## 📞 Support

For additional customization needs or technical support, refer to the main README.md or contact the development team.

*Last updated: [Current Date]* 