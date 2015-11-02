#!/bin/bash

cd "$( dirname "${BASH_SOURCE[0]}" )"

cd ..
node src/index.js -o email
