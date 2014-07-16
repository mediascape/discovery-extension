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

chrome.runtime.getBackgroundPage(buildUI);

function buildUI(backgroundPage) {
  var serviceId = window.location.search.match(/service=([^&]*)/i)[1],
      services  = backgroundPage.services,
      radiodan  = services[serviceId],
      players   = radiodan.txt.players,
      currentPlayer = players[0];

  window.ui = {};

  createPlayerSelection(players, currentPlayer.id);
  setupRadiodan(radiodan);
  createPlayer(currentPlayer.id);
}

function createPlayerSelection(players, selectedId) {
  var playerSelect = document.querySelector('#player-select');

  players.forEach(function(player) {
    var opt = document.createElement('option');
    opt.value = player.id;
    opt.innerHTML = player.name;

    if(selectedId === player.id) {
      opt.selected = true;
    }

    playerSelect.appendChild(opt);
  });

  playerSelect.addEventListener('change', function(e) {
    var selected  = e.srcElement.options.selectedIndex,
        newOption = e.srcElement.options[selected];

    window.ui = {};

    createPlayer(newOption.value);
  });
}

function setupRadiodan(service) {
  window.radiodan = window.Radiodan.create('http://'+service.address+':'+service.port);
}

function createPlayer(id) {
  /*
    Connect to a Radiodan Player.
    '1' is the ID of the player to
    connect to.
  */
  window.ui.player = window.radiodan.player.create(id);

  //var audio  = window.radiodan.audio.create('default');
  window.ui.audio  = window.radiodan.audio.create('default');
  //window.ui.audio  = window.ui.player;


  /*
     Playback controls
     */
  window.ui.playPauseEl = document.querySelector('#play-pause');

  // Listen for the play-pause button to be pressed
  window.ui.playPauseEl.addEventListener('click', handlePlayPause);

  /*
     Trigger either playing or paused when the button
     is clicked
     */
  function handlePlayPause() {
    // Get the current button state
    var currentState = window.ui.playPauseEl.dataset.state;
    if (currentState === 'paused') {
      setPlayState();
      play();
    } else {
      setPauseState();
      pause();
    }
  }

  // Set the button to the playing state
  // and actually start playing
  function setPlayState() {
    window.ui.playPauseEl.dataset.state = 'playing';
  }

  // Set the button to the paused state
  // and tell the player to pause
  function setPauseState() {
    window.ui.playPauseEl.dataset.state = 'paused';
  }

  /*
     Listen for general player state changes
     */
  window.ui.player.on('player', function (info) {
    if (info.state === 'play') {
      setPlayState();
    } else {
      setPauseState();
    }

    if (info.song) {
      setCurrentSong(info.song);
    }

    if (info.nextsong) {
      setNextSong(info.nextsong);
    }
  });

  /*
     Next
     */
  window.ui.nextEl = document.querySelector('#next');

  // Listen for the play-pause button to be pressed
  window.ui.nextEl.addEventListener('click', function () {
    nextTrack();
  });

  window.ui.previousEl = document.querySelector('#previous');

  // Listen for the play-pause button to be pressed
  window.ui.previousEl.addEventListener('click', function () {
    previousTrack();
  });

  /*
     Change the volume when the slide is moved
     */
  window.ui.volumeEl = document.querySelector('#volume');
  window.ui.volumeEl.addEventListener('change', function () {
    console.log('Volume', window.ui.volumeEl.value);
    setVolume(window.ui.volumeEl.value);
  });

  /*
     If the player volume is changed elsewhere in the
     system, change the position of the slider
     to match the new volume
     */
  window.ui.audio.on('volume', function(content) {
    console.log('Volume has changed to ', content.volume);
    setVolumeSlider(content.volume);
  });

  function setVolumeSlider(volume) {
    window.ui.volumeEl.value = volume;
  }

  /*
     When the playlist has changed, rebuild the
     playlist table
     */
  window.ui.currentPlaylistEl = document.querySelector('#current-playlist table tbody');
  window.ui.player.on('playlist', rebuildPlaylistTable);

  function rebuildPlaylistTable(content) {
    var html = '';
    if (content.length === 0) {
      html = '<tr><td colspan="6">Playlist is empty</td></tr>';
    } else {
      html = content.map(createPlaylistRowForItem).join('');
    }

    window.ui.currentPlaylistEl.innerHTML = html;
  }

  /*
     For a playlist item, returns a single
     table row of HTML markup
     */
  function createPlaylistRowForItem(item) {
    return    '<tr>'
      +   '<td><i class="indicator fa fa-circle"></i></td>'
      +   '<td>' + item.Pos + '</td>'
      +   '<td>' + (item.Name || item.Title || '') + '</td>'
      +   '<td>' + (item.Artist || '') + '</td>'
      +   '<td>' + '00:00' + '</td>'
      +   '<td><button class="remove no-button" data-pos="' + item.Pos + '"><i class="fa fa-times-circle"></i></button></td>'
      + '</tr>';
  }

  /*
     Clear the entire playlist when the button is pressed
     */
  window.ui.playlistClearButtonEl = document.querySelector('.clear-playlist');
  window.ui.playlistClearButtonEl.addEventListener('click', function () {
    clearPlaylist();
  });

  /*
     Remove an item from playlist when button's pressed
     */
  window.ui.currentPlaylistEl.addEventListener('click', handleRemovePlaylist);

  function handleRemovePlaylist(evt) {
    var targetEl = evt.target,
        position;

    // This will run for any click on the currentPlaylist element
    // If the element clicked is the icon, set the target as the
    // parent button
    if (targetEl.nodeName === 'I') {
      targetEl = targetEl.parentNode;
    }

    // If the target is the button then remove from the playlist
    if (targetEl.nodeName === 'BUTTON') {
      position = targetEl.dataset.pos;
    }

    if (position) {
      removeFromPlaylist(position);
    }
  }

  /*
     Add an item to the playlist from 'Add to playlist'
     */
  window.ui.addToPlaylistInput  = document.querySelector('.add-to-playlist input');
  window.ui.addToPlaylistButton = document.querySelector('.add-to-playlist button');

  window.ui.addToPlaylistButton.addEventListener('click', handleAddToPlaylist);

  function handleAddToPlaylist() {
    // Handle adding to playlist
    if (window.ui.addToPlaylistInput.value === '') { return; }

    // Add to the player's playlist
    addToPlaylist(window.ui.addToPlaylistInput.value);
  }

  /*
     Show the current and next songs on the playlist
     */
  function setCurrentSong(position) {
    clearCurrentSong();
    var row = window.ui.currentPlaylistEl.children[position];
    if (row) {
      row.classList.add('is-current');
    }
  }

  function clearCurrentSong() {
    var row = window.ui.currentPlaylistEl.querySelector('.is-current');
    if (row) {
      row.classList.remove('is-current');
    }
  }

  function setNextSong(position) {
    clearNextSong();
    var row = window.ui.currentPlaylistEl.children[position];
    if (row) {
      row.classList.add('is-next');
    }
  }

  function clearNextSong() {
    var row = window.ui.currentPlaylistEl.querySelector('.is-next');
    if (row) {
      row.classList.remove('is-next');
    }
  }

  /*
     Perform a search
     */
  window.ui.searchPanelEl   = document.querySelector('.search');
  window.ui.searchInputEl   = window.ui.searchPanelEl.querySelector('input');
  window.ui.searchButtonEl  = window.ui.searchPanelEl.querySelector('button');
  window.ui.searchResultsEl = window.ui.searchPanelEl.querySelector('tbody');

  // Perform a search when the text box changes or
  // a button is pressed
  window.ui.searchInputEl.addEventListener('input', performSearch);
  window.ui.searchButtonEl.addEventListener('click', performSearch);

  // Listen for the custom 'searchresults' event fired
  // on the document when results are result
  document.addEventListener('searchresults', populateSearchResults);

  function performSearch() {
    var term = window.ui.searchInputEl.value;
    search(term);
  }

  function populateSearchResults(evt) {
    var results = evt.results,
        html = '';

    if (results.length === 0) {
      html = '<tr><td colspan="5">No search results</td></tr>';
    } else {
      html = evt.results.map(createSearchRowForItem).join('');
    }

    window.ui.searchResultsEl.innerHTML = html;
  }

  function createSearchRowForItem(item) {
    return    '<tr>'
      +   '<td>' + (item.Name || item.Title || '') + '</td>'
      +   '<td>' + (item.Artist || '') + '</td>'
      +   '<td>' + (item.Time || '') + '</td>'
      +   '<td><button class="add no-button" data-file="' + item.file + '"><i class="fa fa-plus-circle"></i></button></td>'
      + '</tr>';
  }

  /*
     Adding a search result
     */
  // Listen for the 'add' button to be pressed on a search result
  window.ui.searchResultsEl.addEventListener('click', handleSearchAddClick);

  function handleSearchAddClick(evt) {
    var targetEl = evt.target,
        file;

    // This will run for any click on the searchResults element
    // If the element clicked is the icon, set the target as the
    // parent button
    if (targetEl.nodeName === 'I') {
      targetEl = targetEl.parentNode;
    }

    // If the target is the button then add to the playlist
    if (targetEl.nodeName === 'BUTTON') {
      file = targetEl.dataset.file;
    }

    if (file) {
      addToPlaylist(file);
    }
  }

  /*
     Live streams list
     */
  var streamsEl = document.querySelector('.streams');
  window.getJSON(
      'http://bbcradioservices.pixelblend.co.uk/services.json',
      buildServicesList
      );

  function buildServicesList(json) {
    streamsEl.innerHTML = json.services
      .map(createServiceListItem)
      .join('');
  }

  function createServiceListItem(service) {
    if (service.audioStreams.length > 0) {
      return '<li>'
        +   '<a href="' + service.audioStreams[0].url + '">'
        +     '<img src="' + service.logos.active + '" />'
        +     '<span>'
        +       '<i class="fa fa-plus-circle"></i> '
        +       (service.nowAndNext[0].brand || '')
        +     '</span>'
        +   '</a>'
        + '</li>';
    } else {
      return '';
    }
  }

  // Add stream to the playlist on click
  streamsEl.addEventListener('click', handleAddStream);

  function handleAddStream(evt) {
    var targetEl = evt.target,
        url;

    // Prevent any links being followed
    evt.preventDefault();

    // This will run for any click on the streams list element
    // If the parent of the element clicked is the anchor, then
    // set the parent as the target
    if (targetEl.parentNode.nodeName === 'A') {
      targetEl = targetEl.parentNode;
    }

    // If the target is the anchor then add to the playlist
    if (targetEl.nodeName === 'A') {
      url = targetEl.getAttribute('href');
    }

    console.log(targetEl, targetEl.parentNode, url);

    if (url) {
      addToPlaylist(url).then(play);
    }
  }

  // Get status to do an initial update of
  // the user interface
  window.ui.player.status()
    .then(function (status) {
      if (status.playlist) {
        rebuildPlaylistTable(status.playlist);
      }
      if (status.player.state && status.player.state === 'play') {
        setPlayState();
      } else {
        setPauseState();
      }

      if (status.player.song) {
        setCurrentSong(status.player.song);
      }

      if (status.player.nextsong) {
        setNextSong(status.player.nextsong);
      }
    });

  window.ui.audio.status()
    .then(function (status) {
      if (status.volume) {
        setVolumeSlider(status.volume);
      }
    });
}
