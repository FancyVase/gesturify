// Constants
const MS_TO_S = 1000;
const GESTURE_DELAY = 2 * MS_TO_S;
const SEEK_TIME = 10 * MS_TO_S;
const SELECT_PLAYLIST_DELAY = 2 * MS_TO_S;
const VOLUME_MAX_POS = -200;
const VOLUME_MIN_POS = 400;

// Spotify States/ Types
const SPOTIFY_TYPE = { ALBUM: 'album', ARTIST: 'artist', PLAYLIST: 'playlist', TRACK: 'track' };
const REPEAT_STATE = { TRACK: 'track', CONTEXT: 'context', OFF: 'off' };
const SHUFFLE_STATE = { ON: true, OFF: false };

// Selectors
const TEXT_SELECTOR = '#gesture-text';
const SIDEBAR_SELECTOR = 'div#sidebar';
const MENU_SELECTOR = '.menu.listings';
const PLAYLIST_ITEM_SELECTOR = '.playlist-item';
const CURSOR_SELECTOR = '.circle.icon';
const SONG_TEXT_SELECTOR = '#song-title';
const ARTIST_TEXT_SELECTOR = '#artist';
const PLAYLIST_TEMPLATE = '#playlist-template';

