import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Paragraph,
  Heading,
  List,
  Undo,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

const baseConfig = {
  licenseKey: "GPL",
  plugins: [Essentials, Bold, Italic, Paragraph, Heading, List, Undo],
  toolbar: [
    "heading",
    "|",
    "bold",
    "italic",
    "bulletedList",
    "numberedList",
    "undo",
    "redo",
  ],
};

export function createForumEditor(element, options = {}) {
  if (!element) return Promise.resolve(null);

  return ClassicEditor.create(element, {
    ...baseConfig,
    placeholder: options.placeholder || "",
  }).catch((err) => {
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
