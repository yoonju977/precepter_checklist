# 신규간호사 체크리스트 웹앱 기술 구조 판단

## 1. 프로젝트 목적

기존 엑셀 양식인 **신규간호사 체크리스트 4주/8주 양식**을 기반으로, PC와 모바일에서 역할별로 입력하고, 최종 출력은 원본 엑셀 양식과 동일하게 유지하는 웹앱을 제작한다.

핵심 방향은 다음과 같다.

- 입력 화면은 웹/모바일에서 편하게 사용한다.
- 최종 출력물은 기존 엑셀 양식의 디자인과 서식을 유지한다.
- 프리셉티, 프리셉터, 교육전담, 수간호사 역할별로 화면과 권한을 분리한다.
- 전자서명, 중간저장, 불러오기, 최종 출력 기능을 제공한다.
- 배포는 가능하면 GitHub Pages를 사용한다.
- AWS, 별도 서버, SQL 설치처럼 무거운 백엔드 구조는 피한다.

---

## 2. 최종 판단

이 프로젝트는 제작 가능하다.

다만 **GitHub Pages만으로는 여러 사용자가 접속해서 데이터를 CRUD하고 Google Drive에 저장하는 기능을 완전하게 처리하기 어렵다.**

따라서 가장 현실적인 구조는 다음과 같다.

```text
React + TypeScript + Vite + Tailwind CSS
+ LocalStorage / JSON 저장
+ Google Apps Script
+ Google Drive 또는 Google Sheets
+ GitHub Pages 배포
```

---

## 3. 프레임워크 선택

### 추천

```text
React + TypeScript + Vite + Tailwind CSS
```

### 선택 이유

#### React

역할별 화면, 체크리스트 카드, 점수 입력, 메모 입력, 서명 패드, 저장/불러오기 UI를 구성하기에 적합하다.

#### TypeScript

체크리스트 문항, 평가자 역할, 점수, 메모, 서명 데이터 등 데이터 구조가 복잡해질 가능성이 있으므로 TypeScript를 사용하는 것이 안전하다.

#### Vite

React 프로젝트를 빠르게 생성하고 실행할 수 있다. GitHub Pages 정적 배포에도 적합하다.

#### Tailwind CSS

모바일 대응, 카드형 UI, 반응형 화면 구성을 빠르게 만들 수 있다.

---

## 4. Next.js를 사용하지 않는 이유

Next.js는 서버 기능, 라우팅, SSR/SSG 등에 강점이 있다.

하지만 현재 프로젝트는 다음 성격이 더 강하다.

- 입력 중심 웹앱
- 모바일 반응형 화면
- 브라우저 저장
- 엑셀 출력
- GitHub Pages 정적 배포

GitHub Pages에서는 Next.js의 서버 기능을 제대로 활용하기 어렵다. 따라서 현재 단계에서는 Next.js보다 Vite 기반 React가 더 단순하고 적합하다.

---

## 5. Node.js 단독 사용 여부

Node.js 단독은 추천하지 않는다.

Node.js는 서버 실행 환경이 필요하다. 하지만 GitHub Pages는 정적 사이트 호스팅만 지원하므로 Node 서버를 직접 실행할 수 없다.

단, 개발 과정에서 `npm` 명령어를 사용하기 위해 Node.js 설치는 필요하다.

---

## 6. 데이터베이스 구조 판단

### 핵심 질문

Google Drive를 DB처럼 사용할 것인가, 아니면 별도 DB를 두고 Drive로 엑셀/CSV를 export할 것인가?

### 결론

초기/간단 운영 버전에서는 별도 SQL DB를 두지 않는다.

대신 다음 구조를 사용한다.

```text
프론트엔드 웹앱
→ Google Apps Script
→ Google Drive / Google Sheets 저장
```

---

## 7. Google Drive를 직접 DB처럼 쓰는 방식

브라우저에서 Google Drive API를 직접 호출하여 파일을 만들고 수정하는 방식은 가능하다.

하지만 다음 문제가 있다.

- Google 로그인/OAuth 인증 처리가 필요하다.
- 사용자마다 권한 허용이 필요할 수 있다.
- 브라우저에 인증 로직이 들어가면서 구조가 복잡해진다.
- 단순 운영용으로는 유지보수가 어렵다.

