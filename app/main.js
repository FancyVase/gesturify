// Setting up global variables
let play;
let trackId;
var prevGestureTime = new Date().getTime();
var prevGesture;
var circleGestureDuration = 0;
var prevCircleGestureTime = prevGestureTime;
var addToPlaylistMode = false;

// Constants
const GESTURE_DELAY = 2000;
const CIRCLE_GESTURES = ["forward", "reverse"];

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

  const player = setUpPlayer();

  player.on('player_state_changed', ({ paused, track_window: { current_track: { name, artists, id } } }) => {
    play = !paused;
    $(SONG_TEXT_SELECTOR).text(name);
    $(ARTIST_TEXT_SELECTOR).text(artists[0].name);
    trackId = id;
  });

  Leap.loop(controllerOptions, function (frame) {
    const numHands = frame.hands.length;
    var currentTime = new Date().getTime();

    // reset text
    if (numHands == 0) {
      $(TEXT_SELECTOR).text('');
      //resetCircleDuration(player, circleGestureDuration)
    }

    // recognize one-handed gestures
    else if (numHands == 1) {
      var hand = frame.hands[0];

      if (addToPlaylistMode) {

        selectPlaylist(hand, listingsTopPos, listingsHeight, itemHeight);

      } else {

        resetPlaylistAppearance();
        resetCursor();

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

            updateTextAndTime(player, circleGestureDuration);
            prevGesture = 'toggle-play';
          }

          // Detect Save to Library Gesture
          else if (detectThumbsUpGesture(hand)) {
            saveSong({
              playerInstance: player,
              spotify_id: trackId,
            });
            $(TEXT_SELECTOR).text('Saved to Library!');
            updateTextAndTime();
            prevGesture = 'save';
          }
          // else if (frame.valid && frame.gestures.length > 0) {
          //   frame.gestures.forEach(function (gesture) {
          //     switch (gesture.type) {
          //       case "circle":
          //         playerSeek(frame, gesture, circleGestureDuration, currentTime, player);
          //         break;
          //       case "swipe":
          //         // Detect Change Volume/ Change Track Gesture
          //         // const previous = swipe(gesture);
          //         // if (previous) {
          //         //   player.previousTrack().then(() => {
          //         //     $(TEXT_SELECTOR).text("Play Previous Song");
          //         //     updateTextAndTime(player, circleGestureDuration);
          //         //     prevGesture = 'change-track';
          //         //   });
          //         // } else {
          //         //   player.nextTrack().then(() => {
          //         //     $(TEXT_SELECTOR).text("Play Next Song");
          //         //     updateTextAndTime(player, circleGestureDuration);
          //         //     prevGesture = 'change-track';
          //         //   });
          //         // }
          //         // console.log("Swipe Gesture");
          //         break;
          //     }
          //   });
          // }
        }
        // else if ((currentTime - prevCircleGestureTime > GESTURE_DELAY) && CIRCLE_GESTURES.indexOf(prevGesture) > 0) {
        //   updateTextAndTime(player, circleGestureDuration);
        // }
      }
    } else {
      // warn user
      $(TEXT_SELECTOR).text("Only use one hand!");
      //resetCircleDuration(player, circleGestureDuration)
    }
  }).use('screenPosition', { scale: 0.5 });
};

/**
 * Determines the duration and direction to seek a song.
 * The clockwise motion of the finger indicates fast forward.
 * The other direction indicates rewind.
 * The duration of the gesture corresponds to how much the song should be fast forwarded/
 * rewinded
 * @param {Frame} frame The current frame given by the Leap Motion controller.
 * @param {CircleGesture} gesture The gesture object representing a circular finger movement.
 * @param {number} duration The total time taken for the gesture, in seconds.
 * @param {number} currentTime The time the current gesture was made, in milliseconds.
 */
function playerSeek(frame, gesture, duration, currentTime, player) {
  //TODO: https://beta.developer.spotify.com/documentation/web-playback-sdk/reference/#api-spotify-player-seek


  var clockwise = false;
  var pointableID = gesture.pointableIds[0];
  var direction = frame.pointable(pointableID).direction;
  var dotProduct = Leap.vec3.dot(direction, gesture.normal);

  if (dotProduct > 0) clockwise = true;

  // Reset total time taken to complete circle gesture.
  // The circle gesture is considered complete if:
  // - the time between detected circle gestures is greater than 500ms
  // - the direction of the previous circle gesture is not the same as the current circle gesture

  if (currentTime - prevCircleGestureTime > 500 || prevGesture === "forward" && !clockwise || prevGesture === "reverse" && clockwise || CIRCLE_GESTURES.indexOf(prevGesture) < 0) {
    resetCircleDuration(player, duration);
  }
  circleGestureDuration += 1;

  if (clockwise) {
    $(TEXT_SELECTOR).text("Fast Forward Song by " + convertDuration(duration));
    prevGesture = 'forward';
  } else {
    $(TEXT_SELECTOR).text("Rewind Song by " + convertDuration(duration));
    prevGesture = 'reverse';
  }

  prevCircleGestureTime = new Date().getTime();
}

