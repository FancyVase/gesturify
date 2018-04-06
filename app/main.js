$(document).ready(function () {
    var gestureText = document.getElementById('gesture-text');
    var play = false;
    var prevPauseGestureTime = new Date().getTime();
    var prevGesture;
    var circleGestureDuration = 0;
    var prevCircleGestureTime = prevPauseGestureTime;
    var circleActions = ["forward", "reverse"];

    var controllerOptions = { enableGestures: true, background: true };

    function seek(frame, gesture, gestureText, duration, currentTime) {

        var clockwise = false;
        var pointableID = gesture.pointableIds[0];
        var direction = frame.pointable(pointableID).direction;
        var dotProduct = Leap.vec3.dot(direction, gesture.normal);
    
        if (dotProduct > 0) clockwise = true;

        if (circleActions.indexOf(prevGesture) < 0 || currentTime - prevCircleGestureTime > 500 || 
            prevGesture === "forward" && !clockwise || prevGesture === "reverse" && clockwise) {
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

    Leap.loop(controllerOptions, function (frame) {
        const numHands = frame.hands.length;

        // reset text
        if (numHands == 0) {
            $(gestureText).text('');
        }
        else if (numHands == 1) {
            var hand = frame.hands[0];
            var currentTime = new Date().getTime();

            if (detectPauseGesture(hand) && currentTime - prevPauseGestureTime >= 3500) {
                if (play) {
                    $(gestureText).text('Pause');
                    setTimeout(() => $(gestureText).text(''), 1500);
                } else {
                    $(gestureText).text('Play');
                    setTimeout(() => $(gestureText).text(''), 1500);
                }
                play = !play;
                prevPauseGestureTime = new Date().getTime();
                prevGesture = 'halt';
                circleGestureDuration = 0;
            }

            else if (frame.valid && frame.gestures.length > 0) {
                frame.gestures.forEach(function (gesture) {
                    switch (gesture.type) {
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

function detectPauseGesture(hand) {
    var pitch = hand.pitch();
    var grabStrength = hand.grabStrength;

    var openHand = grabStrength < 0.25;
    var verticalHand = (pitch > 1.15 && pitch < 2);
    return openHand && verticalHand;
}

/**
 * Converts microseconds to a string of format HH:MM:SS
 * TODO: Change this
 * @param {number} durationMS The elapsed duration of the circle gesture up to the frame containing this gesture, in microseconds.
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
