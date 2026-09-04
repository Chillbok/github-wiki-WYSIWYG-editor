// [원리] 빌드 스크립트: Cargo가 Rust 컴파일 전에 실행하는 전처리 단계
// tauri_build::build()가 tauri.conf.json을 읽어 필요한 코드를 생성한다
fn main() {
    tauri_build::build()
}
