document.addEventListener('DOMContentLoaded', function () {
  display('Searching...');
});

function display(msg) {
  var el = document.body;
  el.innerHTML = msg;
}

chrome.runtime.getBackgroundPage(displayMessages);

function displayMessages(backgroundPage) {
  var html = '<ul>';
  html += backgroundPage.services.map(function (service) {
    return '<li class="service">'
            + service.name
            + '<span class="host">'
            + service.host + ':' + service.port
            + '</span>'
           '</li>';
  }).join('');
  html += '</ul>';
  display(html);

  var items = Array.prototype.slice.call(document.getElementsByTagName('li')),
      uiPage = chrome.extension.getURL("ui.html");

  items.forEach(function(li) {
    li.addEventListener('click', function() {
      chrome.tabs.create({url: uiPage});
    });
  });
}
