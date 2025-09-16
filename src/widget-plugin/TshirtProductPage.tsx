import React, { useState } from 'react'
import { motion } from "framer-motion"
import { FindYourSizerWidget } from './widget'

export function TshirtProductPage() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  const handleSizeRecommended = (size: string) => {
    console.log('📦 TshirtProductPage: Size recommended:', size)
    console.log('🔧 Props passed to widget:', { productId: "tshirt-classic-001", brandId: "demo-store", clothingType: "tshirt" })
    setSelectedSize(size)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <img 
              src="https://via.placeholder.com/600x600/4F46E5/white?text=T-Shirt" 
              alt="T-Shirt" 
              className="w-full rounded-lg"
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Classic T-Shirt</h1>
              <p className="text-2xl font-semibold text-gray-900 mt-2">$29.99</p>
            </div>
            
            <p className="text-gray-600">
              Premium cotton t-shirt with a comfortable fit. Perfect for everyday wear.
            </p>
            
            <div className="space-y-4">
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
              
              {/* Find Your Size Widget with customization */}
              <FindYourSizerWidget 
                buttonText="Demo Store Yoursizer"
                position="center"
                className="w-full flex"
                // buttonBg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                licenseKey="7b2e2a34-07f7-4798-8a6f-f9b6ed0365c5"
                onSizeRecommended={handleSizeRecommended}
                productId="yoursizer_upperwear_001"
                brandId="yoursizer"
                clothingType="Shirts"
              />
              
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