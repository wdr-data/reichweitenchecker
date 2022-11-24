#!/usr/bin/env bash

usage() {
  echo -e "Usage: ./$(basename $0)

Upload data from data/ to Google Cloud Storage
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


upload() {
  # destination folder in google cloud storage
  cloud_dst=gs:/"$base_path"

  # set google cloud project if necessary
  cloud_project=rbb-data-static-file-server
  [ "$(gcloud config get-value project)" = "$cloud_project" ] || gcloud config set project "$cloud_project"

  # sync files to the cloud
  gsutil rsync -d -r -c "$DATA_DIR" "$cloud_dst"

  # configure caching of assets
  gsutil setmeta -h 'Cache-Control:public,max-age=3600' "$cloud_dst"/**/*.json
}

main() {
  base_path="$DATA_PATH"
  upload
}

main "$@"
