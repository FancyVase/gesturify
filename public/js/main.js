// Setting up global variables
let play;
var prevGestureTime = new Date().getTime();
var addToPlaylistMode = false;
var changeVolumeMode = false;
let addSongCommand = false;
let access_token;
let user_id;
let currentTrackUri;

// Controller options for the Leap Motion
const controllerOptions = { enableGestures: true, background: true };

window.onSpotifyWebPlaybackSDKReady = () => {

  // Retrieving Spotify user info and credentials
  var params = getHashParams();
  access_token = params.access_token;
  refresh_token = params.refresh_token;
  user_id = params.user_id;
  let error = params.error;

  if (error) {
    throw new Error('There was an error during the authentication');
  }

  getUserDetails(access_token);
  const player = setUpPlayer(access_token); // device_id === player.device_id
  loadPlaylists(access_token);

  // Values for playlist task
  let listingsTopPos = $(MENU_SELECTOR).offset().top;

  // Retrive current track details
  player.on('player_state_changed', ({ paused, track_window: { current_track: { name, artists, uri } } }) => {
    play = !paused;
    $(SONG_TEXT_SELECTOR).text(name);
    currentTrackUri = uri;
    $(ARTIST_TEXT_SELECTOR).text(artists[0].name);
  });

  Leap.loop(controllerOptions, function (frame) {
    const numHands = frame.hands.length;
    var currentTime = new Date().getTime();

    // reset text
    if (numHands == 0) {
      $(TEXT_SELECTOR).text('');

      if (changeVolumeMode) {
        $(TEXT_SELECTOR).text('Volume');
      }
    }

    // recognize one-handed gestures
    else if (numHands == 1) {
      var hand = frame.hands[0];

      if (addToPlaylistMode) {
        let selectedPlaylist = selectPlaylist(hand, listingsTopPos);
        if (addSongCommand) {
          addSongCommand = false;
          addTracksToPlaylist(user_id, selectedPlaylist, [currentTrackUri], access_token);
          toggleMode();
          $(TEXT_SELECTOR).text('Song added!');
          
        }
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
              $(TEXT_SELECTOR).text('Play Next Song');
              updateTextAndTime();
            });
          }

          // Detect skip to previous track gesture
          else if (detectPreviousTrackGesture(hand)) {
            player.previousTrack().then(() => {
              $(TEXT_SELECTOR).text('Play Previous Song');
              updateTextAndTime();
            });
          }

          else if (frame.valid && frame.gestures.length > 0) {
            frame.gestures.forEach(function (gesture) {
              if (gesture.type === 'circle') {
                // Detect Seek Gesture
                const clockwise = detectCircleDirection(frame, gesture);
                player.getCurrentState().then(state => {
                  if (!state) {
                    return;
                  }
                  const songPosition = state.position;
                  if (clockwise) {
                    player.seek(songPosition + SEEK_TIME).then(() => {
                      $(TEXT_SELECTOR).text('Fast Forward Song');
                      console.log(`Changed position by ${SEEK_TIME}!`);
                    });
                  } else {
                    player.seek(songPosition - SEEK_TIME).then(() => {
                      $(TEXT_SELECTOR).text('Rewind Song');
                      console.log(`Changed position by -${SEEK_TIME}!`);
                    });
                  }
                });
              }
            });
          }
        }
      }
    } else {
      // warn user
      $(TEXT_SELECTOR).text('Only use one hand!');
    }
  }).use('screenPosition', { scale: 0.5 });
};


/**
 * Toggles between the ability to select a playlist or make gestures to control the player.
 */
function togglePlaylistMode() {
  $('.ui.button.playlist').addClass('disabled');
  $('.ui.button.volume').addClass('disabled');
  $('.ui.button.controller').removeClass('disabled');
  addToPlaylistMode = true;
}

/**
 * Toggles between the ability to change the volume of the player.
 */
function toggleVolumeMode() {
  $('.ui.button.playlist').addClass('disabled');
  $('.ui.button.volume').addClass('disabled');
  $('.ui.button.controller').removeClass('disabled');
  changeVolumeMode = true;
}

function toggleMode() {
  $('.ui.button.playlist').removeClass('disabled');
  $('.ui.button.volume').removeClass('disabled');
  $('.ui.button.controller').addClass('disabled');
  addToPlaylistMode = false;
  changeVolumeMode = false;
  updateTextAndTime();
}

function showModal() {
  $('.ui.modal').modal('show');
}

