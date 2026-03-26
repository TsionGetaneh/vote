/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: '0x9ccF3d67acECa28D898B346FCd3DABF24ec1A442',
    NEXT_PUBLIC_API_URL: 'http://localhost:5000',
  },
};

module.exports = nextConfig;