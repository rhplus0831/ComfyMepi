import {Textarea} from "@nextui-org/input";
import {Listbox, ListboxItem} from "@nextui-org/listbox";
import {useContext, useRef, useState} from "react";
import {DanbooruTag, DanbooruTrieSearchContext} from "@/components/DanbooruTrieSearch";
import build from "next/dist/build";

export default function PromptTextArea({startValue, label, placeholder, onChange}: {
    startValue: string,
    label: string,
    placeholder: string,
    onChange: (value: string) => void
}) {
    const [value, setValue] = useState(startValue)
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [description, setDescription] = useState("")

    const [displayAutoComplete, setDisplayAutoComplete] = useState(false)
    const [autoCompleteList, setAutoCompleteList] = useState<DanbooruTag[] | null>(null)

    const trieState = useContext(DanbooruTrieSearchContext)

    const [waitTimer, setWaitTimer] = useState<number>(-1)

    function findMatchIndex(value: string) {
        if(!textareaRef.current) return [0, 0]

        const i = textareaRef.current.selectionStart
        let si = i - 1
        let ei = i

        while (si >= 0) {
            if (value.at(si) == ',') {
                si++;
                break;
            }
            si--;
        }
        if (si < 0) {
            si = 0;
        }

        while (ei < value.length) {
            if (value.at(ei) == ',') {
                break;
            }
            ei++;
        }

        return [si, ei]
    }

    function checkAutoComplete(value: string) {
        if (!trieState) return

        if (waitTimer > 0) {
            try {
                clearTimeout(waitTimer)
            } catch {

            }
        }
        setWaitTimer(window.setTimeout(() => {
            try {
                const [trie, setTrie] = trieState

                if (!trie) return
                if (!textareaRef.current) return;

                const [si, ei] = findMatchIndex(value)

                const currentTag = value.slice(si, ei).trim()

                setDescription(`Editing: ${currentTag}`)
                let result = trie.search(currentTag.replaceAll(" ", "_"), undefined, 5)
                console.log(`search '${currentTag}' => ${result}`)

                if (result.length == 0) {
                    setDisplayAutoComplete(false)
                    setAutoCompleteList([])
                    return;
                }

                setDisplayAutoComplete(true)
                setAutoCompleteList(result)
            } finally {
                setWaitTimer(-1)
            }
        }, 100))
    }

    function fixTagName(name: string) {
        return name.replaceAll("_", " ").replaceAll("(", "\\(").replaceAll(")", "\\)")
    }

    return (
        <div>
            <Textarea value={value} onSelect={() => {
                checkAutoComplete(value)
            }} onChange={(event) => {
                setValue(event.target.value)
                checkAutoComplete(event.target.value)
                onChange(event.target.value)
            }} ref={textareaRef}/>
            {displayAutoComplete ?
                <Listbox className={"w-full"} onAction={(key) => {
                    const [si, ei] = findMatchIndex(value)
                    const front = value.slice(0, si)
                    const back = value.slice(ei)
                    const build = `${front} ${fixTagName(key.toString())}${back}`
                    setValue(build)
                    onChange(build)
                    setDescription("")
                    setAutoCompleteList([])
                    setDisplayAutoComplete(false)
                }}>
                    <>
                        {
                            autoCompleteList ? autoCompleteList.map((tag) => (
                                <ListboxItem key={tag.name}>{fixTagName(tag.name)} ({tag.count})</ListboxItem>
                            )) : ""
                        }
                    </>
                </Listbox>
                : ""}

        </div>
    )
}