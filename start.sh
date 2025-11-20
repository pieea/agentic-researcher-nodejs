#!/bin/bash

# Agentic Researcher - Next.js Frontend + Backend 통합 실행 스크립트
# 백엔드와 Next.js 프론트엔드를 동시에 실행합니다

set -e  # 에러 발생시 중단

echo "🚀 Agentic Researcher (Next.js) 시작..."
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 백엔드 경로
BACKEND_DIR="../agentic-researcher/backend"

# 백엔드 환경 변수 체크
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}⚠️  $BACKEND_DIR/.env 파일이 없습니다!${NC}"
    echo "backend/.env.example을 복사하여 backend/.env를 만들고 API 키를 설정하세요."
    echo ""
    echo "예시:"
    echo "  cp $BACKEND_DIR/.env.example $BACKEND_DIR/.env"
    echo "  # .env 파일을 편집하여 API 키 입력 (OPENAI_API_KEY, TAVILY_API_KEY)"
    exit 1
fi

# Next.js 환경 변수 체크
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local 파일이 없습니다. 기본값으로 생성합니다.${NC}"
    cat > .env.local << EOF
BACKEND_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo -e "${GREEN}✅ .env.local 파일 생성 완료${NC}"
    echo ""
fi

# 백엔드 의존성 체크 및 설치
echo -e "${BLUE}📦 백엔드 의존성 확인 중...${NC}"
cd "$BACKEND_DIR"
if [ ! -d ".venv" ]; then
    echo "가상환경 생성 및 의존성 설치 중..."
    uv venv
    uv sync
else
    echo "✅ 백엔드 의존성 준비 완료"
fi
cd - > /dev/null

# Next.js 의존성 체크 및 설치
echo -e "${BLUE}📦 Next.js 의존성 확인 중...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Next.js 의존성 설치 중..."
    npm install
else
    echo "✅ Next.js 의존성 준비 완료"
fi

echo ""
echo -e "${GREEN}✅ 모든 의존성 준비 완료${NC}"
echo ""

# 로그 디렉토리 생성
mkdir -p logs

# 트랩 설정 (Ctrl+C 시 모든 프로세스 종료)
trap 'echo -e "\n${RED}🛑 서버 종료 중...${NC}"; kill 0' EXIT INT TERM

# 백엔드 시작
echo -e "${BLUE}🔧 백엔드 서버 시작 중... (포트 8080)${NC}"
cd "$BACKEND_DIR"
uv run uvicorn src.main:app --host 127.0.0.1 --port 8080 --reload > "$(pwd)/../../agentic-researcher-nextjs/logs/backend.log" 2>&1 &
BACKEND_PID=$!
cd - > /dev/null

# 백엔드가 준비될 때까지 대기
echo "⏳ 백엔드 서버 준비 대기 중..."
sleep 3

# 백엔드 헬스체크
if curl -s http://127.0.0.1:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 백엔드 서버 준비 완료${NC}"
else
    echo -e "${RED}⚠️  백엔드 서버가 정상적으로 시작되지 않았습니다${NC}"
    echo "logs/backend.log를 확인하세요"
fi

# Next.js 프론트엔드 시작
echo -e "${BLUE}🎨 Next.js 프론트엔드 시작 중... (포트 3000)${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 서버가 성공적으로 시작되었습니다!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📱 Next.js 프론트엔드: ${BLUE}http://localhost:3000${NC}"
echo -e "🔧 백엔드 API: ${BLUE}http://localhost:8080${NC}"
echo -e "📖 API 문서: ${BLUE}http://localhost:8080/docs${NC}"
echo ""
echo -e "💡 팁:"
echo "  - 백엔드 로그: tail -f logs/backend.log"
echo "  - 프론트엔드 로그: tail -f logs/frontend.log"
echo ""
echo -e "${RED}종료하려면 Ctrl+C를 누르세요${NC}"
echo ""

# 프로세스 대기
wait
