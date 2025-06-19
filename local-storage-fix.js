// Temporary fix for VidShare without Supabase
// Add this to the top of your mobley/index.html file in a <script> tag

// Override the getDropboxToken function to use localStorage instead of Supabase
async function getDropboxToken() {
    // Try localStorage first
    let token = localStorage.getItem('vidshare_dropbox_token');
    
    if (!token) {
        // Prompt user to enter token manually
        token = prompt(`Supabase is not available. Please enter your Dropbox token:
        
1. Go to https://www.dropbox.com/developers/apps
2. Find your VidShare app
3. Generate a new Access Token
4. Paste it below:`);
        
        if (token && token.trim()) {
            // Save to localStorage
            localStorage.setItem('vidshare_dropbox_token', token.trim());
            console.log('✅ Dropbox token saved to localStorage');
        } else {
            throw new Error('No Dropbox token provided');
        }
    }
    
    return token;
}

// Override saveGalleryToSupabase to use localStorage
async function saveGalleryToSupabase(shortCode, folderUrl, config, name) {
    const gallery = {
        shortCode,
        folderUrl,
        config,
        name,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem(`vidshare_gallery_${shortCode}`, JSON.stringify(gallery));
    console.log('✅ Gallery saved to localStorage:', shortCode);
    
    return { shortCode };
}

// Override loadGalleriesFromSupabase to use localStorage
async function loadGalleriesFromSupabase() {
    const galleries = [];
    
    // Get all gallery keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vidshare_gallery_')) {
            try {
                const gallery = JSON.parse(localStorage.getItem(key));
                galleries.push({
                    short_code: gallery.shortCode,
                    name: gallery.name,
                    folder_url: gallery.folderUrl,
                    config: gallery.config,
                    created_at: gallery.createdAt
                });
            } catch (error) {
                console.warn('Failed to parse gallery from localStorage:', key);
            }
        }
    }
    
    console.log('✅ Loaded galleries from localStorage:', galleries.length);
    return galleries;
}

// Override deleteGalleryFromSupabase to use localStorage
async function deleteGalleryFromSupabase(shortCode) {
    localStorage.removeItem(`vidshare_gallery_${shortCode}`);
    console.log('✅ Gallery deleted from localStorage:', shortCode);
}

console.log('🔧 Local storage fallback loaded - VidShare will work without Supabase'); 