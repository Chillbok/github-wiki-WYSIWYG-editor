// Github WIKI Editor - Tauri 백엔드 (Rust)
// [전체 원리]
// 이 파일은 Tauri의 Rust 백엔드 진입점이다.
// 프론트엔드(TypeScript)에서 invoke("read_text_file", {path})를 호출하면
// 이 파일의 #[tauri::command] 함수가 실행되어 결과를 다시 JS로 돌려준다.
// Tauri는 이 과정을 위해 serde로 JSON 직렬화/역직렬화를 자동 처리한다.

use std::fs;
use std::path::Path;

// ─────────────────────────────────────────────────────────────
// [원리] 파일 읽기 명령
// - #[tauri::command] : 이 함수가 JS에서 호출 가능한 Tauri 명령임을 선언
// - path: String : JS에서 {path: "/some/file.md"}로 넘긴 값. serde가 자동 변환.
// - Result<String, String> : 성공 시 파일 내용을, 실패 시 에러 메시지를 JS로 전달.
//   JS에서는 try/catch로 에러를 잡을 수 있다.
// ─────────────────────────────────────────────────────────────
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    // [원리] Path::new는 경로 문자열을 OS 경로 객체로 변환. Utf-8 검증도 포함.
    let p = Path::new(&path);

    // [원리] 파일 존재 여부 사전 체크. 없으면 fs::read_to_string이 OS 에러를 내지만,
    // 사용자 친화적 메시지를 위해 미리 검사한다.
    if !p.exists() {
        return Err(format!("파일을 찾을 수 없습니다: {}", path));
    }

    // [원리] fs::read_to_string은 파일을 UTF-8 텍스트로 읽는다.
    // 바이너리 파일은 에러가 난다. 텍스트 에디터이므로 이는 의도된 동작.
    // map_err로 std::io::Error를 String으로 변환해 JS로 전달한다.
    fs::read_to_string(p).map_err(|e| format!("파일 읽기 실패 ({}): {}", path, e))
}

// ─────────────────────────────────────────────────────────────
// [원리] 파일 쓰기 명령
// - path: 저장할 파일의 절대 경로
// - contents: 저장할 텍스트 내용
// - Result<(), String> : 성공 시 빈 값(()), 실패 시 에러 메시지
// [원리] fs::write는 파일이 없으면 생성하고, 있으면 덮어쓴다. 부모 디렉토리는 자동 생성하지 않는다.
// ─────────────────────────────────────────────────────────────
#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    let p = Path::new(&path);

    // [원리] 부모 디렉토리가 없으면 생성. 예: /a/b/c.md에서 /a/b가 없으면 만든다.
    // 이미 존재하면 아무 일도 하지 않는다.
    if let Some(parent) = p.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("디렉토리 생성 실패 ({}): {}", parent.display(), e))?;
        }
    }

    // [원리] fs::write는 원자적이지 않다. 쓰기 도중 앱이 죽으면 파일이 깨질 수 있다.
    // 최소 에디터이므로 단순 write를 쓰고, 추후 필요 시 임시 파일 + rename 방식으로 개선 가능.
    fs::write(p, contents).map_err(|e| format!("파일 쓰기 실패 ({}): {}", path, e))
}

// ─────────────────────────────────────────────────────────────
// [원리] Tauri 앱 실행 함수
// - tauri::Builder::default() : Tauri 앱 빌더 생성
// - .plugin(...) : 플러그인 등록. dialog 플러그인이 없으면 open/save 다이얼로그가 동작하지 않는다.
// - .invoke_handler(...) : JS에서 호출할 수 있는 Rust 함수 목록 등록
// - .run(...) : 이벤트 루프 시작 (앱이 종료될 때까지 블로킹)
// ─────────────────────────────────────────────────────────────
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // [원리] dialog 플러그인: 프론트의 open()/save()가 OS 네이티브 다이얼로그를 띄우게 한다
        .plugin(tauri_plugin_dialog::init())
        // [원리] opener 플러그인: 외부 링크를 기본 브라우저로 여는 기능 (템플릿 기본값)
        .plugin(tauri_plugin_opener::init())
        // [원리] generate_handler! 매크로가 각 함수의 래퍼를 생성해 JS와 연결한다
        .invoke_handler(tauri::generate_handler![read_text_file, write_text_file])
        .run(tauri::generate_context!())
        .expect("Tauri 앱 실행 중 에러 발생");
}
