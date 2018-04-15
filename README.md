# gesturify
MIT 6.835 term project - gestures + speech + Spotify to maximize productivity

Run locally with
`python -m SimpleHTTPServer` and go to localhost:8000

To connect to Spotify, choose Gesturify from Spotify's Connect to a device window.

You can obtain an access token from the [Spotify Web Playback SDK Quick Start](https://beta.developer.spotify.com/documentation/web-playback-sdk/quick-start/) (Spotify Premium needed).

## Actions
| Feature              | Trigger + Description |
|----------------------|-----------------------|
| Fast Forward/ Rewind | Rotate the tip of the finger in the clockwise direction to fast forward the song, anti-clockwise to rewind. |
| Play/ Pause          | Extend the hand out to play/ pause the current song if paused/ playing. |
| Save Current Song    | Make thumbs up gesture to save the current song to the user's library. |
| Next/ Previous Song  | Swipe to the left to skip to the next song or to the right to skip to the previous song. |
| Volume Control       | Swipe up to raise the volume or down to lower it. |
| Search               | Make a fist gesture to search Spotify. |
