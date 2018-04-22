// Get token from: https://beta.developer.spotify.com/documentation/web-playback-sdk/quick-start/
const SPOTIFY_TOKEN = "BQCiggQ55xCTJBZuMjfYuJbl9bqDJnJEiXo78eJRQAUVeTaHTj_1C2Bhfd6DgL5T-8bBk992tIR40CglUdNZhRWgr9lQTYnjrrUQFx0XkPWKt7rsdlTap7ioqmiAZ5gW-CWuuxUj0-hoKXtBhB0TpbxwAqIvntGbD9I";
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