/*import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
/*};

export default nextConfig;*/

/** @type {import('next').NextStyle}.NextConfig */
const nextConfig = {
  allowedDevOrigins: ['192.168.1.136', 'localhost:3000'],
};

module.exports = nextConfig;
