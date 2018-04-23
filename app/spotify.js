// Get token from: https://beta.developer.spotify.com/documentation/web-playback-sdk/quick-start/
const SPOTIFY_TOKEN = "BQCQs3tPIFei8pAkDd6N1mXfPtSECcYkgwOiGCXdQdRb8krKYF54FMBs6n26cHxDLTxWo86De1lBUNjkPNr9j07xrqh71yvwU0PI5SHqda9ZtYKTJ542J2hR2YjYr8HEY0aJG5QtL0gamSEQjPzDROsTZzZNdzWG7zo";
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