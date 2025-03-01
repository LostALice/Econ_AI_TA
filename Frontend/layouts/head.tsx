import React from "react";
import NextHead from "next/head";
import { siteConfig } from "@/config/site";

export const Head = () => {
    return (
        <NextHead>
            <title>{siteConfig.name}</title>
            <meta key="title" content={siteConfig.name} property="og:title" />
            <meta content={siteConfig.description} property="og:description" />
            <meta content={siteConfig.description} name="description" />
            <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link href="/favicon.ico" rel="icon" />
        </NextHead>
    );
};