/**
 * Determines what playlist the user wants to add a song to based on his/her hand's position.
 * Updates the position of the cursor.
 * @param {Hand} hand The physical characteristics of the detected hand.
 * @param {number} listingsTopPos The y-coordinate of the start of the list of playlists relative to the document, in pixels.
 * @returns {string} playlist The ID of the playlist selected.
 */
function selectPlaylist(hand, listingsTopPos) {
  var handPosition = hand.screenPosition();
  var yPosition = handPosition[1];

  let scrollOffset = $(SIDEBAR_SELECTOR).scrollTop();
  console.log(listingsTopPos);
  // Only update the position of the cursor if hand's position is within the region with
  // playlist items
  if (yPosition - listingsTopPos > 0) {
    var offsetYPosition = yPosition + scrollOffset;
    $(CURSOR_SELECTOR).css({ top: offsetYPosition.toString() + 'px', right: '18%' });

    // Determine which playlist the cursor is over
    let playlist = document.elementFromPoint(0, yPosition).id;

    if (playlist) {

      resetPlaylistAppearance();
      // Highlight the playlist marked by the cursor
      $('#' + playlist).addClass('active');

      // Report the highlighted playlist name
      $(TEXT_SELECTOR).text($('#' + playlist).text());

      return playlist;
    }
    return '';
  }
  return '';
}

/**
 * Changes the volume based on the user's hand's position.
 * @param {Hand} hand The physical characteristics of the detected hand.
 * @param {Player} player The Spotify player.
 */
function changeVolume(hand, player) {
  $(TEXT_SELECTOR).text('Volume');
  var handPosition = hand.screenPosition();
  var yPosition = handPosition[1];
  var openHand = (hand.thumb.extended && hand.indexFinger.extended && hand.middleFinger.extended && hand.ringFinger.extended && hand.pinky.extended);

  if (!openHand && hand.grabStrength === 1) {
    toggleMode();
  }

  // Change the volume if the hand is open and its vertical position is in [VOLUME_MIN, VOLUME_MAX] range
  if (yPosition > VOLUME_MAX_POS && yPosition < VOLUME_MIN_POS && openHand) {
    var volume = Math.round(((yPosition - VOLUME_MIN_POS) / (VOLUME_MAX_POS - VOLUME_MIN_POS)) * 100);
    player.setVolume(volume / 100).then(() => {
      resetText();
      $(TEXT_SELECTOR).text('Volume: ' + volume + '%');
    });
  } else if (yPosition < VOLUME_MAX_POS && openHand) {
    player.setVolume(1).then(() => {
      resetText();
      $(TEXT_SELECTOR).text('Volume: 100%');
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

/**
 * Processes Web Speech API recognized speech.
 * Input: transcript, a string of possibly multiple words that were recognized
 * Output: processed, a boolean indicating whether the system reacted to the speech or not
 */
var processSpeech = function (transcript) {
  transcript = transcript.toLowerCase();
  // Helper function to detect if any commands appear in a string
  var userSaid = function (str, commands) {
    for (var i = 0; i < commands.length; i++) {
      if (str.indexOf(commands[i]) > -1)
        return true;
    }
    return false;
  };

  if (transcript.length > 0) {
    console.log(`Speech: ${transcript}`);
  }

  var processed = false;

  if (userSaid(transcript, ['volume'])) {
    toggleVolumeMode();
    resetText();
    processed = true;
  }

  else if (userSaid(transcript, ['search'])) {
    if (userSaid(transcript, ['album'])) {
      let words = transcript.split(' ');
      try {
        let typeIndex = words.indexOf('album');
        search(words.slice(typeIndex + 1).join(' '), 'album', access_token);
      } catch (e) {
        console.error(e);
      }
    } else if (userSaid(transcript, ['artist'])) {
      let words = transcript.split(' ');
      try {
        let typeIndex = words.indexOf('artist');
        search(words.slice(typeIndex + 1).join(' '), 'artist', access_token);
      } catch (e) {
        console.error(e);
      }
    } else if (userSaid(transcript, ['playlist'])) {
      let words = transcript.split(' ');
      try {
        let typeIndex = words.indexOf('playlist');
        search(words.slice(typeIndex + 1).join(' '), 'playlist', access_token);
      } catch (e) {
        console.error(e);
      }
    } else if (userSaid(transcript, ['song', 'track'])) {
      let words = transcript.split(' ');
      try {
        let typeIndex = words.indexOf('song') > -1 ? words.indexOf('song') : words.indexOf('track');
        search(words.slice(typeIndex + 1).join(' '), 'track', access_token);
      } catch (e) {
        console.error(e);
      }
    }
  }

  else if (userSaid(transcript, ['add this song to that playlist'])) {
    addSongCommand = true;
  }


  return processed;
};
