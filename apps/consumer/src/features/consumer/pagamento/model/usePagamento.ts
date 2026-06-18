import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Cartao, detectarBandeira } from '../lib/cartao';

const FORM_VAZIO = { apelido: '', titular: '', numero: '', validade: '', cvv: '' };

export function usePagamento() {
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);

  const setCampo = (campo: keyof typeof FORM_VAZIO, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const abrirModal = () => setShowModal(true);
  const fecharModal = () => {
    setShowModal(false);
    setForm(FORM_VAZIO);
  };

  const handleSalvar = () => {
    const digits = form.numero.replace(/\D/g, '');
    if (!form.titular || digits.length < 16 || !form.validade || form.cvv.length < 3) {
      Alert.alert('Atenção', 'Preencha todos os campos corretamente.');
      return;
    }
    setCartoes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        apelido: form.apelido || `Cartão ${detectarBandeira(digits)}`,
        bandeira: detectarBandeira(digits),
        ultimos4: digits.slice(-4),
        titular: form.titular.toUpperCase(),
      },
    ]);
    fecharModal();
  };

  const handleRemover = (id: string) => {
    const confirmar = () => setCartoes((prev) => prev.filter((c) => c.id !== id));
    if (Platform.OS === 'web') {
      if (window.confirm('Remover este cartão?')) confirmar();
    } else {
      Alert.alert('Remover cartão', 'Deseja remover este cartão?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: confirmar },
      ]);
    }
  };

  return {
    cartoes,
    showModal,
    form,
    setCampo,
    abrirModal,
    fecharModal,
    handleSalvar,
    handleRemover,
  };
}
