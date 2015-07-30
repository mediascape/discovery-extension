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
          return player.status().then(function (s) { return s.response; });
        },
        on: function (name, callback) {
          return player.on(name, callback);
        },
        search: function search(term) {
          var promise;
          if (term.length > 0) {
            // Ask the player to search for anything
            // matching the term in artist name, titles etc.
            promise = player.search({ any: term }).then(function (s) { return s.response; });
          } else {
            promise = Promise.resolve([]);
          }
          return promise;
        }
      }
    }
  };
})();
