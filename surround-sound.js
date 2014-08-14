Speakers = new Meteor.Collection('speakers')
AudioChannels = new Meteor.Collection('audiochannels')
AudioEvents = new Meteor.Collection('audioevents')

if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Speakers.find().count() === 0) {
      Speakers.insert({
        position: 'left',
        gain: '0.5'
      })
      Speakers.insert({
        position: 'right',
        gain: '0.5'
      })
    }

    if (AudioChannels.find().count() === 0) {
      AudioChannels.insert({
        name: 'moo',
        filePath: '/audio/moo.mp3',
        playing: false
      })
      AudioChannels.insert({
        name: 'baa',
        filePath: '/audio/baa.mp3',
        playing: false
      })
      AudioChannels.insert({
        name: 'cowbell',
        filePath: '/audio/cowbell.mp3',
        playing: false
      })
    }
  })

  Meteor.publish('speakers', function () {
    return Speakers.find()
  })

  Meteor.publish('audiochannels', function () {
    return AudioChannels.find()
  })

  Meteor.publish('audioevents', function () {
    return AudioEvents.find()
  })
}

if (Meteor.isClient) {

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
}

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

function playSound (name) {
  console.log(name, sounds)
  var source = context.createBufferSource()
  source.buffer = sounds[name].buffer
  source.connect(gainNode)
  gainNode.connect(context.destination)

  source.start(0)

  $('.speaker-position').animate({ fontSize: '200px' }).delay(1000).animate({ fontSize: '70px' })
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
      var fiveSecondsAgo = moment().subtract('seconds', 5)
      if (moment(event.timestamp).isAfter(fiveSecondsAgo)) playSound(event.name)
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
      timestamp: moment().toISOString()
    }
  )
} 

function getNextMultipleOf (number, multiple) {
  if (number % multiple != 0) return Math.ceil(number / multiple) * multiple
  return number
}