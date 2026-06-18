import { useState, useEffect, useMemo } from 'react';
import { LojaService } from '@ajulabs/api-client';
import { Loja } from '@ajulabs/types';
import { useCartStore, calcularQuantidadeItens } from '../../../../store';

const normCategoria = (s: string) =>
  s
    .toLowerCase()
    .replace(/[àáâãä]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/\s+/g, '');

// Mapeia os IDs de filtro do consumer para as labels de categoria do lojista
// (normalizadas). Necessário porque o lojista usa labels descritivas
// ("Pet Shop", "Esportes e Lazer") e o consumer usa IDs curtos ("pet", "esportes").
const CATEGORIA_GRUPOS: Record<string, string[]> = {
  mercado: ['alimentacao', 'padariaeconfeitaria', 'acougueepeixaria', 'hortifruti', 'bebidas'],
  moda: [
    'modainfantil',
    'modapraiaeesporte',
    'roupaseacessorios',
    'bijuteriasejoias',
    'cosmeticosebeleza',
  ],
  pet: ['petshop'],
  esportes: ['esportoselazer'],
  eletronicos: ['eletronicos', 'informatica', 'eletrodomesticos'],
};

const categoriaMatchLoja = (lojaCategoria: string, filtro: string): boolean => {
  const norm = normCategoria(lojaCategoria);
  if (norm === filtro) return true;
  return CATEGORIA_GRUPOS[filtro]?.includes(norm) ?? false;
};

export function useVitrines() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const itensPorLoja = useCartStore((s) => s.itensPorLoja);
  const quantidadeItens = useMemo(() => calcularQuantidadeItens(itensPorLoja), [itensPorLoja]);

  useEffect(() => {
    LojaService.listar()
      .then((data) => setLojas(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lojasFiltradas = lojas.filter((l) => {
    const buscaOk =
      busca === '' ||
      l.nome.toLowerCase().includes(busca.toLowerCase()) ||
      l.endereco.bairro.toLowerCase().includes(busca.toLowerCase());
    const categoriaOk = categoria === 'todos' || categoriaMatchLoja(l.categoria, categoria);
    return buscaOk && categoriaOk;
  });

  return {
    lojas,
    loading,
    busca,
    setBusca,
    categoria,
    setCategoria,
    quantidadeItens,
    lojasFiltradas,
  };
}
