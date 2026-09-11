# selnar 작업 규칙

작업 전에 반드시 [PLAN.md](PLAN.md)와 [FIGMA_SPEC.md](FIGMA_SPEC.md)를 읽는다. 기능 목록, 폴더 구조, Figma 디자인 명세, 단계별 로드맵이 거기 있다.

## 코드

- 스택: Vite + React + TypeScript, Tailwind CSS v4, React Router, Zustand
- 스타일은 Tailwind 클래스로 작성한다. 별도 CSS 파일은 만들지 않는다
- 기능 전용 코드는 `src/features/<기능>`, 공용 코드만 `src/components`, `src/lib`에 둔다
- 전역 상태는 `src/stores`의 Zustand 스토어로 관리한다
- `src` 안의 다른 폴더를 가져올 때는 `@/` 별칭을 쓴다 (`import { Button } from '@/components/ui/Button'`)
- 현재 단계 범위를 넘는 기능은 만들지 않는다

## 작업 마무리

- `npm run format`, `npm run build`, `npm run lint`를 차례로 실행해 모두 통과시킨다
- 로드맵 항목을 끝내면 PLAN.md의 체크박스를 갱신한다

## Git

- 작업 하나가 끝나면 커밋한다. 메시지는 `feat:`, `fix:`, `chore:`, `docs:` 접두어를 붙인다
- 폴더 이동·삭제, 브랜치나 원격 설정 같은 작업은 한 도구만 한다. 그동안 다른 도구는 이 폴더에서 작업하지 않는다
- `.git` 폴더를 직접 옮기거나 지우지 않는다
