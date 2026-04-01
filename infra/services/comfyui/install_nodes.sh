#!/bin/bash
set -euo pipefail

# Install ComfyUI custom nodes for EasyWan22
# Run during OCI image build

COMFYUI_DIR="${COMFYUI_DIR:-/app/ComfyUI}"
CUSTOM_NODES_DIR="${COMFYUI_DIR}/custom_nodes"

mkdir -p "${CUSTOM_NODES_DIR}"

NODES=(
    "https://github.com/kijai/ComfyUI-WanVideoWrapper"
    "https://github.com/kijai/ComfyUI-KJNodes"
    "https://github.com/kijai/ComfyUI-Florence2"
    "https://github.com/kijai/ComfyUI-DepthAnythingV2"
    "https://github.com/Fannovel16/ComfyUI-Frame-Interpolation"
    "https://github.com/ltdrdata/ComfyUI-Impact-Pack"
    "https://github.com/ltdrdata/ComfyUI-Impact-Subpack"
    "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite"
    "https://github.com/kijai/ComfyUI-segment-anything-2"
    "https://github.com/BRIA-AI/ComfyUI-BRIA-RMBG"
    "https://github.com/city96/ComfyUI-GGUF"
    "https://github.com/rgthree/rgthree-comfy"
    "https://github.com/pythongosssss/ComfyUI-Custom-Scripts"
    "https://github.com/Suzie1/ComfyUI_Comfyroll_CustomNodes"
    "https://github.com/cubiq/ComfyUI_essentials"
    "https://github.com/melMass/comfy_mtb"
    "https://github.com/ssitu/ComfyUI_UltimateSDUpscale"
    "https://github.com/WASasquatch/was-node-suite-comfyui"
    "https://github.com/crystian/ComfyUI-Crystools"
    "https://github.com/ltdrdata/ComfyUI-Inspire-Pack"
)

for repo in "${NODES[@]}"; do
    name=$(basename "${repo}")
    echo "Installing custom node: ${name}"
    if [ ! -d "${CUSTOM_NODES_DIR}/${name}" ]; then
        git clone --depth 1 "${repo}" "${CUSTOM_NODES_DIR}/${name}"
    fi
    if [ -f "${CUSTOM_NODES_DIR}/${name}/requirements.txt" ]; then
        pip install --no-cache-dir -r "${CUSTOM_NODES_DIR}/${name}/requirements.txt" || true
    fi
    if [ -f "${CUSTOM_NODES_DIR}/${name}/install.py" ]; then
        python3 "${CUSTOM_NODES_DIR}/${name}/install.py" || true
    fi
done

echo "All custom nodes installed successfully."
