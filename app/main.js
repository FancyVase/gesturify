$(document).ready(function () {
    var gestureText = document.getElementById('gesture-text');
    var play = false;
    var prevGestureTime = '';

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
            
            if (detectPauseGesture(hand) && currentTime - prevGestureTime >= 3500) {
                if (play) {
                    $(gestureText).text('Pause');
                    setTimeout(() => $(gestureText).text(''), 1500);
                } else {
                    $(gestureText).text('Play');
                    setTimeout(() => $(gestureText).text(''), 1500);
                }
                play = !play;
                prevGestureTime = new Date().getTime();
            }
            

            


            // if (frame.valid && frame.gestures.length > 0) {
            //     frame.gestures.forEach(function (gesture) {
            //         switch (gesture.type) {
            //             case "circle":
            //                 seek(frame, gesture, gestureText);
            //                 console.log("Circle Gesture");
            //                 break;
            //             case "keyTap":
            //                 console.log("Key Tap Gesture");
            //                 break;
            //             case "screenTap":
            //                 console.log("Screen Tap Gesture");
            //                 break;
            //             case "swipe":
            //                 console.log("Swipe Gesture");
            //                 break;
            //         }
            //     });
            // }
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
 * rewinded.
 * @param {Frame} frame The current frame given by the Leap Motion controller.
 * @param {CircleGesture} gesture The gesture object representing a circular finger movement.
 * @param {HTMLElement} gestureText The selector to update the text.
 */
function seek(frame, gesture, gestureText) {

    var clockwise = false;
    var pointableID = gesture.pointableIds[0];
    var direction = frame.pointable(pointableID).direction;
    var dotProduct = Leap.vec3.dot(direction, gesture.normal);

    if (dotProduct > 0) clockwise = true;

    var duration = gesture.duration;

    if (clockwise) {
        $(gestureText).text("Fast Forward Song by " + convertDuration(duration));
    } else {
        $(gestureText).text("Rewind Song by " + convertDuration(duration));
    }
}

function detectPauseGesture(hand) {
    var pitch = hand.pitch();
    var grabStrength = hand.grabStrength;
    console.log(pitch, grabStrength);

    var openHand = grabStrength < 0.25;
    var verticalHand = (pitch > 1.15 && pitch < 2);
    return openHand && verticalHand;
}

/**
 * Converts microseconds to a string of format HH:MM:SS
 * @param {number} durationMS The elapsed duration of the circle gesture up to the frame containing this gesture, in microseconds.
 * @returns The corresponding time in string format HH:MM:SS
 */
function convertDuration(durationMS) {
    var duration = durationMS / 1000000;
    var hours = Math.floor(duration / 3600);
    var minutes = Math.floor((duration - (hours * 3600)) / 60);
    var seconds = Math.ceil(duration - (hours * 3600) - (minutes * 60));

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    return `${hours}:${minutes}:${seconds}`;
}
