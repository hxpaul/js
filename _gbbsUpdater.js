'use strict';
/**
 * Microlibrary, to do everything I was using jquery for
 * Also run through my own forum / blog, looking for things to change
 * based on cookies etc
 * gbbs was "grate bulletin board system" back in the day
 *
 * @author  Paul Clarke <paulypopex+php@gmail.com>
 */
var gU = (function(window, document) {

  // shortcuts for better compression
  // this script makes a lot of use of document.foo === document['foo']
  // document.fooBar can only be compressed to a.fooBar but
  // document['fooBar'] can be compressed to a[b] - shorter, see
  var className = 'className',
    _createElement = document.createElement.bind(document),
    addEventListener = 'addEventListener',
    removeChild = 'removeChild',
    innerHTML = 'innerHTML',
    length = 'length',
    message = 'message',
    remove = 'remove',
    edit = 'edit',
    adminLevel = {
      pauly: 10
    },
    security = {};
  security[edit] = 3;
  // security[remove] = 3;

  function _appendChild(element, child) {
    element.appendChild(child);
  }

  // To read a cookie, given the name. adapted from jquery.cookie
  // function _cookie(name, index, cookie, cookies) {
  //   cookies = document.cookie.split(/; */);
  //   for (index = cookies[length]; index >= 0; --index) {
  //     cookie = ('' + cookies[index])[replace](/^ /g, '');
  //     if (cookie.substr(0, name[length] + 1) == (name + '=')) {
  //       return decodeURIComponent(cookie.substr(name[length] + 1));
  //     }
  //   }
  // }

  function _setInnerHTML(element, content) { // like $.html
    if (element) {
      if (typeof content === 'string') {
        element[innerHTML] = content;
        return;
      }
      while (element.lastChild) {
        element[removeChild](element.lastChild);
      }
      _appendChild(element, content);
    }
  }

  // return a list item for the admin options
  function _adminLink(href, table, id, callback, anchor) {
    anchor = _createElement('a');
    if (id) anchor.id = table + id;
    // href will always be appended with id
    anchor.href = href + id;
    _setInnerHTML(anchor, table);
    if (callback) gU.on(anchor, 'click', callback);
    return anchor;
  }


  function _getElementsByTagName(id, context) {
    return (context || document).getElementsByTagName(id);
  }

  var gbbsUpdater = {
    on: function(element, event, callback) { // like $.on
      element[addEventListener](event, callback, false);
    },
    /* debug: function() {
      var console = window.console;
      console && console.log.apply(console, arguments);
    }, */
    id: document.getElementById.bind(document),
    tag: _getElementsByTagName,
    get: function(url, done, request) { // like $.get
      // don't support ie6
      request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) done(request.responseText); // eslint-disable-line eqeqeq
      };
      request.send();
    },
    json: function(url, done, tag, scriptName) { // like $.getJSON
      scriptName = '_cb' + (new Date()).getTime();
      tag = _createElement('script');
      tag.src = url.replace(/(\?|$)/, '?callback=' + scriptName + '&');
      _appendChild(document.body, tag);
      window[scriptName] = function(data) {
        done(data);
        delete window[scriptName];
        document.body[removeChild](tag);
      };
    },
    aC: _appendChild,
    cE: _createElement,
    html: _setInnerHTML
  };

  gbbsUpdater.ok = gbbsUpdater.on.bind(gbbsUpdater, window, 'load');

  // don't need gU.ok as we're at the bottom of the content anyway
  var index,
    links = _getElementsByTagName('a'),
    anchor,
    tagText,
    href,
    regex,
    user;

  regex = /lN=(\w+)/.exec(document.cookie);
  user = regex ? regex[1] : 0;

  for (index = links[length] - 1; index >= 0; --index) {
    anchor = links[index];
    tagText = anchor[innerHTML];

    // internal links that I used to do with <b> tags
    // any <a> with no href is considered a wiki style link
    if (!anchor.href) {
      anchor.title = 'Search for ' + tagText;
      anchor.href = '/' + (gbbsUpdater.id('section').content || 'wiki') + '/' + tagText.toLowerCase().split(/\W+/).join('+');
      anchor[className] = tagText;
    }

    href = anchor.href;
    // external links
    if (('' + href).indexOf(location.host) === -1) {
      anchor[className] += ' external';
      anchor.rel += ' noopener';
    }

    regex = /\/r\/(\d+)\/(\d+)#(\w*)/.exec(href);
    if (regex) {
      var board = regex[1],
        id = regex[2],
        div = anchor.parentElement,
        punter = regex[3];
      _appendChild(div, _adminLink('/tweet/' + message.charAt(0), 'tweet', id));
      if (user == punter || adminLevel[user] >= security[edit]) { // eslint-disable-line eqeqeq
        // was used on popbitch
        // _appendChild(div, _adminLink('/a?m=' + edit + '&b=' + board + '&confirm=1&key='', 'rebuild', id));
        _appendChild(div, _adminLink('/a?m=' + remove + '&b=' + board + '&key=', remove, id));
        _appendChild(div, _adminLink('/a?m=' + edit + '&b=' + board + '&key=', edit, id));
      }
      _appendChild(div, anchor);
    }
  }
  return gbbsUpdater;
})(window, document);
