#!/bin/bash
DEFAULT_COMMIT_MESSAGE="minor changes"

COMMIT_MESSAGE=${1:-$DEFAULT_COMMIT_MESSAGE}

git add -A
git commit -m "$COMMIT_MESSAGE"
git push origin nico