import { TipoProdutoValue } from '../model/tipoProdutos';
import { VariacaoEstoque } from '../../../../entities/produto';

/** Dados do formulário do fluxo "Novo produto" (captura → IA → edição). */
export interface ProductData {
  nome: string;
  categoria: string;
  descricao: string;
  tags: string[];
  preco: string;
  estoque: string;
  variacoes: string[];
  tipoProduto: TipoProdutoValue | null;
  variacoesEstoque: VariacaoEstoque[];
}

/** Dados do formulário de edição de produto existente. */
export interface EditForm {
  nome: string;
  categoria: string;
  descricao: string;
  preco: string;
  estoque: string;
  disponivel: boolean;
  tipoProduto: TipoProdutoValue | null;
  variacoesEstoque: VariacaoEstoque[];
}

/** Slot de imagem no editor de fotos (existente, nova ou vazio). */
export type ImageSlot =
  | { type: 'existing'; url: string }
  | { type: 'new'; uri: string }
  | { type: 'empty' };
