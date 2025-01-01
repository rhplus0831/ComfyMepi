// @ts-check
const {PHASE_DEVELOPMENT_SERVER} = require('next/constants')
module.exports = (phase, {defaultConfig}) => {
    const isDev = phase === PHASE_DEVELOPMENT_SERVER

    /**
     * @type {import('next').NextConfig}
     */
    const nextConfig = {
        output: "export",
        assetPrefix: isDev ? undefined : '/mepi'
    };

    return nextConfig
}