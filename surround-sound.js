if (Meteor.isClient) {

  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  var context = new AudioContext();

  var mooBuffer = null
  var gainNode = context.createGain();

  loadMooSound('http://localhost:3000/audio/moo.wav', function (buffer) {
    mooBuffer = buffer
  })

  Template.hello.rendered = function () {
    $('body').on('click', '.playMoo', function (e) {
      e.preventDefault()
      console.log("nope")
      playSound(mooBuffer)
    })
  }

  Template.hello.events({
    // 'click input.playMoo': function () {
    //   playSound(mooBuffer) 
    // },
    'input .volume': function () {
      console.log('yep')
      gainNode.gain.value = $('.volume').val();
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

function loadMooSound (url, cb) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function (buffer) {
      cb(buffer)
    }, function (err) {
      console.error("Couldn't load audio:", err)
    });
  }
  request.send();
}

function playSound (buffer) {

  // Connect the gain node to the destination.
  var source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;
  source.connect(gainNode);
  gainNode.connect(context.destination);

  source.start(0);
}