/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // ❌ Do not block production builds because of ESLint errors
        ignoreDuringBuilds: true,
    },
    typescript: {
        // ❌ Do not block builds if there are TypeScript errors
        ignoreBuildErrors: true,
    },
};

module.exports = nextConfig;
