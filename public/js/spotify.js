/**
 * Controls Spotify user's playback
 * Reference: https://beta.developer.spotify.com/documentation/web-api/reference/,
 *            https://github.com/spotify/web-api-auth-examples
 * For more info about Spotify URIs and IDs, see: https://beta.developer.spotify.com/documentation/web-api/#spotify-uris-and-ids
 */

/**
* Obtains parameters from the hash of the URL
* @return Object
*/
function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1);
  while (e = r.exec(q)) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

/**
 * Gets a user's details and updates the screen if authenticated.
 * @param {string} access_token A valid access token from the Spotify Accounts service
 */
function getUserDetails(access_token) {
  if (access_token) {
    $.ajax({
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      success: function (response) {
        $('#login').addClass('hide');
        $('#loggedin').removeClass('hide');
      }
    });
  } else {
    // render initial screen
    $('#login').removeClass('hide');
    $('#loggedin').addClass('hide');
  }
}

function loadPlaylists(access_token) {
  $.ajax({
    url: 'https://api.spotify.com/v1/me/playlists',
    data: { limit: 50 },
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    success: function (response) {
      var playlists = response.items.map(item => { return { name: item.name, id: item.id } });
      var templateScript = $(PLAYLIST_TEMPLATE).html();
      //Compile the template​
      var template = Handlebars.compile(templateScript);
      $(MENU_SELECTOR).append(template(playlists));
    }
  });
}

/**
 * Initializes the Spotify Player
 * @param {string} accessToken A valid access token from the Spotify Accounts service
 * @returns {Spotify.Player} the instance of the Gesturify player
 * @see https://beta.developer.spotify.com/documentation/web-playback-sdk/quick-start/
 */
