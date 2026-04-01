import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { env, envInt } from '../../shared/env.js';
import { createRouter } from './router.js';

const PORT = envInt('MCP_GATEWAY_PORT', 3100);
const ST_URL = env('SILLYTAVERN_URL', 'http://sillytavern:8000');
const COMFYUI_URL = env('COMFYUI_URL', 'http://comfyui:8188');

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mcp-gateway' });
});

// MCP tool routes
app.use('/api/v1', createRouter({ stUrl: ST_URL, comfyuiUrl: COMFYUI_URL }));

const server = http.createServer(app);

// WebSocket for real-time MCP protocol
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      // MCP protocol message handling
      ws.send(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { status: 'received' } }));
    } catch {
      ws.send(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`MCP Gateway listening on port ${PORT}`);
});
