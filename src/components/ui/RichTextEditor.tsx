// src/components/ui/RichTextEditor.tsx
import React, { useRef, useCallback, useEffect } from 'react';
import '../../styles/components/ui/RichTextEditor.css';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
                                                                  value,
                                                                  onChange,
                                                                  placeholder = 'Kirjuta siia...',
                                                                  disabled = false
                                                              }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // Update editor content when value changes
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const execCommand = useCallback((command: string, value?: string) => {
        if (disabled) return;

        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    }, [disabled, handleInput]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        if (disabled) return;

        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        handleInput();
    }, [disabled, handleInput]);

    return (
        <div className={`rte-editor ${disabled ? 'rte-editor--disabled' : ''}`}>
            <div className="rte-toolbar">
                <button
                    type="button"
                    className="rte-toolbar__btn"
                    onClick={() => execCommand('bold')}
                    disabled={disabled}
                    title="Rasvane tekst (Ctrl+B)"
                >
                    <strong>B</strong>
                </button>

                <button
                    type="button"
                    className="rte-toolbar__btn"
                    onClick={() => execCommand('italic')}
                    disabled={disabled}
                    title="Kaldkiri (Ctrl+I)"
                >
                    <em>I</em>
                </button>

                <button
                    type="button"
                    className="rte-toolbar__btn"
                    onClick={() => execCommand('underline')}
                    disabled={disabled}
                    title="Allajoonitud (Ctrl+U)"
                >
                    <u>U</u>
                </button>

                <div className="rte-toolbar__separator"></div>

                <button
                    type="button"
                    className="rte-toolbar__btn"
                    onClick={() => execCommand('insertUnorderedList')}
                    disabled={disabled}
                    title="Punktiloend"
                >
                    •
                </button>

                <button
                    type="button"
                    className="rte-toolbar__btn"
                    onClick={() => execCommand('insertOrderedList')}
                    disabled={disabled}
                    title="Nummerdatud loend"
                >
                    1.
                </button>

                <div className="rte-toolbar__separator"></div>

                <button
                    type="button"
                    className="rte-toolbar__btn rte-toolbar__btn--color"
                    onClick={() => execCommand('foreColor', '#ff0000')}
                    disabled={disabled}
                    title="Punane tekst"
                    style={{ color: '#ff0000' }}
                >
                    A
                </button>

                <button
                    type="button"
                    className="rte-toolbar__btn rte-toolbar__btn--color"
                    onClick={() => execCommand('foreColor', '#00aa00')}
                    disabled={disabled}
                    title="Roheline tekst"
                    style={{ color: '#00aa00' }}
                >
                    A
                </button>

                <button
                    type="button"
                    className="rte-toolbar__btn rte-toolbar__btn--color"
                    onClick={() => execCommand('foreColor', '#0066cc')}
                    disabled={disabled}
                    title="Sinine tekst"
                    style={{ color: '#0066cc' }}
                >
                    A
                </button>

                <button
                    type="button"
                    className="rte-toolbar__btn rte-toolbar__btn--color"
                    onClick={() => execCommand('foreColor', '#ffd700')}
                    disabled={disabled}
                    title="Kuldne tekst"
                    style={{ color: '#ffd700' }}
                >
                    A
                </button>

                <button
                    type="button"
                    className="rte-toolbar__btn"
                    onClick={() => execCommand('removeFormat')}
                    disabled={disabled}
                    title="Eemalda vormindus"
                >
                    ×
                </button>
            </div>

            <div
                ref={editorRef}
                className="rte-content"
                contentEditable={!disabled}
                onInput={handleInput}
                onPaste={handlePaste}
                data-placeholder={placeholder}
                suppressContentEditableWarning={true}
            />
        </div>
    );
};