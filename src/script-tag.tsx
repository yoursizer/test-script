import { FindYourSizerWidget } from './widget-plugin/widget'
import './index.css'

// Get React and ReactDOM from global scope for UMD builds
// This ensures we use the globally loaded React/ReactDOM instead of bundled versions
const GlobalReact = (window as any).React
const GlobalReactDOM = (window as any).ReactDOM

// Ensure React and ReactDOM are available
if (!GlobalReact) {
  throw new Error('React must be loaded globally before this script. Please include React 18 via script tag.')
}
if (!GlobalReactDOM) {
  throw new Error('ReactDOM must be loaded globally before this script. Please include ReactDOM 18 via script tag.')
}

// Global interface for the widget API
interface WidgetOptions {
  container: HTMLElement
  buttonText?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  className?: string
  buttonBg?: string
  licenseKey?: string
  onSizeRecommended?: (size: string) => void
  productId?: string
  brandId?: string
  clothingType?: string
}

interface WidgetInstance {
  destroy: () => void
  update: (options: Partial<WidgetOptions>) => void
}

// Global widget class
class YoursizerWidget {
  private root: any = null
  private container: HTMLElement | null = null
  private options: WidgetOptions

  constructor() {
    this.options = {} as WidgetOptions
  }

  create(options: WidgetOptions): WidgetInstance {
    this.container = options.container
    this.options = options
    
    // Clear the container
    this.container.innerHTML = ''
    
    // Double-check React and ReactDOM are available
    if (!GlobalReact || !GlobalReactDOM) {
      throw new Error('React and ReactDOM must be loaded before initializing the widget. Please ensure React 18 is loaded via script tags.')
    }
    
    console.log('GlobalReact:', GlobalReact);
    console.log('GlobalReactDOM:', GlobalReactDOM);
    console.log('GlobalReactDOM.createRoot:', GlobalReactDOM.createRoot);
    
    try {
      // Create React root and render using global React/ReactDOM
      if (GlobalReactDOM.createRoot) {
        // React 18+ with createRoot
        console.log('Using React 18 createRoot');
        this.root = GlobalReactDOM.createRoot(this.container)
        this.root.render(
          GlobalReact.createElement(FindYourSizerWidget, {
            buttonText: options.buttonText,
            position: options.position,
            className: options.className,
            buttonBg: options.buttonBg,
            licenseKey: options.licenseKey,
            onSizeRecommended: options.onSizeRecommended,
            productId: options.productId,
            brandId: options.brandId,
            clothingType: options.clothingType
          })
        )
      } else {
        // Fallback for older React versions
        console.log('Using React legacy render');
        GlobalReactDOM.render(
          GlobalReact.createElement(FindYourSizerWidget, {
            buttonText: options.buttonText,
            position: options.position,
            className: options.className,
            buttonBg: options.buttonBg,
            licenseKey: options.licenseKey,
            onSizeRecommended: options.onSizeRecommended,
            productId: options.productId,
            brandId: options.brandId,
            clothingType: options.clothingType
          }),
          this.container
        )
      }
    } catch (error) {
      console.error('Error creating React root:', error);
      throw error;
    }

    return {
      destroy: () => this.destroy(),
      update: (newOptions) => this.update(newOptions)
    }
  }

  private destroy() {
    if (this.root) {
      if (this.root.unmount) {
        // React 18+ with createRoot
        this.root.unmount()
      } else {
        // Fallback for older React versions
        GlobalReactDOM.unmountComponentAtNode(this.container!)
      }
      this.root = null
    }
    if (this.container) {
      this.container.innerHTML = ''
      this.container = null
    }
  }

  private update(newOptions: Partial<WidgetOptions>) {
    if (this.container) {
      const updatedOptions = { ...this.options, ...newOptions }
      this.options = updatedOptions
      
      if (this.root && this.root.render) {
        // React 18+ with createRoot
        this.root.render(
          GlobalReact.createElement(FindYourSizerWidget, {
            buttonText: updatedOptions.buttonText,
            position: updatedOptions.position,
            className: updatedOptions.className,
            buttonBg: updatedOptions.buttonBg,
            licenseKey: updatedOptions.licenseKey,
            onSizeRecommended: updatedOptions.onSizeRecommended,
            productId: updatedOptions.productId,
            brandId: updatedOptions.brandId,
            clothingType: updatedOptions.clothingType
          })
        )
      } else {
        // Fallback for older React versions
        GlobalReactDOM.render(
          GlobalReact.createElement(FindYourSizerWidget, {
            buttonText: updatedOptions.buttonText,
            position: updatedOptions.position,
            className: updatedOptions.className,
            buttonBg: updatedOptions.buttonBg,
            licenseKey: updatedOptions.licenseKey,
            onSizeRecommended: updatedOptions.onSizeRecommended,
            productId: updatedOptions.productId,
            brandId: updatedOptions.brandId,
            clothingType: updatedOptions.clothingType
          }),
          this.container
        )
      }
    }
  }
}

// Create global instance
const widgetInstance = new YoursizerWidget()

// Expose global API
declare global {
  interface Window {
    FindYourSizerWidget: {
      create: (options: WidgetOptions) => WidgetInstance
    }
  }
}

// Set global API
;(window as any).FindYourSizerWidget = {
  create: (options: WidgetOptions) => widgetInstance.create(options)
}

// Also set the SimpleYourSizerWidget for backward compatibility
;(window as any).SimpleYourSizerWidget = {
  create: (options: WidgetOptions) => widgetInstance.create(options)
}

// Export for module systems
export { YoursizerWidget }
export default (window as any).FindYourSizerWidget
