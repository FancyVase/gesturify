// Setting up global variables
let play;
var prevGestureTime = new Date().getTime();
var addToPlaylistMode = false;
var changeVolumeMode = false;

// Constants
const MS_TO_S = 1000;
const GESTURE_DELAY = 2 * MS_TO_S;
const SEEK_TIME = 10 * MS_TO_S;
const VOLUME_MAX_POS = -200;
const VOLUME_MIN_POS = 400;

// Spotify States/ Types
const SPOTIFY_TYPE = { ALBUM: "album", ARTIST: "artist", PLAYLIST: "playlist", TRACK: "track" };
const REPEAT_STATE = { TRACK: "track", CONTEXT: "context", OFF: "off" };
const SHUFFLE_STATE = { ON: true, OFF: false };

// Selectors
const TEXT_SELECTOR = '#gesture-text';
const MENU_SELECTOR = '.menu.listings';
const PLAYLIST_ITEM_SELECTOR = '.playlist-item';
const CURSOR_SELECTOR = '.circle.icon';
const SONG_TEXT_SELECTOR = '#song-title';
const ARTIST_TEXT_SELECTOR = '#artist';

// Controller options for the Leap Motion
const controllerOptions = { enableGestures: true, background: true };

window.onSpotifyWebPlaybackSDKReady = () => {
  // Getting values for playlist task
  const listingsTopPos = $(MENU_SELECTOR).offset().top;
  const listingsHeight = $(MENU_SELECTOR).outerHeight();
  const itemHeight = $(PLAYLIST_ITEM_SELECTOR).outerHeight();
  const numItems = $(PLAYLIST_ITEM_SELECTOR).length;

  // Retrieving Spotify user info and credentials
  var params = getHashParams();
  var access_token = params.access_token,
    refresh_token = params.refresh_token,
    user_id = params.user_id,
    error = params.error;

  if (error) {
    throw new Error('There was an error during the authentication');
  }

  getUserDetails(access_token);
  const player = setUpPlayer(access_token); // device_id === player.device_id

  // Retrive current track details
  player.on('player_state_changed', ({ paused, track_window: { current_track: { name, artists } } }) => {
    play = !paused;
    $(SONG_TEXT_SELECTOR).text(name);
    $(ARTIST_TEXT_SELECTOR).text(artists[0].name);
  });

  Leap.loop(controllerOptions, function (frame) {
    const numHands = frame.hands.length;
    var currentTime = new Date().getTime();

    // reset text
    if (numHands == 0) {
      $(TEXT_SELECTOR).text('');
    }

    // recognize one-handed gestures
    else if (numHands == 1) {
      var hand = frame.hands[0];

      if (addToPlaylistMode) {
        selectPlaylist(hand, listingsTopPos, listingsHeight, itemHeight);
      } else if (changeVolumeMode) {
        changeVolume(hand, player);
      } else {
        resetPlaylistAppearance();
        resetCursor();

        // Delay gesture recognition
        if (currentTime - prevGestureTime >= GESTURE_DELAY) {

          // Detect Play/ Pause Gesture
          if (detectPlayPauseGesture(hand)) {
            if (play) {
              player.pause().then(() => {
                $(TEXT_SELECTOR).text('Pause');
              });
            } else {
              player.resume().then(() => {
                $(TEXT_SELECTOR).text('Play');
              });
            }

            play = !play;
            updateTextAndTime();
          }

          // Detect skip to next track gesture
          else if (detectNextTrackGesture(hand)) {
            player.nextTrack().then(() => {
              $(TEXT_SELECTOR).text("Play Next Song");
              updateTextAndTime();
            });
            console.log("Play Next Song");
          }

          // Detect skip to previous track gesture
          else if (detectPreviousTrackGesture(hand)) {
            player.previousTrack().then(() => {
              $(TEXT_SELECTOR).text("Play Previous Song");
              updateTextAndTime();
            });
            console.log("Play Previous Song");
          }

          else if (frame.valid && frame.gestures.length > 0) {
            frame.gestures.forEach(function (gesture) {
              switch (gesture.type) {
                case "circle":
                  // Detect Seek Gesture
                  const clockwise = detectCircleDirection(frame, gesture);
                  player.getCurrentState().then(state => {
                    if (!state) {
                      return;
                    }
                    const songPosition = state.position;
                    if (clockwise) {
                      player.seek(songPosition + SEEK_TIME).then(() => {
                        $(TEXT_SELECTOR).text("Fast Forward Song");
                        console.log(`Changed position by ${SEEK_TIME}!`);
                      });
                    } else {
                      player.seek(songPosition - SEEK_TIME).then(() => {
                        $(TEXT_SELECTOR).text("Rewind Song");
                        console.log(`Changed position by -${SEEK_TIME}!`);
                      });
                    }
                  });
                  break;
              }
            });
          }
        }
      }
    } else {
      // warn user
      $(TEXT_SELECTOR).text("Only use one hand!");
    }
  }).use('screenPosition', { scale: 0.5 });
};


