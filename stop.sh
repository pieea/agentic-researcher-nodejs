#!/bin/bash

# Agentic Researcher - 서버 종료 스크립트
# 실행 중인 백엔드와 프론트엔드 서버를 종료합니다

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 서버 종료 중...${NC}"
echo ""

# 백엔드 종료 (포트 8080)
BACKEND_PID=$(lsof -ti:8080)
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${BLUE}백엔드 서버 종료 중 (PID: $BACKEND_PID)...${NC}"
    kill $BACKEND_PID
    echo -e "${GREEN}✅ 백엔드 서버 종료 완료${NC}"
else
    echo "백엔드 서버가 실행 중이지 않습니다."
fi

# 프론트엔드 종료 (포트 3000)
FRONTEND_PID=$(lsof -ti:3000)
if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${BLUE}프론트엔드 서버 종료 중 (PID: $FRONTEND_PID)...${NC}"
    kill $FRONTEND_PID
    echo -e "${GREEN}✅ 프론트엔드 서버 종료 완료${NC}"
else
    echo "프론트엔드 서버가 실행 중이지 않습니다."
fi

echo ""
echo -e "${GREEN}✅ 모든 서버가 종료되었습니다.${NC}"
