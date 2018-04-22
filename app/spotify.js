// Get token from: https://beta.developer.spotify.com/documentation/web-playback-sdk/quick-start/
const SPOTIFY_TOKEN = "BQBWygevudZK5jql7keeOZgKCwU201VivLk01ineXhrt7hKCL3yITEvm8bvrA164xFpPr3McJj1Ckjj3ShhAQyAPue94w0LUNrK_7AKvh_2h_ndzWEHyvln_k037-svNs2L0YrdJF9pF11xZRPDOp20epTQnESyeIDQ";
function setUpPlayer() {
    const player = new Spotify.Player({
        name: 'Gesturify',
        getOAuthToken: cb => { cb(SPOTIFY_TOKEN); }
    });
    
    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });
    
    // Playback status updates
    player.addListener('player_state_changed', state => { console.log(state); });
    
    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
    });
    
    // Connect to the player!
    player.connect();

    return player;
}
