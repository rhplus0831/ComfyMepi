import "@/styles/globals.css";
import {Metadata, Viewport} from "next";
import clsx from "clsx";

import {Providers} from "./providers";
import {Noto_Sans_KR} from "next/font/google";
import {siteConfig} from "@/config/site";

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
};

const notoSansKR = Noto_Sans_KR({
    subsets: ["latin"],
    variable: '--font-noto-Sans-KR',
    display: "swap",
});

export const viewport: Viewport = {
    themeColor: [
        {media: "(prefers-color-scheme: light)", color: "white"},
        {media: "(prefers-color-scheme: dark)", color: "black"},
    ],
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning lang="ko">
        <head/>
        <body
            className={clsx(
                "min-h-screen bg-background font-sans antialiased font-sansKR",
                notoSansKR.variable,
            )}
        >
        <Providers themeProps={{attribute: "class", defaultTheme: "dark"}}>
            <div className="relative flex flex-col w-screen h-screen max-w-screen max-h-screen">
                <main className={"overflow-hidden w-screen h-screen"}>
                    {children}
                </main>
            </div>
        </Providers>
        </body>
        </html>
    );
}
