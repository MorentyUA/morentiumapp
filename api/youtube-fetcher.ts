export const YOUTUBE_API_KEYS = [
    process.env.YOUTUBE_API_KEY || "AIzaSyCyKZ9GPZqfALXnHfJRZZZ3qOQzHSX51c4",
    "AIzaSyBjxnJ8k9BEq_swWGboAtaepgNIRlJoDM8",
    "AIzaSyA4jWPpuivAbx4lDPEjESDuVrrpld07G44"
];

let globalKeyIndex = 0;

export async function fetchWithRotation(originalUrl: string, init?: RequestInit): Promise<Response> {
    let attempts = 0;
    let lastResponse: Response | null = null;
    
    // We only rotate keys for Google/YouTube APIs
    if (!originalUrl.includes('googleapis.com')) {
        return globalThis.fetch(originalUrl, init); // pass-through
    }

    while (attempts < YOUTUBE_API_KEYS.length) {
        const currentKey = YOUTUBE_API_KEYS[globalKeyIndex];
        
        // Find existing key parameter and replace it
        // Or append one if it doesn't exist? (The endpoints already append one, so we just replace)
        let urlWithRotatedKey = originalUrl.replace(/((\\?|&)key=)([^&]+)/, `$1${currentKey}`);

        const response = await globalThis.fetch(urlWithRotatedKey, init);
        lastResponse = response;
        
        // Clone the response so we can read JSON without exhausting the body stream
        const clonedResponse = response.clone();
        try {
            const data = await clonedResponse.json();
            if (data && data.error && data.error.errors) {
                const isQuotaError = data.error.errors.some((e: any) => e.reason === 'quotaExceeded' || e.domain === 'youtube.quota');
                const isAuthError = response.status === 403 || response.status === 401;
                
                if (isQuotaError || (isAuthError && (data.error.message.includes('has not been used') || data.error.message.includes('suspended') || data.error.message.includes('API key not valid')))) {
                    console.warn(`[API Rotation] Key index ${globalKeyIndex} failed (Quota/Auth). Rotating to next key.`);
                    globalKeyIndex = (globalKeyIndex + 1) % YOUTUBE_API_KEYS.length;
                    attempts++;
                    continue; // Try again loop
                }
            }
        } catch(e) {
            // Not JSON or other parsing error, just break and return response
        }

        // Return the valid response immediately
        return response;
    }
    
    // Fallback if all keys fail - return the last fetched response
    console.error(`[API Rotation] Exhausted all ${YOUTUBE_API_KEYS.length} keys.`);
    return lastResponse || globalThis.fetch(originalUrl, init);
}
