#!/bin/sh

IN=lib/
OUT=public/js/

set -e -x

coffee --watch --output $OUT $IN
