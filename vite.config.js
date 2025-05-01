import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '127.0.0.1',
        port: 3000,
        proxy: {
            '/api': 'https://my-react-7dedd.web.app/'
        }
    }
})