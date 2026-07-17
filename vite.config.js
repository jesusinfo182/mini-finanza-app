import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: base must match your GitHub repo name exactly, with slashes,
// so assets load correctly when published at https://<user>.github.io/<repo>/
export default defineConfig({
  plugins: [react()],
  base: '/mini-finanza-app/',
})
