function play() {
  player.play();
}

function pause() {
  player.pause({ value: true });
}

function nextTrack() {
  return player.next();
}

function previousTrack() {
  return player.previous();
}

function setVolume(vol) {
  return audio.volume({ value: vol });
}

function clearPlaylist() {
  return player.clear();
}

function addToPlaylist(path) {
  return player.add({ playlist: [ path ]});
}

function removeFromPlaylist(position) {
  return player.remove({ position: position });
}
