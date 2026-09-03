# github-wiki-WYSIWYG-editor

GitHub Wiki를 편집 영역에 한해 옵시디언 수준으로 편하게 쓰는 Tauri 기반 WYSIWYG(위지윅) 에디터입니다.
Rust·JavaScript 학습과 앱 개발 연습이 배경인 프로젝트입니다.

## 기능

### WYSIWYG 에디터 기능

- GitHub Wiki에서 사용하는 문법의 Auto-Completion
- 이미지와 문법의 실시간 라이브 프리뷰
- 여러 문서를 서로 다른 탭에 열어 편집할 수 있는 기능
- 이미지나 파일을 검색할 수 있는 파일 검색 기능

### 이미지 관련 기능

- 첨부한 이미지를 자동으로 GitHub 저장소에 업로드하고, 참조 링크를 GitHub 원격 저장소 기반(https)으로 수정하는 기능
- 동일한 이미지가 있는지 확인하고, 있다면 해당 이미지를 첨부하는 기능

### Git 커밋 및 푸시 기능

- 일괄 `commit`, `push`, `pull` 기능
- 간단하게 커밋 메시지 작성하게 해주는 기능

## 기술 스택

| 항목 | 사용할 기술 | 이유 |
| --- | --- | --- |
| GUI 프레임워크 | Tauri | Electron보다 번들이 가볍고, 성능이 우수함. 또한, Rust/JS 학습 목표와도 일치함. |
| 프론트엔드 | JavaScript | Tauri 프론트엔드 기본값, 추후 TypeScript 전환 여지 있음. |
| 백엔드 | Rust | Tauri 백엔드 기본 언어이자 학습 목표와 일치함. |

## 아키텍처

| 필요한 것 | 설명 |
| --- | --- |
| 에디터 코어 | 마우스로 꾸민 서식을 자동으로 마크다운으로 변환하는 기능 |
| GFM, GitHub Wiki 문법 파서 | 일반 마크다운을 GitHub Wiki 형식으로 변환하는 번역기 역할을 해줌 |
| 로컬 Git 연동, GitHub 연동 | 위키 저장소를 로컬에 복제해 수정한 뒤 다시 GitHub에 올리는 통로 |
| 파일 탐색기 | 파일을 검색하고, 위키에 존재하는 파일을 볼 수 있게 해주는 파일 탐색기 |

## 로드맵

- v0.1: 탭 편집 + 라이브 프리뷰 + 일괄 `push` / `pull`.
- 제외: 파일별 `stage` 후 커밋 (1차 버전에서 제공하지 않음).
- 설치 / 사용 방법: 프로토타입 구현 후 작성 예정.

## 라이선스

This project is licensed under the MIT License - see [LICENSE](./LICENSE) for details.

Copyright (c) 2026 Chillbok.
