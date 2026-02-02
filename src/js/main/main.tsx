import { useCallback, useEffect, useRef, useState } from "react";
import yaml from "js-yaml";
import { subscribeBackgroundColor, selectFile } from "../lib/utils/bolt";
import { validateYaml, type ValidationError } from "./schema/validation";
import { createInAE, generateFromAE } from "./lib/bridge";
import { YamlEditor } from "./components/YamlEditor";
import { Toolbar } from "./components/Toolbar";
import { ErrorPanel } from "./components/ErrorPanel";
import "./main.scss";

export const App = () => {
  const [bgColor, setBgColor] = useState("#282c34");
  const [yamlContent, setYamlContent] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Track the latest YAML content for create/validate
  const yamlRef = useRef<string>("");

  const handleChange = useCallback((value: string) => {
    yamlRef.current = value;
    setErrors([]);
    setRuntimeError(null);
    setSuccessMessage(null);
  }, []);

  const handleCreate = useCallback(async () => {
    const text = yamlRef.current;
    if (!text.trim()) return;

    // Validate
    const result = validateYaml(text);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    // Send to AE
    setIsCreating(true);
    setRuntimeError(null);
    setSuccessMessage(null);
    try {
      const response = await createInAE(result.data!);
      const stats = response.created;
      const parts: string[] = [];
      if (stats.compositions) parts.push(`${stats.compositions} comp(s)`);
      if (stats.layers) parts.push(`${stats.layers} layer(s)`);
      if (stats.files) parts.push(`${stats.files} file(s)`);
      if (stats.folders) parts.push(`${stats.folders} folder(s)`);
      setSuccessMessage(`Created ${parts.join(", ")}`);
    } catch (e: any) {
      const msg =
        typeof e === "string"
          ? e
          : e?.message || JSON.stringify(e) || "Unknown ExtendScript error";
      setRuntimeError(msg);
    } finally {
      setIsCreating(false);
    }
  }, []);

  const handleGenerate = useCallback(async (selectionOnly: boolean) => {
    setIsGenerating(true);
    setRuntimeError(null);
    try {
      const doc = await generateFromAE(selectionOnly);
      const yamlStr = yaml.dump(doc, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });
      setYamlContent(yamlStr);
      yamlRef.current = yamlStr;
      setErrors([]);
    } catch (e: any) {
      setRuntimeError(
        typeof e === "string" ? e : e?.message || "Failed to read from AE"
      );
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleLoadFile = useCallback(() => {
    selectFile("", "Select a YAML file", (filePath: string) => {
      if (!filePath) return;
      try {
        const content = window.cep_node
          .require("fs")
          .readFileSync(filePath, "utf8");
        setYamlContent(content);
        yamlRef.current = content;
        setErrors([]);
        setRuntimeError(null);
      } catch (e: any) {
        setRuntimeError(`Failed to read file: ${e.message}`);
      }
    });
  }, []);

  useEffect(() => {
    if (window.cep) {
      subscribeBackgroundColor(setBgColor);
    }
  }, []);

  return (
    <div className="app" style={{ backgroundColor: bgColor }}>
      <Toolbar
        onCreate={handleCreate}
        onGenerate={handleGenerate}
        onLoadFile={handleLoadFile}
        isCreating={isCreating}
        isGenerating={isGenerating}
      />
      <YamlEditor
        value={yamlContent}
        onChange={handleChange}
        errors={errors}
      />
      <ErrorPanel errors={errors} runtimeError={runtimeError} successMessage={successMessage} />
    </div>
  );
};
