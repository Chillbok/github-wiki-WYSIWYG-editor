import { defineConfig } from "vite";

// [원리] TAURI_DEV_HOST: Tauri가 모바일 개발 시 네트워크 호스트를 전달하는 환경 변수
// @ts-expect-error process는 Node.js 전역 객체라 브라우저 타입에는 없지만 빌드 시엔 존재한다
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  // [원리] Vite 옵션: Tauri 개발에 최적화된 설정
  // 1. clearScreen: false - Vite가 터미널을 지우지 않아 Rust 에러 로그가 가려지지 않는다
  clearScreen: false,
  // 2. Tauri는 고정 포트(1420)를 기대하므로, 포트가 없으면 실패해야 한다
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. src-tauri는 Rust 코드라 Vite가 감시할 필요 없음 → 무시
      ignored: ["**/src-tauri/**"],
    },
  },
}));
