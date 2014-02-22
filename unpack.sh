pushd . > /dev/null

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ALL_IMAGE_DIR="${DIR}/webapp/images"

unzip "${DIR}/Brands.zip"

if ! [[ -d "${ALL_IMAGE_DIR}" ]]; then 
    mkdir "${ALL_IMAGE_DIR}"
fi

for file in `find "${DIR}" -name *.jpg`; do
    hash="$(openssl dgst -md5 "${file}" | sed 's/^[^=]*=[ ]*//')" 
    cp "${file}" "${ALL_IMAGE_DIR}/${hash}.jpg"
done


popd > /dev/null

