import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Paragraph,
  Heading,
  List,
  Undo,
  Link,
  AutoLink,
  BlockQuote,
  Code,
  CodeBlock,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  ImageInsertViaUrl,
  ImageResize,
  LinkImage,
  Plugin,
  FileRepository,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

const UPLOAD_URL = "/api/upload-image";

/**
 * Stores selected files locally and shows blob: preview URLs.
 * Real upload runs only when flushPendingUploads() is called (form submit).
 */
class DeferredImageUpload extends Plugin {
  static get requires() {
    return [FileRepository];
  }

  static get pluginName() {
    return "DeferredImageUpload";
  }

  init() {
    const editor = this.editor;
    const pending = new Map();
    editor._pendingImages = pending;

    editor.plugins.get(FileRepository).createUploadAdapter = (loader) => ({
      upload: () =>
        loader.file.then(
          (file) =>
            new Promise((resolve) => {
              const previewUrl = URL.createObjectURL(file);
              pending.set(previewUrl, { file, previewUrl });
              resolve({ default: previewUrl });
            }),
        ),
      abort: () => {},
    });
  }

  destroy() {
    const pending = this.editor._pendingImages;
    if (!pending) return;
    for (const { previewUrl } of pending.values()) {
      URL.revokeObjectURL(previewUrl);
    }
    pending.clear();
  }
}

const baseConfig = {
  licenseKey: "GPL",
  plugins: [
    Essentials,
    Bold,
    Italic,
    Paragraph,
    Heading,
    List,
    Undo,
    Link,
    AutoLink,
    BlockQuote,
    Code,
    CodeBlock,
    Image,
    ImageCaption,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    ImageInsertViaUrl,
    ImageResize,
    LinkImage,
    DeferredImageUpload,
  ],
  toolbar: [
    "heading",
    "|",
    "bold",
    "italic",
    "code",
    "|",
    "link",
    "insertImage",
    "blockQuote",
    "codeBlock",
    "|",
    "bulletedList",
    "numberedList",
    "|",
    "undo",
    "redo",
  ],
  image: {
    toolbar: [
      "imageStyle:inline",
      "imageStyle:block",
      "imageStyle:side",
      "|",
      "toggleImageCaption",
      "imageTextAlternative",
      "|",
      "linkImage",
    ],
    insert: {
      integrations: ["upload", "url"],
      type: "auto",
    },
  },
};

/**
 * Upload deferred blob images to the server and replace preview URLs in content.
 */
export async function flushPendingUploads(editor, uploadUrl = UPLOAD_URL) {
  if (!editor) return "";

  const pending = editor._pendingImages;
  let html = editor.getData();

  if (!pending?.size) return html;

  const replacements = [];

  for (const [previewUrl, { file }] of pending.entries()) {
    if (!previewUrl.startsWith("blob:")) continue;

    const formData = new FormData();
    formData.append("upload", file);

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }

      const data = await res.json();
      const url = data?.url || data?.urls?.default;

      if (!url) {
        throw new Error("Upload response missing url");
      }

      replacements.push({ previewUrl, url });
    } catch (err) {
      // Frontend placeholder: keep local preview if API is not ready yet.
      console.warn(
        "[CKEditor] Image will stay as local preview until upload API is ready.",
        err,
      );
    }
  }

  for (const { previewUrl, url } of replacements) {
    html = html.split(previewUrl).join(url);
    URL.revokeObjectURL(previewUrl);
    pending.delete(previewUrl);
  }

  if (replacements.length) {
    editor.setData(html);
  }

  return editor.getData();
}

function syncEditorToTextarea(editor, element) {
  if (!editor || !element) return;
  if (element.tagName === "TEXTAREA") {
    element.value = editor.getData();
  }
}

function bindEditorSubmit(editor, element) {
  const form = element?.closest?.("form");
  if (!form || form._ckSubmitBound) return;

  form._ckSubmitBound = true;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
    }

    try {
      const editors = [];

      if (form._ckEditor) editors.push(form._ckEditor);
      form.querySelectorAll(".js-ckeditor, .js-reply-editor").forEach((el) => {
        if (el._ckEditor && !editors.includes(el._ckEditor)) {
          editors.push(el._ckEditor);
        }
      });

      for (const ed of editors) {
        await flushPendingUploads(ed);
        const sourceEl =
          ed.sourceElement ||
          form.querySelector(".js-ckeditor, .js-reply-editor");
        syncEditorToTextarea(ed, sourceEl);
      }

      // Demo / static pages: no real POST target yet.
      if (!form.getAttribute("action") || form.getAttribute("action") === "#") {
        console.info("[CKEditor] Submit ready (images uploaded or preview kept).");
        return;
      }

      form.submit();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
      }
    }
  });
}

export function createForumEditor(element, options = {}) {
  if (!element) return Promise.resolve(null);

  return ClassicEditor.create(element, {
    ...baseConfig,
    placeholder: options.placeholder || "",
  })
    .then((editor) => {
      element._ckEditor = editor;
      const form = element.closest("form");
      if (form) form._ckEditor = editor;
      bindEditorSubmit(editor, element);
      return editor;
    })
    .catch((err) => {
      console.error("CKEditor failed to load", err);
      return null;
    });
}

export function destroyForumEditor(editor) {
  if (!editor) return Promise.resolve();
  return editor.destroy().catch(() => {});
}

export function initAnswerEditors() {
  const mainEl = document.querySelector("#answer-editor");
  if (mainEl) {
    createForumEditor(mainEl, {
      placeholder: "Write a clear answer. Explain why it works.",
    });
  }

  const template = document.getElementById("answer-reply-template");
  if (!template) return;

  let openPanel = null;
  let openBtn = null;

  function closeReply() {
    if (openPanel) {
      openPanel.classList.remove("is-open");
      openPanel = null;
    }
    if (openBtn) {
      openBtn.setAttribute("aria-expanded", "false");
      openBtn = null;
    }
  }

  function getOrCreatePanel(answer) {
    let panel = answer.querySelector(".answer-reply");
    if (panel) return panel;

    panel = template.content.firstElementChild.cloneNode(true);
    answer.appendChild(panel);

    const cancel = panel.querySelector("[data-reply-cancel]");
    if (cancel) {
      cancel.addEventListener("click", () => closeReply());
    }

    return panel;
  }

  document.querySelectorAll("[data-reply]").forEach((el) => {
    const toggleReply = async () => {
      const answer = el.closest(".answer-item");
      if (!answer) return;

      if (openBtn === el) {
        closeReply();
        return;
      }

      closeReply();

      const panel = getOrCreatePanel(answer);
      const name = el.dataset.replyTo || "member";
      const textarea = panel.querySelector(".js-reply-editor");

      panel.classList.add("is-open");
      el.setAttribute("aria-expanded", "true");
      openPanel = panel;
      openBtn = el;
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });

      if (!panel._ckEditor && textarea) {
        panel._ckEditor = await createForumEditor(textarea, {
          placeholder: `Reply to @${name}…`,
        });
      }

      panel._ckEditor?.editing.view.focus();
    };

    el.addEventListener("click", () => {
      toggleReply();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleReply();
      }
    });
  });
}
