import json
import os

from aiohttp import web
from server import PromptServer

from .route import MepiCheckpoint, MepiPositivePrompt, MepiNegativePrompt, MepiStepsAndCfg, MepiSaveImage, MepiImageSize

static_folder = os.path.join(os.path.dirname(__file__), os.path.join("comfy-mepi-client", "out"))
preset_file = os.path.join(os.path.dirname(__file__), "presets.json")

if os.path.exists(preset_file):
    with open(preset_file, 'r', encoding='utf-8') as f:
        presets = json.loads(f.read())
else:
    presets = []


def __init__(self):
    pass


@PromptServer.instance.routes.get("/mepi")
async def get_mepi(_):
    raise web.HTTPFound('./mepi/')


@PromptServer.instance.routes.delete("/mepi/presets/{name}")
async def post_presets(request: web.Request):
    global presets
    del presets[request.match_info.get("name")]
    with open(preset_file, 'w', encoding='utf-8') as f:
        f.write(json.dumps(presets))
    return web.Response(status=204)


@PromptServer.instance.routes.post("/mepi/presets/{name}")
async def post_presets(request: web.Request):
    global presets
    presets[request.match_info.get("name")] = await request.json()
    with open(preset_file, 'w', encoding='utf-8') as f:
        f.write(json.dumps(presets))
    return web.Response(status=204)


@PromptServer.instance.routes.get("/mepi/{subpath:.*}")
async def get_mepi_root(request: web.Request):
    global presets
    sub_path = request.match_info.get("subpath")
    if sub_path == '':
        sub_path = 'index.html'

    if sub_path == 'presets':
        return web.Response(text=json.dumps(presets), content_type='application/json')

    if sub_path[0] == '/' or '..' in sub_path:
        return web.Response(status=400)

    final_path = os.path.join(static_folder, sub_path)
    print(final_path)
    return web.FileResponse(final_path)


NODE_CLASS_MAPPINGS = {
    "MepiCheckpoint": MepiCheckpoint,
    "MepiPositivePrompt": MepiPositivePrompt,
    "MepiNegativePrompt": MepiNegativePrompt,
    "MepiStepsAndCfg": MepiStepsAndCfg,
    "MepiSaveImage": MepiSaveImage,
    "MepiImageSize": MepiImageSize,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MepiCheckpoint": "Mepi Checkpoint and Loras Point",
    "MepiPositivePrompt": "Mepi Positive Prompt",
    "MepiNegativePrompt": "Mepi Negative Prompt",
    "MepiStepsAndCfg": "Mepi Steps & CFG",
    "MepiSaveImage": "Mepi Save Image",
    "MepiImageSize": "Mepi Image Size",
}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
