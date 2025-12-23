#!/bin/bash
cd /home/kavia/workspace/code-generation/classic-snake-game-190591-190600/frontend_snake_game
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

