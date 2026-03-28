## setup
```
apt update
apt install python3 python3-pip python3-venv
apt install git

cd /workspace

git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip wheel
pip install -r requirements.txt

cd custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Manager.git
cd ../
```

## Single-Image Model Files Download
```
wget https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors
mv qwen_image_vae.safetensors ./models/vae/

wget https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_edit_fp8_e4m3fn.safetensors
mv qwen_image_edit_fp8_e4m3fn.safetensors ./models/diffusion_models/

wget https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors
mv qwen_2.5_vl_7b_fp8_scaled.safetensors ./models/text_encoders/

wget https://huggingface.co/lightx2v/Qwen-Image-Lightning/resolve/main/Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors
mv Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors ./models/loras/
```


## Re-Light Model Files Download
```
wget https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b.safetensors
mv qwen_2.5_vl_7b.safetensors ./models/clip/

wget https://huggingface.co/aidiffuser/Qwen-Image-Edit-2509/resolve/main/Qwen-Image-Edit-2509_fp8_e4m3fn.safetensors
mv Qwen-Image-Edit-2509_fp8_e4m3fn.safetensors ./models/diffusion_models/

wget https://huggingface.co/lightx2v/Qwen-Image-Lightning/resolve/main/Qwen-Image-Lightning-8steps-V1.1.safetensors
mv Qwen-Image-Lightning-8steps-V1.1.safetensors ./models/loras/

wget https://huggingface.co/dx8152/Qwen-Image-Edit-2509-Relight/resolve/main/Qwen-Edit-Relight.safetensors
mv Qwen-Edit-Relight.safetensors ./models/loras/
```



## SUPIR Model Files Download
```
wget https://huggingface.co/Kijai/SUPIR_pruned/resolve/main/SUPIR-v0F_fp16.safetensors
mv SUPIR-v0F_fp16.safetensors ./models/checkpoints/

scp -P 1234 juggernautXL_v9Rdphoto2Lightning.safetensors root@69.19.137.247:/workspace/ComfyUI/models/checkpoints/
OR
wget --content-disposition "https://civitai.com/api/download/models/357609"
mv juggernautXL_v9Rdphoto2Lightning.safetensors ./models/checkpoints/
```



# running ComfyUI
```
cd /workspace/ComfyUI
source venv/bin/activate
python main.py
```