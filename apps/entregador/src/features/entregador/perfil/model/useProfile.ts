import { useEffect, useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';

export type PerfilNavDestino =
  | 'documentos'
  | 'veiculo'
  | 'dados-bancarios'
  | 'notificacoes'
  | 'avaliacoes'
  | 'seguranca'
  | 'conversas'
  | 'endereco';

export function useProfile(onNavigate: (dest: PerfilNavDestino) => void) {
  const token = useAuthEntregadorStore((s) => s.token);
  const nomeStore = useAuthEntregadorStore((s) => s.nome);
  const fotoUrl = useAuthEntregadorStore((s) => s.fotoUrl);
  const setFotoUrl = useAuthEntregadorStore((s) => s.setFotoUrl);

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [ganhos, setGanhos] = useState<any>(null);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [photoExpanded, setPhotoExpanded] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([EntregadorService.buscarPerfil(token), EntregadorService.buscarGanhos(token)])
      .then(([p, g]) => {
        setPerfil(p);
        setGanhos(g);
        // Sync fotoUrl: usa o retorno da API como fonte de verdade
        const apiFoto = p?.entregador?.fotoUrl ?? null;
        if (apiFoto && apiFoto !== fotoUrl) setFotoUrl(apiFoto);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleTrocarFoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para trocar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    if (!token) return;
    try {
      const url = await EntregadorService.atualizarFoto(token, result.assets[0].uri);
      await setFotoUrl(url);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a foto. Tente novamente.');
    }
  }, [token, setFotoUrl]);

  const handleMenuPress = useCallback(
    (label: string) => {
      switch (label) {
        case 'Documentos':
          onNavigate('documentos');
          break;
        case 'Veículo':
          onNavigate('veiculo');
          break;
        case 'Dados bancários':
          onNavigate('dados-bancarios');
          break;
        case 'Notificações':
          onNavigate('notificacoes');
          break;
        case 'Avaliações':
          onNavigate('avaliacoes');
          break;
        case 'Segurança':
          onNavigate('seguranca');
          break;
        case 'Endereço':
          onNavigate('endereco');
          break;
        case 'Conversas':
          onNavigate('conversas');
          break;
        case 'Ajuda e suporte':
          Alert.alert('Ajuda e suporte', 'Entre em contato com nossa equipe:', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/5579999999999') },
            { text: 'Email', onPress: () => Linking.openURL('mailto:suporte@ajulabs.com') },
          ]);
          break;
      }
    },
    [perfil, onNavigate],
  );

  const menuItems = [
    { icon: 'chatbubbles', label: 'Conversas' },
    { icon: 'location', label: 'Endereço' },
    {
      icon: 'document-text',
      label: 'Documentos',
      extra: perfil?.onboarding?.documentosAprovados ? 'Verificado' : undefined,
      extraColor: '#039855',
    },
    {
      icon: 'car-sport',
      label: 'Veículo',
      extra: perfil?.entregador?.veiculo ? perfil.entregador.veiculo.modelo : undefined,
      extraColor: '#9099B3',
    },
    { icon: 'wallet', label: 'Dados bancários' },
    { icon: 'star', label: 'Avaliações' },
    { icon: 'notifications', label: 'Notificações' },
    { icon: 'shield-checkmark', label: 'Segurança' },
    { icon: 'help-circle', label: 'Ajuda e suporte' },
  ] as const;

  const nome = perfil?.entregador?.nome ?? nomeStore ?? 'Entregador';
  const initials = nome
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const veiculo = perfil?.entregador?.veiculo;
  const tipoTransporte = (perfil?.entregador?.tipoTransporte ?? 'moto') as
    | 'moto'
    | 'carro'
    | 'bike';
  const veiculoLabel = veiculo
    ? veiculo.placa !== 'BICICLETA'
      ? `${veiculo.modelo} · ${veiculo.placa}`
      : 'Bicicleta'
    : null;

  // Foto: prefer API data (synced to store), fallback to store
  const fotoPerfil = fotoUrl ?? perfil?.entregador?.fotoUrl ?? null;
  const totalEntregas = ganhos?.allTime?.corridas ?? 0;
  const ganhoTotal = ganhos?.allTime?.total
    ? `R$${Number(ganhos.allTime.total).toFixed(0)}`
    : 'R$0';
  const corridasSemana = ganhos?.semana?.corridas ?? 0;

  return {
    loading,
    logoutVisible,
    setLogoutVisible,
    photoExpanded,
    setPhotoExpanded,
    handleTrocarFoto,
    handleMenuPress,
    menuItems,
    nome,
    initials,
    tipoTransporte,
    veiculoLabel,
    fotoPerfil,
    totalEntregas,
    ganhoTotal,
    corridasSemana,
  };
}
