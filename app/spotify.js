// Get token from: https://beta.developer.spotify.com/documentation/web-playback-sdk/quick-start/
const SPOTIFY_TOKEN = "BQAU_8xSP6248GCJNvNnIUZIOydStLxEGfYMAdwc7kjab6_KYOXVALoE328kLuTumcdNMKyhBTYyM5mgByCkEeOL7LHIebdePZ_k-dcYSn5bmJjx1wwPot4BbemHFit1uwQMh0wuy0cJd676B9JPWxCuWUgRBMH7K9E";

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
