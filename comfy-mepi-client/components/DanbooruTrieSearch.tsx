import TrieSearch from "trie-search";
import {getAPIServer} from "@/config/site";
import Papa from "papaparse";
import {createContext, Dispatch, ReactNode, SetStateAction, useEffect, useState} from "react";

export interface DanbooruTag {
    name: string
    count: number
}

async function loadCsvData() {
    const response = await fetch(getAPIServer() + "mepi/danbooru_241016.csv");
    const text = await response.text();
    const result = Papa.parse<DanbooruTag>(text, {header: true});

    return result.data;
}


export async function loadDanbooruTrie() {
    const trie = new TrieSearch<DanbooruTag>('name')
    const data = await loadCsvData()

    console.log(data[0])

    data.forEach((tag) => {
        trie?.add(tag)
    })

    console.log(`Danbooru Trie Registered: ${data.length}`)

    return trie
}

export const DanbooruTrieSearchContext = createContext<[TrieSearch<DanbooruTag> | null, Dispatch<SetStateAction<TrieSearch<DanbooruTag> | null>>] | undefined>(undefined)

export default function DanbooruTrieSearchProvider({children}: { children: ReactNode }) {
    const trieState = useState<TrieSearch<DanbooruTag> | null>(null);

    useEffect(() => {
        const [trie, setTrie] = trieState

        async function load() {
            setTrie(await loadDanbooruTrie())
        }

        load().then()
    }, []);

    return (
        <DanbooruTrieSearchContext.Provider value={trieState}>
            {children}
        </DanbooruTrieSearchContext.Provider>
    );
}