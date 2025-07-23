/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // APIs Supabase: NetworkFirst con TTL corto para datos frescos
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60, // 1 minuto - datos muy frescos
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // APIs Supabase Auth: NetworkFirst con cache más largo
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/v1\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-auth-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 300, // 5 minutos
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // APIs locales: NetworkOnly (nunca cachear)
    {
      urlPattern: /^https?:\/\/localhost:3000\/api\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkOnly',
    },
    // Páginas dinámicas: NetworkFirst con timeout
    {
      urlPattern: /\/_next\/data\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 300, // 5 minutos
        },
      },
    },
    // Assets estáticos: CacheFirst (rendimiento)
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    // JS/CSS estáticos: CacheFirst
    {
      urlPattern: /\.(?:js|css|woff2?|ttf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
        },
      },
    },
    // Páginas HTML: NetworkFirst para contenido dinámico
    {
      urlPattern: /\.(?:html)$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'html-cache',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 300, // 5 minutos
        },
      },
    },
  ],
})

const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = withPWA(nextConfig)