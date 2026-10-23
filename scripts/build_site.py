"""Prepara somente os arquivos públicos para publicação na Vercel."""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.recommender.build_wasm import verify_wasm


def build_site(root=ROOT):
    root = Path(root).resolve()
    source = root / 'Site'
    output_root = root / '.build'
    output = output_root / 'site'
    if output.is_symlink() or output_root.is_symlink() or not output.resolve().is_relative_to(root):
        raise RuntimeError('Diretório de publicação inválido.')
    if output.exists():
        # O destino absoluto foi verificado acima e pertence à pasta .build.
        shutil.rmtree(output)

    def ignore(directory, names):
        return [name for name in names if name.startswith('.') or name.lower() == 'quiz_perguntas.json']

    shutil.copytree(source, output, ignore=ignore)
    if (output / 'quiz_perguntas.json').exists():
        raise RuntimeError('Arquivo privado encontrado na publicação.')
    return output


if __name__ == '__main__':
    verify_wasm()
    print(f'Site público preparado em {build_site().relative_to(ROOT)}')
