export const DIFY_CONFIG = {
    API_BASE_URL: process.env.DIFY_API_BASE_URL || '',
    API_KEY: process.env.DIFY_API_KEY || '',
    DEFAULT_USER: 'lab4-demo-user',
}

export function validateDifyConfig() {
    if (!DIFY_CONFIG.API_KEY || !DIFY_CONFIG.API_BASE_URL) {
        throw new Error('Dify API configuration is missing (DIFY_API_BASE_URL or DIFY_API_KEY)')
    }
}
