APPNAME=${2:-Untitled}
DIR=${1}

mkdir -p "$DIR/$APPNAME.app/Contents/MacOS"
mkdir -p "$DIR/$APPNAME.app/Contents/Resources"
touch    "$DIR/$APPNAME.app/Contents/MacOS/$APPNAME"
chmod +x "$DIR/$APPNAME.app/Contents/MacOS/$APPNAME"

DONE=false
until $DONE ;do
  read || DONE=true
  [[ ! $REPLY ]] && continue
  echo "$REPLY" >> "$APPNAME.app/Contents/MacOS/$APPNAME"
done

cat <<EOF > $DIR/$APPNAME.app/Contents/Info.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleExecutable</key>
	<string>$APPNAME</string>
	<key>CFBundleGetInfoString</key>
	<string>$APPNAME</string>
	<key>CFBundleIconFile</key>
	<string>$APPNAME</string>
	<key>CFBundleName</key>
	<string>$APPNAME</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
</dict>
</plist>
EOF

chmod +x "$DIR/$APPNAME.app"

cp -v $DIR/app/doc/logo_mitao_mini_2.png $DIR/$APPNAME.app/Contents/Resources/mitao.icns
