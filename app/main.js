// Setting up global variables
var play = false;
var prevGestureTime = new Date().getTime();
var prevGesture;
var circleGestureDuration = 0;
var prevCircleGestureTime = prevGestureTime;
var addToPlaylistMode = false;
const GESTURE_DELAY = 2000;
const CIRLCE_GESTURES = ["forward", "reverse"];

// Selectors
const TEXT_SELECTOR = '#gesture-text';
const MENU_SELECTOR = '.menu.listings';
const PLAYLIST_ITEM_SELECTOR = '.playlist-item';
const CURSOR_SELECTOR = '.circle.icon';

$(document).ready(function () {
  var listingsTopPos = $(MENU_SELECTOR).offset().top;
  var listingsHeight = $(MENU_SELECTOR).outerHeight();
  var itemHeight = $(PLAYLIST_ITEM_SELECTOR).outerHeight();
  var numItems = $(PLAYLIST_ITEM_SELECTOR).length;

  // Controller options for the Leap Motion
  var controllerOptions = { enableGestures: true, background: true };

  Leap.loop(controllerOptions, function (frame) {
    const numHands = frame.hands.length;
    var currentTime = new Date().getTime();

    // reset text
    if (numHands == 0) {
      $(TEXT_SELECTOR).text('');
      resetCircleDuration();
    }
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
            var gestureText = play ? 'Pause' : 'Play';
            $(TEXT_SELECTOR).text(gestureText);
            play = !play;
            resetAllTime();
            prevGesture = 'halt';
          }

          // Detect Search Gesture
          else if (detectFistGesture(hand)) {
            $(TEXT_SELECTOR).text('Search');
            resetAllTime();
            prevGesture = 'search';
          }

          // Detect Save to Library Gesture
          else if (detectThumbsUpGesture(hand)) {
            $(TEXT_SELECTOR).text('Saved to Library!');
            resetAllTime();
            prevGesture = 'save';
          }

          else if (frame.valid && frame.gestures.length > 0) {
            frame.gestures.forEach(function (gesture) {
              switch (gesture.type) {
                // Detect Fast Forward/ Rewind Gesture
                case "circle":
                  seek(frame, gesture, circleGestureDuration, currentTime);
                  resetText();
                  console.log("Circle Gesture");
                  break;
                case "swipe":
                  swipe(gesture);
                  console.log("Swipe Gesture");
                  break;
              }
            });
          }
        } else if ((currentTime - prevCircleGestureTime > 500) && CIRLCE_GESTURES.indexOf(prevGesture) > 0) {
          resetAllTime();
        }
      }
    } else {
      // warn user
      $(TEXT_SELECTOR).text("Only use one hand!");
      resetCircleDuration();
    }
  }).use('screenPosition', { scale: 0.5 });
});

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
function seek(frame, gesture, duration, currentTime) {
  var clockwise = false;
  var pointableID = gesture.pointableIds[0];
  var direction = frame.pointable(pointableID).direction;
  var dotProduct = Leap.vec3.dot(direction, gesture.normal);

  if (dotProduct > 0) clockwise = true;

  // Reset total time taken to complete circle gesture.
  // The circle gesture is considered complete if:
  // - the time between detected circle gestures is greater than 500ms
  // - the direction of the previous circle gesture is not the same as the current circle gesture

  if (currentTime - prevCircleGestureTime > 500 || prevGesture === "forward" && !clockwise || prevGesture === "reverse" && clockwise) {
    resetCircleDuration();
  }
  circleGestureDuration += 0.5;

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
  if (isHorizontal) {
    var previous = gesture.direction[0] > 0;

    if (previous) {
      $(TEXT_SELECTOR).text("Play Previous Song");
      prevGesture = 'previous';
    } else {
      $(TEXT_SELECTOR).text("Play Next Song");
      prevGesture = 'next';
    }

    // Change the volume
    // TODO: use position and prevPosition to get magnitude
  } else {
    var volumeUp = gesture.direction[1] > 0;

    if (volumeUp) {
      $(TEXT_SELECTOR).text("Raise the Volume");
      prevGesture = 'previous';
    } else {
      $(TEXT_SELECTOR).text("Lower the Volume");
      prevGesture = 'next';
    }
  }
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

function resetAllTime() {
  updatePrevGestureTime();
  resetCircleDuration();
  resetText();
}

function updatePrevGestureTime() {
  prevGestureTime = new Date().getTime();
}

function resetCircleDuration() {
  circleGestureDuration = 0;
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

function resetText() {
  setTimeout(() => $(TEXT_SELECTOR).text(''), 1750);
}
