"use client"

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
import State, {PostState} from "@/components/State";
import Prompt from "@/components/Prompt";
import PromptBox from "@/components/PromptBox";
import {useDisclosure} from "@nextui-org/use-disclosure";
import {Drawer, DrawerBody, DrawerHeader} from "@nextui-org/drawer";
import {DrawerContent} from "@nextui-org/react";
import {MdOutlineFileDownload, MdSettings} from "react-icons/md";
import {Image} from "@nextui-org/image";
import {CircularProgress} from "@nextui-org/progress";
import DanbooruTrieSearchProvider from "@/components/DanbooruTrieSearch";

export default function Home() {
    const client_id = useRef(crypto.randomUUID())

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

    const [inProgress, setInProgress] = useState(false)
    const [progress, setProgress] = useState("Wait for Something...")

    const [inited, setInited] = useState(false)

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

    useEffect(() => {
        async function work() {
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
            }

            setInited(true)
        }

        work().then()
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
            "seed": seed
        }

        return state
    }

    useEffect(() => {
        if (!inited) return;
        const state = generateState();

        localStorage.setItem("lastState", JSON.stringify(state))
    }, [selectedCheckpoint, selectedVAE, loras, prompts, negativePrompt, selectedImageSize, steps, cfg, selectedSampler, selectedScheduler, seed]);

    const [isConnected, setConnected] = useState(false)
    const [lastPromptUUID, setLastPromptUUID] = useState("")

    const ws = useRef<WebSocket | null>(null);
    useEffect(() => {
        function generateWebsocket() {
            ws.current = new WebSocket(getAPIServer().replace("http", "ws") + "ws?clientId=" + client_id.current);
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
        const imageMeta = history[uuid]["outputs"]["8-SaveImage"]["images"][0]

        setDestImageSrc(getAPIServer() + `view?filename=${imageMeta["filename"]}&subfolder=${imageMeta["subfolder"]}&type=${imageMeta["type"]}&preview=true`)
    }

    useEffect(() => {
        if (!ws.current) return
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
                        setInProgress(false)
                        findAndDisplayPrompt(lastPromptUUID).then()
                    } else {
                        setProgress(`${type}: ${data["node"]}`)
                    }
                }
            }
        };
    }, [ws, lastPromptUUID]);

    const drawerClosure = useDisclosure();

    const [destImageSrc, setDestImageSrc] = useState<string | undefined>(undefined)

    return (
        <section className={"flex flex-col p-1 w-screen h-screen items-center"}>
            <header className={"flex flex-row items-center w-full max-w-7xl"}>
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
                                <DrawerHeader>생성 옵션</DrawerHeader>
                                <DrawerBody>
                                    <section className={"max-w-md flex flex-col gap-4"}>
                                        <Accordion selectionMode={"multiple"}>
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
                                                            "uuid": crypto.randomUUID(),
                                                            "name": "",
                                                            "modelWeight": 1.0,
                                                            "clipWeight": 1.0
                                                        }

                                                        setLoras([...loras, newLora])
                                                    }}>Add</Button>
                                                </div>
                                            </AccordionItem>
                                        </Accordion>
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
                                                "uuid": crypto.randomUUID(),
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
                                    </section>
                                </DrawerBody>
                            </>
                        )}
                    </DrawerContent>
                </Drawer>
            </DanbooruTrieSearchProvider>
            <div className={"flex-1 relative flex items-center justify-center"}>
                <Image radius={"none"} src={destImageSrc}/>
                {inProgress ?
                    <CircularProgress className={"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"}
                                      size={"lg"}/> : ""}
            </div>
            <div className={"flex-none w-full max-w-7xl flex flex-row"}>
                <Button className={"flex-1"} disabled={!isConnected} onPress={async () => {
                    const uuid = await PostState(generateState(), client_id.current)
                    console.log(uuid)
                    setLastPromptUUID(uuid)
                    setProgress("Wait for Queue")
                    setInProgress(true)
                }}>Generate!</Button>
                <Button className={"flex-none"} isIconOnly disabled={!isConnected}
                        onPress={async () => {
                            window.open(destImageSrc?.replace("&preview=true", ""))
                        }}><MdOutlineFileDownload size={30}/></Button>
            </div>

            {inProgress ? <section
                className={`absolute bottom-5 left-1/2 -translate-x-1/2 w-screen lg:w-1/2 h-14 p-7 bg-[#000000BB] flex items-center justify-center text-center rounded-2xl`}>
                {progress}
            </section> : ""}
        </section>
    );
}
