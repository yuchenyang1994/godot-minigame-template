self.position = {
  position: 0,
  ended: false,
  lastPostTime: 0,
  currentTime: 0
}

self.onmessage = event => {
  if (event?.data?.type === 'ended') {
    self.position.ended = true;
  }
  if (event?.data?.type === "process") {
    if (event.data.currentTime > 0) {
      self.position.currentTime = event.data.currentTime;
      return;
    }
    if (self.position.ended) {
      return;
    }
    if (event.data.input > 0) {
      const input = inputs[0];
      if (input.length > 0) {
        self.position.position += input[0].length;
      }
      if (event.data.currentTime - self.position.lastPostTime > 0.1) {
        self.position.lastPostTime = event.data.currentTime;
        self.postMessage({type: 'position', data: self.position.position})
      }
    }
  }
}
