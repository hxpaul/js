'use strict';
// I really liked the overlays that flickr used to do,
// so this is that.
(function(document, gU, round) {
  // requires http://www.clarkeology.com/js/gbbsUpdater.js
  // also requires an api at /i that can get or post
  // notes for images.
  // spec to come here...
  // GET /i/imageurl
  //  {
  //    notes: [
  //      {
  //        text: 'a label',
  //        coords: [left, top, right, bottom]
  //      }
  //    ]
  //  }
  // POST /i/imageurl
  //  {
  //    notes: [
  //      {
  //        text: 'a label',
  //        coords: [left, top, right, bottom]
  //      }
  //    ]
  //  }
  if (!gU) return;

  var images,
    box = 0,
    // now a load of strings for better minifying
    appendChild = 'appendChild',
    coords = 'coords',
    currentTarget = 'currentTarget',
    // src = 'src',
    scrollTop = 'scrollTop',
    scrollLeft = 'scrollLeft',
    heightString = 'height',
    widthString = 'width',
    style = 'style',
    body = 'body';

  function getOffset(element, offset) {
    offset = { x: 0, y: 0 };
    do {
      offset.x += element.offsetLeft - element[scrollLeft];
      offset.y += element.offsetTop - element[scrollTop];
    } while (element = element.offsetParent); // eslint-disable-line no-cond-assign
    return offset;
  }

  // first 250 chars of url, that needs to be unique enough
  // so it fits neatly in a varchar in the db
  function beginningOf(url) {
    return ('' + url).replace(/^\w+:\/+/, '').substr(0, 240);
  }

  function findImage(srcToFind, image, index) {
    for (index in images) {
      image = images[index];
      if (beginningOf(image.src) === beginningOf(srcToFind)) return image;
    }
    return null;
  }

  function drawNote(note, offset, image, overlay, src, left, top, width, height) {
    src = note.src;
    image = findImage(src);
    if (image) {
      offset = getOffset(image);
      if (!offset) return;
      left = offset.x + ((image[widthString] * note[coords][0]) / 100) + document[body][scrollLeft];
      top = offset.y + ((image[heightString] * note[coords][1]) / 100) + document[body][scrollTop];
      width = image[widthString] * ((note[coords][2] - note[coords][0]) / 100);
      height = image[heightString] * ((note[coords][3] - note[coords][1]) / 100);
      overlay = gU.cE('a'); // createElement, from gbbsUpdater.js
      overlay.className = 'overlay';
      overlay[style].color = '#' + (note.color || 'ff0');
      overlay[style].border = '1px solid ' + overlay[style].color;
      overlay[style].top = top + 'px';
      overlay[style].left = left + 'px';
      overlay[style][widthString] = width + 'px';
      overlay[style][heightString] = height + 'px';
      overlay.title = note.text;
      document[body][appendChild](overlay);
      // return overlay;
    }
  }

  function drawNotes(data, index) {
    if (JSON.parse) {
      data = JSON.parse(data);
      if (data.notes) {
        for (index = data.notes.length - 1; index >= 0; --index) {
          drawNote(data.notes[index]);
        }
      }
    }
  }

  function mousedown(event, image, src, offset, x, y, text, url) {
    if (!event.altKey) return;
    src = event[currentTarget].currentSrc;
    image = findImage(src);
    offset = getOffset(event[currentTarget]);
    x = event.pageX - offset.x - document[body][scrollLeft];
    y = event.pageY - offset.y - document[body][scrollTop];
    if (!box) { // this is our first click...
      box = {
        offset: offset,
        left: x,
        top: y
      };
      return;
    }
    // so this must be our second click...
    box.right = x;
    box.bottom = y;
    box.src = src;
    box[coords] = [
      round((box.left / image[widthString]) * 100), // left as %
      round((box.top / image[heightString]) * 100), // top as %
      round((box.right / image[widthString]) * 100), // right as %
      round((box.bottom / image[heightString]) * 100) // bottom as %
    ];
    drawNote(box);
    box.text = prompt('Enter a note for this area'); // eslint-disable-line no-alert
    if (box.text) {
      url = '/i/' + beginningOf(image.src) + '?_method=post' +
        '&text=' + box.text + '&' + coords + '[0]=' + box[coords][0] + '&' + coords + '[1]=' + box[coords][1] +
        '&' + coords + '[2]=' + box[coords][2] + '&' + coords + '[3]=' + box[coords][3];
      gU.get(url, drawNotes);
    }
    box = 0;
  }

  function init(index, image, lazy) {
    images = gU.tag('img'); // getElementsByTagName from gbbsUpdater.js
    // gU.debug && gU.debug('@todo delegate image event here?');
    for (index = images.length - 1; index >= 0; --index) {
      image = images[index];
      image[style][heightString] = '';
      lazy = image.getAttribute('data-lazy');
      if (lazy) image.src = lazy;
      if (!image.src.match(/icons|ebayamazon|lastfm|lst.fm/)) {
        gU.on(image, 'mousedown', mousedown);
        setTimeout(function() {
          gU.get('/i/' + this, drawNotes);
        }.bind(beginningOf(image.src)), 999);
      }
    }
  }

  gU.ok(init);
})(document, window.gU, Math.round);
