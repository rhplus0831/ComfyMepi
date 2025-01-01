import {Input, Textarea} from "@nextui-org/input";
import Prompt from "@/components/Prompt";
import {Button} from "@nextui-org/button";
import {DeleteIcon} from "@nextui-org/shared-icons";
import PromptTextArea from "@/components/PromptTextArea";

export default function PromptBox({prompt, updatePrompt, removePrompt}: {
    prompt: Prompt,
    updatePrompt: (prompt: Prompt) => void
    removePrompt: (prompt: Prompt) => void
}) {

    return (
        <article className={"flex flex-col gap-4"}>
            <div className={"flex flex-row gap-2"}>
                <Input defaultValue={prompt.name} size={"sm"} label={"Prompt Name"} onChange={(event) => {
                    prompt.name = event.target.value
                    updatePrompt(prompt)
                }}/>
                <Button className={"flex-none"} size={"lg"} isIconOnly onPress={() => {
                    removePrompt(prompt)
                }}><DeleteIcon/></Button>
            </div>
            <PromptTextArea startValue={prompt.prompt} label={"Prompt"} placeholder={"Something you want"} onChange={(value) => {
                prompt.prompt = value
                updatePrompt(prompt)
            }}/>
        </article>
    )
}