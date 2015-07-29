window.radiodanPlayer = (function () {
  var supportedServiceTypes = [
    '_mediascape-http._tcp.local',
    '_radiodan-http._tcp.local'
  ];

  return {
    create: function (service) {
      if ( !_.include(supportedServiceTypes, service.serviceType) ) {
        throw new Error('Unsupport service type ', service.serviceType, ' expected ', supportedServiceTypes);
      }

      var uri = service.uri,
          playerId = service.txt.players[0],
          player = Radiodan.create(uri).player.create(playerId);

      return {
        play: function play() {
          return player.play();
        },
        pause: function pause() {
          return player.pause({ value: true });
        },
        nextTrack: function nextTrack() {
          return player.next();
        },
        previousTrack: function previousTrack() {
          return player.previous();
        },
        setVolume: function setVolume(vol) {
          return player.volume({ value: vol });
        },
        clearPlaylist: function clearPlaylist() {
          return player.clear();
        },
        addToPlaylist: function addToPlaylist(path) {
          return player.add({ playlist: [ path ]});
        },
        removeFromPlaylist: function removeFromPlaylist(position) {
          return player.remove({ position: position });
        },
        status: function status() {
          return player.status();
        }
      }
    }
  };
})();
