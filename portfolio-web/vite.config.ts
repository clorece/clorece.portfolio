import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Matches your exact repository name clorece.portfolio
  base: '/clorece.portfolio/', 
})
