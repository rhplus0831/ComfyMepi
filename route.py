import json
import os
import random

import folder_paths as comfy_paths
import comfy.utils
import comfy.sd

from PIL import Image, ImageOps, ImageSequence
from PIL.PngImagePlugin import PngInfo
import numpy as np
from comfy.cli_args import args

global_category = 'mepi'


# Dirty copy of CheckpointLoaderSimple
class MepiCheckpoint:
    def __init__(self):
        self.loaded_loras = []

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "ckpt_name": (comfy_paths.get_filename_list("checkpoints"),
                              {"tooltip": "The name of the checkpoint (model) to load."}),
                "loras": ("STRING", {"display": "input", "multiline": True})
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP", "VAE")
    OUTPUT_TOOLTIPS = ("The model used for denoising latents.",
                       "The CLIP model used for encoding text prompts.",
                       "The VAE model used for encoding and decoding images to and from latent space.")
    FUNCTION = "reroute_load_checkpoint"

    CATEGORY = global_category
    DESCRIPTION = "Loads a diffusion model checkpoint and loras"

    def reroute_load_checkpoint(self, ckpt_name, loras):
        ckpt_path = comfy_paths.get_full_path_or_raise("checkpoints", ckpt_name)
        out = comfy.sd.load_checkpoint_guess_config(ckpt_path, output_vae=True, output_clip=True,
                                                    embedding_directory=comfy_paths.get_folder_paths("embeddings"))

        model = out[0]
        clip = out[1]
        vae = out[2]

        lora_split = loras.split(",")

        chunks = [(lora_split[i], lora_split[i+1], lora_split[i+2]) for i in range(0, len(lora_split), 3)]

        loaded_loras = self.loaded_loras.copy()
        self.loaded_loras.clear()

        for chunk in chunks:
            lora_file_name = chunk[0]
            lora_path = comfy_paths.get_full_path_or_raise("loras", lora_file_name)
            lora_strength_model = float(chunk[1])
            lora_strength_clip = float(chunk[2])

            cached_lora = None
            for lora in loaded_loras:
                if lora_file_name == lora[0]:
                    cached_lora = lora[1]
                    break

            if cached_lora is None:
                cached_lora = comfy.utils.load_torch_file(lora_path, safe_load=True)

            self.loaded_loras.append((lora_file_name, cached_lora))

            model, clip = comfy.sd.load_lora_for_models(model, clip, cached_lora, lora_strength_model, lora_strength_clip)

        return (model, clip, vae,)


class MepiPositivePrompt:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "prompt": ("STRING", {"display": "input", "multiline": True}),
            }
        }

    RETURN_TYPES = ("STRING",)
    OUTPUT_TOOLTIPS = ("Prompt for Positive.",)
    FUNCTION = "return_positive_prompt"

    CATEGORY = global_category
    DESCRIPTION = "Simply return positive prompt"

    def return_positive_prompt(self, prompt):
        return (prompt,)


class MepiNegativePrompt:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "prompt": ("STRING", {"display": "input", "multiline": True}),
            }
        }

    RETURN_TYPES = ("STRING",)
    OUTPUT_TOOLTIPS = ("Prompt for Negative.",)
    FUNCTION = "return_negative_prompt"

    CATEGORY = global_category
    DESCRIPTION = "Simply return negative prompt"

    def return_negative_prompt(self, prompt):
        return (prompt,)


# Dirty copy of Mira's StepsAndCfg
class MepiStepsAndCfg:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "steps": ("INT", {"default": 30, "step": 1, "min": 1}),
                "cfg": ("FLOAT", {"default": 7.0, "step": 0.01, "min": 1.0}),
            },
        }

    RETURN_TYPES = ("INT", "FLOAT",)
    RETURN_NAMES = ("STEPS", "CFG",)
    FUNCTION = "StepsAndCFGEx"
    CATEGORY = global_category

    def StepsAndCFGEx(self, steps, cfg):
        return (steps, cfg,)


class MepiImageSize:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "width": ("INT", {}),
                "height": ("INT", {})
            }
        }

    RETURN_TYPES = ("INT", "INT",)
    RETURN_NAMES = ("Width", "Height",)
    FUNCTION = "image_size"
    CATEGORY = global_category

    def image_size(self, width, height):
        return (width, height,)


class MepiSaveImage:
    def __init__(self):
        self.output_dir = comfy_paths.get_output_directory()
        self.type = "output"
        self.prefix_append = ""
        self.compress_level = 4

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE", {"tooltip": "The images to save."}),
                "filename_prefix": ("STRING", {"default": "ComfyUI",
                                               "tooltip": "The prefix for the file to save. This may include formatting information such as %date:yyyy-MM-dd% or %Empty Latent Image.width% to include values from nodes."})
            },
            "hidden": {
                "prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"
            },
        }

    RETURN_TYPES = ()
    FUNCTION = "save_images"

    OUTPUT_NODE = True

    CATEGORY = global_category
    DESCRIPTION = "Saves the input images to your ComfyUI output directory."

    def save_images(self, images, filename_prefix="ComfyUI", prompt=None, extra_pnginfo=None):
        filename_prefix += self.prefix_append
        full_output_folder, filename, counter, subfolder, filename_prefix = comfy_paths.get_save_image_path(
            filename_prefix, self.output_dir, images[0].shape[1], images[0].shape[0])
        results = list()
        for (batch_number, image) in enumerate(images):
            i = 255. * image.cpu().numpy()
            img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
            metadata = None
            if not args.disable_metadata:
                metadata = PngInfo()
                if prompt is not None:
                    metadata.add_text("prompt", json.dumps(prompt))
                if extra_pnginfo is not None:
                    for x in extra_pnginfo:
                        metadata.add_text(x, json.dumps(extra_pnginfo[x]))

            filename_with_batch_num = filename.replace("%batch_num%", str(batch_number))
            file = f"{filename_with_batch_num}_{counter:05}_.png"
            img.save(os.path.join(full_output_folder, file), pnginfo=metadata, compress_level=self.compress_level)
            results.append({
                "filename": file,
                "subfolder": subfolder,
                "type": self.type
            })
            counter += 1

        return {"ui": {"images": results}}
