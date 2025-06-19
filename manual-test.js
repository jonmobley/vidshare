// Manual Dropbox Test - Paste this into your browser console
// Go to http://localhost:8000/mobley/ and paste this in the console

async function manualDropboxTest() {
    console.log('🔍 Starting manual Dropbox test...');
    
    const SUPABASE_URL = 'https://gnfxpqlfqjxtuthoplpx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZnhwcWxmcWp4dHV0aG9wbHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MzYxODgsImV4cCI6MjA2NDMxMjE4OH0.ymqy7Igd530LuJvj-u_SU_1iGJBTLZAig1vAYmDPX20';
    
    try {
        // Step 1: Test Supabase
        console.log('Step 1: Testing Supabase connection...');
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                config_key: 'dropbox_token'
            })
        });
        
        console.log('Supabase response status:', response.status);
        
        if (!response.ok) {
            console.error('❌ Supabase failed:', response.status, await response.text());
            return;
        }
        
        const token = await response.text();
        const cleanToken = token.replace(/^"|"$/g, '');
        console.log('✅ Supabase working! Token length:', cleanToken.length);
        
        if (!cleanToken || cleanToken === 'null') {
            console.error('❌ No Dropbox token found in Supabase!');
            console.log('🔧 Solution: Use add_dropbox_token.html to add your token');
            return;
        }
        
        // Step 2: Test Dropbox token
        console.log('Step 2: Testing Dropbox token...');
        const dropboxResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanToken}`
            }
        });
        
        console.log('Dropbox response status:', dropboxResponse.status);
        
        if (!dropboxResponse.ok) {
            console.error('❌ Dropbox token failed:', dropboxResponse.status, await dropboxResponse.text());
            console.log('🔧 Solution: Get a fresh token from Dropbox App Console');
            return;
        }
        
        const userData = await dropboxResponse.json();
        console.log('✅ Dropbox token working!');
        console.log('Account:', userData.name?.display_name);
        
        // Step 3: Test folder access
        console.log('Step 3: Testing folder access...');
        const testUrl = 'https://www.dropbox.com/scl/fo/gb50nb8pi109aowl70ja6/AAX1ksJ5Z9kRw5gL5kyWIV8?rlkey=oy1lx4vp9aeigxxzfpd7reihp&st=8vio47mh&dl=0';
        
        const metadataResponse = await fetch('https://api.dropboxapi.com/2/sharing/get_shared_link_metadata', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: testUrl
            })
        });
        
        console.log('Folder metadata response status:', metadataResponse.status);
        
        if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            console.log('✅ Folder access working!');
            console.log('Sample folder:', metadata.name);
            console.log('🎉 ALL TESTS PASSED! The issue is likely with your specific folder URL.');
        } else {
            console.error('❌ Folder access failed:', metadataResponse.status, await metadataResponse.text());
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
manualDropboxTest(); 