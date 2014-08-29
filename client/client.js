Template.controlPanel.speakers = function () {
  return Speakers.find()
}

Template.controlPanel.sounds = function () {
  return AudioChannels.find()
}

Meteor.subscribe('speakers')
Meteor.subscribe('audiochannels', function () {
  initAudioChannels()
})
Meteor.subscribe('audioevents')

window.AudioContext = window.AudioContext || window.webkitAudioContext
var context = new AudioContext()
var gainNode = context.createGain()

var speakerPosition = null
var sounds = {}

Template.controlPanel.rendered = function () {
  initAudioChannels()
  if (hasGetUserMedia()) {
    // We have mic
  } else {
    alert('getUserMedia() is not supported in your browser');
  }
}

Template.controlPanel.events({
  'click .subscribe-left': function () {
    speakerPosition = 'left'
    becomeSpeaker('left')
  },
  'click .subscribe-right': function () {
    speakerPosition = 'right'
    becomeSpeaker('right')
  },
  'click .play': function (e) {
    var soundName = $(e.target).attr('data-sound')
    newAudioEvent(soundName)
  },

  'input .pan': function () {
    var rightGain = $('.pan').val() / 100
    var leftGain = 1 - rightGain
    setSpeakerGain('left', leftGain)
    setSpeakerGain('right', rightGain)
  },

  'input .volume': function () {
    gainNode.gain.value = $('.volume').val()
  }
})

// Get webaudio to work on ios
window.addEventListener('click', function () {
  var buffer = context.createBuffer(1, 1, 22050)
  var source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  if (source.noteOn) {
    source.noteOn(0)
  } else {
    source.start(0)
  }
}, false)

function initAudioChannels () {
  if (AudioChannels.find().count() === 0) return
  AudioChannels.find().fetch()
  .forEach(function (channel) {
    bufferAudio(window.location.origin + channel.filePath, function (buffer) {
      sounds[channel.name] = {}
      sounds[channel.name].buffer = buffer
    })
  })
}

function bufferAudio (url, cb) {
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

function playSound (audioEvent) {
  //console.log(audioEvent)
  var soundName = audioEvent.name
  var time = moment(audioEvent.time)
  var timeDifference = moment(time).diff(moment()) / 1000

  if (timeDifference < 0) return
  console.log(context.currentTime, timeDifference)

  var source = context.createBufferSource()
  source.buffer = sounds[soundName].buffer
  source.connect(gainNode)
  gainNode.connect(context.destination)

  source.start(context.currentTime + timeDifference)

  $('.speaker-position').animate({ fontSize: '200px' }, 50).delay(50).animate({ fontSize: '70px' }, 50)
}

function becomeSpeaker (position) {
  var speakerQuery = Speakers.find({position: position})
  speakerQuery.observeChanges({
    changed: function (id, changes) {
      if (changes.gain != null) gainNode.gain.value = changes.gain
    }
  })

  var audioEventQuery = AudioEvents.find()
  audioEventQuery.observe({
    added: function (event) {
      playSound(event)
    }
  })

  $('body').removeClass().addClass(position)
}

function setSpeakerGain (position, gain) {
  var speaker = Speakers.findOne({position: position})
  Speakers.update(
    { _id: speaker._id },
    { $set: { gain: gain } }
  )
}

function newAudioEvent (name) {
  console.log('playing', name)
  var audioChannel = AudioChannels.findOne({name: name})

  AudioEvents.insert(
    {
      name: name,
      time: moment().add(3, 'seconds').toDate()
    }
  )
}

function hasGetUserMedia() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || 
    navigator.mozGetUserMedia || navigator.msGetUserMedia);
}