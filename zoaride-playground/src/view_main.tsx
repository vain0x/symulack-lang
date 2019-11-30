import { renderEditor } from "./view_editor"
import { renderLayout } from "./view_layout"

export const renderMain = () => renderLayout(renderEditor)
