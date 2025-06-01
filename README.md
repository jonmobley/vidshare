# VidShare 🎬

Transform your Dropbox video folders into beautiful, shareable galleries with custom short URLs.

## ✨ Features

- **🔗 Short URLs**: Create memorable links like `/g/my-videos` for easy sharing
- **📱 Mobile Responsive**: Beautiful galleries that work on any device
- **🎯 Smart Navigation**: Automatic folder organization with navigation pills
- **⚡ Fast Loading**: Lazy-loaded thumbnails and optimized video streaming
- **🔒 Secure**: No API keys exposed - all credentials stored securely
- **📊 Analytics**: Track which videos have been watched
- **⚙️ Configurable**: Control downloads and sharing permissions per gallery
- **🔄 Real-time Sync**: Changes to your Dropbox folder automatically reflect in the gallery

## 🚀 Quick Start

### Option 1: Deploy to Netlify (Recommended)

1. **Fork this repository**
2. **Deploy to Netlify**:
   - Connect your GitHub account to Netlify
   - Select your forked repository
   - Deploy with default settings
3. **Set up Supabase** (see [Database Setup](#database-setup))
4. **Configure Dropbox** (see [Dropbox Setup](#dropbox-setup))
5. **Start creating galleries!**

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/vidshare.git
cd vidshare

# Serve locally (Python example)
python -m http.server 8000

# Or with Node.js
npx serve .

# Open http://localhost:8000
```

## 🛠️ Setup Guide

### Database Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Create the galleries table**:
```sql
CREATE TABLE galleries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    folder_url TEXT NOT NULL,
    name VARCHAR(255),
    config JSONB DEFAULT '{}',
    video_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_galleries_short_code ON galleries(short_code);
```

3. **Create the config table**:
```sql
CREATE TABLE config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. **Create the RPC functions**:
```sql
-- Function to save galleries
CREATE OR REPLACE FUNCTION save_gallery(
    p_short_code VARCHAR(50),
    p_folder_url TEXT,
    p_config JSONB DEFAULT '{}',
    p_name VARCHAR(255) DEFAULT NULL,
    p_video_count INTEGER DEFAULT 0
) RETURNS TEXT AS $$
BEGIN
    INSERT INTO galleries (short_code, folder_url, name, config, video_count)
    VALUES (p_short_code, p_folder_url, p_name, p_config, p_video_count)
    ON CONFLICT (short_code) 
    DO UPDATE SET 
        folder_url = EXCLUDED.folder_url,
        name = EXCLUDED.name,
        config = EXCLUDED.config,
        video_count = EXCLUDED.video_count;
    
    RETURN p_short_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get config values
CREATE OR REPLACE FUNCTION get_config(config_key VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
    config_value TEXT;
BEGIN
    SELECT value INTO config_value FROM config WHERE key = config_key;
    RETURN config_value;
END;
$$ LANGUAGE plpgsql;
```

5. **Update your configuration**:
   - Copy your Supabase URL and anon key
   - Update the constants in `mobley/index.html` and `gallery/index.html`:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### Dropbox Setup

1. **Create a Dropbox App**:
   - Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
   - Create a new app with "Scoped access" and "Full Dropbox" access
   - Note your App Key

2. **Generate an Access Token**:
   - In your app settings, scroll to "OAuth 2"
   - Click "Generate" under "Generated access token"
   - Copy the entire token (starts with `sl.`)

3. **Store the token securely**:
```sql
INSERT INTO config (key, value) 
VALUES ('dropbox_token', 'your-dropbox-token-here');
```

4. **Set permissions** (in Dropbox app settings):
   - `files.metadata.read`
   - `files.content.read` 
   - `sharing.read`

## 📖 Usage

### Creating a Gallery

1. Go to your admin panel at `/mobley`
2. Paste a Dropbox folder share URL
3. Wait for automatic folder scanning
4. Configure gallery settings:
   - Gallery name
   - Custom short URL (optional)
   - Download permissions
   - Sharing permissions
5. Click "Create Gallery"
6. Share your gallery URL!

### Sharing Videos

Share your gallery URL in the format:
```
https://yourdomain.com/g/your-short-code
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │  Video Gallery  │    │   Supabase DB   │
│   /mobley/      │◄──►│   /gallery/     │◄──►│   (Secure)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Dropbox API   │
                    │   (Videos)      │
                    └─────────────────┘
```

## 🔧 Configuration Options

### Gallery Settings

- **Allow Downloads**: Users can download individual videos
- **Allow Sharing**: Users can open videos in new windows
- **Custom URLs**: Create branded short links

### Supported Video Formats

- MP4, MOV, AVI, MKV, WebM, M4V, WMV, FLV

## 🛠️ Development Tools

### Debug & Testing Tools

- **Token Debug**: `/support/token/` - Validate Dropbox tokens
- **Folder Scanner**: `/support/scan/scan.html` - Test folder compatibility
- **Demo Gallery**: `/gallery/demo.html` - Preview with sample videos

### Local Development

```bash
# Install a local server
npm install -g serve

# Serve the project
serve .

# Access admin panel
open http://localhost:3000/mobley
```

## 🚀 Deployment

### Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Build settings:
   - Build command: (none)
   - Publish directory: `.`
3. The `netlify.toml` file handles redirects automatically

### Other Platforms

The project is static HTML/CSS/JS and can be deployed to:
- Vercel
- GitHub Pages
- Any static hosting service

**Note**: Make sure your hosting supports redirects/rewrites for the short URL functionality.

## 🔒 Security

- ✅ No API keys exposed to client-side
- ✅ Dropbox tokens stored securely in Supabase
- ✅ Gallery URLs are not guessable
- ✅ No sensitive data in localStorage
- ✅ CORS-safe API requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Dropbox API** for seamless file access
- **Supabase** for secure backend services
- **Netlify** for hosting and redirects
- Sample videos from [Google's Video Test Suite](https://goo.gl/MkMJPs)

## 🐛 Issues & Support

Found a bug or need help? Please [open an issue](https://github.com/yourusername/vidshare/issues) with:
- Detailed description
- Steps to reproduce
- Browser/device information
- Screenshots (if applicable)

---

**Made with ❤️ for easy video sharing**
