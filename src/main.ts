/**
 * Github WIKI Editor - 프론트엔드 진입점 (TypeScript)
 * 
 * [전체 원리]
 * Tauri는 두 층으로 이루어진다:
 *  1) 프론트엔드 (이 파일, TypeScript + HTML/CSS) - 사용자가 보는 화면, WebView에서 동작
 *  2) 백엔드 (src-tauri/src/lib.rs, Rust) - 파일 읽기/쓰기 같은 OS 권한이 필요한 작업
 *  프론트와 백은 `invoke()`라는 다리(IPC, Inter-Process Communication)로 JSON을 주고받는다.
 */

import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";

// ─────────────────────────────────────────────────────────────
// [원리] DOM 요소 타입 단언
// TypeScript는 HTML 요소를 정확히 알면 자동완성과 타입 검사를 해준다.
// 예: HTMLTextAreaElement에는 .value가 있지만, HTMLElement에는 없다.
// ─────────────────────────────────────────────────────────────
const editor = document.getElementById("editor") as HTMLTextAreaElement;
const filePathEl = document.getElementById("file-path") as HTMLSpanElement;
const statusEl = document.getElementById("status") as HTMLSpanElement;
const charCountEl = document.getElementById("char-count") as HTMLSpanElement;
const btnNew = document.getElementById("btn-new") as HTMLButtonElement;
const btnOpen = document.getElementById("btn-open") as HTMLButtonElement;
const btnSaveAs = document.getElementById("btn-save-as") as HTMLButtonElement;

// ─────────────────────────────────────────────────────────────
// [원리] 앱 상태 변수
// currentFile: 현재 편집 중인 파일의 절대 경로. null이면 아직 저장된 적 없는 새 파일.
// isDirty: 저장되지 않은 변경이 있는지 여부. 자동 저장 성공 시 false가 된다.
// saveTimer: debounce 타이머 ID. 입력마다 리셋된다.
// ─────────────────────────────────────────────────────────────
let currentFile: string | null = null;
let isDirty = false;
let saveTimer: number | null = null;

// [원리] 자동 저장 대기 시간. 600ms는 타이핑이 멈춘 뒤 저장까지의 간격.
// 300ms는 너무 자주 저장해 디스크 부담, 1000ms는 정전 시 최대 1초치 손실.
const AUTO_SAVE_DELAY_MS = 600;

// ─────────────────────────────────────────────────────────────
// [원리] UI 업데이트 헬퍼 함수
// 상태 표시를 한 곳에서 관리하면 버그가 줄고 코드가 읽기 쉬워진다.
// ─────────────────────────────────────────────────────────────
function updateFilePathDisplay(): void {
  // [원리] 파일 경로가 길면 그대로 보여주고, 없으면 "파일 없음" 표시
  filePathEl.textContent = currentFile ?? "파일 없음";
  filePathEl.title = currentFile ?? ""; // [원리] 마우스 호버 시 전체 경로 툴팁
}

function updateCharCount(): void {
  // [원리] editor.value.length는 현재 글자 수. 한글도 1글자로 센다.
  const count = editor.value.length;
  charCountEl.textContent = `${count.toLocaleString()} 글자`;
}

function setStatus(text: string, state: "idle" | "saving" | "error" = "idle"): void {
  statusEl.textContent = text;
  // [원리] CSS 클래스로 색상을 바꾼다. styles.css의 #status.saving / .error 참조
  statusEl.classList.remove("saving", "error");
  if (state === "saving") statusEl.classList.add("saving");
  if (state === "error") statusEl.classList.add("error");
}

// ─────────────────────────────────────────────────────────────
// [원리] Rust 백엔드 호출 함수
// invoke<T>(명령이름, 인자) 형태로 Rust의 #[tauri::command] 함수를 호출한다.
// Rust는 Result<T, E>를 반환하고, 실패 시 JS에서 catch로 잡힌다.
// ─────────────────────────────────────────────────────────────
async function readFileFromDisk(path: string): Promise<string> {
  // [원리] 제네릭 <string>은 Rust가 반환할 타입을 TypeScript에 알려주는 힌트
  return await invoke<string>("read_text_file", { path });
}

