import React from 'react'
import { createRoot } from 'react-dom/client'
import { FindYourSizerWidget } from './widget'

// Global YourSizer interface
interface YourSizerConfig {
  merchantId?: string
  productId?: string
  brandId?: string
  clothingType?: string
  licenseKey?: string
  buttonText?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  className?: string
  buttonBg?: string
  onSizeRecommended?: (size: string) => void
  rootSelector?: string
}

// Global YourSizer object
declare global {
  interface Window {
    YourSizer: {
      init: (config: YourSizerConfig) => void
      mount: (selector: string, config: YourSizerConfig) => void
      version: string
    }
  }
}

class YourSizerManager {
  private instances: Map<string, any> = new Map()
  private version = '1.0.0'

  init(config: YourSizerConfig) {
    console.log('🚀 YourSizer: Initializing with config:', config)
    
    // Default configuration
    const defaultConfig: YourSizerConfig = {
      merchantId: 'demo-merchant',
      productId: 'demo-product',
      brandId: 'demo-brand',
      clothingType: 'tshirt',
      licenseKey: 'demo-license-key',
      buttonText: 'Find Your Size',
      position: 'center',
      className: '',
      rootSelector: '[data-yoursizer]'
    }

    const finalConfig = { ...defaultConfig, ...config }
    
    // Auto-mount if rootSelector is provided
    if (finalConfig.rootSelector) {
      this.mount(finalConfig.rootSelector, finalConfig)
    }
  }

  mount(selector: string, config: YourSizerConfig) {
    console.log('🎯 YourSizer: Mounting to selector:', selector)
    
    const elements = document.querySelectorAll(selector)
    
    if (elements.length === 0) {
      console.warn('⚠️ YourSizer: No elements found with selector:', selector)
      return
    }

    elements.forEach((element, index) => {
      const instanceId = `${selector}-${index}`
      
      // Check if already mounted
      if (this.instances.has(instanceId)) {
        console.log('🔄 YourSizer: Already mounted, skipping:', instanceId)
        return
      }

      // Create React root and mount widget
      const root = createRoot(element as HTMLElement)
      
      // Extract data attributes from element
      const dataConfig = this.extractDataAttributes(element as HTMLElement)
      const finalConfig = { ...config, ...dataConfig }

      root.render(
        React.createElement(FindYourSizerWidget, {
          buttonText: finalConfig.buttonText,
          position: finalConfig.position,
          className: finalConfig.className,
          buttonBg: finalConfig.buttonBg,
          licenseKey: finalConfig.licenseKey,
          onSizeRecommended: finalConfig.onSizeRecommended,
          productId: finalConfig.productId,
          brandId: finalConfig.brandId,
          clothingType: finalConfig.clothingType
        })
      )

      this.instances.set(instanceId, root)
      console.log('✅ YourSizer: Successfully mounted to:', instanceId)
    })
  }

  private extractDataAttributes(element: HTMLElement): Partial<YourSizerConfig> {
    const config: Partial<YourSizerConfig> = {}
    
    // Extract data attributes
    if (element.dataset.productId) config.productId = element.dataset.productId
    if (element.dataset.brandId) config.brandId = element.dataset.brandId
    if (element.dataset.clothingType) config.clothingType = element.dataset.clothingType
    if (element.dataset.licenseKey) config.licenseKey = element.dataset.licenseKey
    if (element.dataset.buttonText) config.buttonText = element.dataset.buttonText
    if (element.dataset.position) config.position = element.dataset.position as any
    if (element.dataset.className) config.className = element.dataset.className
    if (element.dataset.buttonBg) config.buttonBg = element.dataset.buttonBg

    return config
  }

  getVersion() {
    return this.version
  }
}

// Create global instance
const yourSizerManager = new YourSizerManager()

// Expose to global scope
window.YourSizer = {
  init: (config: YourSizerConfig) => yourSizerManager.init(config),
  mount: (selector: string, config: YourSizerConfig) => yourSizerManager.mount(selector, config),
  version: yourSizerManager.getVersion()
}

// Auto-initialize if DOM is ready
function autoInitialize() {
  console.log('📄 YourSizer: Auto-initializing...')
  // Auto-mount elements with data-yoursizer attribute
  const autoElements = document.querySelectorAll('[data-yoursizer]')
  if (autoElements.length > 0) {
    yourSizerManager.init({})
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitialize)
} else {
  // DOM already ready, but wait a bit for other scripts to load
  setTimeout(autoInitialize, 100)
}

// Export for module systems
export default window.YourSizer
