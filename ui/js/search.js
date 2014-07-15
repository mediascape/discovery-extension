function search(term) {
  if (term.length > 0) {
    // Ask the player to search for anything
    // matching teh term in artist name, titles etc.
    // Then, trigger a custom event containing the
    // results
    window.player.search({ any: term })
          .then(triggerResults);

    // Trigger a custom 'searchstarted' event
    // This will happen _before_ the search
    // code above completes
    triggerSearchStarted();
  } else {
    triggerResults([]);
  }
}

function triggerResults(results) {
  var evt = new CustomEvent('searchresults');
  evt.results = results;
  document.dispatchEvent(evt);
}

function triggerSearchStarted() {
  document.dispatchEvent( new CustomEvent('searchstarted') );
}
