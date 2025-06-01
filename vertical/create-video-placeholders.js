// create-video-placeholders.js - Run this to create video placeholder files

const fs = require('fs');
const path = require('path');

// Ensure directories exist
const videoDirs = [
    'videos',
    'videos/categories',
    'videos/categories/foryou',
    'videos/categories/gaming',
    'videos/categories/music'
];

videoDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Video placeholder template
const createVideoPlaceholder = (category, index, title, description) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
        }
        .video-placeholder {
            text-align: center;
            padding: 20px;
        }
        .play-button {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .play-button:hover {
            transform: scale(1.1);
            background: rgba(255,255,255,0.3);
        }
        .play-icon {
            width: 0;
            height: 0;
            border-left: 25px solid white;
            border-top: 15px solid transparent;
            border-bottom: 15px solid transparent;
            margin-left: 5px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .metadata {
            font-size: 0.9rem;
            opacity: 0.7;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="video-placeholder">
        <div class="play-button">
            <div class="play-icon"></div>
        </div>
        <h1>${title}</h1>
        <p>${description}</p>
        <div class="metadata">
            <div>Category: ${category}</div>
            <div>Video ID: ${category}-${index}</div>
            <div>Duration: 0:15</div>
        </div>
    </div>
</body>
</html>`;
};

// Create placeholder videos for each category
const categories = {
    foryou: [
        { title: "Trending Now", description: "The most popular content curated just for you" },
        { title: "Viral Moments", description: "What everyone is talking about" },
        { title: "Discover", description: "Fresh content tailored to your interests" },
        { title: "Recommended", description: "Based on your viewing history" },
        { title: "Creator Spotlight", description: "Featured content from top creators" },
        { title: "Weekly Highlights", description: "Best of the week" },
        { title: "Rising Stars", description: "New creators to watch" },
        { title: "Community Picks", description: "Chosen by the community" }
    ],
    gaming: [
        { title: "Epic Wins", description: "Watch the most incredible gaming moments" },
        { title: "Pro Tips", description: "Learn from the best players in the game" },
        { title: "Reviews", description: "Discover your next favorite game" },
        { title: "Esports", description: "Professional gaming at its finest" },
        { title: "Speedruns", description: "Record-breaking game completions" },
        { title: "Indie Gems", description: "Hidden treasures from indie developers" },
        { title: "Retro Gaming", description: "Classic games never die" },
        { title: "Game Updates", description: "Latest patches and DLC news" },
        { title: "Tournament Highlights", description: "Best moments from recent tournaments" },
        { title: "Gaming Setup Tours", description: "See the best gaming battlestations" },
        { title: "Let's Play", description: "Full gameplay walkthroughs" },
        { title: "Gaming News", description: "Stay updated with the latest" }
    ],
    music: [
        { title: "Chart Toppers", description: "The biggest hits of the moment" },
        { title: "Live Sessions", description: "Intimate performances from your favorite artists" },
        { title: "Covers & Remixes", description: "Creative takes on your favorite songs" },
        { title: "New Artists", description: "Discover the next big thing" },
        { title: "Concert Highlights", description: "Best moments from live shows" },
        { title: "Behind the Music", description: "Stories behind the songs" },
        { title: "Music Production", description: "Learn how hits are made" }
    ]
};

// Generate video files
Object.entries(categories).forEach(([category, videos]) => {
    videos.forEach((video, index) => {
        const filename = `videos/categories/${category}/video-${index + 1}.html`;
        const content = createVideoPlaceholder(category, index + 1, video.title, video.description);
        
        fs.writeFileSync(filename, content);
        console.log(`Created video placeholder: ${filename}`);
    });
});

// Create a sample MP4 placeholder (text file explaining it would be a video)
const mp4Placeholder = `This is a placeholder for actual video content.

In a real implementation, this would be:
- video-1.mp4
- video-2.mp4
- etc.

The video files would contain:
- Actual video content
- Audio tracks
- Metadata

For demo purposes, we're using HTML placeholders that simulate video content.`;

// Create MP4 placeholder info files
Object.keys(categories).forEach(category => {
    const infoFile = `videos/categories/${category}/README.txt`;
    fs.writeFileSync(infoFile, mp4Placeholder);
    console.log(`Created info file: ${infoFile}`);
});

console.log('\nVideo placeholder structure created successfully!');
console.log('\nStructure:');
console.log(`
videos/
└── categories/
    ├── foryou/
    │   ├── video-1.html
    │   ├── video-2.html
    │   ├── ... (8 videos)
    │   └── README.txt
    ├── gaming/
    │   ├── video-1.html
    │   ├── video-2.html
    │   ├── ... (12 videos)
    │   └── README.txt
    └── music/
        ├── video-1.html
        ├── video-2.html
        ├── ... (7 videos)
        └── README.txt
`);

// Also update the videoData.js to reference these files
const videoDataWithPaths = `// js/data/videoData.js - Video data with file paths

const videoData = {
    0: [ // For You category
        ${categories.foryou.map((v, i) => `{ 
            title: "${v.title}", 
            description: "${v.description}", 
            id: "foryou-${i + 1}",
            path: "videos/categories/foryou/video-${i + 1}.html"
        }`).join(',\n        ')}
    ],
    1: [ // Gaming category
        ${categories.gaming.map((v, i) => `{ 
            title: "${v.title}", 
            description: "${v.description}", 
            id: "gaming-${i + 1}",
            path: "videos/categories/gaming/video-${i + 1}.html"
        }`).join(',\n        ')}
    ],
    2: [ // Music category
        ${categories.music.map((v, i) => `{ 
            title: "${v.title}", 
            description: "${v.description}", 
            id: "music-${i + 1}",
            path: "videos/categories/music/video-${i + 1}.html"
        }`).join(',\n        ')}
    ]
};`;

// Write updated videoData.js
fs.writeFileSync('js/data/videoData.js', videoDataWithPaths);
console.log('\nUpdated js/data/videoData.js with video paths');