/**
 * Determines what kind of swipe was made.
 * A horizontal swipe changes the track.
 * A swipe to the left indicates skip to the next track.
 * A swipe to the right indicates skip to the previous track.
 * A vertical swipe changes the volume.
 * A swipe up raises the volume.
 * A swipe down lowers the volume.
 * @param {SwipeGesture} gesture The gesture object representing a hand swipe.
 */
function swipe(gesture) {
  var isHorizontal = Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]);

  // Change the track
  return isHorizontal && gesture.direction[0] > 0;



  // Change the volume
  // TODO: use position and prevPosition to get magnitude
  // https://beta.developer.spotify.com/documentation/web-playback-sdk/reference/#api-spotify-player-getvolume


  // else {
  //   var volumeUp = gesture.direction[1] > 0;

  //   if (volumeUp) {
  //     $(TEXT_SELECTOR).text("Raise the Volume");
  //     prevGesture = 'previous';
  //   } else {
  //     $(TEXT_SELECTOR).text("Lower the Volume");
  //     prevGesture = 'next';
  //   }
  // }
}

/**
 * Determines if the user is indicating to Pause/ Play the music.
 * To do this, the user must make a halt sign.
 * @param {Hand} hand The physical characteristics of the detected hand.
 * @returns True if the hand is making Play/ Pause gesture, False otherwise.
 */
function detectPlayPauseGesture(hand) {
  var pitch = hand.pitch();
  var grabStrength = hand.grabStrength;

  var openHand = grabStrength < 0.25;
  var verticalHand = (pitch > 1.15 && pitch < 2);
  return openHand && verticalHand;
}

/**
 * Determines if the user is indicating to save the current song to the user's library.
 * To do this, the user must make a thumbs up gesture.
 * @param {Hand} hand The physical characteristics of the detected hand.
 * @returns True if the hand is making a thumbs up gesture, False otherwise.
 */
function detectThumbsUpGesture(hand) {
  var thumbExtended = hand.thumb.extended;
  var thumbUpright = hand.thumb.direction[1] > 0.4;
  var closedFingers = (hand.indexFinger.extended || hand.middleFinger.extended || hand.ringFinger.extended || hand.pinky.extended);

  return thumbExtended && !closedFingers && thumbUpright;
}

/**
 * Determines if the user is indicating to search for a song.
 * To do this, the user must make a closed fist gesture.
 * @param {Hand} hand The physical characteristics of the detected hand.
 * @returns True if the hand is making a closed fist gesture, False otherwise.
 */
function detectFistGesture(hand) {
  var closedFingers = (hand.thumb.extended || hand.indexFinger.extended || hand.middleFinger.extended || hand.ringFinger.extended || hand.pinky.extended);

  return !closedFingers && (hand.grabStrength === 1);
}

/**
 * Converts seconds to a string of format HH:MM:SS
 * @param {number} duration The elapsed duration of the circle gesture up to the frame containing this gesture, in seconds.
 * @returns The corresponding time in string format HH:MM:SS
 */
function convertDuration(duration) {
  var hours = Math.floor(duration / 3600);
  var minutes = Math.floor((duration - (hours * 3600)) / 60);
  var seconds = Math.ceil(duration - (hours * 3600) - (minutes * 60));

  if (hours < 10) { hours = "0" + hours; }
  if (minutes < 10) { minutes = "0" + minutes; }
  if (seconds < 10) { seconds = "0" + seconds; }
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Toggles between the ability to select a playlist or make gestures to control the player.
 */
function togglePlaylistMode() {
  if (addToPlaylistMode) {
    $('.ui.left.attached.button').removeClass('disabled');
    $('.ui.right.attached.button').addClass('disabled');
  } else {
    $('.ui.left.attached.button').addClass('disabled');
    $('.ui.right.attached.button').removeClass('disabled');
  }
  addToPlaylistMode = !addToPlaylistMode;
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
  var handPostion = hand.screenPosition();
  var yPosition = handPostion[1];
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
 * Resets the presentation text and circle gesture duration time.
 * Records the time of the last recognized gesture.
 */
function updateTextAndTime(player, duration) {
  updatePrevGestureTime();
  //resetCircleDuration(player, duration);
  resetText();
}

/**
 * Records the time of the last recognized gesture.
 */
function updatePrevGestureTime() {
  prevGestureTime = new Date().getTime();
}

/**
 * Resets the total time taken to complete a circle gesture.
 */
function resetCircleDuration(player, duration) {
  player.getCurrentState().then(state => {
    if (!state || duration === 0) {
      return;
    }
    const songPosition = state.position;
    const seekTime = duration * 1000;
    if (prevGesture === 'forward') {
      player.seek(songPosition + seekTime).then(() => {
        console.log(`Changed position by ${seekTime}!`);
      });
    } else if (prevGesture === 'reverse') {
      player.seek(songPosition - seekTime).then(() => {
        console.log(`Changed position by -${seekTime}!`);
      });
    }
  });


  circleGestureDuration = 0;
  prevGesture = '';
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
