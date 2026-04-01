import { Router, Request, Response } from 'express';

interface RouterConfig {
  stUrl: string;
  comfyuiUrl: string;
}

export function createRouter(config: RouterConfig): Router {
  const router = Router();

  // List available tools
  router.get('/tools', (_req: Request, res: Response) => {
    res.json({
      tools: [
        {
          name: 'comfyui.generate_video',
          description: 'Generate video from image using EasyWan22 workflow',
          inputSchema: {
            type: 'object',
            properties: {
              imageUrl: { type: 'string', description: 'URL or path to input image' },
              prompt: { type: 'string', description: 'Text prompt for video generation' },
              workflow: { type: 'string', description: 'Workflow name', default: '00_I2V' },
              frames: { type: 'number', description: 'Number of frames', default: 81 },
            },
            required: ['imageUrl'],
          },
        },
        {
          name: 'comfyui.list_workflows',
          description: 'List available ComfyUI workflows',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'comfyui.queue_status',
          description: 'Get ComfyUI generation queue status',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    });
  });

  // Execute tool
  router.post('/tools/:toolName/execute', async (req: Request, res: Response) => {
    const { toolName } = req.params;
    const { input } = req.body;

    // Validate toolName against known tools to prevent arbitrary endpoint access
    const knownTools = ['comfyui.queue_status', 'comfyui.list_workflows', 'comfyui.generate_video'];
    if (!knownTools.includes(toolName)) {
      res.status(404).json({ error: `Unknown tool: ${toolName}` });
      return;
    }

    try {
      switch (toolName) {
        case 'comfyui.queue_status': {
          const response = await fetch(`${config.comfyuiUrl}/queue`);
          const data = await response.json();
          res.json({ result: data });
          break;
        }
        case 'comfyui.list_workflows': {
          const response = await fetch(`${config.comfyuiUrl}/api/workflows`);
          const data = await response.json();
          res.json({ result: data });
          break;
        }
        case 'comfyui.generate_video': {
          const workflow = input?.workflow || '00_I2V';
          const response = await fetch(`${config.comfyuiUrl}/api/prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: input,
              workflow,
            }),
          });
          const data = await response.json();
          res.json({ result: data });
          break;
        }
        default:
          res.status(404).json({ error: `Unknown tool: ${toolName}` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(502).json({ error: `Tool execution failed: ${message}` });
    }
  });

  return router;
}
