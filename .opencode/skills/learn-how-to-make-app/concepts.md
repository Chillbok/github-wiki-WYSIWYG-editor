# 용어·비유 모음 (concepts.md)

`SKILL.md`에서 비유가 필요할 때만 읽는다. 각 항목 양식 5줄 고정: 정의 / C++·C# 비유 / 12살 비유 / 파일 앵커 / 흔한 오해.

## 1. npm

- 한 줄 정의: 자바스크립트 라이브러리 앱스토어. `package.json` 목록을 `node_modules/`에 내려받는다.
- C++/C# 비유: Unity Package Manager. `_SHARED` 에셋을 manifest대로 내려받는 것과 같다.
- 12살 비유: 레고 부품 주문서(`package.json`)를 가게(`npm`)에 내면 부품 상자(`node_modules/`)가 집에 온다.
- 파일 앵커: `package.json` scripts·dependencies.
- 흔한 오해: `npm install`을 매번 해야 하는 것으로 아는데, 목록이 바뀔 때만 다시 하면 된다.

## 2. TypeScript 타입

- 한 줄 정의: 자바스크립트에 타입을 붙인 것. 틀리면 실행 전에 알려준다.
- C++/C# 비유: C# 변수 선언처럼 `string`, `number`를 미리 적는 것. `as HTMLTextAreaElement`는 `Find()` 결과를 `TextArea`로 캐스팅하는 것과 같다.
- 12살 비유: 상자에 `문구용`, `숫자용` 딱지를 붙여두면, 엉뚱한 걸 넣으려 할 때 미리 막아준다.
- 파일 앵커: `src/main.ts` DOM 타입 단언, `string | null`, `tsconfig.json` `strict: true`.
- 흔한 오해: 타입을 쓰면 실행이 빨라지는 것으로 아는데, 실수 방지용이다. 속도는 그대로다.

## 3. Vite

- 한 줄 정의: 프론트 개발 서버. 저장하면 바로 화면에 반영해준다.
- C++/C# 비유: Unity에서 Play를 누르면 바로 실행되는 것과 같다.
- 12살 비유: 그림을 그리면 옆 거울에 바로 비쳐서 확인할 수 있는 이젤이다.
- 파일 앵커: `vite.config.ts` 포트 1420, `tauri.conf.json` `beforeDevCommand`.
- 흔한 오해: Vite만으로 앱이 완성되는 것으로 아는데, 웹 미리보기일 뿐 파일 저장은 Rust를 거쳐야 한다.

## 4. Rust Result·? (파일 읽기/쓰기)

- 한 줄 정의: 성공과 실패를 반환값으로 나누는 방식. 실패하면 에러 쪽지를 돌려준다.
- C++/C# 비유: C++ `try/catch` 대신 결과 상자에 성공물 또는 에러쪽지 중 하나를 넣어 돌려주는 것. `?`는 에러쪽지를 받으면 즉시 위로 전달하는 지름길이다. (`cout`, 파일 입출력을 모른다는 전제라 `fstream` 비교는 하지 않는다.)
- 12살 비유: 심부름 결과를 빈손으로 오지 않고, 성공하면 과자 상자, 실패하면 이유 쪽지를 반드시 들고 오는 약속이다.
- 파일 앵커: `src-tauri/src/lib.rs` `read_text_file`, `write_text_file`, `fs::read_to_string`, `fs::write`.
- 흔한 오해: `Err`가 뜨면 프로그램이 죽는 것으로 아는데, `try/catch`처럼 JS `catch`로 받아 상태를 표시하면 된다.

## 5. invoke (IPC 다리)

- 한 줄 정의: 앞 화면(TS)이 뒤쪽(Rust) 함수를 이름으로 호출하는 다리. JSON으로 주고받는다.
- C++/C# 비유: whitelist 초과 개념(`DllImport`)은 가정하지 않는다. 버튼을 누르면 주방(Rust)에 주문서(JSON)를 넘기는 것과 같다고만 설명한다.
- 12살 비유: 손님(TS)이 주방(Rust)에 메뉴 이름(`read_text_file`)과 재료(`{path}`)를 적은 주문서를 내면, 주방이 완성품(파일 내용)이나 이유 쪽지(에러)를 돌려준다.
- 파일 앵커: `src/main.ts` `invoke("read_text_file", {path})`, `src-tauri/src/lib.rs` `#[tauri::command]`.
- 흔한 오해: 이름만 같으면 되는 것으로 아는데, `{path}` 키 철자가 Rust 인자 `path`와 한 글자까지 같아야 한다.
