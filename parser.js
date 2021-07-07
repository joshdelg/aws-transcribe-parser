const fs = require('fs');

const blockify = (newBlocks, transcriptObject, numSpeakers) => {
  const items = transcriptObject.results.items;

  if(numSpeakers > 1) {
    // Split transcript into blocks
    let blocks = [];

    let i = 0;
    const segments = transcriptObject.results.speaker_labels.segments;
    segments.forEach((seg) => {
      let speakerId = parseInt(seg.speaker_label.split('_')[1]);
      let speakerName = "Speaker " + speakerId;
      let startTime = seg.start_time;
      let endTime = seg.end_time;
      let text = "";

      const segmentItems = seg.items;
      segmentItems.forEach((word, index) => {
        let item = items[i];
        text += item.alternatives[0].content;
        if(items[i + 1] && (item.type == "pronunciation" && items[i + 1].type == "punctuation")) {
          text += items[i + 1].alternatives[0].content + " ";
          i++;
        } else {
          text += " ";
        }
        i++;
      });
      text = text.substring(0, text.length - 1);
      blocks.push({speakerId, speakerName, startTime, endTime, text});
    });

    let ind = 0;
    while(ind < blocks.length) {
      let currBlock = blocks[ind];
      let newText = "";
      while(blocks[ind] && blocks[ind].speakerId == currBlock.speakerId) {
        newText += blocks[ind].text + " ";
        ind++;
      }
      newText = newText.substring(0, newText.length - 1);
      newBlocks.push({...currBlock, startTime: currBlock.startTime, endTime: blocks[ind - 1].endTime, text: newText});
    }
  } else {
    newBlocks.push({
      speakerId: 0,
      speakerName: "Speaker 0",
      startTime: items[0].start_time,
      endTime: items[items.length - 2].end_time,
      text: transcriptObject.results.transcripts[0].transcript
    });
  }
};

const outputType = "html";
const speakerNames = {
  '0': 'Joe Biden',
  '1': 'Joe Biden',
  '2': 'Joe Biden'
};

fs.readFile(('./BidenAcceptanceSpeech.json'), (err, data) => {
  if(err) {
    console.log(err);
  } else {
    const object = JSON.parse(data);

    let blocks = [];
    blockify(blocks, object, 2);

    // Write to text file
    let output = "";
    blocks.forEach((block, i) => {
      const mins = Math.floor(block.startTime / 60);
      const secs = Math.floor(block.startTime % 60);

      if(outputType === "html") {
        output += `<h3>[${mins}:${(secs >= 10) ? (secs) : "0" + secs}] ${speakerNames[parseInt(block.speakerId)]}</h3>\n`
        output += `<p>${block.text}</p>\n`;
      } else {
        output += `[${mins}:${(secs >= 10) ? (secs) : "0" + secs}] ${speakerNames[parseInt(block.speakerId)]}: ${block.text}\n`;
      }
    });

    fs.writeFile('./BidenAccept.' + ((outputType === "html") ? 'html' : 'txt'), output, (err, data) => {
      if(err) throw err;
      console.log("Success!");
    });
  }
});