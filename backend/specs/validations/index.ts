export { checkoutValidationSpec, checkoutCalculoSpec } from './checkout_validation.spec';
export { produtoValidationSpec } from './produto_validation.spec';
export { autenticacaoValidationSpec, cpfValidationSpec, senhaForteValidationSpec } from './autenticacao_validation.spec';
export { estoqueValidationSpec } from './estoque_validation.spec';
export { enderecoValidationSpec } from './endereco_validation.spec';

import { checkoutValidationSpec, checkoutCalculoSpec } from './checkout_validation.spec';
import { produtoValidationSpec } from './produto_validation.spec';
import { autenticacaoValidationSpec, cpfValidationSpec, senhaForteValidationSpec } from './autenticacao_validation.spec';
import { estoqueValidationSpec } from './estoque_validation.spec';
import { enderecoValidationSpec } from './endereco_validation.spec';

export const VALIDATION_SPECS = [
  checkoutValidationSpec,
  checkoutCalculoSpec,
  produtoValidationSpec,
  autenticacaoValidationSpec,
  cpfValidationSpec,
  senhaForteValidationSpec,
  estoqueValidationSpec,
  enderecoValidationSpec,
] as const;
