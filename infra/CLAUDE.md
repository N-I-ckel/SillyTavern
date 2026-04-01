# Agent Platform — Infrastructure

## Architecture
3-layer: Bazelisk/Bazel 9.0 (build) → Helm Charts (package) → Kubeadm + GPU Operator (run)

## Key Principles
- **Zero hardcoding**: all config via values.yaml, env vars, or Doppler secrets
- **Hermetic builds**: Bazel with MODULE.bazel (Bzlmod), pinned digests
- **GPU-native**: NVIDIA GPU Operator + NIM for AI inference
- **Observable**: Prometheus + Grafana + Loki + DCGM Exporter

## Build
```bash
bazel build //...        # Build all
bazel test //...         # Test all
bazel run //k8s:deploy_local   # Deploy to local Kubeadm
```

## Helm
```bash
helm lint charts/agent-platform
helm install ap charts/agent-platform -f charts/agent-platform/values-local.yaml
```

## Directory Layout
- `services/` — Source code for each microservice
- `charts/` — Helm umbrella chart + subcharts
- `k8s/` — Kubeadm config + deploy targets
- `.devcontainer/` — Dev Container for consistent environment

## Services
| Service | Port | Description |
|---------|------|-------------|
| SillyTavern | 8000 | AI chat frontend |
| MCP Gateway | 3100 | Model Context Protocol router |
| Agent Orchestrator | 3200 | Multi-agent session manager |
| ComfyUI | 8188 | Image/video generation (EasyWan22) |
| Redis | 6379 | Session/cache store |

## Naming
- Helm values: camelCase
- K8s resources: kebab-case
- Environment vars: UPPER_SNAKE_CASE
- TypeScript: camelCase
- Python: snake_case
