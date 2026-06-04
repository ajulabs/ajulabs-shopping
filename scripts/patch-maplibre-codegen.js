#!/usr/bin/env node
/**
 * Corrige os specs de componentes nativos do MapLibre 11.x para que o
 * @react-native/babel-plugin-codegen (React Native 0.81) consiga
 * parseá-los durante o bundle do Metro.
 *
 * ## Problema
 *
 * O MapLibre 11.x escreve os tipos do codegen com o namespace
 * qualificado, ex:
 *
 *     selected?: CodegenTypes.WithDefault<boolean, false>;
 *     center: CodegenTypes.Double;
 *
 * O babel-plugin-codegen do RN 0.81 NÃO resolve o namespace
 * `CodegenTypes.X` — ele só entende os tipos importados diretamente
 * (como o próprio React Native escreve seus specs internos):
 *
 *     selected?: WithDefault<boolean, false>;
 *     center: Double;
 *
 * Resultado sem o patch: o build de produção (eas build / expo
 * export:embed) quebra com erros como:
 *
 *     Unknown prop type for "selected": "undefined"
 *     Unknown prop type for "center": TSTypeReference
 *
 * ## Fix
 *
 * Para cada arquivo *NativeComponent.ts do MapLibre, este script:
 *   1. detecta quais tipos do codegen são usados via `CodegenTypes.X`
 *   2. remove o prefixo `CodegenTypes.` de todas as referências
 *   3. troca o `type CodegenTypes,` do import pelos imports diretos
 *      dos tipos efetivamente usados
 *
 * É idempotente: rodar de novo num arquivo já corrigido é no-op.
 *
 * ## Quando rodar
 *
 * Via `postinstall` na raiz (roda após cada pnpm install) e via
 * `eas-build-pre-install` (garante que o EAS aplique antes do bundle).
 *
 * Remover quando o MapLibre publicar uma versão compatível com o
 * codegen do RN 0.81 (ou quando subirmos de RN). Acompanhar:
 * https://github.com/maplibre/maplibre-react-native/issues
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CODEGEN_TYPES = [
  'BubblingEventHandler',
  'DirectEventHandler',
  'Double',
  'Int32',
  'WithDefault',
];

function patchFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('CodegenTypes.')) return false;

  const used = CODEGEN_TYPES.filter((t) =>
    new RegExp(`CodegenTypes\\.${t}\\b`).test(src),
  );
  if (used.length === 0) return false;

  for (const t of used) {
    src = src.replace(new RegExp(`CodegenTypes\\.${t}\\b`, 'g'), t);
  }

  const directImports = used.map((t) => `  type ${t},`).join('\n');
  // Substitui a linha do import namespaced pelos imports diretos.
  src = src.replace(/\n\s*type CodegenTypes,/, '\n' + directImports);

  fs.writeFileSync(file, src);
  return true;
}

function main() {
  // Resolve o diretório do MapLibre a partir da raiz do workspace.
  // Em pnpm o pacote pode estar em node_modules/.pnpm, então tentamos
  // resolver via require quando o caminho direto não existe.
  const candidates = [
    path.join(__dirname, '..', 'node_modules', '@maplibre', 'maplibre-react-native', 'lib'),
  ];

  try {
    const pkgJson = require.resolve('@maplibre/maplibre-react-native/package.json', {
      paths: [path.join(__dirname, '..')],
    });
    candidates.unshift(path.join(path.dirname(pkgJson), 'lib'));
  } catch {
    // ignore — usamos os candidatos fixos
  }

  const base = candidates.find((c) => fs.existsSync(c));
  if (!base) {
    console.log('[patch-maplibre] MapLibre não encontrado, pulando (ok se não instalado ainda)');
    return;
  }

  let count = 0;
  for (const variant of ['commonjs', 'module']) {
    const dir = path.join(base, variant, 'components');
    if (!fs.existsSync(dir)) continue;
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('NativeComponent.ts') && patchFile(full)) {
          count++;
        }
      }
    };
    walk(dir);
  }

  console.log(`[patch-maplibre] ${count} spec(s) de componente nativo corrigido(s) para o codegen do RN 0.81`);
}

main();
