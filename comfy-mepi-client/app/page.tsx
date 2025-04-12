"use client"

import {v4 as uuidv4} from 'uuid';
import {ThemeSwitch} from "@/components/theme-switch";
import {Accordion, AccordionItem} from "@nextui-org/accordion";
import {Select, SelectItem} from "@nextui-org/select";
import {Button} from "@nextui-org/button";
import {Input, Textarea} from "@nextui-org/input";
import {Slider} from "@nextui-org/slider";
import {useEffect, useRef, useState} from "react";
import {getAPIServer} from "@/config/site";
import Lora from "@/components/Lora";
import LoraBox from "@/components/LoraBox";
import State, {PostState, StateContainer} from "@/components/State";
import Prompt from "@/components/Prompt";
import PromptBox from "@/components/PromptBox";
import {useDisclosure} from "@nextui-org/use-disclosure";
import {Drawer, DrawerBody, DrawerHeader} from "@nextui-org/drawer";
import {AutocompleteItem, Checkbox, DrawerContent} from "@nextui-org/react";
import {MdDeleteForever, MdOutlineFileDownload, MdSave, MdSettings} from "react-icons/md";
import {CircularProgress} from "@nextui-org/progress";
import DanbooruTrieSearchProvider from "@/components/DanbooruTrieSearch";
import {Autocomplete} from "@nextui-org/autocomplete";
import {FaFileImport} from "react-icons/fa6";
import {Popover, PopoverContent, PopoverTrigger} from "@nextui-org/popover";

