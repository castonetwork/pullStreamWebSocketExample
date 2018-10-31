const connect = require("pull-ws/client");
const pull = require("pull-stream");
const {tap} = require("pull-tap");
const Pushable = require("pull-pushable");
let sendStream = Pushable();

const randomString = function (len) {
  var charSet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var randomString = "";
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
};

const challenge = {
  create: () => ({
    janus: "create",
    transaction: randomString(12)
  }),
  attach: obj => ({
    janus: "attach",
    opaque_id: "videoroomtest-oxiuc88HQWG7",
    plugin: "janus.plugin.videoroom",
    session_id: obj.data.id,
    transaction: randomString(12)
  }),
  message: obj => ({
    janus: "message",
    body: {
      request: "create",
      room: obj.roomId,
      videocodec: "H264",
      audiocode: "opus",
      notify_joining: true
    },
    opaque_id: "videoroomtest-oxiuc88HQWG7",
    plugin: "janus.plugin.videoroom",
    handle_id: obj.data.id,
    session_id: obj.session_id,
    transaction: randomString(12)
  })
};

connect(
  "ws://127.0.0.1:3030",
  {
    onConnect: (err, stream) => {
      if (err) throw err; //handle err
      console.log("connected");
      /* send stream */
      pull(
        sendStream,
        tap(o => console.log("sent:", o)),
        pull.map(JSON.stringify),
        stream
      );
      /* recv stream */
      pull(
        stream,
        pull.map(o => JSON.parse(o)),
        pull.drain(o => {
          console.log("recv:", o);
          if (o.janus === 'success') {
            if (!o.session_id) {
              sendStream.push(challenge.attach(o))
            } else if (!o.sender) {
              sendStream.push(challenge.message({...o, roomId: 1}))
            } else {
              console.log("that's all folks. success!");
            }
          }
        })
      );
      sendStream.push(challenge.create())
    }
  }
);