async function writeFileToDisk(path: string, contents: string): Promise<void> {
  // [원리] Rust 함수 시그니처: write_text_file(path: String, contents: String)
  // JS 객체 키 이름(path, contents)이 Rust 인자 이름과 정확히 일치해야 한다.
  await invoke("write_text_file", { path, contents });
}

// ─────────────────────────────────────────────────────────────
// [원리] 자동 저장 핵심 로직 (디바운스)
// 사용자가 타이핑할 때마다 타이머를 리셋하고, 600ms 동안 입력이 없으면 저장.
// 이렇게 하면 "ㅇㅏㄴㄴㅕㅇ" 5글자를 빨리 칠 때 5번 저장하지 않고 1번만 저장한다.
// ─────────────────────────────────────────────────────────────
function scheduleAutoSave(): void {
  // [원리] 기존 타이머가 있으면 취소 → 마지막 입력부터 600ms를 다시 센다
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
  }

  // [원리] 빈 에디터는 저장할 필요가 없으면 스킵 (선택 사항, 여기선 저장함)
  isDirty = true;
  setStatus("편집 중...", "saving");

  saveTimer = window.setTimeout(async () => {
    await performAutoSave();
  }, AUTO_SAVE_DELAY_MS);
}

async function performAutoSave(): Promise<void> {
  // [원리] 1. 아직 파일 경로가 없으면(새 파일) 먼저 저장 위치를 물어본다
  if (!currentFile) {
    // [원리] save()는 OS의 저장 다이얼로그(파인더/탐색기)를 연다. 취소 시 null 반환.
    const picked = await save({
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "Text", extensions: ["txt"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    // [원리] 사용자가 다이얼로그에서 취소를 누르면 저장하지 않고 상태를 되돌린다
    if (!picked) {
      setStatus("저장 취소됨", "idle");
      return;
    }
    currentFile = picked;
    updateFilePathDisplay();
  }

  // [원리] 2. 실제 디스크에 쓰기 시도
  try {
    setStatus("저장 중...", "saving");
    await writeFileToDisk(currentFile, editor.value);
    isDirty = false;
    setStatus("자동 저장됨 ✓", "idle");
  } catch (e) {
    // [원리] Rust에서 Err(String)을 반환하면 여기서 catch된다. 예: 권한 없음, 디스크 가득 참
    console.error("[저장 실패]", e);
    setStatus(`저장 실패: ${e}`, "error");
  }
}

// ─────────────────────────────────────────────────────────────
// [원리] 파일 열기
// open()으로 경로를 얻고 → Rust로 파일 내용을 읽어 → textarea에 넣는다
// ─────────────────────────────────────────────────────────────
async function handleOpen(): Promise<void> {
  try {
    // [원리] open()은 OS 열기 다이얼로그를 띄운다. multiple: false로 파일 1개만 선택
    const picked = await open({
      multiple: false,
      filters: [
        { name: "Markdown", extensions: ["md", "markdown"] },
        { name: "Text", extensions: ["txt"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!picked || typeof picked !== "string") return; // 취소 시 null

    setStatus("불러오는 중...", "saving");
    const contents = await readFileFromDisk(picked);

    // [원리] 디바운스 타이머가 돌고 있다면 취소 → 파일 열기로 인한 불필요한 자동 저장 방지
    if (saveTimer !== null) clearTimeout(saveTimer);

    currentFile = picked;
    editor.value = contents;
    isDirty = false;
    updateFilePathDisplay();
    updateCharCount();
    setStatus("불러옴 ✓", "idle");
    editor.focus();
  } catch (e) {
    console.error("[열기 실패]", e);
    setStatus(`열기 실패: ${e}`, "error");
  }
}

// ─────────────────────────────────────────────────────────────
// [원리] 새 파일
// 메모리를 비우고 currentFile을 null로 리셋. 디스크에는 아직 저장하지 않는다.
// 첫 자동 저장 시점에 저장 다이얼로그가 뜬다.
// ─────────────────────────────────────────────────────────────
function handleNew(): void {
  if (isDirty) {
    // [원리] 저장되지 않은 변경이 있으면 사용자에게 확인. confirm은 브라우저 기본 다이얼로그.
    const ok = confirm("저장되지 않은 변경이 있습니다. 새 파일을 만들면 사라집니다. 계속할까요?");
    if (!ok) return;
  }
  if (saveTimer !== null) clearTimeout(saveTimer);
  currentFile = null;
  editor.value = "";
  isDirty = false;
  updateFilePathDisplay();
  updateCharCount();
  setStatus("새 파일", "idle");
  editor.focus();
}

// ─────────────────────────────────────────────────────────────
// [원리] 다른 이름으로 저장
// 현재 내용을 다른 경로에 저장하고, 그 경로를 새로운 currentFile로 삼는다.
// ─────────────────────────────────────────────────────────────
async function handleSaveAs(): Promise<void> {
  try {
    const picked = await save({
      defaultPath: currentFile ?? undefined,
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "Text", extensions: ["txt"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (!picked) return;

    setStatus("저장 중...", "saving");
    await writeFileToDisk(picked, editor.value);
    currentFile = picked;
    isDirty = false;
    updateFilePathDisplay();
    setStatus("저장됨 ✓", "idle");
  } catch (e) {
    console.error("[다른 이름으로 저장 실패]", e);
    setStatus(`저장 실패: ${e}`, "error");
  }
}

// ─────────────────────────────────────────────────────────────
// [원리] 이벤트 리스너 연결
// DOMContentLoaded 이전에 실행될 수도 있으므로, 요소 존재 여부를 확인한다.
// ─────────────────────────────────────────────────────────────
function bindEvents(): void {
  // [원리] input 이벤트는 키보드, 붙여넣기, IME(한글 조합) 등 모든 텍스트 변경에 발생
  editor.addEventListener("input", () => {
    updateCharCount();
    scheduleAutoSave();
  });

  btnNew.addEventListener("click", handleNew);
  btnOpen.addEventListener("click", handleOpen);
  btnSaveAs.addEventListener("click", handleSaveAs);

  // [원리] 키보드 단축키: Cmd(맥) 또는 Ctrl(윈도/리눅스) 조합
  // 브라우저 기본 동작(e.preventDefault로 막지 않으면 탭이 닫히는 등)을 방지
  window.addEventListener("keydown", (e) => {
    const isMod = e.metaKey || e.ctrlKey; // [원리] metaKey는 Mac Cmd, ctrlKey는 Ctrl
    if (isMod && e.key.toLowerCase() === "n") {
      e.preventDefault();
      handleNew();
    }
    if (isMod && e.key.toLowerCase() === "o") {
      e.preventDefault();
      void handleOpen();
    }
    if (isMod && e.key.toLowerCase() === "s") {
      // [원리] 자동 저장이지만, 사용자가 Cmd+S를 누르면 즉시 저장되게 한다
      e.preventDefault();
      if (saveTimer !== null) clearTimeout(saveTimer);
      void performAutoSave();
    }
  });

  // [원리] 창을 닫기 전에 저장되지 않은 변경이 있으면 경고
  // Tauri에서는 별도 이벤트로 처리할 수도 있지만, beforeunload도 동작한다
  window.addEventListener("beforeunload", (e) => {
    if (isDirty) {
      e.preventDefault();
      // [원리] 일부 브라우저는 returnValue 설정이 있어야 다이얼로그를 띄운다
      e.returnValue = "";
    }
  });
}

// ─────────────────────────────────────────────────────────────
// [원리] 앱 초기화
// HTML이 모두 파싱된 뒤 실행되도록 한다. <script defer> 덕에 DOM이 준비된 상태.
// ─────────────────────────────────────────────────────────────
bindEvents();
updateFilePathDisplay();
updateCharCount();
setStatus("준비됨", "idle");
console.log("[Github WIKI Editor] 초기화 완료 - 자동 저장 600ms 디바운스 활성화");
