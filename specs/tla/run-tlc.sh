#!/usr/bin/env bash
# Run TLC on every model under specs/tla, one property at a time, and compare
# the outcome with each model's expected.txt.
#
#   bash specs/tla/run-tlc.sh                 # all models
#   bash specs/tla/run-tlc.sh upload-build-cache
#
# expected.txt lines:  <invariant|property> <Name> <holds|violated>
# Exit code 0 when every outcome matches expected.txt, 1 otherwise.
# Full TLC output and counterexamples go to specs/tla/<model>/out/<Name>.txt.
set -euo pipefail

TLA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TLC_VERSION="v1.7.4"
TLC_SHA256="936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88"
TOOLS_DIR="${TLA_TOOLS_DIR:-$TLA_DIR/.tools}"
JAR="$TOOLS_DIR/tla2tools-$TLC_VERSION.jar"

command -v java >/dev/null || { echo "需要 Java 11 以上（java 指令）" >&2; exit 2; }

if [[ ! -f "$JAR" ]]; then
	mkdir -p "$TOOLS_DIR"
	echo "下載 TLC $TLC_VERSION ..."
	curl -fsSL -o "$JAR.part" "https://github.com/tlaplus/tlaplus/releases/download/$TLC_VERSION/tla2tools.jar"
	mv "$JAR.part" "$JAR"
fi
actual="$(sha256sum "$JAR" | cut -d' ' -f1)"
if [[ "$actual" != "$TLC_SHA256" ]]; then
	echo "tla2tools.jar 的 SHA-256 不符（$actual），刪掉 $JAR 後重跑" >&2
	exit 2
fi

models=("$@")
if [[ ${#models[@]} -eq 0 ]]; then
	for dir in "$TLA_DIR"/*/; do
		[[ -f "$dir/expected.txt" ]] && models+=("$(basename "$dir")")
	done
fi

status=0
for model in "${models[@]}"; do
	dir="$TLA_DIR/$model"
	spec="$(basename "$(ls "$dir"/*.tla | head -1)" .tla)"
	mkdir -p "$dir/out"
	# CONSTANTS block of the model's .cfg, reused for every single-property run
	constants="$(awk '/^SPECIFICATION/{exit} {print}' "$dir/$spec.cfg")"
	echo "== $model ($spec)"
	while read -r kind name want; do
		[[ -z "${kind:-}" || "$kind" == \#* ]] && continue
		cfg="$dir/out/$name.cfg"
		{
			echo "$constants"
			echo "SPECIFICATION Spec"
			echo "INVARIANTS"
			echo "    TypeOK"
			if [[ "$kind" == "invariant" ]]; then echo "    $name"; else printf 'PROPERTIES\n    %s\n' "$name"; fi
		} > "$cfg"
		log="$dir/out/$name.txt"
		( cd "$dir" && java -XX:+UseParallelGC -cp "$JAR" tlc2.TLC -deadlock -workers auto \
			-metadir "$dir/out/states" -config "$cfg" "$spec.tla" ) > "$log" 2>&1 || true
		if grep -q "No error has been found" "$log"; then got="holds"
		elif grep -qE "Invariant $name is violated|Temporal propert(y $name was|ies were) violated" "$log"; then got="violated"
		else got="error"; fi
		states="$(grep -oE '[0-9,]+ distinct states found' "$log" | tail -1 || true)"
		if [[ "$got" == "$want" ]]; then mark="ok"; else mark="MISMATCH"; status=1; fi
		printf '  %-28s %-9s 預期 %-9s %-9s %s\n' "$name" "$got" "$want" "$mark" "$states"
	done < "$dir/expected.txt"
	rm -rf "$dir/out/states"
done
exit $status