따라서 Google Drive API를 프론트엔드에서 직접 다루는 방식은 비추천한다.

---

## 8. Google Apps Script를 사용하는 방식

가장 현실적인 방식이다.

Google Apps Script를 간단한 API 서버처럼 사용한다.

```text
GitHub Pages 사이트
→ fetch 요청
→ Google Apps Script Web App
→ Google Drive 폴더 또는 Google Sheets에 저장
```

### 장점

- AWS, 별도 백엔드 서버가 필요 없다.
- SQL 설치가 필요 없다.
- Google Drive/Sheets와 연결이 쉽다.
- GitHub Pages 정적 배포와 함께 사용할 수 있다.
- CRUD 기능을 구현할 수 있다.

### 단점

- 완전한 전문 DB만큼 강력하지는 않다.
- 동시 수정 충돌 처리에는 한계가 있다.
- 권한/배포 설정을 신중히 해야 한다.
- 대규모 사용에는 적합하지 않다.

하지만 현재 프로젝트 규모에서는 충분히 현실적이다.

---

## 9. CSV 저장 방식 판단

요구사항 중 “현재 프로젝트 소스에 올라간 엑셀 파일의 각 시트를 CSV 파일로 변환하고, Google Drive에 저장하여 사이트 운영 시 CRUD가 가능해야 한다”는 조건이 있다.

이 구조는 가능하다.

다만 CSV만으로는 원본 엑셀 디자인을 유지할 수 없다.

따라서 역할을 분리한다.

```text
CSV 또는 Google Sheets
= 데이터 저장용

원본 XLSX 파일
= 최종 출력 템플릿용
```

즉, CSV는 DB처럼 사용하고, 최종 출력 시에는 원본 엑셀 파일을 템플릿으로 사용한다.

---

## 10. 출력 구조

최종 출력은 웹 화면을 그대로 프린트하는 방식보다, 원본 엑셀 파일을 템플릿으로 사용하는 방식이 적절하다.

```text
원본 XLSX 템플릿
→ 웹앱 입력값 삽입
→ 전자서명 이미지 삽입
→ 완성본 XLSX 다운로드
→ 필요 시 PDF 저장 또는 종이 출력
```

### 이유

요구사항에서 최종 출력물은 기존 엑셀 양식과 동일해야 한다. 웹 화면을 인쇄하면 엑셀 원본 디자인을 완전히 유지하기 어렵다.

---

## 11. 저장 방식 단계별 전략

### 1단계: 로컬 테스트 버전

```text
LocalStorage 자동저장
JSON 파일 다운로드
JSON 파일 불러오기
```

이 단계에서는 서버 없이 테스트 가능하다.

가능한 기능:

- 프리셉티 자가평가 입력
- 프리셉터 평가 입력
- 교육전담 평가 입력
- 수간호사 최종평가 입력
- 전자서명
- 자동 중간저장
- JSON 저장/불러오기
- 70점 미만 경고 팝업

### 2단계: 운영용 최소 버전

```text
Google Apps Script
Google Drive 또는 Google Sheets 저장
대상자별 데이터 CRUD
```

가능한 기능:

- 대상자별 저장
- 역할별 입력값 저장
- 공유 URL 기반 접근
- 여러 기기에서 이어서 입력
- CSV/JSON/Sheets 데이터 관리

### 3단계: 확장 버전

필요 시 다음 구조를 고려할 수 있다.

```text
Supabase / Firebase
또는 별도 백엔드 + DB
```

하지만 현재 요구사항에서는 우선순위가 낮다.

---

## 12. 역할별 데이터 구조 기본 방향

문항 1개에 대해 다음 평가값을 저장한다.

```ts
type Evaluation = {
  score: number | null
  memo: string
  signerName: string
  signatureImage: string | null
  signedAt: string | null
}

type ChecklistItemResult = {
  itemId: string
  preceptee: Evaluation
  preceptor: Evaluation
  educator: Evaluation
  headNurse: Evaluation
}
```

프리셉터가 2명이더라도 프리셉터 평가 칸은 문항당 1개만 둔다.

프리셉터 변경이 발생하면, 담당 문항을 미리 고정하지 않고 실제 평가한 사람의 이름과 서명일시만 기록한다.

