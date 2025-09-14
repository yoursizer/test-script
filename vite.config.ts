import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  if (mode === 'widget') {
    // Build for widget (UMD library)
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: 'src/script-tag.tsx',
          name: 'YourSizer',
          fileName: (format) => `yoursizer-widget.${format}.js`,
          formats: ['umd', 'es']
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM'
            }
          }
        }
      }
    }
  } else {
    // Default build (demo app)
    return {
      plugins: [react()],
      build: {
        outDir: 'dist-demo',
        rollupOptions: {
          input: {
            main: 'index.html'
          }
        }
      }
    }
  }
})