function setUpPlayer(accessToken) {
  const player = new Spotify.Player({
    name: 'Gesturify',
    getOAuthToken: cb => { cb(accessToken); }
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

/**
 * Get a list of the playlists owned or followed by the current Spotify user.
 * @param {string} accessToken A valid access token from the Spotify Accounts service 
 * @see https://beta.developer.spotify.com/documentation/web-api/reference/playlists/get-a-list-of-current-users-playlists/
 */
function getUserPlaylists(access_token) {
  $.ajax({
    url: 'https://api.spotify.com/v1/me/playlists',
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    success: function (response) {
      // NOTE: use playlist id as html id
      const playlists = response.items.map((playlist) => {
        return {
          id: playlist.id,
          name: playlist.name
        }
      });

      console.log(playlists);
    },
    error: function (err) {
      console.log(err);
    }
  });
}

/**
 * Add one or more tracks to a user’s playlist.
 * @param {string} user_id The unique string identifying the Spotify user that you 
 *                    can find at the end of the Spotify URI (e.g. spotify:user:wizzler) 
 *                    for the user, e.g. wizzler
 * @param {string} playlist_id 	The base-62 identifier that you can find at the 
 *                    end of the Spotify URI (e.g. spotify:playlist:37i9dQZF1DX1ewVhAJ17m4) 
 *                    for a playlist, e.g. 37i9dQZF1DX1ewVhAJ17m4
 * @param {string[]} track_uris An array of Spotify track URIs.
 *                    The resource identifier that you can enter, for example, in the 
 *                    Spotify Desktop client’s search box to locate an artist, album, or track.
 *                    (e.g. spotify:track:6rqhFgbbKwnb9MLmUQDhG6)
 * @param {string} accessToken A valid access token from the Spotify Accounts service 
 * @see https://beta.developer.spotify.com/documentation/web-api/reference/playlists/add-tracks-to-playlist/
 */
function addTracksToPlaylist(user_id, playlist_id, track_uris, access_token) {
  $.ajax({
    type: 'POST',
    url: `https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}/tracks`,
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    contentType: 'application/json',
    data: JSON.stringify({ "uris": track_uris }),
    success: function (response) {
      console.log(response);
    },
    error: function (err) {
      console.log(err);
    }
  });
}

/**
 * Get Spotify Catalog information about artists, albums, tracks or playlists that match a keyword string,
 * and plays the first result on the user’s active device.
 * @param {string} keywords Not case-sensitive. Unless surrounded by double quotation marks,
 *                          keywords are matched in any order. Only popular playlists returned
 *                          if type===playlist.
 * @param {string} type See SPOTIFY_TYPE
 * @param {string} accessToken A valid access token from the Spotify Accounts service 
 * @see https://beta.developer.spotify.com/documentation/web-api/reference/search/search/
 */
function search(keywords, type, access_token) {
  var query = keywords.replace(' ', '%20');

  $.ajax({
    url: 'https://api.spotify.com/v1/search',
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    data: {
      q: keywords,
      type: type,
      limit: 1
    }
  }).done(function (response) {
    if (type === SPOTIFY_TYPE.ALBUM) {
      changeUserPlayback(type, [response.albums.items[0].uri], access_token);
    } else if (type === SPOTIFY_TYPE.ARTIST) {
      changeUserPlayback(type, [response.artists.items[0].uri], access_token);
    } else if (type === SPOTIFY_TYPE.PLAYLIST) {
      console.log(response);
      changeUserPlayback(type, [response.playlists.items[0].uri], access_token);
    } else {
      changeUserPlayback(type, [response.tracks.items[0].uri], access_token);
    }
  });
}

/**
 * Start a new context on the user’s active device.
 * @param {string} type See SPOTIFY_TYPE
 * @param {string[]} uris if album/artist/playlist, uris.length === 1 * 
 * @param {string} accessToken A valid access token from the Spotify Accounts service 
 * @see https://beta.developer.spotify.com/documentation/web-api/reference/player/start-a-users-playback/ | BETA
 */
function changeUserPlayback(type, uris, access_token) {
  const track_data = { uris: uris };
  const other_data = { context_uri: uris[0] };
  const req_data = type === SPOTIFY_TYPE.TRACK ? track_data : other_data;

  $.ajax({
    type: 'PUT',
    url: `https://api.spotify.com/v1/me/player/play`,
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    contentType: 'application/json',
    data: JSON.stringify(req_data),
    success: function (response) {
      console.log(response);
    },
    error: function (err) {
      console.log(err);
    }
  });
}

/**
 * Save one or more tracks to the current user’s ‘Songs’ library
 * @param {string[]} track_ids An array of Spotify Track IDs.
 *                             The base-62 identifier that you can find at the 
 *                             end of the Spotify URI (e.g. spotify:track:4iV5W9uYEdYUVa79Axb7Rh) 
 *                             for a track, e.g. 4iV5W9uYEdYUVa79Axb7Rh
 * @param {string} accessToken A valid access token from the Spotify Accounts service 
 * @see https://beta.developer.spotify.com/documentation/web-api/reference/library/save-tracks-user/
 */
function saveTracksToUserLibrary(track_ids, access_token) {
  $.ajax({
    type: 'PUT',
    url: `https://api.spotify.com/v1/me/tracks`,
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    contentType: 'application/json',
    data: JSON.stringify({ "ids": track_ids }),
    success: function (response) {
      console.log(response);
    },
    error: function (err) {
      console.log(err);
    }
  });
}

/**
 * Set the repeat mode for the user’s playback. 
 * @param {string} state "track" will repeat the current track
 *                       "context" will repeat the current context
 *                       "off" will turn off repeat
 * @param {string} accessToken A valid access token from the Spotify Accounts service 
 * @see https://beta.developer.spotify.com/documentation/web-api/reference/player/set-repeat-mode-on-users-playback/ | BETA
 */
function repeat(state, access_token) {
  $.ajax({
    type: 'PUT',
    url: `https://api.spotify.com/v1/me/player/repeat?state=${state}`,
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    success: function (response) {
      console.log(response);
    },
    error: function (err) {
      console.log(err);
    }
  });
}

/**
 * Toggle shuffle on or off for user’s playback.
 * @param {Boolean} state Shuffles user's playback if true.
 * @param {string} accessToken A valid access token from the Spotify Accounts service  
 * @see https://beta.developer.spotify.com/documentation/web-api/reference/player/toggle-shuffle-for-users-playback/ | BETA
 */
function shuffle(state, access_token) {
  $.ajax({
    type: 'PUT',
    url: `https://api.spotify.com/v1/me/player/shuffle?state=${state}`,
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    success: function (response) {
      console.log(response);
    },
    error: function (err) {
      console.log(err);
    }
  });
}

