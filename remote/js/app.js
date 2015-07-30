/* jshint laxbreak: true, latedef: nofunc */
/*
  The following helper method are defined in
  playback-controls.js and search.js
*/
/* globals play, pause, nextTrack, previousTrack,
          setVolume, clearPlaylist, removeFromPlaylist,
          addToPlaylist, search
*/
'use strict';

chrome.runtime.getBackgroundPage(init);

var view,
    currentPlayer;

function init(backgroundPage) {

  var serviceId = decodeURIComponent(window.location.search.match(/service=([^&]*)/i)[1]);

  backgroundPage
    .playerByServiceName(serviceId)
    .then(buildUiWithPlayer);
}

function buildUiWithPlayer(player) {

  if (!player) {
    throw new Error('Player not found');
  }

  console.log('player: ', player);

  currentPlayer = player;

  view = createView();

  attachViewEventListeners(view);

  // Set the name of the current device
  view.set('state.name', player.name);

  fetchLiveStreams()
    .then(function (streams) {
      view.set('streams', streams);
    });

  addPlayerStateChangeListeners(player, view);
  fetchAndUpdateInitialState(player, view);
}


/*
  Live streams list
*/
function buildServicesList(json) {
  var promises = [];
  json.services.forEach(function (s) {
    promises.push( bbc.radio.extractStreamForUrl(s.playlist) );
  });
  return Promise.all(promises)
    .then(function (urls) {
      return json.services.map(function (service, index) {
        service.playlist = urls[index];
        return service;
      });
    });
}

function fetchLiveStreams() {
  return xhr.get('http://bbc.services.radiodan.net/services.json')
      .then(function (data) {
        return JSON.parse(data);
      })
      .then(
        buildServicesList,
        function (err) { console.error('Error fetching streams', err); }
      );
}

function attachViewEventListeners (view) {
  // view.observe('currentPlayer', function (newValue, oldValue, obj) {
  //   console.log('current', newValue, oldValue, obj);
  //   if (oldValue === undefined  || (newValue && newValue.id !== oldValue.id) ) {
  //     console.log('Swap global player', newValue, oldValue, obj);
  //     window.ui.player = newValue.player;
  //     view.set('search', { term: '', results: [] });
  //   }
  // });
  //
  // view.observe('search.term', function (newValue) {
  //   console.log('search.term', newValue);
  //   search(newValue);
  // });

  // Triggered when a radio stream is picked from the list
  view.on('stream', function (evt) {
    evt.original.preventDefault();
    var url = evt.node.href;
    currentPlayer
      .addToPlaylist(url)
      .then(currentPlayer.play);
  });

  view.on('next', function (evt) { currentPlayer.nextTrack(); });
  view.on('previous', function (evt) { currentPlayer.previousTrack(); });

  // Clear playlist
  view.on('clear', function (evt) {
    currentPlayer.clearPlaylist();
  });

  view.on('remove', function (evt) {
    var pos = evt.context.Pos;
    currentPlayer.removeFromPlaylist(pos);
  });

  view.on('add-direct', function (evt) {
    var file = evt.context.file;
    if (file) {
      currentPlayer.addToPlaylist(file);

      // Empty file input field in UI
      view.set('file', '');
    }
  });

  view.on('add', function (evt) {
    var file = evt.context.file;
    currentPlayer.addToPlaylist(file);
  });

  // When the volume field changes, check whether to update
  // the player volume
  view.observe('state.volume', function (newValue, oldValue) {
    console.log('ui volume changed from %o to %o ', oldValue, newValue);
    var firstSetting = newValue === null || oldValue === null;
    // Only send updates if change is from UI
    if (!firstSetting) {
      console.log('update volume to ', newValue);
      currentPlayer.setVolume(newValue);
    }
  });

  // Play or pause depending on what the current
  // player state is
  view.on('play-pause', function handlePlayPause(evt) {
    // Get the current button state
    var currentState = evt.context.state.playback;
    if (currentState === 'play') {
      currentPlayer.pause();
    } else {
      currentPlayer.play();
    }
  });

  // document.addEventListener('searchresults', function (evt) {
  //   view.set('search.results', evt.results);
  // });
}

function createView() {
  var view = new Ractive({
    el: '#view',
    template: '#view-template',
    data: {
      players: [],
      state: {},
      streams: [],
      search: {
        term: '',
        results: []
      },
      volume: null
    },
    debug: true
  });

  return view;
}

function fetchAndUpdateInitialState(player, view) {
  console.log('fetchAndUpdateInitialState', player, view);

  // Get status to do an initial update of
  // the user interface
  player.status()
    .then(function (status) {
      console.log('player.status', status);

      if (status.playlist) {
        view.set('state.playlist', status.playlist);
      }

      if (status.player.state) {
        view.set('state.playback', status.player.state);
      }

      if (status.player.volume) {
        view.set('state.volume', status.player.volume);
      }

      if (status.player.song) {
        view.set('state.current', status.player.song);
      }

      if (status.player.nextsong) {
        view.set('state.next', status.player.nextsong);
      }
    });
}

function addPlayerStateChangeListeners(player, view) {
  console.log('adding listeners to player: ', player);

  player.on('player', function (info) {
    console.log('player', info);

    if (info.state) {
      view.set('state.playback', info.state);
    }

    if (info.song) {
      view.set('state.current', info.song);
    }

    if (info.nextsong) {
      view.set('state.next', info.nextsong);
    }
  });

  player.on('volume', function (info) {
    var volume = parseInt(info.volume, 10);
    console.log('volume', volume);
    view.set('state.volume', volume);
  });

  player.on('playlist', function (playlist) {
    console.log('playlist', playlist);
    view.set('state.playlist', playlist);
  });
}
