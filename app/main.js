// Setting up global variables
var play = false;
var prevPlayPauseGestureTime = new Date().getTime();
var prevGesture;
var circleGestureDuration = 0;
var prevCircleGestureTime = prevPlayPauseGestureTime;

// TODO: Severity: High
// Ensure that there is a delay between recognized gestures, maybe 3 seconds?

$(document).ready(function () {
    var gestureText = document.getElementById('gesture-text');

    // Controller options for the Leap Motion
    var controllerOptions = { enableGestures: true, background: true };

    Leap.loop(controllerOptions, function (frame) {
        const numHands = frame.hands.length;

        // reset text
        if (numHands == 0) {
            $(gestureText).text('');
        }
        else if (numHands == 1) {
            var hand = frame.hands[0];
            var currentTime = new Date().getTime();

            // Detect Play/ Pause Gesture
            if (detectPlayPauseGesture(hand) && currentTime - prevPlayPauseGestureTime >= 3500) {
                if (play) {
                    $(gestureText).text('Pause');
                    setTimeout(() => $(gestureText).text(''), 1500);
                } else {
                    $(gestureText).text('Play');
                    setTimeout(() => $(gestureText).text(''), 1500);
                }
                play = !play;
                prevPlayPauseGestureTime = new Date().getTime();
                prevGesture = 'halt';
                circleGestureDuration = 0;
            }

            else if (detectThumbsUpGesture(hand)) {
                $(gestureText).text('Saved to Library!');
                setTimeout(() => $(gestureText).text(''), 1500);
            }

            else if (frame.valid && frame.gestures.length > 0) {
                frame.gestures.forEach(function (gesture) {
                    switch (gesture.type) {
                        // Detect Fast Forward/ Rewind Gesure
                        case "circle":
                            prevGesture = seek(frame, gesture, gestureText, circleGestureDuration, currentTime);
                            prevCircleGestureTime = new Date().getTime();
                            console.log("Circle Gesture");
                            break;
                        case "swipe":
                            console.log("Swipe Gesture");
                            break;
                    }
                });
            }
        } else {
            // warn user
            $(gestureText).text("Only use one hand!");
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
 * @param {HTMLElement} gestureText The selector to update the text.
 * @param {number} duration The total time taken for the gesture, in seconds.
 * @param {number} currentTime The time the current gesture was made, in milliseconds.
 */
function seek(frame, gesture, gestureText, duration, currentTime) {
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
        circleGestureDuration = 0;
    }
    circleGestureDuration += 0.5;

    if (clockwise) {
        $(gestureText).text("Fast Forward Song by " + convertDuration(duration));
        return 'forward';
    } else {
        $(gestureText).text("Rewind Song by " + convertDuration(duration));
        return 'reverse';
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
