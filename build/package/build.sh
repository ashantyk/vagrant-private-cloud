#!/usr/bin/env bash

set -e

#
# set variables
#
PACKAGE_NAME="vagrant-private-cloud"
BASE_DST="/tmp/${PACKAGE_NAME}"
REPO_SRC="../../"
TARGET_DST="${BASE_DST}/opt/vagrant-private-cloud"

#
# create target directory
#
echo "Creating target directory"
mkdir -p ${TARGET_DST}
mkdir -p ${TARGET_DST}/src
mkdir -p ${TARGET_DST}/config

#
# copy application files
#
echo "Copying application files"
cp -R ${REPO_SRC}/index.js      ${TARGET_DST}/index.js
cp -R ${REPO_SRC}/package.json  ${TARGET_DST}/package.json
cp -R ${REPO_SRC}/readme.md     ${TARGET_DST}/readme.md
cp -R ${REPO_SRC}/LICENSE       ${TARGET_DST}/LICENSE
cp -R ${REPO_SRC}/src/*         ${TARGET_DST}/src
cp -R ${REPO_SRC}/config/default.json ${TARGET_DST}/config/default.json

#
# copy systemd services
#
echo "Copying service file"
mkdir -p "${BASE_DST}/lib/systemd/system/"
cp -R "${REPO_SRC}/build/services/vagrant-private-cloud.service" "${BASE_DST}/lib/systemd/system/vagrant-private-cloud.service"

#
# copy dpkg scripts
#
echo "Copying DPKG scripts"
mkdir -p ${BASE_DST}/DEBIAN
cp -R ${REPO_SRC}/build/package/deb/preinst  ${BASE_DST}/DEBIAN/preinst
cp -R ${REPO_SRC}/build/package/deb/postinst ${BASE_DST}/DEBIAN/postinst
cp -R ${REPO_SRC}/build/package/deb/prerm    ${BASE_DST}/DEBIAN/prerm
cp -R ${REPO_SRC}/build/package/deb/postrm   ${BASE_DST}/DEBIAN/postrm
cp -R ${REPO_SRC}/build/package/deb/control  ${BASE_DST}/DEBIAN/control
chmod +x ${BASE_DST}/DEBIAN/*

#
# make sure all the interesting files are in unix format
#
echo "Ensuring line endings"
find "$TARGET_DST" -name "*.sh" -print0 | xargs -0 dos2unix
find "$TARGET_DST" -name "*.js" -print0 | xargs -0 dos2unix

#
# get required .deb variables
#
DEB_VERSION=$(grep -Po '(?<=Version: ).*' ${REPO_SRC}/build/package/deb/control)
PACKAGE_FILENAME=${PACKAGE_NAME}_${DEB_VERSION}.deb
PACKAGE_SIZE=$(du -s -k --exclude ${TARGET_DST}/DEBIAN* ${TARGET_DST} | cut -f1)

#
# build .deb
#
echo "Building .deb file"
sed -i "5i Installed-Size: $PACKAGE_SIZE" ${BASE_DST}/DEBIAN/control
dpkg-deb --build ${BASE_DST} $PACKAGE_FILENAME
