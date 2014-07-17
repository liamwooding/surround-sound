Speakers = new Meteor.Collection('speakers')
AudioChannels = new Meteor.Collection('audiochannels')

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
    }
  })

  Meteor.publish('speakers', function () {
    return Speakers.find()
  })

  Meteor.publish('audiochannels', function () {
    return AudioChannels.find()
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

  window.AudioContext = window.AudioContext || window.webkitAudioContext
  var context = new AudioContext()
  var gainNode = context.createGain()

  var speakerPosition = null
  var buffers = {}

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
      setChannelPlaying(soundName, true)
      setTimeout(function () {
        setChannelPlaying(soundName, false)
      }, 100)
    },
    'click .playMooAll': function () {
      
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
      buffers[channel.name] = buffer
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
  var source = context.createBufferSource()
  source.buffer = buffers[name]
  source.connect(gainNode)
  gainNode.connect(context.destination)
  source.start(0)
}

function becomeSpeaker (position) {
  var speakerQuery = Speakers.find({position: position})
  speakerQuery.observeChanges({
    changed: function (id, changes) {
      if (changes.gain != null) gainNode.gain.value = changes.gain
    }
  })

  var channelQuery = AudioChannels.find()
  channelQuery.observe({
    changed: function (id, channel) {
      console.log('playing', channel.name)
      if (channel.playing === true) playSound(channel.name)
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

function setChannelPlaying (name, playing) {
  var audioChannel = AudioChannels.findOne({name: name})
  AudioChannels.update(
    { _id: audioChannel._id },
    { $set: { playing: playing } }
  )
}