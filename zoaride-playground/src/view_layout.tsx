import * as React from "react"

type RenderFun = () => JSX.Element

export const renderLayout = (renderContent: RenderFun) => (
    <article id="app">
        {renderContent()}
    </article>
)
