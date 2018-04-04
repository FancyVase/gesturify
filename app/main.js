$(document).ready(function () {
    var gestureText = document.getElementById('gesture-text');

    // Called every time the Leap provides a new frame of data
    Leap.loop({
        hand: function (hand) {
            var handPos = hand.screenPosition();
            $(gestureText).text(handPos);
        }
    }).use('screenPosition', { scale: 0.5 });
});
