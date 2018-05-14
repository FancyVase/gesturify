/**
 * Determines if a song should be fast-forwarded/ rewinded.
 * The clockwise motion of the finger indicates fast forward. Otherwise, rewind.
 * @param {Frame} frame The current frame given by the Leap Motion controller.
 * @param {CircleGesture} gesture The gesture object representing a circular finger movement.
 * @returns True if clockwise circle gesture, False otherwise.
 * 
 */
function detectCircleDirection(frame, gesture) {
  var pointableID = gesture.pointableIds[0];
  var direction = frame.pointable(pointableID).direction;
  var dotProduct = Leap.vec3.dot(direction, gesture.normal);

  return dotProduct > 0;
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
 * Determines if the next track should play.
 * Indicated by a thumb pointing to the right.
 * @param {Hand} hand The physical characteristics of the detected hand.
 * @returns True if next track should play, False otherwise.
 */
function detectNextTrackGesture(hand) {
  // Check that thumb is pointing right.
  var pointRight = hand.pointables[0].direction[0] > 0;
  var closedHand = hand.grabStrength > 0.75;

  return closedHand && hand.thumb.extended && pointRight;
}

/**
 * Determines if the previous track should play.
 * Indicated by a thumb pointing to the left.
 * @param {Hand} hand The physical characteristics of the detected hand.
 * @returns True if previous track should play, False otherwise.
 */
function detectPreviousTrackGesture(hand) {
  // Check that thumb is pointing left.
  var pointLeft = hand.pointables[0].direction[0] < 0;
  var closedHand = hand.grabStrength > 0.75;

  return closedHand && hand.thumb.extended && pointLeft;
}
