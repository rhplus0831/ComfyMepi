import {Select, SelectItem} from "@heroui/select";
import Lora from "@/components/Lora";
import {Slider} from "@heroui/slider";
import {Button} from "@heroui/button";
import {DeleteIcon} from "@heroui/shared-icons";

export default function LoraBox({lora, loraNames, updateLora, removeLora}: {
    lora: Lora,
    loraNames: string[],
    updateLora: (lora: Lora) => void
    removeLora: (lora: Lora) => void
}) {

    return (
        <article className={"flex flex-col gap-4"}>
            <div className={"flex flex-row gap-2"}>
                <Select size={"lg"} selectedKeys={[lora.name]} onChange={(event) => {
                    lora.name = event.target.value
                    updateLora(lora)
                }} >
                    {loraNames.map((lora) => (
                        <SelectItem key={lora}>{lora}</SelectItem>
                    ))}
                </Select>
                <Button size={"lg"} className={"flex-none"} isIconOnly onPress={() => {
                    removeLora(lora)
                }}><DeleteIcon/></Button>
            </div>

            <Slider label={"Model Weight"} defaultValue={lora.modelWeight} step={0.05} minValue={0} maxValue={1}
                    onChangeEnd={(value) => {
                        lora.modelWeight = Array.isArray(value) ? value[0] : value
                        updateLora(lora)
                    }}/>
            <Slider label={"Clip Weight"} defaultValue={lora.clipWeight} step={0.05} minValue={0} maxValue={1}
                    onChangeEnd={(value) => {
                        lora.clipWeight = Array.isArray(value) ? value[0] : value
                        updateLora(lora)
                    }}/>
        </article>
    )
}