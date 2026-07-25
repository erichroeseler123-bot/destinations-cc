#!/bin/bash
HOST="welcometoneworleanstours.com"
URLS=(
"/categories/swamp-tours"
"/categories/city-tours"
"/categories/plantation-tours"
"/categories/french-quarter-tours"
)
for URL in "${URLS[@]}"; do
  echo "Testing: $URL"
  curl -s -L -I -H "Host: $HOST" "http://localhost:3000$URL" | grep -E "HTTP/|Location:"
  FINAL_URL=$(curl -s -L -o /dev/null -w "%{url_effective}" -H "Host: $HOST" "http://localhost:3000$URL")
  echo "Final URL: $FINAL_URL"
  echo "---"
done
