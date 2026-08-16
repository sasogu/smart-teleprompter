import { useEffect, useState } from "react";

const SCRIPTS_KEY = "tp_scripts_v1";
const MAX_SCRIPTS = 50;
const SETTINGS_KEY = "tp_settings_v1";

// Saved-script library: CRUD and localStorage persistence.
// `text`/`setText`/`setLanguage` are the main teleprompter script state,
// owned by the caller — loading/saving a saved script reads/writes those.
export default function useScriptLibrary({ text, setText, setLanguage }) {
  const [showScriptList, setShowScriptList] = useState(false);
  const [savedScripts, setSavedScripts] = useState([]);
  const [showAddScript, setShowAddScript] = useState(false);
  const [editScriptId, setEditScriptId] = useState(null);
  const [addScriptName, setAddScriptName] = useState("");
  const [addScriptText, setAddScriptText] = useState("");
  const [addScriptLanguage, setAddScriptLanguage] = useState("en-US");
  const [scriptFormTouched, setScriptFormTouched] = useState(false);
  const [deleteScriptConfirm, setDeleteScriptConfirm] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCRIPTS_KEY);
      if (raw) {
        setSavedScripts(JSON.parse(raw));
      } else {
        // Migrate existing script from settings if present
        const seeds = [];
        try {
          const settingsRaw = localStorage.getItem(SETTINGS_KEY);
          if (settingsRaw) {
            const s = JSON.parse(settingsRaw);
            if (s.text && s.text.trim()) {
              seeds.push({
                id: "migrated",
                name: "My Script",
                text: s.text,
                language: s.language || "en-US",
                savedAt: new Date().toISOString(),
              });
            }
          }
        } catch (_) {}
        // Always include the demo script
        seeds.push({
          id: "demo",
          name: "Demo Script",
          text,
          language: "en-US",
          savedAt: new Date().toISOString(),
        });
        setSavedScripts(seeds);
        localStorage.setItem(SCRIPTS_KEY, JSON.stringify(seeds));
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveScriptsToStorage = (scripts) => {
    setSavedScripts(scripts);
    try {
      localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
    } catch (_) {}
  };

  const openAddScriptModal = () => {
    setEditScriptId(null);
    setAddScriptName("");
    setAddScriptText("");
    setAddScriptLanguage("en-US");
    setScriptFormTouched(false);
    setShowAddScript(true);
  };

  const openEditScriptModal = (script) => {
    setEditScriptId(script.id);
    setAddScriptName(script.name);
    setAddScriptText(script.text);
    setAddScriptLanguage(script.language || "en-US");
    setScriptFormTouched(false);
    setShowAddScript(true);
  };

  const saveScript = (andLoad) => {
    setScriptFormTouched(true);
    const trimmed = (addScriptName || "").trim();
    if (!trimmed || !addScriptText.trim() || !addScriptLanguage) return;

    let updated;
    if (editScriptId) {
      updated = savedScripts.map((s) =>
        s.id === editScriptId
          ? {
              ...s,
              name: trimmed,
              text: addScriptText,
              language: addScriptLanguage,
              savedAt: new Date().toISOString(),
            }
          : s
      );
    } else {
      const newScript = {
        id: Date.now().toString(),
        name: trimmed,
        text: addScriptText,
        language: addScriptLanguage,
        savedAt: new Date().toISOString(),
      };
      updated = [newScript, ...savedScripts].slice(0, MAX_SCRIPTS);
    }
    saveScriptsToStorage(updated);
    setShowAddScript(false);
    setEditScriptId(null);
    if (andLoad) {
      setText(addScriptText);
      setLanguage(addScriptLanguage);
    }
  };

  const loadScript = (script) => {
    setText(script.text);
    if (script.language) setLanguage(script.language);
  };

  const confirmDeleteScript = () => {
    if (!deleteScriptConfirm) return;
    saveScriptsToStorage(
      savedScripts.filter((s) => s.id !== deleteScriptConfirm.id)
    );
    setDeleteScriptConfirm(null);
  };

  return {
    MAX_SCRIPTS,
    showScriptList,
    setShowScriptList,
    savedScripts,
    showAddScript,
    setShowAddScript,
    editScriptId,
    setEditScriptId,
    addScriptName,
    setAddScriptName,
    addScriptText,
    setAddScriptText,
    addScriptLanguage,
    setAddScriptLanguage,
    scriptFormTouched,
    setScriptFormTouched,
    deleteScriptConfirm,
    setDeleteScriptConfirm,
    openAddScriptModal,
    openEditScriptModal,
    saveScript,
    loadScript,
    confirmDeleteScript,
  };
}
