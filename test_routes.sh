#!/bin/bash
HOST="welcometoneworleanstours.com"
URLS=(
"/"
"/tours"
"/swamp-tours"
"/city-tours"
"/plantation-tours"
"/categories/swamp-tours"
"/categories/city-tours"
"/categories/plantation-tours"
"/categories/french-quarter-tours"
"/areas/french-quarter"
"/editorial-policy"
"/how-we-rank-tours"
)

for URL in "${URLS[@]}"; do
  echo "Testing: $URL"
  curl -s -I -H "Host: $HOST" "http://localhost:3000$URL" | grep -E "HTTP/|Location:"
  echo "---"
done
