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