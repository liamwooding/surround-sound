#Synchronising speakers

- Speakers listen to the Sync collection

- Controller adds a document to the Sync collection, containing a unix timestamp 10 seconds in the future

- Controller waits until that time, then plays an audio ping

- Speakers listen through the microphone, and when they hear that ping they measure the difference between their system clock and the Sync timestamp, saving that value

#Playing sounds

- Sounds are played by the controller adding a document to the AudioEvent collection

- The document contains an instruction and a timestamp

- Speakers add their own time difference to the timestamp and follow the instruction at that time