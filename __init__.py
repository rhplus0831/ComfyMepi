import os

from aiohttp import web

from server import PromptServer

static_folder = os.path.join(os.path.dirname(__file__), os.path.join("comfy-mepi-client", "out"))


@PromptServer.instance.routes.get("/mepi")
async def get_mepi(_):
    raise web.HTTPFound('./mepi/')


@PromptServer.instance.routes.get("/mepi/{subpath:.*}")
async def get_mepi_root(request):
    sub_path = request.match_info.get("subpath")
    if sub_path == '':
        sub_path = 'index.html'

    if sub_path[0] == '/' or '..' in sub_path:
        return web.Response(status=400)

    final_path = os.path.join(static_folder, sub_path)
    print(final_path)
    return web.FileResponse(final_path)


NODE_CLASS_MAPPINGS = {}  # to prevent 'import: failed'
