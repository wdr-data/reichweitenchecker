#!/usr/bin/env bash

usage() {
  echo -e "Usage: ./$(basename $0) [-b|--build] [base_path]

Deploys a static build to Google Cloud Storage

  --build \t build before deploying, base_path is the public base path (default: BASE_PATH in .env)
"
  exit
}

# show help
if [[ "${1-}" =~ ^-*h(elp)?$ ]]; then
  usage
fi

set -o errexit  # exit script when a command fails
set -o nounset  # fail when accessing an unset variable
set -o pipefail  # treats pipeline command as failed when one command in the pipeline fails 
set -o xtrace  # prints every command before execution

# make sure to run from project root
cd $(dirname $0)/..

# load environment variables from file
export $(cat .env | xargs)


compress() {
  # compress text files
  text_files=$(find "$BUILD_DIR" -name '*.html' -o -name '*.css' -o -name '*.js')
  for f in $text_files; do gzip $f && mv $f.gz $f; done
}

upload() {
  # destination folder in google cloud storage
  cloud_dst=gs:/"$base_path"

  # set google cloud project if necessary
  cloud_project=rbb-data-static-file-server
  [ "$(gcloud config get-value project)" = "$cloud_project" ] || gcloud config set project "$cloud_project"

  # sync files to the cloud
  gsutil rsync -d -r -c "$BUILD_DIR" "$cloud_dst"

  # configure content types and encodings
  gsutil setmeta \
    -h 'Content-Encoding:gzip' \
    -h 'Content-Type:text/html' \
    -h 'Cache-Control:private,max-age=0,no-transform' "$cloud_dst"/**/*.html
  gsutil setmeta \
    -h 'Content-Encoding:gzip' \
    -h 'Content-Type:text/css' \
    -h 'Cache-Control:public,max-age=31536000,immutable' "$cloud_dst"/**/*.css
  gsutil setmeta \
    -h 'Content-Encoding:gzip' \
    -h 'Content-Type:text/javascript' \
    -h 'Cache-Control:public,max-age=31536000,immutable' "$cloud_dst"/**/*.js

  # configure caching of assets
  gsutil setmeta -h 'Cache-Control:public,max-age=31536000' "$cloud_dst"/**/*.{png,svg}
}

main() {
  # use base path from command line or from the environment
  base_path=${2:-"$BASE_PATH"}

  # fail if the base path is not set
  if [[ "$base_path" =~ .*{project-name}.* ]]; then
    echo 'BASE_PATH in .env not set (did you forget to run the setup script?)' >&2
    exit 1
  fi

  # re-build app if requested
  if [[ "${1-}" =~ ^-*b(uild)?$ ]]; then
    BASE_PATH="$base_path" npm run build
  fi

  compress
  upload
}

main "$@"
