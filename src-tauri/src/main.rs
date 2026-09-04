// [원리] Windows에서 release 빌드 시 콘솔 창이 추가로 뜨는 것을 방지한다. Tauri 기본 설정.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// [원리] main.rs는 실행 파일의 진입점. 실제 로직은 lib.rs의 run()에 위임한다.
// 이렇게 분리하면 모바일(안드로이드/iOS)에서도 같은 lib를 재사용할 수 있다.
fn main() {
    github_wiki_wysiwyg_editor_lib::run()
}
