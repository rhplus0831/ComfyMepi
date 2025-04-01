//@ts-nocheck

import Lora from "@/components/Lora";
import Prompt from "@/components/Prompt";
import {getAPIServer} from "@/config/site";

export interface StateContainer {
    [name: string]: State
}

export default interface State {
    checkpoint: string,
    vae: string,
    loras: Lora[],
    prompts: Prompt[],
    negativePrompt: string,
    imageSize: string,
    steps: number,
    cfg: number
    sampler: string,
    scheduler: string,
    seed: number,
    json: string
}

export async function PostAPI(state: State, client_id: string): Promise<string> {
    const prompt: any = JSON.parse(state.json)
    const data = Object.entries(prompt)

    data.forEach((value) => {
        if (value[1]['class_type'] == 'MepiCheckpoint') {
            value[1]['inputs']['ckpt_name'] = state.checkpoint
            value[1]['inputs']['loras'] = ''
            if (state.loras.length != 0) {
                let build = ''
                for (let i = 0; i < state.loras.length; i++) {
                    const lora = state.loras[i]
                    build += `${lora.name},${lora.modelWeight},${lora.clipWeight},`
                }
                value[1]['inputs']['loras'] = build.slice(0, -1)
            }
        } else if (value[1]['class_type'] == 'MepiPositivePrompt') {
            let positive = ''

            state.prompts.forEach((p) => {
                if (!p.prompt.trim()) return;
                positive += p.prompt.trimEnd() + ", "
            })
            positive = positive.slice(0, positive.length - 2)

            value[1]['inputs']['prompt'] = positive
        } else if (value[1]['class_type'] == 'MepiNegativePrompt') {
            value[1]['inputs']['prompt'] = state.negativePrompt
        } else if (value[1]['class_type'] == 'MepiStepsAndCfg') {
            value[1]['inputs']['steps'] = state.steps
            value[1]['inputs']['cfg'] = state.cfg
        } else if (value[1]['class_type'] == 'MepiImageSize') {
            const split = state.imageSize.split("x")

            value[1]['inputs']['width'] = parseInt(split[0])
            value[1]['inputs']['height'] = parseInt(split[1])
        } else if (value[1]['class_type'] == 'KSampler') {
            value[1]['inputs']['seed'] = state.seed > 0 ? state.seed : Math.floor(Math.random() * 9999999998 + 1)
        }
    })

    const response = await fetch(getAPIServer() + "prompt", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"prompt": prompt, "client_id": client_id})
    })

    const result = await response.json()

    return result["prompt_id"]
}

export async function PostState(state: State, client_id: string): Promise<string> {
    const prompt: any = {}

    if (state.json.trim().length !== 0) {
        return await PostAPI(state, client_id)
    }

    if (!state.checkpoint) {
        alert("체크포인트(Checkpoint)를 설정해야합니다.")
        throw Error()
    }

    prompt["1-CheckpointLoaderSimple"] = {
        "inputs": {
            "ckpt_name": state.checkpoint
        },
        "class_type": "CheckpointLoaderSimple"
    }

    if (state.vae) {
        prompt["6-VAELoader"] = {
            "inputs": {
                "vae_name": state.vae
            },
            "class_type": "VAELoader"
        }
    }

    let checkpointName = '1-CheckpointLoaderSimple'

    if (state.loras.length != 0) {
        for (let i = 0; i < state.loras.length; i++) {
            const lora = state.loras[i]
            const loraNumber = i + 10
            const holder = i == 0 ? "1-CheckpointLoaderSimple" : `${loraNumber - 1}-LoraLoader`

            prompt[`${loraNumber}-LoraLoader`] = {
                "inputs": {
                    "model": [
                        holder,
                        0
                    ],
                    "clip": [
                        holder,
                        1
                    ],
                    "lora_name": lora.name,
                    "strength_model": lora.modelWeight.toString(),
                    "strength_clip": lora.clipWeight.toString()
                },
                "class_type": "LoraLoader"
            }
        }
        checkpointName = `${state.loras.length + 9}-LoraLoader`
    }

    let positive = ''

    state.prompts.forEach((p) => {
        if (!p.prompt.trim()) return;
        positive += p.prompt.trimEnd() + ", "
    })
    positive = positive.slice(0, positive.length - 2)

    prompt["2-CLIPTextEncode"] = {
        "inputs": {
            "text": positive,
            "clip": [
                checkpointName,
                1
            ]
        },
        "class_type": "CLIPTextEncode"
    }

    prompt["3-CLIPTextEncode"] = {
        "inputs": {
            "text": state.negativePrompt.trim(),
            "clip": [
                checkpointName,
                1
            ]
        },
        "class_type": "CLIPTextEncode"
    }

    if (!state.imageSize) {
        alert("이미지 크기(imageSize)를 설정해야합니다.")
        throw Error()
    }

    const splited = state.imageSize.split("x")

    prompt["4-EmptyLatentImage"] = {
        "inputs": {
            "width": splited[0],
            "height": splited[1],
            "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
    }

    if (!state.sampler) {
        alert("샘플러(sampler)를 설정해야합니다.")
        throw Error()
    }

    if (!state.scheduler) {
        alert("스케쥴러(scheduler)를 설정해야합니다.")
        throw Error()
    }

    prompt["5-KSampler"] = {
        "inputs": {
            "model": [
                checkpointName,
                0
            ],
            "seed": state.seed > 0 ? state.seed : Math.floor(Math.random() * 9999999998 + 1),
            "steps": state.steps,
            "cfg": state.cfg,
            "sampler_name": state.sampler,
            "scheduler": state.scheduler,
            "positive": [
                "2-CLIPTextEncode",
                0
            ],
            "negative": [
                "3-CLIPTextEncode",
                0
            ],
            "latent_image": [
                "4-EmptyLatentImage",
                0
            ],
            "denoise": 1
        },
        "class_type": "KSampler"
    }

    prompt["7-VAEDecode"] = {
        "inputs": {
            "samples": [
                "5-KSampler",
                0
            ],
            "vae": state.vae ? [
                "6-VAELoader",
                0
            ] : [
                "1-CheckpointLoaderSimple",
                2
            ]
        },
        "class_type": "VAEDecode"
    }

    prompt["8-SaveImage"] = {
        "inputs": {
            "images": [
                "7-VAEDecode",
                0
            ],
            "filename_prefix": "ComfyMepi"
        },
        "class_type": "SaveImage"
    }

    const response = await fetch(getAPIServer() + "prompt", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"prompt": prompt, "client_id": client_id})
    })

    const result = await response.json()

    return result["prompt_id"]
}