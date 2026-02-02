import { useEffect, useRef } from "react";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { yaml } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";
import { lintGutter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  indentOnInput,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import type { ValidationError } from "../schema/validation";

const SAMPLE_YAML = `compositions:
  - name: My Comp
    width: 1920
    height: 1080
    duration: 10
    framerate: 30
    layers:
      - name: background
        type: solid
        color: "1a1a2e"
      - name: title
        type: text
        text: Hello World
        transform:
          position: [960, 540]
`;

interface YamlEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  errors?: ValidationError[];
}

export function YamlEditor({ value, onChange, errors = [] }: YamlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChange) {
        onChange(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value || SAMPLE_YAML,
      extensions: [
        lineNumbers(),
        history(),
        foldGutter(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        lintGutter(),
        yaml(),
        oneDark,
        updateListener,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...closeBracketsKeymap,
          ...foldKeymap,
        ]),
        EditorView.theme({
          "&": { height: "100%", fontSize: "13px" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { fontFamily: "'SF Mono', Menlo, monospace" },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Sync initial content to parent
    if (onChange) {
      onChange(view.state.doc.toString());
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update editor content when value prop changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view || value === undefined) return;

    const currentContent = view.state.doc.toString();
    if (value !== currentContent) {
      view.dispatch({
        changes: { from: 0, to: currentContent.length, insert: value },
      });
    }
  }, [value]);

  // Update diagnostics when errors change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const diagnostics: Diagnostic[] = errors
      .filter((e) => e.line !== null)
      .map((e) => {
        const line = view.state.doc.line(
          Math.min(e.line!, view.state.doc.lines)
        );
        return {
          from: line.from,
          to: line.to,
          severity: "error" as const,
          message: e.message,
        };
      });

    view.dispatch(setDiagnostics(view.state, diagnostics));
  }, [errors]);

  return (
    <div
      ref={containerRef}
      className="yaml-editor"
      style={{ flex: 1, overflow: "hidden" }}
    />
  );
}
