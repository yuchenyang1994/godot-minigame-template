self.position = {
  position: 0,
  ended: false,
  lastPostTime: 0,
  currentTime: 0
}

self.onmessage = event => {

  if (self.position.ended) {
    return;
  }
  if (event.data.msg.data.type === 'init') {
    self.position.currentTime = event.data.msg.data.currentTime;
  }

  if (event.data.msg.data.type === "process") {
    if (self.position.ended) {
      return;
    }
    if (event.data.msg.data.currentTime > 0) {
      self.position.currentTime = event.data.msg.data.currentTime;
    }

    self.position.position += event.data.msg.data.inputLength
    if (event.data.msg.data.currentTime - self.position.lastPostTime > 0.1) {
      self.position.lastPostTime = event.data.msg.data.currentTime;
      worker.postMessage({type: 'position', data: self.position.position})
    }
  }
}
