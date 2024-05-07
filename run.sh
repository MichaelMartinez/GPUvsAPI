#!/bin/bash

# Install dependencies
npm install http-server
npm install -g http-server

# Start the HTTP server
http-server . &

# Open the web page in the default browser
open http://localhost:8080