/**
 * Toggles between the ability to select a playlist or make gestures to control the player.
 */
function togglePlaylistMode() {
  if (!changeVolumeMode) {
    if (addToPlaylistMode) {
      $('.ui.left.attached.button.playlist').removeClass('disabled');
      $('.ui.left.attached.button.volume').removeClass('disabled');
      $('.ui.right.attached.button.playlist').addClass('disabled');
    } else {
      $('.ui.left.attached.button.playlist').addClass('disabled');
      $('.ui.left.attached.button.volume').addClass('disabled');
      $('.ui.right.attached.button.playlist').removeClass('disabled');
      $('.ui.right.attached.button.volume').addClass('disabled');
    }
  }
  addToPlaylistMode = !addToPlaylistMode;
}

/**
 * Toggles between the ability to change the volume of the player.
 */
function toggleVolumeMode() {
  if (!addToPlaylistMode) {
    if (changeVolumeMode) {
      $('.ui.left.attached.button.volume').removeClass('disabled');
      $('.ui.left.attached.button.playlist').removeClass('disabled');
      $('.ui.right.attached.button.volume').addClass('disabled');
    } else {
      $('.ui.left.attached.button.playlist').addClass('disabled');
      $('.ui.left.attached.button.volume').addClass('disabled');
      $('.ui.right.attached.button.volume').removeClass('disabled');
      $('.ui.right.attached.button.playlist').addClass('disabled');
    }
  }
  changeVolumeMode = !changeVolumeMode;
}

/**
 * Determines what playlist the user wants to add a song to based on his/her hand's position.
 * Updates the position of the cursor.
 * @param {Hand} hand The physical characteristics of the detected hand.
 * @param {number} listingsTopPos The y-coordinate of the start of the list of playlists relative to the document, in pixels.
 * @param {number} listingsHeight The total height of the list of playlists, in pixels.
 * @param {number} itemHeight The height of one playlist item, in pixels.
 */
function selectPlaylist(hand, listingsTopPos, listingsHeight, itemHeight) {
  var handPosition = hand.screenPosition();
  var yPosition = handPosition[1];
  resetPlaylistAppearance();

  // Only update the position of the cursor if hand's position is within the region with
  // playlist items
  if (yPosition - listingsTopPos > 0 && yPosition - listingsTopPos < listingsHeight) {
    $(CURSOR_SELECTOR).css({ top: yPosition.toString() + 'px', right: '18%' });

    // Determine which playlist the cursor is over
    var playlistItemIdNum = Math.floor((yPosition - listingsTopPos) / itemHeight);

    // Highlight the playlist marked by the cursor
    $('#item' + playlistItemIdNum.toString()).addClass('active');

    // Report the highlighted playlist name
    $(TEXT_SELECTOR).text($('#item' + playlistItemIdNum.toString()).text());
  }
}

/**
 * Changes the volume based on the user's hand's position.
 * @param {Hand} hand The physical characteristics of the detected hand.
 * @param {Player} player The Spotify player.
 */
function changeVolume(hand, player) {
  var handPosition = hand.screenPosition();
  var yPosition = handPosition[1];
  var openHand = (hand.thumb.extended && hand.indexFinger.extended && hand.middleFinger.extended && hand.ringFinger.extended && hand.pinky.extended);

  // Change the volume if the hand is open and its vertical position is in [VOLUME_MIN, VOLUME_MAX] range
  if (yPosition > VOLUME_MAX_POS && yPosition < VOLUME_MIN_POS && openHand) {
    var volume = Math.round(((yPosition - VOLUME_MIN_POS) / (VOLUME_MAX_POS - VOLUME_MIN_POS)) * 100);
    player.setVolume(volume / 100).then(() => {
      $(TEXT_SELECTOR).text("Volume: " + volume + "%");
      updateTextAndTime();
    });
  } else if (yPosition < VOLUME_MAX_POS && openHand) {
    player.setVolume(1).then(() => {
      $(TEXT_SELECTOR).text("Volume: 100%");
      updateTextAndTime();
    });
  }
}

/**
 * Resets the presentation text and records the time of the last recognized gesture.
 */
function updateTextAndTime() {
  updatePrevGestureTime();
  resetText();
}

/**
 * Records the time of the last recognized gesture.
 */
function updatePrevGestureTime() {
  prevGestureTime = new Date().getTime();
}

/**
 * Resets the styling of the playlists.
 */
function resetPlaylistAppearance() {
  $(PLAYLIST_ITEM_SELECTOR).removeClass('active');
}

/**
 * Resets the position of the cursor.
 */
function resetCursor() {
  $(CURSOR_SELECTOR).css({ top: '0px', right: '0%' });
}

/**
 * Resets the presentation text.
 */
function resetText() {
  setTimeout(() => $(TEXT_SELECTOR).text(''), 1750);
}
