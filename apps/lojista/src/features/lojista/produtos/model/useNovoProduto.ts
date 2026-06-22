import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LojistaService } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../../../../store';
import { derivarCategoriaString, inferirTipoProduto } from './tipoProdutos';
import { ProductData } from '../lib/types';

export type Stage = 'capture' | 'analyzing' | 'edit';

export const EMPTY_DATA: ProductData = {
  nome: '',
  categoria: '',
  descricao: '',
  tags: [],
  preco: '',
  estoque: '',
  variacoes: [],
  tipoProduto: null,
  variacoesEstoque: [],
};

export function useNovoProduto({
  onPublicar,
  onVoltar,
}: {
  onPublicar?: (data: ProductData) => void;
  onVoltar?: () => void;
}) {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);

  const [stage, setStage] = useState<Stage>('capture');
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [publishedName, setPublishedName] = useState('');
  const [productData, setProductData] = useState<ProductData>(EMPTY_DATA);
  const [analisarErro, setAnalisarErro] = useState<{
    titulo: string;
    descricao: string;
  } | null>(null);

  const stepIndex = stage === 'capture' ? 0 : stage === 'analyzing' ? 1 : 2;

  const handleVoltarStage = useCallback(() => {
    setStage('capture');
    setImageUri(null);
    setProductData(EMPTY_DATA);
    setAnalisarErro(null);
  }, []);

  const handleCapture = useCallback(
    async (uri: string) => {
      setImageUri(uri);
      setStage('analyzing');
      setAnalisarErro(null);
      try {
        const data = await LojistaService.analisarImagem(token!, uri);
        setProductData({
          nome: data.nome ?? '',
          categoria: data.categoria ?? '',
          descricao: data.descricao ?? '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          preco: data.preco ?? '',
          estoque: data.estoque ?? '',
          variacoes: [],
          tipoProduto: inferirTipoProduto(data as Record<string, unknown>),
          variacoesEstoque: [],
        });
      } catch (e) {
        const status = (e as { status?: number } | null)?.status;
        const msg = e instanceof Error ? e.message : '';
        const isTipoArquivo =
          status === 400 && /formato.*imagem|imagem.*inv|jpe?g|png|gif|webp/i.test(msg);
        const isSemProduto = status === 400 && /produto vend|sem_produto|n[ãa]o mostra/i.test(msg);
        const isModerado = status === 400 && /n[ãa]o pode ser usada|cadastro de produto/i.test(msg);
        const isBloqueado = status === 423;
        if (isBloqueado) {
          setAnalisarErro({
            titulo: 'Cadastro bloqueado temporariamente',
            descricao:
              msg ||
              'Sua conta foi bloqueada de cadastrar produtos por uploads inadequados repetidos.',
          });
        } else if (isTipoArquivo) {
          setAnalisarErro({
            titulo: 'Tipo de arquivo não suportado',
            descricao:
              'A IA aceita apenas imagens (JPEG, PNG, GIF ou WebP). Troque a foto e tente de novo.',
          });
        } else if (isModerado) {
          setAnalisarErro({
            titulo: 'Imagem bloqueada',
            descricao:
              'Esta foto não pode ser usada para cadastro de produto. Escolha outra imagem.',
          });
        } else if (isSemProduto) {
          setAnalisarErro({
            titulo: 'Nenhum produto identificado',
            descricao:
              'A imagem não mostra um produto vendável. Envie uma foto clara do item que você quer cadastrar.',
          });
        } else {
          setAnalisarErro({
            titulo: 'Não foi possível analisar a imagem',
            descricao: 'Preencha os dados manualmente abaixo ou troque a foto e tente de novo.',
          });
        }
      } finally {
        setStage('edit');
      }
    },
    [token],
  );

  const limparAnalisarErro = useCallback(() => setAnalisarErro(null), []);

  const handleTrocarFoto = useCallback(() => {
    Alert.alert('Trocar foto', 'Escolha uma opção', [
      {
        text: 'Câmera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permissão necessária',
              'Precisamos de acesso à câmera para fotografar o produto.',
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, []);

  const handleChange = useCallback(
    (key: keyof ProductData, value: ProductData[keyof ProductData]) => {
      setProductData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handlePublicar = useCallback(async () => {
    if (!token || !lojaId) {
      Alert.alert('Erro', 'Sessão inválida. Faça login novamente.');
      return;
    }
    const preco = parseFloat(productData.preco.replace(',', '.'));
    const hasVariacoes = productData.variacoesEstoque.length > 0;
    const estoqueTotal = hasVariacoes
      ? productData.variacoesEstoque.reduce((s, v) => s + (v.estoque || 0), 0)
      : parseInt(productData.estoque, 10);
    const categoriaFinal = productData.tipoProduto
      ? derivarCategoriaString(productData.tipoProduto)
      : productData.categoria;
    setSaving(true);
    try {
      await LojistaService.criarProduto(token, {
        lojaId,
        nome: productData.nome,
        descricao: productData.descricao,
        preco,
        estoque: isNaN(estoqueTotal) ? 0 : estoqueTotal,
        categoria: categoriaFinal,
        tags: productData.tags,
        imageUri: imageUri ?? undefined,
        variacoes: hasVariacoes ? productData.variacoesEstoque : undefined,
      });
      onPublicar?.(productData);
      setPublishedName(productData.nome);
      setShowSuccess(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao publicar produto.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [token, lojaId, productData, imageUri, onPublicar]);

  const handleSuccessOk = useCallback(() => {
    setShowSuccess(false);
    if (onVoltar) {
      onVoltar();
    } else {
      setStage('capture');
      setImageUri(null);
      setProductData(EMPTY_DATA);
    }
  }, [onVoltar]);

  return {
    stage,
    stepIndex,
    saving,
    imageUri,
    showSuccess,
    publishedName,
    productData,
    analisarErro,
    limparAnalisarErro,
    handleVoltarStage,
    handleCapture,
    handleTrocarFoto,
    handleChange,
    handlePublicar,
    handleSuccessOk,
  };
}
