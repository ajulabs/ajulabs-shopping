import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';
import { useHardwareBack } from '../../../../shared/hooks';

export const TIPOS = [
  { id: 'moto' as const, label: 'Moto', icon: 'motorbike', lib: 'mci', needsDocs: true },
  { id: 'carro' as const, label: 'Carro', icon: 'car', lib: 'ion', needsDocs: true },
  { id: 'bike' as const, label: 'Bicicleta', icon: 'bicycle', lib: 'ion', needsDocs: false },
];

export type Tipo = 'moto' | 'carro' | 'bike';

export const TIPO_ICON: Record<Tipo, { icon: string; lib: string }> = {
  moto: { icon: 'motorbike', lib: 'mci' },
  carro: { icon: 'car', lib: 'ion' },
  bike: { icon: 'bicycle', lib: 'ion' },
};

export type Mode = 'view' | 'request';

export function useVeiculo(onBack: () => void) {
  const token = useAuthEntregadorStore((s) => s.token);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>('view');

  // Botão físico: de 'request' volta para 'view'; de 'view' sai da tela.
  useHardwareBack(() => {
    if (mode === 'request') {
      setMode('view');
      return true;
    }
    onBack();
    return true;
  });

  // Current data
  const [currentVehicle, setCurrentVehicle] = useState<any>(null);
  const [currentTipo, setCurrentTipo] = useState<Tipo>('moto');
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  // Form state
  const [tipo, setTipo] = useState<Tipo>('moto');
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [cor, setCor] = useState('');
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [cnhUri, setCnhUri] = useState<string | null>(null);
  const [docUri, setDocUri] = useState<string | null>(null);

  const needsDocs = TIPOS.find((t) => t.id === tipo)?.needsDocs ?? false;

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    const [perfil, solicitacao] = await Promise.all([
      EntregadorService.buscarPerfil(token).catch(() => null),
      EntregadorService.buscarSolicitacaoTrocaVeiculo(token).catch(() => null),
    ]);
    setCurrentVehicle(perfil?.entregador?.veiculo ?? null);
    setCurrentTipo((perfil?.entregador?.tipoTransporte ?? 'moto') as Tipo);
    setPendingRequest(solicitacao);
  }, [token]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const openRequest = () => {
    setTipo(currentTipo);
    setModelo(currentVehicle?.modelo ?? '');
    setPlaca(currentVehicle?.placa === 'BICICLETA' ? '' : (currentVehicle?.placa ?? ''));
    setCor(currentVehicle?.cor ?? '');
    setAno(currentVehicle?.ano ? String(currentVehicle.ano) : String(new Date().getFullYear()));
    setCnhUri(null);
    setDocUri(null);
    setMode('request');
  };

  const pickImage = async (setter: (u: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para enviar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (tipo !== 'bike') {
      if (!modelo.trim()) {
        Alert.alert('Erro', 'Informe o modelo do veículo.');
        return;
      }
      if (!placa.trim()) {
        Alert.alert('Erro', 'Informe a placa do veículo.');
        return;
      }
      if (!cnhUri) {
        Alert.alert('Erro', 'Envie a foto da sua CNH.');
        return;
      }
      if (!docUri) {
        Alert.alert('Erro', 'Envie o documento do veículo.');
        return;
      }
    }
    if (!token) return;

    setSubmitting(true);
    try {
      const result = await EntregadorService.solicitarTrocaVeiculo(
        token,
        {
          tipoTransporte: tipo,
          modelo: tipo === 'bike' ? 'Bicicleta' : modelo.trim(),
          placa: tipo === 'bike' ? 'BICICLETA' : placa.trim().toUpperCase(),
          cor: cor.trim() || 'Não informado',
          ano: parseInt(ano) || new Date().getFullYear(),
        },
        tipo !== 'bike' ? { cnhUri: cnhUri!, docVeiculoUri: docUri! } : undefined,
      );

      if (result.status === 'aprovado') {
        Alert.alert('Veículo atualizado!', 'Seu veículo foi atualizado com sucesso.', [
          {
            text: 'OK',
            onPress: async () => {
              await fetchData();
              setMode('view');
            },
          },
        ]);
      } else {
        Alert.alert(
          'Solicitação enviada!',
          'Seus documentos estão em análise. Em até 24h seu veículo será atualizado.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await fetchData();
                setMode('view');
              },
            },
          ],
        );
      }
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível enviar a solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    mode,
    setMode,
    currentVehicle,
    currentTipo,
    pendingRequest,
    tipo,
    setTipo,
    modelo,
    setModelo,
    placa,
    setPlaca,
    cor,
    setCor,
    ano,
    setAno,
    cnhUri,
    setCnhUri,
    docUri,
    setDocUri,
    needsDocs,
    openRequest,
    pickImage,
    handleSubmit,
  };
}
