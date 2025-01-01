export type SiteConfig = typeof siteConfig;

export const siteConfig = {
    name: "Comfy Mepi",
    description: "Another mobile frontend for ComfyUI",
};

export function getAPIServer() {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        return 'http://127.0.0.1:8188/'
    } else {
        return '/'
    }
}