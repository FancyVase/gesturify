// Get token from: https://beta.developer.spotify.com/documentation/web-playback-sdk/quick-start/
const SPOTIFY_TOKEN = "BQCt9XoFDedbbI0tnHWePr2N-9lRPB_4gyGrLot2bQ0Y-kxA-oXhFE2PsLJga55CTZ40f4VtLTDfuDlxWP5CvaXD432js_Pc2pWNYsNfuKp7dsjsyCfBrVPckNq4mhsNdrATyJufCQPfjIHZb-EEli_aOhGgYvUfwa-QEA";

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