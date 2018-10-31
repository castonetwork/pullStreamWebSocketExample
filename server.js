const PORT = 3030;
const pull = require("pull-stream");
const {tap} = require("pull-tap");
const createServer = require("pull-ws/server");
const createSessionId = () => ~~(Math.random() * 65536);

const reqParser = {
  create: o => ({...o, janus: "success", data: {id: createSessionId()}}),
  attach: ({session_id, transaction}) => ({
    janus: "success",
    data: {
      id: createSessionId()
    },
    session_id,
    transaction
  }),
  message: ({session_id, transaction, handle_id}) => ({
    janus: "success",
    session_id,
    transaction,
    sender: handle_id,
    plugindata: {
      plugin: "janus.plugin.videoroom",
      data: {
        permanent: false,
        room: 1,
        videoroom: "created"
      }
    }
  })
}
;
createServer(function (stream) {
  pull(
    stream,
    pull.map(JSON.parse),
    tap(o => console.log("recv:", o)),
    pull.map(o => reqParser[o.janus] && reqParser[o.janus](o)),
    pull.map(JSON.stringify),
    tap(o => console.log("send:", o)),
    stream
  );
}).listen(PORT);
