import { View, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';
import { useLoginEntregador } from '../model/useLoginEntregador';
import { LoginHeader } from './components/LoginHeader';
import { LoginForm } from './components/LoginForm';
import { LoginFooter } from './components/LoginFooter';
import { RecoveryModal } from './components/RecoveryModal';

interface LoginEntregadorProps {
  onLoginSuccess?: () => void;
}

export function LoginEntregador({ onLoginSuccess }: LoginEntregadorProps) {
  const {
    cpf,
    setCpf,
    senha,
    setSenha,
    loading,
    error,
    setError,
    showRecovery,
    setShowRecovery,
    handleLogin,
    router,
  } = useLoginEntregador(onLoginSuccess);

  return (
    <View style={styles.container}>
      <LoginHeader />

      <LoginForm
        cpf={cpf}
        setCpf={setCpf}
        senha={senha}
        setSenha={setSenha}
        loading={loading}
        error={error}
        setError={setError}
        handleLogin={handleLogin}
        onForgotPassword={() => setShowRecovery(true)}
        router={router}
      />

      <LoginFooter />

      <RecoveryModal visible={showRecovery} onClose={() => setShowRecovery(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },
});
