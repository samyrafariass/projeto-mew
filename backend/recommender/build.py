"""Compila usando g++, clang++, cl, Zig instalado ou o Zig portátil local."""
import os
from pathlib import Path
import shutil
import subprocess


def main():
    folder = Path(__file__).resolve().parent
    root = folder.parent.parent
    output = folder / 'build' / ('recommender.exe' if os.name == 'nt' else 'recommender')
    output.parent.mkdir(exist_ok=True)
    local_zig = root / '.tools' / 'ziglang' / ('zig.exe' if os.name == 'nt' else 'zig')
    compiler = next((shutil.which(name) for name in ('g++', 'clang++', 'cl', 'zig') if shutil.which(name)), None)
    if not compiler and local_zig.exists():
        compiler = str(local_zig)
    if not compiler:
        raise SystemExit('Instale um compilador C++17 (g++, clang++, Visual C++ ou Zig) e execute novamente. A API continua usando o motor Python.')
    name = Path(compiler).stem
    env = os.environ.copy()
    sources = [str(folder / name) for name in ('main.cpp', 'score.cpp')]
    if name == 'cl':
        command = [compiler, '/std:c++17', '/O2', '/EHsc', *sources, f'/Fe:{output}', f'/Fo:{output.parent}{os.sep}']
    else:
        command = [compiler] + (['c++'] if name == 'zig' else []) + [*sources, '-std=c++17', '-O2', '-o', str(output)]
        if name == 'zig':
            env['ZIG_GLOBAL_CACHE_DIR'] = str(root / '.tools' / 'zig-global')
            env['ZIG_LOCAL_CACHE_DIR'] = str(root / '.tools' / 'zig-cache')
            command += ['-Wno-nullability-completeness']
    subprocess.run(command, check=True, cwd=root, env=env)
    print(f'Recomendador compilado: {output}')


if __name__ == '__main__':
    main()
