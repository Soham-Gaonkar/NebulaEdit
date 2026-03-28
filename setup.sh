#!/usr/bin/env bash
set -euo pipefail

# Colors
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

log() { echo -e "${GREEN}=>${NC} $1"; }
warn() { echo -e "${YELLOW}!!${NC} $1"; }
err() { echo -e "${RED}xx${NC} $1"; }

# Require running on Linux with apt
if ! command -v apt-get >/dev/null 2>&1; then
  err "This script requires Debian/Ubuntu (apt-get)."
  exit 1
fi

WORKDIR="/workspace"
COMFY_DIR="${WORKDIR}/ComfyUI"

# Apt packages
log "Updating apt and installing base packages"
export DEBIAN_FRONTEND=noninteractive
sudo -n true 2>/dev/null || warn "sudo not available or not passwordless; attempting apt-get directly"
APT="sudo apt-get"
if ! sudo -n true 2>/dev/null; then APT="apt-get"; fi
$APT update -y
$APT install -y python3 python3-pip python3-venv git wget ca-certificates

# Workspace directory
if [ ! -d "$WORKDIR" ]; then
  log "Creating workspace directory at $WORKDIR"
  mkdir -p "$WORKDIR"
fi
cd "$WORKDIR"

# Clone ComfyUI
if [ -d "$COMFY_DIR/.git" ]; then
  log "ComfyUI already cloned; pulling latest"
  git -C "$COMFY_DIR" fetch --depth=1 || true
  git -C "$COMFY_DIR" pull --ff-only || warn "Could not fast-forward pull; keeping current state"
else
  log "Cloning ComfyUI"
  git clone https://github.com/comfyanonymous/ComfyUI.git "$COMFY_DIR"
fi

cd "$COMFY_DIR"

# Python venv
if [ -d "venv" ]; then
  log "Python venv exists; reusing"
else
  log "Creating Python venv"
  python3 -m venv venv
fi

# Activate venv
# shellcheck disable=SC1091
source "venv/bin/activate"

# Upgrade pip/wheel and install requirements
log "Upgrading pip and wheel"
python -m pip install --upgrade pip wheel

log "Installing Python requirements"
pip install -r requirements.txt

# Custom nodes: ComfyUI-Manager
log "Ensuring custom nodes directory"
mkdir -p custom_nodes
if [ -d "custom_nodes/ComfyUI-Manager/.git" ]; then
  log "ComfyUI-Manager already present; updating"
  git -C custom_nodes/ComfyUI-Manager fetch --depth=1 || true
  git -C custom_nodes/ComfyUI-Manager pull --ff-only || warn "Could not fast-forward; keeping current"
else
  log "Cloning ComfyUI-Manager"
  git clone https://github.com/ltdrdata/ComfyUI-Manager.git custom_nodes/ComfyUI-Manager
fi

# Ensure model directories
log "Creating model directories"
mkdir -p models/vae \
         models/diffusion_models \
         models/text_encoders \
         models/loras \
         models/checkpoints \
         models/clip

# Helper: download if missing
download_if_missing() {
  local url="$1"; shift
  local target="$1"; shift
  local fname
  fname=$(basename "$target")
  if [ -f "$target" ]; then
    log "Exists: ${target} — skipping download"
    return 0
  fi
  log "Downloading ${fname}"
  wget -q --show-progress "$url" -O "$target"
}

# Single-Image Model Files
log "Downloading Single-Image model files (if needed)"
download_if_missing "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors" "models/vae/qwen_image_vae.safetensors"
download_if_missing "https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_edit_fp8_e4m3fn.safetensors" "models/diffusion_models/qwen_image_edit_fp8_e4m3fn.safetensors"
download_if_missing "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors" "models/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors"
download_if_missing "https://huggingface.co/lightx2v/Qwen-Image-Lightning/resolve/main/Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors" "models/loras/Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors"

# Re-Light Model Files
log "Downloading Re-Light model files (if needed)"
download_if_missing "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b.safetensors" "models/clip/qwen_2.5_vl_7b.safetensors"
download_if_missing "https://huggingface.co/aidiffuser/Qwen-Image-Edit-2509/resolve/main/Qwen-Image-Edit-2509_fp8_e4m3fn.safetensors" "models/diffusion_models/Qwen-Image-Edit-2509_fp8_e4m3fn.safetensors"
download_if_missing "https://huggingface.co/lightx2v/Qwen-Image-Lightning/resolve/main/Qwen-Image-Lightning-8steps-V1.1.safetensors" "models/loras/Qwen-Image-Lightning-8steps-V1.1.safetensors"
download_if_missing "https://huggingface.co/dx8152/Qwen-Image-Edit-2509-Relight/resolve/main/Qwen-Edit-Relight.safetensors" "models/loras/Qwen-Edit-Relight.safetensors"

# SUPIR Model Files
log "Downloading SUPIR model files (if needed)"
download_if_missing "https://huggingface.co/Kijai/SUPIR_pruned/resolve/main/SUPIR-v0F_fp16.safetensors" "models/checkpoints/SUPIR-v0F_fp16.safetensors"

# JuggernautXL: prefer civitai download if local file not present
JUG_LOCAL="${WORKDIR}/juggernautXL_v9Rdphoto2Lightning.safetensors"
JUG_TARGET="${COMFY_DIR}/models/checkpoints/juggernautXL_v9Rdphoto2Lightning.safetensors"
if [ -f "$JUG_TARGET" ]; then
  log "Exists: ${JUG_TARGET} — skipping"
elif [ -f "$JUG_LOCAL" ]; then
  log "Copying local JuggernautXL to checkpoints"
  cp "$JUG_LOCAL" "$JUG_TARGET"
else
  warn "Local JuggernautXL not found at ${JUG_LOCAL}; attempting Civitai download"
  # --content-disposition may save with an arbitrary name; place into target path explicitly
  TMPFILE=$(mktemp)
  if wget --content-disposition -O "$TMPFILE" "https://civitai.com/api/download/models/357609"; then
    mv "$TMPFILE" "$JUG_TARGET"
    log "Saved JuggernautXL to ${JUG_TARGET}"
  else
    warn "Civitai download failed; you can manually provide the file at ${JUG_LOCAL}"
    rm -f "$TMPFILE" || true
  fi
fi

log "Setup completed. You can now run ComfyUI manually."
