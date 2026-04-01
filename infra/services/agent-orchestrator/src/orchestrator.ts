import express from 'express';
import { env, envInt, envBool } from '../../shared/env.js';

const PORT = envInt('ORCHESTRATOR_PORT', 3200);
const MAX_AGENTS = envInt('MAX_AGENTS', 10);
const TIMEOUT_MS = envInt('AGENT_TIMEOUT_MS', 30000);
const MCP_GATEWAY_URL = env('MCP_GATEWAY_URL', 'http://mcp-gateway:3100');
const OPENCLAW_URL = env('OPENCLAW_URL', 'http://openclaw:8080');
const SANDBOX_ENABLED = envBool('SANDBOX_ENABLED', true);

interface AgentSession {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  createdAt: Date;
  sandboxId?: string;
}

const sessions = new Map<string, AgentSession>();

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'agent-orchestrator',
    activeSessions: sessions.size,
    maxAgents: MAX_AGENTS,
  });
});

// Create agent session
app.post('/api/v1/sessions', async (req, res) => {
  if (sessions.size >= MAX_AGENTS) {
    res.status(429).json({ error: 'Maximum agent sessions reached' });
    return;
  }

  const id = crypto.randomUUID();
  const session: AgentSession = { id, status: 'idle', createdAt: new Date() };

  if (SANDBOX_ENABLED) {
    try {
      const response = await fetch(`${OPENCLAW_URL}/api/v1/sandboxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'all', scope: 'session', sessionId: id }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const sandbox = await response.json();
      session.sandboxId = sandbox.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(502).json({ error: `Sandbox creation failed: ${message}` });
      return;
    }
  }

  sessions.set(id, session);
  res.status(201).json(session);
});

// List sessions
app.get('/api/v1/sessions', (_req, res) => {
  res.json({ sessions: Array.from(sessions.values()) });
});

// Delete session
app.delete('/api/v1/sessions/:id', async (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (session.sandboxId && SANDBOX_ENABLED) {
    await fetch(`${OPENCLAW_URL}/api/v1/sandboxes/${session.sandboxId}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch(() => {});
  }

  sessions.delete(req.params.id);
  res.status(204).send();
});

// Execute tool via MCP Gateway
app.post('/api/v1/sessions/:id/execute', async (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  session.status = 'running';
  const { tool, input } = req.body;

  try {
    const response = await fetch(`${MCP_GATEWAY_URL}/api/v1/tools/${tool}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const result = await response.json();
    session.status = 'completed';
    res.json(result);
  } catch (error) {
    session.status = 'error';
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({ error: `Tool execution failed: ${message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Agent Orchestrator listening on port ${PORT} (max=${MAX_AGENTS}, sandbox=${SANDBOX_ENABLED})`);
});
