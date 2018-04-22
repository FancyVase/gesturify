// Get token from: https://beta.developer.spotify.com/documentation/web-playback-sdk/quick-start/
const SPOTIFY_TOKEN = "BQBfRXTMCYtO0iZGY2yrN91MPFozzRj_sUn0uqSkhpHhL6EH5BENQFa302Ut5kRnm_HJ0kgShgH_aRUfMMYH-c7mmodVy6tUG3cYUladgDybFPiQrgldQESP9Em87NYlrWyRE2FUoSpmwAopGqblXssKGEuxSt3L_VU";
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
