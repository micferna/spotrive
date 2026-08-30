// Metro résout les imports sans extension ; Node non. Ce hook comble l'écart
// pour que les tests tournent sur les sources telles quelles.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
    const url = new URL(specifier + '.js', context.parentURL);
    if (existsSync(fileURLToPath(url))) return next(specifier + '.js', context);
  }
  return next(specifier, context);
}
