# J war

1인칭 총싸움 웹 게임. 혼자(결투 1대1~5대5 · 총 바꾸기)도, 친구와(방 번호 대결)도 할 수 있어요.

- 게임 주소: GitHub Pages (`index.html`)
- 비용 0원: GitHub Pages + 무료 공개 중계 서버(MQTT) + 직접 만든 블록 그래픽·효과음

## 파일
| 파일 | 내용 |
|---|---|
| `index.html` | 화면 틀·디자인(CSS) |
| `js/01-data.js` | 버전(VER)·무기·춤·등급·맵·임무·패치 노트 |
| `js/02-core.js` | 저장·소리·3D 화면·맵 만들기·충돌·광선·이펙트 |
| `js/03-actors.js` | 캐릭터 모양·피해·사격·로켓·봇 AI |
| `js/04-player.js` | 조작(터치·키보드)·내 캐릭터·손에 든 총 |
| `js/05-modes.js` | 결투(9전 5선승)·총 바꾸기·친구와 대결·열쇠 보상·기록 |
| `js/06-net.js` | 온라인(방 번호) |
| `js/07-ui.js` | 메뉴·HUD·메인 루프 |

## 패치 올리는 법
1. 고칠 파일만 고치기
2. `js/01-data.js` 의 `VER` 올리고 `PATCH` 맨 앞에 패치 노트 추가
3. `python3 stamp.py` → `version.json` 과 `index.html` 의 `?v=` 가 VER 로 맞춰짐
4. commit / push → 열려 있던 게임은 다음에 켤 때 자동으로 새 버전

## 자동 점검·자동 업그레이드
- `node tools/smoke.js [스크린샷.png]` — 혼자 하는 모드를 모두 잠깐 돌려 오류를 찾음(오류 0개여야 올림)
- `UPGRADE_LOG.md` — 예약 작업(하루 1번)이 보는 후보 표와 기록
- 올릴 때는 `git push origin main && git push origin main:gh-pages` (두 가지 모두)
