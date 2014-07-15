function play() {
  window.player.play();
}

function pause() {
  window.player.pause({ value: true });
}

function nextTrack() {
  return window.player.next();
}

function previousTrack() {
  return window.player.previous();
}

function setVolume(vol) {
  return window.audio.volume({ value: vol });
}

function clearPlaylist() {
  return window.player.clear();
}

function addToPlaylist(path) {
  return window.player.add({ playlist: [ path ]});
}

function removeFromPlaylist(position) {
  return window.player.remove({ position: position });
}
