const http = require('http');

const WSTEST_PAGE = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>wstest</title>
<style>
  body { font-family: monospace; margin: 2rem; }
  button { font-size: 1rem; padding: 0.4rem 1rem; }
  dl { display: grid; grid-template-columns: max-content auto; gap: 0.25rem 1rem; }
  dt { font-weight: bold; }
  #status { margin-top: 1rem; }
</style>
</head>
<body>
<h1>WebSocket latency test</h1>
<p>Connects to PieSocket, sends a message, waits for it to echo back.</p>
<button id="run">Run test</button>
<div id="status"></div>
<dl id="results"></dl>
<script>
const WS_URL = 'wss://server.lon1.piesocket.com/v3/webhealthcheck?api_key=BUMOKv60mTfXUoHRKxpYxUup4Y9InaU01tMJFMuR&notify_self';

function setStatus(text) {
  document.getElementById('status').textContent = text;
}

function setResult(label, value) {
  const dl = document.getElementById('results');
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  dl.appendChild(dt);
  dl.appendChild(dd);
}

document.getElementById('run').addEventListener('click', () => {
  document.getElementById('results').innerHTML = '';
  setStatus('Connecting...');

  const connectStart = performance.now();
  const ws = new WebSocket(WS_URL);
  const payload = 'ping-' + connectStart;
  let sendTime;
  let timeout;

  const finish = () => {
    clearTimeout(timeout);
    ws.close();
  };

  ws.addEventListener('open', () => {
    const connectMs = performance.now() - connectStart;
    setResult('Time to connect', connectMs.toFixed(1) + ' ms');
    setStatus('Connected, sending message...');

    sendTime = performance.now();
    ws.send(payload);

    timeout = setTimeout(() => {
      setStatus('Timed out waiting for response.');
      finish();
    }, 10000);
  });

  ws.addEventListener('message', (event) => {
    if (event.data !== payload) return;
    const roundTripMs = performance.now() - sendTime;
    setResult('Time to receive response', roundTripMs.toFixed(1) + ' ms');
    setStatus('Done.');
    finish();
  });

  ws.addEventListener('error', () => {
    setStatus('Connection error.');
    finish();
  });

  ws.addEventListener('close', (event) => {
    clearTimeout(timeout);
    if (event.wasClean === false && !document.getElementById('results').children.length) {
      setStatus('Connection closed unexpectedly.');
    }
  });
});
</script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  if (req.url === '/wstest') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(WSTEST_PAGE);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(process.version);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
