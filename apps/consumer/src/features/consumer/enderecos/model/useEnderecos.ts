import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { EnderecoService } from '@ajulabs/api-client';
import { EnderecoSalvo } from '@ajulabs/types';
import { useAuthStore } from '../../../../store';

export function useEnderecos() {
  const token = useAuthStore((s) => s.token);
  const [enderecos, setEnderecos] = useState<EnderecoSalvo[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    EnderecoService.listar(token)
      .then(setEnderecos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleRemover = (addr: EnderecoSalvo) => {
    if (addr.padrao) {
      const outro = enderecos.find((e) => e.id !== addr.id);
      if (!outro) {
        if (Platform.OS === 'web') {
          window.alert('Não é possível remover o único endereço cadastrado.');
        } else {
          Alert.alert('Atenção', 'Não é possível remover o único endereço cadastrado.');
        }
        return;
      }
      const confirmar = async () => {
        if (!token) return;
        try {
          await EnderecoService.definirPadrao(token, outro.id);
          await EnderecoService.remover(token, addr.id);
          carregar();
        } catch {
          Alert.alert('Erro', 'Não foi possível remover o endereço');
        }
      };
      if (Platform.OS === 'web') {
        if (
          window.confirm(
            `"${outro.apelido}" será definido como padrão e "${addr.apelido}" será removido. Continuar?`,
          )
        )
          confirmar();
      } else {
        Alert.alert(
          'Remover endereço padrão',
          `"${outro.apelido}" será definido como padrão e "${addr.apelido}" será removido. Continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: confirmar },
          ],
        );
      }
      return;
    }

    const confirmar = () => {
      if (!token) return;
      EnderecoService.remover(token, addr.id)
        .then(carregar)
        .catch(() => Alert.alert('Erro', 'Não foi possível remover o endereço'));
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Remover este endereço?')) confirmar();
    } else {
      Alert.alert('Remover endereço', 'Deseja remover este endereço?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: confirmar },
      ]);
    }
  };

  const handleDefinirPadrao = (id: string) => {
    if (!token) return;
    const anterior = enderecos;
    setEnderecos((prev) => prev.map((e) => ({ ...e, padrao: e.id === id })));
    EnderecoService.definirPadrao(token, id).catch(() => setEnderecos(anterior));
  };

  return { token, enderecos, loading, carregar, handleRemover, handleDefinirPadrao };
}