---

## 13. 회색 문항 처리

원본 엑셀에서 회색으로 표시된 문항은 프리셉터가 아니라 교육전담이 평가한다.

따라서 문항 데이터에는 담당자 이름이 아니라 평가 주체 유형을 저장한다.

```ts
type EvaluatorType = "preceptor" | "educator"
```

예시:

```ts
type ChecklistItem = {
  id: string
  weekType: "4week" | "8week"
  category: string
  content: string
  evaluatorType: "preceptor" | "educator"
}
```

---

## 14. GitHub Pages 배포 가능 여부

가능하다.

단, GitHub Pages는 정적 사이트 배포만 가능하다.

따라서 다음 기능은 프론트엔드에서 처리한다.

- 화면 표시
- 역할별 입력
- 전자서명
- LocalStorage 저장
- JSON 저장/불러오기
- 엑셀 파일 생성

서버 저장이 필요한 기능은 Google Apps Script로 처리한다.

- 대상자 데이터 저장
- 대상자 데이터 불러오기
- Drive/Sheets CRUD
- CSV/JSON 저장

---

## 15. 현재 Windows 작업 환경 기준 개발 순서

현재 작업 위치:

```text
C:\Users\82107\Desktop\precepter_checklist
```

권장 개발 순서:

```text
1. React + TypeScript + Vite 프로젝트 생성
2. Tailwind CSS 설치
3. 기본 폴더 구조 생성
4. 엑셀 시트 CSV 변환
5. 체크리스트 데이터 모델 설계
6. 역할별 화면 구성
7. LocalStorage 자동저장 구현
8. JSON 다운로드/불러오기 구현
9. 전자서명 구현
10. 원본 XLSX 출력 기능 구현
11. Google Apps Script 연동
12. GitHub Pages 배포
```

---

## 16. 프로젝트 기본 폴더 구조안

```text
precepter_checklist/
├─ public/
│  ├─ templates/
│  │  └─ checklist-template.xlsx
│  └─ data/
│     ├─ sheet-cover.csv
│     ├─ checklist-4week.csv
│     ├─ checklist-8week.csv
│     └─ department-transfer.csv
│
├─ src/
│  ├─ app/
│  │  └─ App.tsx
│  │
│  ├─ components/
│  │  ├─ layout/
│  │  ├─ checklist/
│  │  ├─ signature/
│  │  └─ common/
│  │
│  ├─ features/
│  │  ├─ checklist/
│  │  ├─ evaluations/
│  │  ├─ export/
│  │  ├─ import/
│  │  └─ storage/
│  │
│  ├─ lib/
│  │  ├─ excel/
│  │  ├─ googleDrive/
│  │  └─ utils/
│  │
│  ├─ types/
│  │  ├─ checklist.ts
│  │  ├─ evaluation.ts
│  │  └─ userRole.ts
│  │
│  ├─ data/
│  │  └─ sampleData.ts
│  │
│  └─ main.tsx
│
├─ docs/
│  └─ technical-decision.md
│
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
└─ README.md
```

---

## 17. 최종 기술 선택

최종 권장 스택:

```text
Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS

Local Save:
- LocalStorage
- JSON export/import

Excel:
- xlsx 또는 ExcelJS

Signature:
- signature_pad 또는 react-signature-canvas

Remote Save:
- Google Apps Script
- Google Drive 또는 Google Sheets

Deploy:
- GitHub Pages
```

---

## 18. 최종 결론

현재 요구사항은 제작 가능하다.

단, 다음처럼 역할을 분리해야 한다.

```text
GitHub Pages
= 사이트 배포

React 앱
= 입력 화면, 역할별 UI, 전자서명, 저장/불러오기, 엑셀 출력

LocalStorage/JSON
= 초기 테스트용 저장

Google Apps Script
= 운영용 CRUD 중계 API

Google Drive/Sheets
= CSV/JSON/데이터 저장소

원본 XLSX
= 최종 출력 템플릿
```

가장 먼저 할 작업은 다음이다.

```text
1. React + TypeScript + Vite 프로젝트 생성
2. Tailwind CSS 설치
3. 기본 폴더 구조 생성
4. docs/technical-decision.md 파일 커밋
```
