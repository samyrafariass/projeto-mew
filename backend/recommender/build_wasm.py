"""Compila o núcleo C++ para Wasm. --check verifica o artefato versionado."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
FOLDER = ROOT / 'backend' / 'recommender'
OUTPUT = ROOT / 'Site' / 'wasm' / 'recommender-v1.wasm'
MANIFEST = FOLDER / 'wasm-manifest.json'


def source_hash():
    # Normaliza fins de linha para o hash ser igual em Windows e Linux.
    return hashlib.sha256('\n'.join((FOLDER / name).read_text(encoding='utf-8')
        for name in ('score.cpp', 'score.hpp', 'build_wasm.py')).encode()).hexdigest()


def verify_wasm():
    try:
        manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
        binary = OUTPUT.read_bytes()
        valid = (binary[:8] == b'\0asm\x01\0\0\0' and manifest['abi'] == 1
                 and manifest['source_sha256'] == source_hash()
                 and manifest['wasm_sha256'] == hashlib.sha256(binary).hexdigest())
    except (OSError, ValueError, KeyError):
        valid = False
    if not valid:
        raise RuntimeError('WebAssembly ausente ou desatualizado. Execute: python backend/recommender/build_wasm.py')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        verify_wasm()
        print('WebAssembly corresponde ao código C++ e ao manifesto.')
        return
    local = ROOT / '.tools' / 'ziglang' / ('zig.exe' if os.name == 'nt' else 'zig')
    compiler = os.getenv('MEW_WASM_CXX') or shutil.which('zig') or (str(local) if local.is_file() else None)
    if not compiler:
        compiler = shutil.which('clang++')
    if not compiler:
        raise SystemExit('Instale Zig ou Clang com wasm-ld, ou configure MEW_WASM_CXX com seu caminho.')
    is_zig = Path(compiler).stem == 'zig'
    command = [compiler, *(['c++'] if is_zig else []), '-target',
               'wasm32-freestanding' if is_zig else 'wasm32-unknown-unknown',
               str(FOLDER / 'score.cpp'), '-std=c++17', '-O3', '-nostdlib',
               '-fno-exceptions', '-fno-rtti', '-Wl,--no-entry', '-Wl,--export-memory',
               '-Wl,--export=mew_score', '-Wl,--export=mew_input_buffer',
               '-Wl,--export=mew_abi_version', '-Wl,-z,stack-size=16384',
               '-Wl,--initial-memory=65536', '-Wl,--max-memory=65536', '-o', str(OUTPUT)]
    env = os.environ.copy()
    if is_zig:
        env['ZIG_GLOBAL_CACHE_DIR'] = str(ROOT / '.tools' / 'zig-global')
        env['ZIG_LOCAL_CACHE_DIR'] = str(ROOT / '.tools' / 'zig-cache')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(command, check=True, cwd=ROOT, env=env)
    MANIFEST.write_text(json.dumps({'abi': 1, 'source_sha256': source_hash(),
        'wasm_sha256': hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}, indent=2) + '\n', encoding='utf-8')
    verify_wasm()
    print(f'WebAssembly compilado: {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size} bytes)')


if __name__ == '__main__':
    main()
