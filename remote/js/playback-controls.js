function play() {
  window.ui.player.play();
}

function pause() {
  window.ui.player.pause({ value: true });
}

function nextTrack() {
  return window.ui.player.next();
}

function previousTrack() {
  return window.ui.player.previous();
}

function setVolume(vol) {
  return window.ui.audio.volume({ value: vol });
}

function clearPlaylist() {
  return window.ui.player.clear();
}

function addToPlaylist(path) {
  return window.ui.player.add({ playlist: [ path ]});
}

function removeFromPlaylist(position) {
  return window.ui.player.remove({ position: position });
}
