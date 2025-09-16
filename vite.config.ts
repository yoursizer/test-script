import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({})
  },
  build: {
    minify: true,
    lib: {
      entry: './src/script-tag.tsx',
      name: 'FindYourSizerWidget',
      formats: ['umd'],
      fileName: (format) => `yoursizer-widget.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOM'
        },
        // Ensure proper UMD format for React compatibility
        format: 'umd',
        name: 'FindYourSizerWidget',
        // Add proper exports for UMD
        exports: 'named'
      }
    },
    cssCodeSplit: false,
    outDir: 'dist',
    // Ensure proper sourcemap generation for debugging
    sourcemap: false
  }
})