export default function Home() {
    const clientId = useRef("")

    const [checkpoints, setCheckPoints] = useState<string[]>([])
    const [VAEs, setVAEs] = useState<string[]>([])
    const [loraNames, setLoraNames] = useState<string[]>([])
    const [samplers, setSamplers] = useState<string[]>([])
    const [schedulers, setSchedulers] = useState<string[]>([])

    const [selectedCheckpoint, setSelectedCheckpoint] = useState("")
    const [selectedVAE, setSelectedVAE] = useState("")
    const [loras, setLoras] = useState<Lora[]>([])

    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [negativePrompt, setNegativePrompt] = useState("")

    const [selectedImageSize, setSelectedImageSize] = useState("1024x1024")
    const [selectedSampler, setSelectedSampler] = useState("")
    const [selectedScheduler, setSelectedScheduler] = useState("")

    const [steps, setSteps] = useState(25)
    const [cfg, setCfg] = useState(5)
    const [seed, setSeed] = useState(-1)
    const [json, setJson] = useState("")

    const [useLocalPresets, setUseLocalPresets] = useState(false)

    const [progress, setProgress] = useState("")

    const [inited, setInited] = useState(false)

    const [presets, setPresets] = useState<StateContainer>({})

    const audio = useRef<HTMLAudioElement | null>(null)
    const [playEffectOnComplete, setPlayEffectOnComplete] = useState(false);

    const imageSizes = [
        "1536x640",
        "1344x768",
        "1216x832",
        "1152x896",
        "1024x1024",
        "832x1216",
        "768x1344",
    ]

    function updateLora(lora: Lora) {
        const newLoras = loras.map((item: Lora) => {
            if (item.uuid == lora.uuid) {
                return lora;
            } else {
                return item;
            }
        })

        setLoras(newLoras)
    }

    function removeLora(lora: Lora) {
        setLoras(loras.filter((item) => {
            return item.uuid != lora.uuid
        }))
    }

    function updatePrompt(prompt: Prompt) {
        const newPrompts = prompts.map((item: Prompt) => {
            if (item.uuid == prompt.uuid) {
                return prompt;
            } else {
                return item;
            }
        })

        setPrompts(newPrompts)
    }

    function removePrompt(prompt: Prompt) {
        setPrompts(prompts.filter((item) => {
            return item.uuid != prompt.uuid
        }))
    }

    function loadState(state: State) {
        setSelectedCheckpoint(state.checkpoint)
        setSelectedVAE(state.vae)
        setLoras(state.loras)
        setPrompts(state.prompts)
        setNegativePrompt(state.negativePrompt)
        setSelectedImageSize(state.imageSize)
        setSteps(state.steps)
        setCfg(state.cfg)
        setSelectedSampler(state.sampler)
        setSelectedScheduler(state.scheduler)
        setSeed(state.seed)
        setJson(state.json)
    }

    async function loadPresets() {
        if (localStorage.getItem("localPreset") === "true") {
            const presetsStr = localStorage.getItem("presets")
            if (presetsStr) {
                setPresets(JSON.parse(presetsStr)["presets"])
            }
        } else {
            const presetsReq = await fetch(getAPIServer() + "mepi/presets", {
                method: "GET"
            })
            const presets = await presetsReq.json()
            console.log(presets)
            console.log("presets loaded")
            setPresets(presets)
        }
    }

    useEffect(() => {
        async function initAsync() {
            const objectInfoReq = await fetch(getAPIServer() + "object_info")
            const objectInfo = await objectInfoReq.json()

            setCheckPoints(objectInfo["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0])
            setVAEs(objectInfo["VAELoader"]["input"]["required"]["vae_name"][0])
            setLoraNames(objectInfo["LoraLoader"]["input"]["required"]["lora_name"][0])
            setSamplers(objectInfo["KSampler"]["input"]["required"]["sampler_name"][0])
            setSchedulers(objectInfo["KSampler"]["input"]["required"]["scheduler"][0])

            const stateStr = localStorage.getItem("lastState")

            if (stateStr) {
                const state: State = JSON.parse(stateStr)

                loadState(state)
            }

            await loadPresets()

            const lastPUUID = localStorage.getItem("lastPromptUUID")
            if (lastPUUID) {
                setLastPromptUUID(lastPUUID)
            }
            audio.current = new Audio(getAPIServer() + "mepi/V_Mephisto_C_Work02_KR.opus")
            console.log(`setPlayEffectOnComplete: ${localStorage.getItem("playEffectOnComplete")}`)
            setPlayEffectOnComplete(localStorage.getItem("playEffectOnComplete") != null)
            setInited(true)
        }

        const cid = localStorage.getItem("clientId")
        if (cid) {
            clientId.current = cid
        } else {
            const uuid = uuidv4()
            localStorage.setItem("clientId", uuid)
            clientId.current = uuid
        }

        initAsync().then()
    }, [])

    function generateState() {
        const state: State = {
            "checkpoint": selectedCheckpoint,
            "vae": selectedVAE,
            "loras": loras,
            "prompts": prompts,
            "negativePrompt": negativePrompt,
            "imageSize": selectedImageSize,
            "steps": steps,
            "cfg": cfg,
            "sampler": selectedSampler,
            "scheduler": selectedScheduler,
            "seed": seed,
            "json": json,
        }

        return state
    }

    useEffect(() => {
        if (!inited) return;
        const state = generateState();

        localStorage.setItem("lastState", JSON.stringify(state))
    }, [selectedCheckpoint, selectedVAE, loras, prompts, negativePrompt, selectedImageSize, steps, cfg, selectedSampler, selectedScheduler, seed, json]);

    async function savePresets(presets: StateContainer, target: string) {
        if (localStorage.getItem("localPreset") === "true") {
            localStorage.setItem("presets", JSON.stringify({
                "presets": presets
            }))
        } else {
            async function postSelf() {
                await fetch(getAPIServer() + `mepi/presets/${target}`, {
                    method: "POST",
                    body: JSON.stringify(presets[target])
                })
            }

            postSelf().then()
        }
    }

    async function deletePresets(presets: StateContainer, target: string) {
        if (localStorage.getItem("localPreset") === "true") {
            await savePresets(presets, target)
        } else {
            async function postSelf() {
                await fetch(getAPIServer() + `mepi/presets/${target}`, {
                    method: "DELETE"
                })
            }

            postSelf().then()
        }
    }

    const [isConnected, setConnected] = useState(false)
    const [lastPromptUUID, setLastPromptUUID] = useState("")

    function generateWebsocket() {
        ws.current = new WebSocket(getAPIServer().replace("http", "ws") + "ws?clientId=" + clientId.current);
        ws.current.onopen = () => {
            setConnected(true)
        }
        ws.current.onerror = () => {
            setTimeout(generateWebsocket, 1000)
            setConnected(false)
        }
        ws.current.onclose = () => {
            setConnected(false)
        };
    }

    const ws = useRef<WebSocket | null>(null);
    useEffect(() => {
        generateWebsocket()
        return () => {
            if (ws.current && ws.current.readyState === 1) {
                ws.current.close();
            }
        };
    }, []);

    async function findAndDisplayPrompt(uuid: string) {
        const response = await fetch(getAPIServer() + "history/" + uuid)
        const history = await response.json()

        if (!history.hasOwnProperty(uuid)) {
            return
        }

        let imageMeta
        if (history[uuid]["outputs"].hasOwnProperty("8-SaveImage")) {
            imageMeta = history[uuid]["outputs"]["8-SaveImage"]["images"][0]
        } else {
            let found = '?'
            const prompt: any = JSON.parse(json)
            const data = Object.entries(prompt)

            data.forEach((value) => {
                // @ts-ignore
                if (value[1]['class_type'] == 'MepiSaveImage') {
                    found = value[0]
                }
            })

            imageMeta = history[uuid]["outputs"][found]["images"][0]
        }
        setDestImageSrc(getAPIServer() + `view?filename=${imageMeta["filename"]}&subfolder=${imageMeta["subfolder"]}&type=${imageMeta["type"]}&preview=true`)
    }

    useEffect(() => {
        if (!ws.current) return
        if (lastPromptUUID) {
            findAndDisplayPrompt(lastPromptUUID).then()
        }
        ws.current.onmessage = (event) => {
            if (event.data) {
                const msg = JSON.parse(event.data)
                const type: string = msg["type"]
                const data = msg["data"]

                console.log(data)
                console.log(lastPromptUUID)

                if (data.hasOwnProperty("prompt_id") && data["prompt_id"] === lastPromptUUID) {
                    if (type == "progress") {
                        setProgress(`${type}: (${data["value"]} / ${data["max"]})`)
                    } else if (type == "execution_success") {
                        if (playEffectOnComplete && audio.current != null) {
                            audio.current.volume = 0.5
                            audio.current.play()
                        }
                        setProgress("")
                        findAndDisplayPrompt(lastPromptUUID).then()
                    } else {
                        if (data["node"] !== null) {
                            setProgress(`${type}: ${data["node"]}`)
                        }
                    }
                }
            }
        };
    }, [ws, lastPromptUUID, playEffectOnComplete]);

    const drawerClosure = useDisclosure();

    const [destImageSrc, setDestImageSrc] = useState<string | undefined>(undefined)

    const [currentPreset, setCurrentPreset] = useState("")
    const deleteConfirmClosure = useDisclosure()

    return (
        <section className={"flex flex-col p-1 w-full h-full max-h-full items-center"}>
            <header className={"flex flex-row items-center w-full max-w-7xl flex-shrink-0"}>
                <button onClick={drawerClosure.onOpen}>
                    <MdSettings size={32}/>
                </button>
                <span className={"text-lg mx-2"}>메피메피</span>
                <ThemeSwitch/>
            </header>
            <DanbooruTrieSearchProvider>
                <Drawer isOpen={drawerClosure.isOpen} placement={"left"} isDismissable={false}
                        onOpenChange={drawerClosure.onOpenChange}
                        size={'lg'}>
                    <DrawerContent>
                        {(onClose) => (
                            <>
                                <DrawerHeader>생성 옵션{json ? " (API Mode)" : ""}</DrawerHeader>
                                <DrawerBody>
                                    <section className={"max-w-md flex flex-col gap-4"}>
                                        <Accordion selectionMode={"multiple"}>
                                            <AccordionItem key="preset" aria-label="Preset" title="Preset">
                                                <div className={"w-full h-full"}>
                                                    <Autocomplete allowsCustomValue inputValue={currentPreset}
                                                                  onInputChange={(value) => {
                                                                      setCurrentPreset(value)
                                                                  }} label={"Preset name (new or exist)"}>
                                                        {Object.keys(presets).map((value) => (
                                                            <AutocompleteItem
                                                                key={value}>{value}</AutocompleteItem>
                                                        ))}
                                                    </Autocomplete>
                                                    <div className={"w-full flex justify-end gap-2 my-2"}>
                                                        <Button isIconOnly onPress={() => {
                                                            const newPresets = presets
                                                            newPresets[currentPreset] = generateState()
                                                            setPresets({...newPresets})
                                                            savePresets(newPresets, currentPreset).then()
                                                        }}><MdSave size={"24"}/></Button>
                                                        <Button isDisabled={!presets.hasOwnProperty(currentPreset)}
                                                                isIconOnly onPress={() => {
                                                            loadState(presets[currentPreset])
                                                        }}><FaFileImport size={"24"}/></Button>
                                                        <Popover placement="bottom" showArrow
                                                                 isOpen={deleteConfirmClosure.isOpen}
                                                                 onOpenChange={deleteConfirmClosure.onOpenChange}>
                                                            <PopoverTrigger>
                                                                <Button
                                                                    isDisabled={!presets.hasOwnProperty(currentPreset)}
                                                                    isIconOnly><MdDeleteForever
                                                                    size={"24"}/></Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent>
                                                                <div className="px-1 py-2">
                                                                    <Button
                                                                        color={"danger"}
                                                                        startContent={
                                                                            <MdDeleteForever size={"24"}/>}
                                                                        onPress={() => {
                                                                            let deleteCopy = presets
                                                                            delete deleteCopy[currentPreset]
                                                                            setPresets({...deleteCopy})
                                                                            deletePresets(deleteCopy, currentPreset).then()
                                                                            setCurrentPreset("")
                                                                            deleteConfirmClosure.onClose()
                                                                        }}>Delete this preset? This cannot be
                                                                        undone.</Button>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </div>
                                            </AccordionItem>
                                            <AccordionItem key="model" aria-label="Model" title="Model">
                                                <div className={"flex flex-col gap-4"}>
                                                    <Select label={"Checkpoint"} selectedKeys={[selectedCheckpoint]}
                                                            onChange={(event) => {
                                                                setSelectedCheckpoint(event.target.value)
                                                            }}>
                                                        {checkpoints.map((checkpoint) => (
                                                            <SelectItem key={checkpoint}
                                                                        value={checkpoint}>{checkpoint}</SelectItem>
                                                        ))}
                                                    </Select>
                                                    <Select label={"VAE"} selectedKeys={[selectedVAE]}
                                                            onChange={(event) => {
                                                                setSelectedVAE(event.target.value)
                                                            }}>
                                                        {VAEs.map((vae) => (
                                                            <SelectItem key={vae} value={vae}>{vae}</SelectItem>
                                                        ))}
                                                    </Select>
                                                </div>
                                            </AccordionItem>
                                            <AccordionItem key="lora" aria-label="Loras" title="Loras">
                                                <div className={"flex flex-col gap-4"}>
                                                    {
                                                        loras.map((lora) => (
                                                            <div key={lora.uuid}>
                                                                <LoraBox lora={lora} loraNames={loraNames}
                                                                         updateLora={updateLora}
                                                                         removeLora={removeLora}/>
                                                                <div className={"w-full h-[1px] mt-4 bg-[#777777]"}/>
                                                            </div>
                                                        ))
                                                    }
                                                    <Button onPress={() => {
                                                        const newLora: Lora = {
                                                            "uuid": uuidv4(),
                                                            "name": "",
                                                            "modelWeight": 1.0,
                                                            "clipWeight": 1.0
                                                        }

                                                        setLoras([...loras, newLora])
                                                    }}>Add</Button>
                                                </div>
                                            </AccordionItem>
                                        </Accordion>
                                        <Textarea disableAutosize label={"Exported API Json"}
                                                  placeholder={"Export (API) from ComfyUI, and paste that here"}
                                                  value={json} onChange={(event) => {
                                            setJson(event.target.value)
                                        }}/>
                                        {
                                            prompts.map((prompt) => (
                                                <div key={prompt.uuid}>
                                                    <PromptBox prompt={prompt} updatePrompt={updatePrompt}
                                                               removePrompt={removePrompt}/>
                                                    <div className={"w-full h-[1px] mt-4 bg-[#777777]"}/>
                                                </div>
                                            ))
                                        }
                                        <Button onPress={() => {
                                            const newPrompt: Prompt = {
                                                "uuid": uuidv4(),
                                                "name": "",
                                                "prompt": ""
                                            }

                                            setPrompts([...prompts, newPrompt])
                                        }}>Add Prompt</Button>
                                        <Textarea label={"Negative Prompt"} value={negativePrompt}
                                                  onChange={(event) => {
                                                      setNegativePrompt(event.target.value)
                                                  }} placeholder={"Something you don't want"}/>
                                        <Select selectedKeys={[selectedImageSize]} onChange={(event) => {
                                            setSelectedImageSize(event.target.value)
                                        }} label={"Image size"}>
                                            {
                                                imageSizes.map((size) => (
                                                    <SelectItem key={size} value={size}>{size}</SelectItem>
                                                ))
                                            }
                                        </Select>
                                        <Slider label={"Steps"} value={steps} onChange={(value) => {
                                            setSteps(Array.isArray(value) ? value[0] : value)
                                        }} minValue={1} maxValue={50}/>
                                        <Slider label={"CFG Scale"} value={cfg} onChange={(value) => {
                                            setCfg(Array.isArray(value) ? value[0] : value)
                                        }} step={0.25} minValue={1} maxValue={10}/>
                                        <Select selectedKeys={[selectedSampler]} onChange={(event) => {
                                            setSelectedSampler(event.target.value)
                                        }} label={"Sampler"}>
                                            {samplers.map((sampler) => (
                                                <SelectItem key={sampler} value={sampler}>{sampler}</SelectItem>
                                            ))}
                                        </Select>
                                        <Select selectedKeys={[selectedScheduler]} onChange={(event) => {
                                            setSelectedScheduler(event.target.value)
                                        }} label={"Scheduler"}>
                                            {schedulers.map((scheduler) => (
                                                <SelectItem key={scheduler} value={scheduler}>{scheduler}</SelectItem>
                                            ))}
                                        </Select>
                                        <Input label={"Seed"} value={seed.toString()} onChange={(event) => {
                                            setSeed(parseInt(event.target.value))
                                        }} type={"number"}/>
                                        <Button className={"w-full"} onPress={onClose}>
                                            닫기
                                        </Button>
                                        <Checkbox isSelected={playEffectOnComplete} onValueChange={(value) => {
                                            setPlayEffectOnComplete(value)
                                            if (value && localStorage.getItem("playEffectOnComplete") == null) {
                                                localStorage.setItem("playEffectOnComplete", "yes")
                                            } else if (!value && localStorage.getItem("playEffectOnComplete") != null) {
                                                localStorage.removeItem("playEffectOnComplete")
                                            }
                                        }}>완료시 소리재생</Checkbox>
                                    </section>
                                </DrawerBody>
                            </>
                        )}
                    </DrawerContent>
                </Drawer>
            </DanbooruTrieSearchProvider>
            <div className={"relative flex items-center justify-center flex-grow min-h-0 overflow-hidden"}>
                <img alt={"ai-generated content"} src={destImageSrc}
                     className="max-w-full max-h-full object-contain"/>
                {progress ?
                    <CircularProgress className={"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"}
                                      size={"lg"}/> : ""}
            </div>
            <div className={"w-full max-w-7xl flex flex-row flex-shrink-0"}>
                <Button className={"flex-1"} disabled={!isConnected} onPress={async () => {
                    try {
                        const uuid = await PostState(generateState(), clientId.current)
                        console.log(uuid)
                        setLastPromptUUID(uuid)
                        localStorage.setItem("lastPromptUUID", uuid)
                        setProgress("Wait for Queue")
                    } catch (e) {
                        console.log(e)
                    }
                }}>Generate!</Button>
                <Button className={"flex-none"} isIconOnly disabled={!isConnected}
                        onPress={async () => {
                            window.open(destImageSrc?.replace("&preview=true", ""))
                        }}><MdOutlineFileDownload size={30}/></Button>
            </div>
            {progress ? <section
                className={`absolute bottom-5 left-1/2 -translate-x-1/2 w-screen lg:w-1/2 h-14 p-7 bg-[#000000BB] flex items-center justify-center text-center rounded-2xl`}>
                {progress}
            </section> : ""}
        </section>
    );
}
