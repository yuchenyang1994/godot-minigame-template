let position = 0
let ended = false
let lastPostTime = 0
let currentTime = 0

worker.onMessage(event => {

  if (ended) {
    return;
  }
  if (event.type === 'init') {
    currentTime = event.currentTime;
  }

  if (event.type === "process") {

    position += event.inputLength
    if (event.currentTime - lastPostTime > 0.1) {
      lastPostTime = event.currentTime;
      worker.postMessage({type: 'position', data: position})
    }
  }
})
